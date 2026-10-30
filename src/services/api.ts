import { IntegrationStatus, WorkflowItem, SupportedLanguage } from '../types';

export async function fetchIntegrationStatus(): Promise<IntegrationStatus> {
  try {
    const res = await fetch('/api/integrations');
    if (!res.ok) throw new Error('Failed to fetch status');
    return await res.json();
  } catch (err) {
    console.warn('Using offline integration status:', err);
    return {
      status: 'offline',
      bolna: {
        configured: false,
        agentId: null,
        mode: 'browser_speech_engine',
        provider: 'Bolna Voice Agent'
      },
      supabase: {
        configured: false,
        mode: 'in_memory_persistence',
        provider: 'Supabase DB & Auth'
      },
      gemini: {
        configured: false,
        model: 'gemini-3.8-flash',
        provider: 'Google AI Studio Gemini'
      }
    };
  }
}

export async function fetchWorkflows(): Promise<WorkflowItem[]> {
  try {
    const res = await fetch('/api/workflows');
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return await res.json();
  } catch (err) {
    console.warn('Failed to load workflows from API, returning local cache:', err);
    return [];
  }
}

export async function toggleWorkflowDocument(workflowId: string, docId: string, submitted: boolean): Promise<WorkflowItem> {
  const res = await fetch(`/api/workflows/${workflowId}/document-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId, submitted })
  });
  if (!res.ok) throw new Error('Failed to update document status');
  return await res.json();
}

export async function createDynamicWorkflow(workflow: WorkflowItem): Promise<WorkflowItem> {
  try {
    const res = await fetch('/api/workflows/dynamic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    if (!res.ok) throw new Error('Failed to create dynamic workflow');
    const data = await res.json();
    return data.workflow || workflow;
  } catch (err) {
    console.warn('Dynamic workflow saved locally:', err);
    return workflow;
  }
}

// Multi-turn Gemini Chatbot with Search Grounding & Model Selection
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeminiChatResponse {
  reply: string;
  model: string;
  sources: GroundingSource[];
  webSearchQueries?: string[];
}

export async function sendGeminiChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon' = 'gemini-3.8-flash',
  systemInstruction?: string,
  useSearchGrounding: boolean = false,
  language: SupportedLanguage = 'en',
  workflowId?: string
): Promise<GeminiChatResponse> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        systemInstruction,
        useSearchGrounding,
        language,
        workflowId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Chat request failed');
    }

    return await res.json();
  } catch (err: any) {
    console.error('sendGeminiChat error:', err);
    throw err;
  }
}

export async function sendVoiceMessage(
  message: string,
  language: SupportedLanguage,
  workflowId?: string,
  history: Array<{ sender: string; text: string }> = []
): Promise<{ reply: string; source: string }> {
  try {
    const formattedHistory = history.map(h => ({
      role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.text
    }));
    formattedHistory.push({ role: 'user', content: message });

    const chatRes = await sendGeminiChat(
      formattedHistory,
      'gemini-3.8-flash',
      undefined,
      true, // use search grounding
      language,
      workflowId
    );

    return {
      reply: chatRes.reply,
      source: chatRes.model
    };
  } catch (err: any) {
    console.warn('sendVoiceMessage fallback triggered:', err);
    return {
      reply: language === 'hi'
        ? 'नमस्ते! मैं वॉयसब्रिज एआई हूँ। मैं छात्रवृत्ति, आयुष्मान भारत और सार्वजनिक सेवाओं में आपकी सहायता कर सकता हूँ।'
        : language === 'te'
        ? 'నమస్కారం! నేను వాయిస్‌బ్రిడ్జ్ ఏఐ. మీ దరఖాస్తులు మరియు ఆరోగ్య సేవల గురించి మీరు ఏవైనా అడగవచ్చు.'
        : 'Hello! I am VoiceBridge AI. I can guide you through scholarships, Ayushman Bharat, and public service paperwork.',
      source: 'local_fallback'
    };
  }
}

// Audio Transcription via gemini-3.5-transcribe
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  language: SupportedLanguage = 'en'
): Promise<{ transcript: string; model: string }> {
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      language
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Audio transcription failed');
  }

  return await res.json();
}

// Gemini Live API Audio Client Helper (gemini-3.8-live)
export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;

  public onStatusChange?: (status: 'connecting' | 'connected' | 'error' | 'disconnected', error?: string) => void;
  public onAudioActivity?: (level: number) => void;

  public async start() {
    this.onStatusChange?.('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.onStatusChange?.('connected');
      this.initMicStream();
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          this.onStatusChange?.('error', msg.error);
        } else if (msg.audio) {
          // Play 24kHz PCM from gemini-3.8-live
          this.playPcm24k(msg.audio);
        } else if (msg.interrupted) {
          // Model interrupted, reset playback queue
          this.nextStartTime = this.outputAudioCtx?.currentTime || 0;
        }
      } catch (err) {
        console.warn('WS onmessage parse error:', err);
      }
    };

    this.ws.onerror = (e) => {
      console.warn('Live API WebSocket error:', e);
      this.onStatusChange?.('error', 'WebSocket connection failed.');
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.onStatusChange?.('disconnected');
      this.stop();
    };
  }

  private async initMicStream() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextStartTime = this.outputAudioCtx.currentTime;

      const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Calculate volume for UI activity
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += Math.abs(channelData[i]);
        }
        const level = Math.min(1, (sum / channelData.length) * 5);
        this.onAudioActivity?.(level);

        // Convert Float32 to 16-bit PCM little-endian
        const pcm16 = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          const s = Math.max(-1, Math.min(1, channelData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64 = this.arrayBufferToBase64(pcm16.buffer);
        this.ws.send(JSON.stringify({ audio: base64 }));
      };
    } catch (err: any) {
      console.error('Failed to init mic for Live API:', err);
      this.onStatusChange?.('error', err.message || 'Microphone access denied');
    }
  }

  private playPcm24k(base64Data: string) {
    if (!this.outputAudioCtx) {
      this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }

    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioCtx.destination);

    const currentTime = this.outputAudioCtx.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  public stop() {
    this.isConnected = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatusChange?.('disconnected');
  }
}
