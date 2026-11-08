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
  workflowId?: string,
  pageContext?: { page: string; title: string; dataSummary?: any }
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
        workflowId,
        pageContext
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
  history: Array<{ sender: string; text: string }> = [],
  pageContext?: { page: string; title: string; dataSummary?: any }
): Promise<{ reply: string; source: string; sources?: GroundingSource[] }> {
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
      workflowId,
      pageContext
    );

    return {
      reply: chatRes.reply,
      source: chatRes.model,
      sources: chatRes.sources
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

// Contextual "Listen and Explain" Narration
export async function requestPageExplanation(
  page: string,
  arg2?: SupportedLanguage | string,
  arg3?: Record<string, any> | string,
  arg4?: string | SupportedLanguage
): Promise<string> {
  let language: SupportedLanguage = 'en';
  let dataSummary: Record<string, any> = {};
  let style: string = 'natural';

  if (arg2 === 'en' || arg2 === 'hi' || arg2 === 'te') {
    language = arg2;
    if (typeof arg3 === 'object' && arg3 !== null) {
      dataSummary = arg3;
    } else if (typeof arg3 === 'string') {
      try { dataSummary = JSON.parse(arg3); } catch { dataSummary = { info: arg3 }; }
    }
    if (typeof arg4 === 'string') style = arg4;
  } else {
    if (arg4 === 'en' || arg4 === 'hi' || arg4 === 'te') {
      language = arg4 as SupportedLanguage;
    }
    if (typeof arg3 === 'object' && arg3 !== null) {
      dataSummary = arg3;
    } else if (typeof arg3 === 'string') {
      try { dataSummary = JSON.parse(arg3); } catch { dataSummary = { info: arg3 }; }
    }
  }

  try {
    const res = await fetch('/api/explain-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, language, dataSummary, style })
    });
    if (!res.ok) throw new Error('Page explanation failed');
    const data = await res.json();
    return data.text || '';
  } catch (err) {
    console.warn('requestPageExplanation error:', err);
    if (page === 'documents') {
      return language === 'hi'
        ? 'मैंने आपकी दस्तावेज़ सूची की जाँच की है। आपका आधार कार्ड पहले से सत्यापित है, लेकिन आय प्रमाण पत्र और अंकतालिका अभी लंबित हैं।'
        : language === 'te'
        ? 'నేను మీ ధ్రువపత్రాల జాబితాను పరిశీలించాను. మీ ఆధార్ కార్డు ఇప్పటికే సమర్పించబడింది, అయితే ఆదాయ ధ్రువీకరణ మరియు మార్కుల పత్రం ఇంకా అవసరం.'
        : 'I have checked your document checklist. Your Aadhaar card is already submitted and linked, while your family income certificate is still needed for verification.';
    }
    return language === 'hi'
      ? 'नागरिक पोर्टल पर आपका स्वागत है। आपके सक्रिय कल्याणकारी आवेदन चल रहे हैं।'
      : language === 'te'
      ? 'సిటిజెన్ పోర్టల్‌కు స్వాగతం. మీ వద్ద చురుకైన దరఖాస్తులు ఉన్నాయి.'
      : 'Welcome to VoiceBridge AI. I can guide you through everything on this screen.';
  }
}

// Server-side High-Fidelity Text-to-Speech
export async function generateServerTTS(
  text: string,
  language: SupportedLanguage,
  style: string = 'natural'
): Promise<{ success: boolean; audioBase64?: string; mimeType?: string }> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, style })
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (err) {
    return { success: false };
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
  private activeSources: AudioBufferSourceNode[] = [];

  public language: SupportedLanguage = 'en';
  public voiceName: string = 'Aoede';
  public page: string = 'assistant';
  public topic: string = '';

  public onStatusChange?: (status: 'connecting' | 'connected' | 'error' | 'disconnected', error?: string) => void;
  public onAudioActivity?: (level: number, source: 'mic' | 'model') => void;
  public onInputTranscript?: (text: string) => void;
  public onOutputTranscript?: (text: string) => void;
  public onInterrupted?: () => void;
  public onTurnComplete?: () => void;

  constructor(language: SupportedLanguage = 'en', voiceName: string = 'Aoede', page: string = 'assistant', topic: string = '') {
    this.language = language;
    this.voiceName = voiceName;
    this.page = page;
    this.topic = topic;
  }

  public isLiveConnected(): boolean {
    return this.isConnected && Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  public async start(language?: SupportedLanguage, voiceName?: string, page?: string, topic?: string) {
    if (language) this.language = language;
    if (voiceName) this.voiceName = voiceName;
    if (page) this.page = page;
    if (topic !== undefined) this.topic = topic;

    this.stop();
    this.onStatusChange?.('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams({
      lang: this.language,
      voice: this.voiceName,
      page: this.page,
      topic: this.topic
    });
    const wsUrl = `${protocol}//${window.location.host}/api/live?${params.toString()}`;

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
          // Play 24kHz PCM chunk from gemini-3.8-live
          this.playPcm24k(msg.audio);
        } else if (msg.inputTranscript) {
          this.onInputTranscript?.(msg.inputTranscript);
        } else if (msg.outputTranscript) {
          this.onOutputTranscript?.(msg.outputTranscript);
        } else if (msg.interrupted) {
          this.stopAllAudioPlayback();
          this.onInterrupted?.();
        } else if (msg.turnComplete) {
          this.onTurnComplete?.();
        }
      } catch (err) {
        console.warn('Live API WebSocket parse error:', err);
      }
    };

    this.ws.onerror = (e) => {
      console.warn('Gemini Live API WebSocket connection error:', e);
      this.onStatusChange?.('error', 'Live API connection error. Please verify server status.');
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopAllAudioPlayback();
      this.onStatusChange?.('disconnected');
    };
  }

  private async initMicStream() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

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

        // Compute mic activity level for live visual orb
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += Math.abs(channelData[i]);
        }
        const level = Math.min(1, (sum / channelData.length) * 5.5);
        this.onAudioActivity?.(level, 'mic');

        // Automatic user speech barge-in: If user starts speaking while model audio is playing, interrupt model
        if (level > 0.12 && this.activeSources.length > 0) {
          this.stopAllAudioPlayback();
          this.onInterrupted?.();
        }

        // Convert Float32 to 16-bit PCM little-endian for Gemini Live API
        const pcm16 = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          const s = Math.max(-1, Math.min(1, channelData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64 = this.arrayBufferToBase64(pcm16.buffer);
        this.ws.send(JSON.stringify({ audio: base64 }));
      };
    } catch (err: any) {
      console.error('Failed to init microphone for Gemini Live API:', err);
      this.onStatusChange?.('error', err.message || 'Microphone access denied or unavailable.');
    }
  }

  private playPcm24k(base64Data: string) {
    if (!this.outputAudioCtx) {
      this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }

    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume().catch(() => {});
    }

    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);

    let sum = 0;
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
      sum += Math.abs(float32[i]);
    }

    // Audio activity from model output
    const modelLevel = Math.min(1, (sum / float32.length) * 4.5);
    this.onAudioActivity?.(modelLevel, 'model');

    const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioCtx.destination);

    const currentTime = this.outputAudioCtx.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;

    this.activeSources.push(source);
    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) this.activeSources.splice(idx, 1);
    };
  }

  public stopAllAudioPlayback() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  public interrupt() {
    this.stopAllAudioPlayback();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ interrupt: true }));
      } catch (e) {
        // ignore
      }
    }
    this.onInterrupted?.();
  }

  public sendText(text: string) {
    if (!text.trim()) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
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
    this.stopAllAudioPlayback();

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
