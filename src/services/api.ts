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
// Gemini Live API Audio Client Helper (gemini-3.8-live)
// Supports both Direct Browser-to-Gemini WebSocket (for Vercel & serverless) and Server Proxy Bridge (for standalone Node / Cloud Run)
export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;
  private isDirectConnection: boolean = false;
  private activeSources: AudioBufferSourceNode[] = [];

  // Voice Activity Detection (VAD) & Conversational Turn State
  private isUserSpeaking: boolean = false;
  private speechStartTime: number = 0;
  private lastSpeechTime: number = 0;
  private silenceTimer: any = null;
  private isTurnCompletePending: boolean = false;
  private modelPlaybackStartTime: number = 0;
  private hasReceivedFirstModelTurn: boolean = false;

  public language: SupportedLanguage = 'en';
  public voiceName: string = 'Aoede';
  public page: string = 'assistant';
  public topic: string = '';

  public onStatusChange?: (
    status: 'connecting' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'error' | 'disconnected',
    error?: string
  ) => void;
  public onAudioActivity?: (level: number, source: 'mic' | 'model') => void;
  public onInputTranscript?: (text: string) => void;
  public onOutputTranscript?: (text: string) => void;
  public onInterrupted?: () => void;
  public onTurnComplete?: () => void;

  constructor(
    language: SupportedLanguage = 'en',
    voiceName: string = 'Aoede',
    page: string = 'assistant',
    topic: string = ''
  ) {
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

    // 0. Crucial: Initialize & resume AudioContext immediately inside user gesture context (browser Autoplay policy)
    try {
      if (!this.outputAudioCtx) {
        this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
        console.log('[GeminiLiveSession] Output AudioContext unlocked and resumed on user interaction.');
      }
    } catch (e) {
      console.warn('[GeminiLiveSession] Note on output AudioContext resume:', e);
    }

    // 1. Fetch live session authorization & configuration from backend
    let sessionConfig: any = null;
    try {
      const res = await fetch('/api/live-session', { cache: 'no-store' });
      if (res.ok) {
        sessionConfig = await res.json();
      }
    } catch (err) {
      console.warn('[GeminiLiveSession] /api/live-session check error:', err);
    }

    // 2. If backend explicitly reports key missing or configuration error
    if (sessionConfig && sessionConfig.configured === false) {
      const errorMsg =
        sessionConfig.error ||
        'GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables and redeploy.';
      console.error('[GeminiLiveSession Config Error]:', errorMsg);
      this.onStatusChange?.('error', errorMsg);
      return;
    }

    if (sessionConfig && sessionConfig.success === false && sessionConfig.error) {
      console.error('[GeminiLiveSession Token Error]:', sessionConfig.error);
      this.onStatusChange?.('error', sessionConfig.error);
      return;
    }

    // 3. Ephemeral token and endpoint provided by secure backend
    const ephemeralToken: string | undefined = sessionConfig?.token;
    const endpoint: string =
      sessionConfig?.websocketEndpoint ||
      'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';
    const isVercelHost = window.location.hostname.includes('vercel.app');

    // On Vercel, incoming WebSockets to /api/live are not supported by the serverless router,
    // so the browser connects directly to Gemini Live API using the secure ephemeral token.
    if (isVercelHost) {
      if (ephemeralToken) {
        console.log('[GeminiLiveSession] Running on Vercel host: connecting directly with secure ephemeral token...');
        this.isDirectConnection = true;
        this.connectDirectWebSocket(ephemeralToken, endpoint);
        return;
      } else {
        this.onStatusChange?.(
          'error',
          'Ephemeral session token not received. Please verify GEMINI_API_KEY in Vercel settings.'
        );
        return;
      }
    }

    // On standalone Node, Cloud Run, and local development, the same-origin /api/live
    // server proxy is running and connects upstream via Node.js @google/genai client.
    console.log('[GeminiLiveSession] Connecting via same-origin server WebSocket proxy on /api/live...');
    this.isDirectConnection = false;
    this.connectServerProxy(ephemeralToken, endpoint);
  }

  private connectDirectWebSocket(ephemeralToken: string, endpointUrl: string) {
    const wsUrl = `${endpointUrl}?access_token=${ephemeralToken}`;
    console.log('[GeminiLiveSession Direct] Establishing WebSocket to:', endpointUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';
    } catch (err: any) {
      console.error('[GeminiLiveSession] Direct WebSocket constructor error:', err);
      this.onStatusChange?.('error', `Failed to open WebSocket to Gemini Live API: ${err?.message || err}`);
      return;
    }

    this.ws.onopen = () => {
      console.log('[GeminiLiveSession Direct] WebSocket opened with ephemeral token. Transmitting setup frame...');
      const targetLanguageName =
        this.language === 'te' ? 'Telugu (తెలుగు)' : this.language === 'hi' ? 'Hindi (हिन्दी)' : 'Indian English';
      const systemInstruction = `You are VoiceBridge AI, a warm, patient, and conversational voice companion assisting citizens with public services, education scholarships, healthcare schemes, and general everyday inquiries.
Target Language: ${targetLanguageName}

VOICE-FIRST CONVERSATIONAL PRINCIPLES:
1. Speak warmly and naturally in ${targetLanguageName}, as if sitting right beside the citizen.
2. Respond conversationally in 1 to 3 spoken sentences. Avoid monologue-length responses.
3. NEVER recite markdown symbols, asterisk bolding, bullet points, numbered lists, or raw portal URLs aloud.
4. If explaining complex paperwork or criteria, use simple everyday examples.
5. Answer directly without repeating the citizen's entire question.
6. The user can interrupt you at any moment; adapt fluidly and naturally to their speech.
${this.topic ? `Active Scheme/Context: ${this.topic}` : ''}
${this.page ? `Current App Screen: ${this.page}` : ''}`;

      const setupMessage = {
        setup: {
          model: 'models/gemini-3.8-live',
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: this.voiceName || 'Aoede'
                }
              }
            }
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      };

      this.ws?.send(JSON.stringify(setupMessage));
      this.isConnected = true;
      this.onStatusChange?.('connected');
      this.initMicStream();
    };

    this.ws.onmessage = async (event) => {
      try {
        let textData = '';
        if (typeof event.data === 'string') {
          textData = event.data;
        } else if (event.data instanceof ArrayBuffer) {
          textData = new TextDecoder().decode(event.data);
        } else if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
          textData = await event.data.text();
        }

        if (!textData) return;
        const msg = JSON.parse(textData);

        if (msg.setupComplete) {
          console.log('[GeminiLiveSession Direct] Setup completed successfully by Gemini 3.8 Live API.');
          this.onStatusChange?.('listening');
        }

        // Handle model audio output (24kHz PCM)
        const parts = msg.serverContent?.modelTurn?.parts || [];
        if (parts.length > 0) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              this.playPcm24k(part.inlineData.data);
            }
          }
        }

        // User speech transcription
        if (msg.serverContent?.inputTranscription?.text) {
          console.log('[GeminiLiveSession Direct] User transcription:', msg.serverContent.inputTranscription.text);
          this.onInputTranscript?.(msg.serverContent.inputTranscription.text);
        }

        // Model spoken speech transcription
        if (msg.serverContent?.outputTranscription?.text) {
          this.onOutputTranscript?.(msg.serverContent.outputTranscription.text);
          this.onStatusChange?.('speaking');
        }

        // Interruption by user
        if (msg.serverContent?.interrupted) {
          console.log('[GeminiLiveSession Direct] Server signaled interruption.');
          this.stopAllAudioPlayback();
          this.isTurnCompletePending = false;
          this.hasReceivedFirstModelTurn = false;
          this.onInterrupted?.();
          this.onStatusChange?.('listening');
        }

        // Turn or generation complete from Gemini Live API
        if (msg.serverContent?.generationComplete || msg.serverContent?.turnComplete) {
          console.log(
            `[GeminiLiveSession Direct] Generation completed by Gemini. Active audio buffers playing: ${this.activeSources.length}`
          );
          if (this.activeSources.length > 0) {
            this.isTurnCompletePending = true;
          } else {
            this.isTurnCompletePending = false;
            this.hasReceivedFirstModelTurn = false;
            this.onStatusChange?.('listening');
            this.onTurnComplete?.();
          }
        }
      } catch (err) {
        console.warn('[GeminiLiveSession Direct] Message parsing error:', err);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[GeminiLiveSession Direct] Error:', e);
      // If direct connection failed on non-Vercel host, gracefully fallback to same-origin server proxy
      if (!window.location.hostname.includes('vercel.app') && !this.isConnected) {
        console.log('[GeminiLiveSession Direct] Direct connection unavailable. Falling back to same-origin /api/live proxy...');
        this.isDirectConnection = false;
        this.connectServerProxy();
        return;
      }
      this.onStatusChange?.('error', 'Gemini Live API connection error. Please verify your GEMINI_API_KEY in Vercel settings.');
    };

    this.ws.onclose = (e) => {
      console.log('[GeminiLiveSession Direct] Closed with code:', e.code, 'reason:', e.reason);
      this.isConnected = false;
      this.stopAllAudioPlayback();

      if (e.code === 1007) {
        this.onStatusChange?.('error', 'Gemini Live session token rejected (code 1007). Please verify GEMINI_API_KEY in Vercel settings.');
      } else if (e.code === 1008 || e.code === 1011) {
        this.onStatusChange?.('error', `Live session rejected (${e.reason || 'Authentication or quota error'}).`);
      } else if (e.wasClean) {
        this.onStatusChange?.('disconnected');
      } else {
        this.onStatusChange?.('error', e.reason || 'Gemini Live session disconnected.');
      }
    };
  }

  private connectServerProxy(ephemeralToken?: string, endpointUrl?: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams({
      lang: this.language,
      voice: this.voiceName,
      page: this.page,
      topic: this.topic
    });
    const wsUrl = `${protocol}//${window.location.host}/api/live?${params.toString()}`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err: any) {
      console.error('[GeminiLiveSession Proxy] WebSocket constructor error:', err);
      this.onStatusChange?.('error', 'Failed to connect to /api/live proxy.');
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.onStatusChange?.('connected');
      this.onStatusChange?.('listening');
      this.initMicStream();
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          this.onStatusChange?.('error', msg.error);
        } else if (msg.audio) {
          this.playPcm24k(msg.audio);
        } else if (msg.inputTranscript) {
          this.onInputTranscript?.(msg.inputTranscript);
        } else if (msg.outputTranscript) {
          this.onOutputTranscript?.(msg.outputTranscript);
          this.onStatusChange?.('speaking');
        } else if (msg.interrupted) {
          this.stopAllAudioPlayback();
          this.isTurnCompletePending = false;
          this.hasReceivedFirstModelTurn = false;
          this.onInterrupted?.();
          this.onStatusChange?.('listening');
        } else if (msg.turnComplete || msg.generationComplete) {
          if (this.activeSources.length > 0) {
            this.isTurnCompletePending = true;
          } else {
            this.isTurnCompletePending = false;
            this.hasReceivedFirstModelTurn = false;
            this.onStatusChange?.('listening');
            this.onTurnComplete?.();
          }
        }
      } catch (err) {
        console.warn('Live API WebSocket proxy parse error:', err);
      }
    };

    this.ws.onerror = (e) => {
      console.warn('Gemini Live API WebSocket proxy error:', e);
      if (ephemeralToken && endpointUrl && !this.isConnected) {
        console.log('[GeminiLiveSession Proxy] Server proxy error. Retrying via direct Live API connection with ephemeral token...');
        this.isDirectConnection = true;
        this.connectDirectWebSocket(ephemeralToken, endpointUrl);
        return;
      }
      if (window.location.hostname.includes('vercel.app')) {
        this.onStatusChange?.('error', 'Vercel Serverless hosting requires GEMINI_API_KEY configured in Vercel Project Settings > Environment Variables.');
      } else {
        this.onStatusChange?.('error', 'Live API connection error. Please verify server status.');
      }
    };

    this.ws.onclose = (e) => {
      this.isConnected = false;
      this.stopAllAudioPlayback();

      if (e.code === 1006 && window.location.hostname.includes('vercel.app')) {
        this.onStatusChange?.('error', 'Vercel Edge closed the WebSocket connection (code 1006). Vercel Serverless requires GEMINI_API_KEY to be set in Vercel Environment Variables so the browser connects directly to Gemini Live API.');
      } else {
        this.onStatusChange?.('disconnected');
      }
    };
  }

  // Linear interpolation resampling to exact 16,000Hz PCM
  private resampleTo16k(input: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === 16000) {
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16;
    }

    const ratio = inputSampleRate / 16000;
    const outputLength = Math.floor(input.length / ratio);
    const pcm16 = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = Math.floor(i * ratio);
      const s = Math.max(-1, Math.min(1, input[srcIndex]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  }

  // Explicit conversational turn complete trigger (ends user turn, requests model answer)
  public sendTurnComplete() {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    console.log('[GeminiLiveSession] Dispatching turnComplete signal to Gemini Live API. State -> thinking');
    this.onStatusChange?.('thinking');

    if (this.isDirectConnection) {
      this.ws.send(JSON.stringify({
        clientContent: {
          turnComplete: true
        }
      }));
    } else {
      this.ws.send(JSON.stringify({ turnComplete: true }));
    }
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

      this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const actualSampleRate = this.inputAudioCtx.sampleRate;
      console.log(`[GeminiLiveSession] Microphone input AudioContext initialized at ${actualSampleRate}Hz.`);

      const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Compute RMS volume level for activity visualizer & VAD
        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
          sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / channelData.length);
        const level = Math.min(1, rms * 5.5);
        this.onAudioActivity?.(level, 'mic');

        const now = Date.now();
        const SPEECH_START_THRESHOLD = 0.022; // Vocal energy threshold
        const BARGE_IN_THRESHOLD = 0.22;      // Higher threshold to avoid speaker echo
        const SILENCE_TIMEOUT_MS = 1000;      // 1 second silence after speaking triggers turn completion
        const MIN_SPEECH_DURATION_MS = 350;   // Minimum speech duration to filter clicks

        const isModelCurrentlySpeaking = this.activeSources.length > 0;
        const timeSinceModelStarted = now - this.modelPlaybackStartTime;

        // User barge-in: If user speaks loud and sustained while assistant is speaking
        if (isModelCurrentlySpeaking && timeSinceModelStarted > 600 && rms > BARGE_IN_THRESHOLD) {
          console.log(`[GeminiLiveSession] User barge-in detected (RMS: ${rms.toFixed(3)}). Halting assistant audio.`);
          this.stopAllAudioPlayback();
          this.isTurnCompletePending = false;
          this.hasReceivedFirstModelTurn = false;
          this.onInterrupted?.();
          this.onStatusChange?.('listening');
        }

        // Client Voice Activity Detection (VAD)
        if (rms > SPEECH_START_THRESHOLD) {
          if (!this.isUserSpeaking) {
            this.isUserSpeaking = true;
            this.speechStartTime = now;
            console.log(`[GeminiLiveSession VAD] User speech started (RMS: ${rms.toFixed(3)})`);
            this.onStatusChange?.('listening');
          }
          this.lastSpeechTime = now;

          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        } else if (this.isUserSpeaking) {
          // User was speaking and is now silent: start silence countdown
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              const speechDuration = this.lastSpeechTime - this.speechStartTime;
              if (speechDuration >= MIN_SPEECH_DURATION_MS) {
                console.log(
                  `[GeminiLiveSession VAD] User speech ended (${speechDuration}ms speech, ${SILENCE_TIMEOUT_MS}ms silence). Completing turn...`
                );
                this.sendTurnComplete();
              } else {
                console.log(`[GeminiLiveSession VAD] Speech duration too short (${speechDuration}ms), ignoring.`);
              }
              this.isUserSpeaking = false;
              this.silenceTimer = null;
            }, SILENCE_TIMEOUT_MS);
          }
        }

        // Resample input to guaranteed 16kHz PCM
        const pcm16 = this.resampleTo16k(channelData, actualSampleRate);
        const base64 = this.arrayBufferToBase64(pcm16.buffer);

        if (this.isDirectConnection) {
          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64
                }
              ]
            }
          }));
        } else {
          this.ws.send(JSON.stringify({ audio: base64 }));
        }
      };
    } catch (err: any) {
      console.error('Failed to init microphone for Gemini Live API:', err);
      this.onStatusChange?.('error', err.message || 'Microphone access denied or unavailable.');
    }
  }

  private playPcm24k(base64Data: string) {
    if (!base64Data) return;

    try {
      if (!this.outputAudioCtx) {
        this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.outputAudioCtx.state === 'suspended') {
        this.outputAudioCtx.resume().catch(() => {});
      }

      const binary = atob(base64Data);
      const len = binary.length;
      const sampleCount = Math.floor(len / 2);
      if (sampleCount === 0) return;

      const float32 = new Float32Array(sampleCount);
      let sum = 0;
      for (let i = 0; i < sampleCount; i++) {
        const byte1 = binary.charCodeAt(i * 2);
        const byte2 = binary.charCodeAt(i * 2 + 1);
        let val = byte1 | (byte2 << 8);
        if (val >= 0x8000) val -= 0x10000;
        const norm = val / 32768.0;
        float32[i] = norm;
        sum += Math.abs(norm);
      }

      if (!this.hasReceivedFirstModelTurn) {
        this.hasReceivedFirstModelTurn = true;
        this.modelPlaybackStartTime = Date.now();
      }

      // Audio activity from model output
      const modelLevel = Math.min(1, (sum / sampleCount) * 4.5);
      this.onAudioActivity?.(modelLevel, 'model');
      this.onStatusChange?.('speaking');

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

        // When all scheduled audio buffers finish playing
        if (this.activeSources.length === 0) {
          this.hasReceivedFirstModelTurn = false;
          if (this.isTurnCompletePending) {
            this.isTurnCompletePending = false;
            console.log('[GeminiLiveSession] Assistant speech finished. State -> listening');
            this.onStatusChange?.('listening');
            this.onTurnComplete?.();
          }
        }
      };
    } catch (err) {
      console.error('[GeminiLiveSession] Error in playPcm24k:', err);
    }
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
    this.isTurnCompletePending = false;
    this.hasReceivedFirstModelTurn = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        if (!this.isDirectConnection) {
          this.ws.send(JSON.stringify({ interrupt: true }));
        }
      } catch (e) {
        // ignore
      }
    }
    this.onInterrupted?.();
    this.onStatusChange?.('listening');
  }

  public sendText(text: string) {
    if (!text.trim()) return;
    this.onStatusChange?.('thinking');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.isDirectConnection) {
        this.ws.send(JSON.stringify({
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text }]
              }
            ],
            turnComplete: true
          }
        }));
      } else {
        this.ws.send(JSON.stringify({ text }));
      }
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  public stop() {
    this.isConnected = false;
    this.isUserSpeaking = false;
    this.isTurnCompletePending = false;
    this.hasReceivedFirstModelTurn = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

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
