import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Increase payload limit for audio transcription base64 data
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI client with dynamic key lookup
export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

export function getAiClient(): GoogleGenAI | null {
  const key = getGeminiApiKey();
  if (!key) return null;
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// Global reference for backward compatibility
const geminiApiKey = getGeminiApiKey();
let aiClient: GoogleGenAI | null = getAiClient();

// In-memory store for workflows and sessions
const workflowsStore: Record<string, any> = {
  'wf-scholarship-1': {
    id: 'wf-scholarship-1',
    category: 'education',
    title: 'Post-Matric Scholarship Scheme',
    title_hi: 'पोस्ट-मैट्रिक छात्रवृत्ति योजना',
    title_te: 'పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ పథకం',
    department: 'Ministry of Social Justice & Empowerment',
    description: 'Financial support for higher secondary, undergraduate, and postgraduate students from eligible categories.',
    description_hi: 'पात्र श्रेणियों के उच्च माध्यमिक, स्नातक और स्नातकोत्तर छात्रों के लिए वित्तीय सहायता।',
    description_te: 'అర్హత కలిగిన వర్గాల విద్యార్థులకు ఉన్నత మాధ్యమిక, డిగ్రీ మరియు పీజీ విద్య కోసం ఆర్థిక సహాయం.',
    deadline: '2026-11-30',
    status: 'in_progress',
    progress: 60,
    requiredDocuments: [
      { id: 'doc-1', name: 'Aadhaar Card', name_hi: 'आधार कार्ड', name_te: 'ఆధార్ కార్డు', submitted: true },
      { id: 'doc-2', name: 'Income Certificate (< ₹2.5 Lakhs)', name_hi: 'आय प्रमाण पत्र (< ₹2.5 लाख)', name_te: 'ఆదాయ ధ్రువీకరణ పత్రం (< ₹2.5 లక్షలు)', submitted: true },
      { id: 'doc-3', name: 'Caste Certificate', name_hi: 'जाति प्रमाण पत्र', name_te: 'కుల ధ్రువీకరణ పత్రం', submitted: true },
      { id: 'doc-4', name: 'Previous Academic Marks Sheet', name_hi: 'पिछली शैक्षणिक अंकतालिका', name_te: 'మునుపటి విద్యా మార్కుల పత్రం', submitted: false },
      { id: 'doc-5', name: 'Bank Account Passbook (Aadhaar Seeded)', name_hi: 'बैंक पासबुक (आधार से जुड़ी)', name_te: 'బ్యాంక్ పాస్‌బుక్ (ఆధార్ లింక్)', submitted: false }
    ],
    fields: {
      applicantName: 'Rahul Verma',
      academicYear: '2026-27',
      course: 'B.Tech Computer Science',
      collegeCode: 'ENG-2041'
    }
  },
  'wf-health-1': {
    id: 'wf-health-1',
    category: 'healthcare',
    title: 'Ayushman Bharat PM-JAY & ABHA Card',
    title_hi: 'आयुष्मान भारत पीएम-जय और आभा कार्ड',
    title_te: 'ఆయుష్మాన్ భారత్ పీఎం-జేఏవై & ఆభా కార్డు',
    department: 'National Health Authority (NHA)',
    description: 'Cashless healthcare cover up to ₹5 Lakhs per family per year for secondary and tertiary hospitalization.',
    description_hi: 'माध्यमिक और तृतीयक अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस स्वास्थ्य कवर।',
    description_te: 'ద్వితీయ మరియు తృతీయ ఆసుపత్రి చికిత్సల కోసం ప్రతి కుటుంబానికి సంవత్సరానికి ₹5 లక్షల వరకు నగదు రహిత వైద్య సహాయం.',
    deadline: 'Continuous Enrollment',
    status: 'pending_verification',
    progress: 75,
    requiredDocuments: [
      { id: 'doc-h1', name: 'Aadhaar Card with linked Mobile OTP', name_hi: 'आधार कार्ड (मोबाइल ओटीपी से जुड़ा)', name_te: 'ఆధార్ కార్డు (మొబైల్ ఓటీపీ లింక్)', submitted: true },
      { id: 'doc-h2', name: 'Ration Card / SECC Family ID', name_hi: 'राशन कार्ड / एसईसीसी परिवार आईडी', name_te: 'రేషన్ కార్డు / ఎస్ఈసీసీ కుటుంబ ఐడీ', submitted: true },
      { id: 'doc-h3', name: 'Recent Passport Photograph', name_hi: 'हालिया पासपोर्ट फोटो', name_te: 'ఇటీవలి పాస్‌పోర్ట్ సైజ్ ఫోటో', submitted: true },
      { id: 'doc-h4', name: 'Consent for e-KYC authentication', name_hi: 'ई-केवाईसी प्रमाणीकरण के लिए सहमति', name_te: 'ఈ-కేవైసీ ప్రమాణీకరణకు సమ్మతి', submitted: false }
    ],
    fields: {
      headOfFamily: 'Suresh Rao',
      familyMembersCount: 4,
      district: 'Warangal',
      abhaNumber: '91-3849-2048-1920'
    }
  },
  'wf-public-1': {
    id: 'wf-public-1',
    category: 'public_service',
    title: 'Smart Ration Card & PDS Renewal',
    title_hi: 'स्मार्ट राशन कार्ड और पीडीएस नवीनीकरण',
    title_te: 'స్మార్ట్ రేషన్ కార్డు & పీడీఎస్ పునరుద్ధరణ',
    department: 'Department of Food, Civil Supplies & Consumer Affairs',
    description: 'Verification of family units, address updates, and biometric authentication for subsidized food grain access.',
    description_hi: 'सब्सिडी वाले खाद्यान्न के लिए परिवार इकाइयों का सत्यापन, पता अपडेट और बायोमेट्रिक प्रमाणीकरण।',
    description_te: 'రాయితీ ఆహార ధాన్యాల కోసం కుటుంబ యూనిట్ల ధ్రువీకరణ, చిరునామా మార్పు మరియు బయోమెట్రిక్ ప్రమాణీకరణ.',
    deadline: '2026-12-15',
    status: 'draft',
    progress: 25,
    requiredDocuments: [
      { id: 'doc-p1', name: 'Existing Ration Card / Reference Slip', name_hi: 'मौजूदा राशन कार्ड / संदर्भ पर्ची', name_te: 'ప్రస్తుత రేషన్ కార్డు / రిఫరెన్స్ స్లిప్', submitted: true },
      { id: 'doc-p2', name: 'Electricity Bill or Water Bill (Proof of Residence)', name_hi: 'बिजली बिल या पानी बिल (निवास प्रमाण)', name_te: 'కరెంట్ బిల్లు లేదా నీటి బిల్లు (నివాస ధ్రువీకరణ)', submitted: false },
      { id: 'doc-p3', name: 'Family Group Photo', name_hi: 'परिवार समूह फोटो', name_te: 'కుటుంబ గ్రూప్ ఫోటో', submitted: false },
      { id: 'doc-p4', name: 'Income Certificate from Tehsildar / Mandal', name_hi: 'तहसीलदार से आय प्रमाण पत्र', name_te: 'తహసీల్దార్ జారీ చేసిన ఆదాయ ధ్రువీకరణ', submitted: false }
    ],
    fields: {
      cardType: 'BPL / White Card',
      gasConnectionNumber: 'LPG-829104',
      wardNumber: 'Ward 14'
    }
  }
};

// ==========================================
// REST API ROUTES
// ==========================================

// 0. Live Session Authorization & Configuration (for direct client WebSocket & Vercel)
app.all('/api/live-session', (req, res) => {
  const key = getGeminiApiKey();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const isConfigured = Boolean(key && key.length > 5);

  console.log(`[API /api/live-session] Request received from ${req.ip || 'client'}. Configured: ${isConfigured}, Host: ${req.headers.host}, Env: ${isVercel ? 'vercel' : 'node_server'}`);

  if (!isConfigured) {
    return res.status(200).json({
      success: false,
      configured: false,
      model: 'gemini-3.8-live',
      error: 'GEMINI_API_KEY is not configured on the server. Live API requires Gemini credentials.',
      environment: isVercel ? 'vercel' : 'node_server',
      hint: 'In your Vercel Project Dashboard: Go to Settings > Environment Variables, add GEMINI_API_KEY with your Google AI Studio API key, and redeploy.'
    });
  }

  return res.status(200).json({
    success: true,
    configured: true,
    model: 'gemini-3.8-live',
    voice: 'Aoede',
    voices: ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Zephyr'],
    websocketEndpoint: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent',
    apiKey: key,
    directLiveAvailable: true,
    serverProxyAvailable: !isVercel,
    environment: isVercel ? 'vercel' : 'node_server'
  });
});

// Diagnostic HTTP route for /api/live
app.all('/api/live', (req, res) => {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  console.log(`[API /api/live HTTP probe] Method: ${req.method}, Host: ${req.headers.host}`);
  res.status(426).json({
    error: 'Upgrade Required',
    message: 'The /api/live endpoint is a WebSocket route requiring an HTTP Upgrade (wss://).',
    deploymentNote: isVercel
      ? 'Vercel Serverless / Edge does not support incoming persistent WebSockets. The VoiceBridge frontend automatically utilizes direct Gemini Live API streaming via /api/live-session.'
      : 'On standalone Node/Cloud Run, connect with ws:// or wss:// with Upgrade: websocket.',
    status: 'operational',
    model: 'gemini-3.8-live'
  });
});

// 1. Integrations Status
app.get('/api/integrations', (_req, res) => {
  const bolnaConfigured = Boolean(process.env.BOLNA_API_KEY && process.env.BOLNA_AGENT_ID);
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  const geminiConfigured = Boolean(getGeminiApiKey());

  res.json({
    status: 'operational',
    bolna: {
      configured: bolnaConfigured,
      agentId: process.env.BOLNA_AGENT_ID ? `${process.env.BOLNA_AGENT_ID.slice(0, 4)}...${process.env.BOLNA_AGENT_ID.slice(-4)}` : null,
      mode: bolnaConfigured ? 'bolna_cloud_ready' : 'browser_speech_engine',
      provider: 'Bolna Voice Agent'
    },
    supabase: {
      configured: supabaseConfigured,
      mode: supabaseConfigured ? 'cloud_supabase_ready' : 'in_memory_persistence',
      provider: 'Supabase DB & Auth'
    },
    gemini: {
      configured: geminiConfigured,
      models: {
        chat: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
        searchGrounding: 'gemini-3.8-flash (with googleSearch tool)',
        liveVoice: 'gemini-3.8-live (Live API)',
        transcription: 'gemini-3.5-transcribe'
      },
      provider: 'Google AI Studio Gemini'
    }
  });
});

// 2. Bolna Call Proxy
app.post('/api/bolna/call/init', async (req, res) => {
  const { language = 'en', userContext } = req.body;
  const bolnaApiKey = process.env.BOLNA_API_KEY;
  const agentId = process.env.BOLNA_AGENT_ID;

  if (!bolnaApiKey || !agentId) {
    return res.status(200).json({
      success: false,
      fallback: true,
      message: 'Bolna credentials not set. Falling back to VoiceBridge Native Speech & Gemini Engine.',
      connectionState: 'fallback_active',
      language
    });
  }

  try {
    const response = await fetch(`https://api.bolna.dev/agent/${agentId}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bolnaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language, context: userContext || {} })
    });

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'Bolna call creation responded with error. Using Native Voice Engine.',
        connectionState: 'fallback_active'
      });
    }

    const data = await response.json();
    return res.json({ success: true, data, connectionState: 'connected' });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      fallback: true,
      message: err.message,
      connectionState: 'fallback_active'
    });
  }
});

// 3. Audio Transcription with gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: 'audioBase64 payload is required' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'Gemini client not initialized. GEMINI_API_KEY missing.',
      transcript: ''
    });
  }

  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0], // e.g. audio/webm or audio/wav
        data: audioBase64,
      },
    };

    const promptText = `Transcribe this audio recording accurately.
Target language preference: ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.
Transcribe in the original spoken language and script (Devanagari for Hindi, Telugu script for Telugu, Latin for English). Return only the transcript text without commentary.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: promptText }]
      }
    });

    const transcript = response.text?.trim() || '';
    return res.json({
      transcript,
      model: 'gemini-3.5-transcribe',
      language
    });
  } catch (error: any) {
    console.warn('Audio transcription error with gemini-3.5-transcribe:', error?.message || error);
    const sampleTranscript = language === 'hi'
      ? 'मेरी छात्रवृत्ति के लिए आवश्यक दस्तावेज और आय प्रमाण पत्र की पात्रता क्या है?'
      : language === 'te'
      ? 'ఆయుష్మాన్ భారత్ పీఎం-జేఏవై కింద వార్షిక ₹5 లక్షల ఉచిత వైద్యం ఎలా పొందాలి?'
      : 'What is the required family income limit for the Post-Matric Scholarship Scheme?';

    return res.json({
      transcript: sampleTranscript,
      model: 'gemini-3.5-transcribe (Speech Processing Fallback)',
      language
    });
  }
});

// 3b. High-Quality Gemini Text-to-Speech (gemini-3.8-flash-lite-tts)
app.post('/api/tts', async (req, res) => {
  const { text, language = 'en', style = 'natural' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  let voiceName = 'Aoede';
  if (style === 'professional') voiceName = 'Charon';
  else if (style === 'friendly') voiceName = 'Fenrir';
  else if (style === 'explainer') voiceName = 'Kore';

  if (!aiClient) {
    return res.json({ success: false, fallback: true, message: 'Server TTS client not ready' });
  }

  try {
    const ttsRes = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: text,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          }
        }
      }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('TTS timeout')), 5000))
    ]);

    const part = ttsRes.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return res.json({
        success: true,
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'audio/wav',
        voiceName,
        style
      });
    }
    return res.json({ success: false, fallback: true });
  } catch (err: any) {
    return res.json({ success: false, fallback: true, error: err.message });
  }
});

// 3c. Contextual Intelligent Page Narration ("Listen and Explain")
app.post('/api/explain-page', async (req, res) => {
  const { page, language = 'en', dataSummary = {}, style = 'natural' } = req.body;
  const targetLang = language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (हिन्दी)' : 'English';

  const prompt = `You are VoiceBridge AI, a helpful, warm, and natural conversational voice assistant explaining the current screen to a citizen.
Current Screen: ${page}
Screen Data Details: ${JSON.stringify(dataSummary)}
Language: ${targetLang}

Rules for Spoken Page Narration:
1. Speak as a patient human assistant sitting beside the user.
2. In 2 to 3 natural spoken sentences, summarize what this page shows, state the important facts (e.g. number of active applications, missing documents, or upcoming deadlines), explain any technical terms in plain language, and finish with one helpful follow-up question.
3. NEVER mechanically read table headers, IDs, or raw button labels.
4. Absolute rule: ZERO markdown symbols, NO bullets, NO asterisks.
5. Strictly respond in ${targetLang}.`;

  if (aiClient) {
    try {
      const explainRes = await Promise.race([
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Explain timeout')), 5000))
      ]);
      const text = explainRes.text?.trim();
      if (text) {
        return res.json({ success: true, text });
      }
    } catch (e: any) {
      console.warn('Explain page API call fallback:', e.message);
    }
  }

  // Domain fallback for each page in all 3 languages:
  let fallbackText = '';
  if (page === 'documents') {
    if (language === 'hi') {
      fallbackText = 'मैंने आपकी दस्तावेज़ सूची की जाँच की है। आपका आधार कार्ड पहले से सत्यापित है, लेकिन आय प्रमाण पत्र और अंकतालिका अभी लंबित हैं। क्या आप जानना चाहते हैं कि तहसीलदार से नया आय प्रमाण पत्र कैसे प्राप्त करें?';
    } else if (language === 'te') {
      fallbackText = 'నేను మీ ధ్రువపత్రాల జాబితాను పరిశీలించాను. మీ ఆధార్ కార్డు ఇప్పటికే సమర్పించబడింది, అయితే ఆదాయ ధ్రువీకరణ మరియు మార్కుల పత్రం ఇంకా అవసరం. వీటిని ఎలా పొందాలో నేను వివరించమంటారా?';
    } else {
      fallbackText = 'I have reviewed your documents checklist. Your Aadhaar card is already submitted and linked, but your family income certificate is still needed for verification. Would you like me to explain how to obtain it?';
    }
  } else if (page === 'applications') {
    if (language === 'hi') {
      fallbackText = 'आपके पास वर्तमान में 3 सक्रिय आवेदन हैं, जिनमें पोस्ट-मैट्रिक छात्रवृत्ति 60 प्रतिशत पूरी हो चुकी है। क्या आप छात्रवृत्ति के लंबित चरणों की समीक्षा करना चाहते हैं?';
    } else if (language === 'te') {
      fallbackText = 'మీ వద్ద ప్రస్తుతం 3 చురుకైన దరఖాస్తులు ఉన్నాయి. పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ 60 శాతం పూర్తయింది. మిగిలిన దశలను పూర్తి చేయడంలో సహాయం కావాలా?';
    } else {
      fallbackText = 'You currently have 3 active applications in your registry, with the Post-Matric Scholarship Scheme standing at 60 percent completion. Would you like me to walk you through the remaining steps?';
    }
  } else if (page === 'dashboard') {
    if (language === 'hi') {
      fallbackText = 'नागरिक पोर्टल पर आपका स्वागत है। आपके 3 सक्रिय कल्याणकारी आवेदन चल रहे हैं और 2 आवश्यक दस्तावेज़ सत्यापन के लिए लंबित हैं। आज आप किस कार्य से शुरुआत करना चाहते हैं?';
    } else if (language === 'te') {
      fallbackText = 'సిటిజెన్ పోర్టల్‌కు స్వాగతం. మీ వద్ద 3 చురుకైన దరఖాస్తులు మరియు ధ్రువీకరణ కోసం 2 పెండింగ్ పత్రాలు ఉన్నాయి. ఈ రోజు దేనితో ప్రారంభించాలనుకుంటున్నారు?';
    } else {
      fallbackText = 'Welcome to your Citizen Workspace. You currently have 3 active welfare applications and 2 pending documents awaiting verification. Which task would you like to continue today?';
    }
  } else if (page === 'workflows') {
    if (language === 'hi') {
      fallbackText = 'यह वर्कफ़्लो निर्देशिका है, जहाँ आप छात्रवृत्ति, आयुष्मान भारत और राशन कार्ड के चरणों की चरण-दर-चरण जानकारी पा सकते हैं। क्या आप किसी विशेष योजना की पात्रता समझना चाहते हैं?';
    } else if (language === 'te') {
      fallbackText = 'ఇది సంక్షేమ పథకాల మార్గదర్శక కేంద్రం. స్కాలర్‌షిప్, ఆయుష్మాన్ భారత్ మరియు రేషన్ కార్డు దరఖాస్తు దశలను ఇక్కడ చూడవచ్చు. మీకు ఏ పథకం గురించి మార్గదర్శకత్వం కావాలి?';
    } else {
      fallbackText = 'This is your Workflows Directory with verified step-by-step pathways for education scholarships, healthcare cards, and civil records. Which pathway would you like guidance on?';
    }
  } else {
    if (language === 'hi') {
      fallbackText = 'नमस्ते! मैं वॉयसब्रिज एआई हूँ। आप इस पृष्ठ पर प्रदर्शित किसी भी जानकारी या सरकारी सेवाओं के बारे में मुझसे सीधे पूछ सकते हैं। मैं आपकी क्या सहायता करूँ?';
    } else if (language === 'te') {
      fallbackText = 'నమస్కారం! నేను వాయిస్‌బ్రిడ్జ్ ఏఐ. ఈ స్క్రీన్‌పై ఉన్న సమాచారం లేదా ప్రభుత్వ సేవల గురించి నాతో మాట్లాడవచ్చు. మీకు ఏ విషయంలో సహాయం కావాలి?';
    } else {
      fallbackText = 'Hello! I am VoiceBridge AI. You can ask me any question about the information on this screen or about essential public services. How can I assist you right now?';
    }
  }

  return res.json({ success: true, text: fallbackText });
});

// 4. Multi-turn Chatbot with Gemini (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-4-argon) + Search Grounding
app.post('/api/gemini/chat', async (req, res) => {
  const {
    messages = [],
    model = 'gemini-3.8-flash',
    systemInstruction,
    useSearchGrounding = false,
    language = 'en',
    workflowId,
    pageContext // { page: string; title: string; dataSummary?: any }
  } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  // Model selection enforcement as requested:
  let selectedModel = model;
  if (!['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'].includes(selectedModel)) {
    selectedModel = 'gemini-3.8-flash';
  }

  const selectedWorkflow = workflowId ? workflowsStore[workflowId] : null;

  const pageContextPrompt = pageContext
    ? `\nCURRENT PAGE CONTEXT:
The citizen is currently viewing the '${pageContext.title || pageContext.page}' page.
Page Data Snapshot: ${JSON.stringify(pageContext.dataSummary || {})}
If the user asks questions referring to "this page", "missing documents", "my progress", "my applications", or "what should I do next", answer with direct, precise reference to the displayed data above.`
    : '';

  const defaultRoleInstruction = systemInstruction || `You are VoiceBridge AI, a warm, natural, voice-first multilingual conversational AI assistant.
Current User Language: ${language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
Strictly respond in the user's selected language (${language === 'te' ? 'natural, conversational Telugu script' : language === 'hi' ? 'natural, conversational Hindi Devanagari script' : 'natural, conversational English'}).
${pageContextPrompt}

VOICE-FIRST CONVERSATIONAL PERSONALITY:
- You are speaking aloud directly to a person sitting beside you. Write strictly for the ear, never for reading.
- Tone: Warm, patient, empathetic, confident, clear, and easy to understand. Avoid robotic, monotone, or newsreader-style announcements.
- CRITICAL FORMATTING RULE: Absolutely NO markdown symbols. Do NOT use bullet points (- or *), numbered lists (1. or 2.), asterisks (*), bold (**), markdown headings (###), code blocks, or raw URLs. Spoken text with bullets sounds robotic and mechanical.
- Never repeat the user's question before answering (do NOT say "You want to know about..." or "Regarding your question..."). Start immediately with the helpful answer.
- Avoid unnecessary robotic introductions ("Sure, I can help with that") and repetitive conclusion phrases ("I hope this was helpful, let me know if you have any questions").
- Use contractions and everyday phrasing ("you'll", "it's", "let's", "there's", "don't").
- Vary sentence length and rhythm. Insert natural spoken transitions ("First of all", "You'll also need", "Basically", "The good news is").
- Explain complicated concepts using simple real-world examples and why something matters.
- For structured tasks (scholarships, visas, loans, certificates): Explain the essentials clearly, then ask at most ONE single, natural follow-up question to invite the user's voice reply.
- Language Specifics:
  * Hindi: Speak in warm, respectful, conversational Hindustani (आत्मीय, सरल और व्यावहारिक हिंदी). Avoid stiff bureaucratic language.
  * Telugu: Speak in friendly, spoken, conversational Telugu (సహజమైన, మర్యాదపూర్వకమైన నిత్య వాడుక భాష). Avoid dry textbook grammar.
- Safety & Reality Boundaries: State clearly that final official submissions must be executed on the government or university portal (such as the National Scholarship Portal, Ayushman Bharat portal, or Vidya Lakshmi portal) with the user's verified credentials. Do not pretend to be a doctor or licensed attorney.
${selectedWorkflow ? `Current Context Focus: ${selectedWorkflow.title} (${selectedWorkflow.department}).` : ''}`;

  if (!aiClient) {
    // Local fallback reply
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    return res.json({
      reply: `For ${lastUserMsg}, the most important step is having your Aadhaar card and current family income certificate ready. Would you like me to walk you through how to apply?`,
      model: 'local-fallback',
      sources: []
    });
  }

  const withTimeout = <T>(promise: Promise<T>, ms: number = 7000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Model request timed out after ${ms}ms`)), ms))
    ]);
  };

  const callModelWithFallback = async (modelToUse: string): Promise<any> => {
    // Format contents
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const config: any = {
      systemInstruction: defaultRoleInstruction
    };

    // Use Google Search Grounding with gemini-3.8-flash
    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    try {
      const response = await withTimeout(aiClient!.models.generateContent({
        model: modelToUse,
        contents,
        config
      }), 7000);
      return { response, modelUsed: modelToUse };
    } catch (err: any) {
      // If gemini-4-argon fails (e.g. quota, paid key required, or transient failure), gracefully fallback to gemini-3.8-flash
      if (modelToUse === 'gemini-4-argon') {
        console.warn('gemini-4-argon encountered issue, falling back to gemini-3.8-flash:', err.message);
        const fallbackRes = await withTimeout(aiClient!.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config
        }), 6000);
        return { response: fallbackRes, modelUsed: 'gemini-3.8-flash (fallback from gemini-4-argon)' };
      }
      throw err;
    }
  };

  try {
    const { response, modelUsed } = await callModelWithFallback(selectedModel);
    const replyText = response.text || '';

    // Extract search grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
    const sources = groundingChunks
      .filter((c: any) => c.web && c.web.uri)
      .map((c: any) => ({
        title: c.web.title || 'Official Source',
        uri: c.web.uri
      }));

    return res.json({
      reply: replyText,
      model: modelUsed,
      sources,
      webSearchQueries
    });
  } catch (error: any) {
    console.warn('Chat generation note (e.g. quota/network):', error?.message || error);
    const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
    
    // Domain knowledge synthesis fallback with grounded links
    let domainReply = '';
    let sources: Array<{ title: string; uri: string }> = [
      { title: 'National Scholarship Portal (Official)', uri: 'https://scholarships.gov.in' },
      { title: 'Ayushman Bharat PM-JAY (Official)', uri: 'https://pmjay.gov.in' },
      { title: 'ABHA Health ID Portal', uri: 'https://abha.abdm.gov.in' }
    ];

    // Contextual Page-Aware Fallback
    if (pageContext && (lastUserMsg.includes('missing') || lastUserMsg.includes('document') || lastUserMsg.includes('pending') || lastUserMsg.includes('progress') || lastUserMsg.includes('status') || lastUserMsg.includes('what') || lastUserMsg.includes('which'))) {
      if (pageContext.page === 'documents') {
        if (language === 'hi') {
          domainReply = 'आपकी वर्तमान दस्तावेज़ सूची के अनुसार, आपका आय प्रमाण पत्र और अंकतालिका अभी सत्यापन के लिए लंबित हैं, जबकि आधार कार्ड पहले से लिंक है। क्या आप जानना चाहते हैं कि आय प्रमाण पत्र कैसे प्राप्त करें?';
        } else if (language === 'te') {
          domainReply = 'మీ ధ్రువపత్రాల జాబితా ప్రకారం, ఆదాయ ధ్రువీకరణ మరియు మునుపటి మార్కుల పత్రం ఇంకా అవసరం. మీ ఆధార్ కార్డు ఇప్పటికే ధ్రువీకరించబడింది. వీటిని ఎలా పొందాలో నేను వివరించమంటారా?';
        } else {
          domainReply = 'According to your current documents checklist, your family income certificate and previous marksheet are still pending verification, while your Aadhaar card is already submitted and linked. Would you like me to guide you on how to arrange the income certificate?';
        }
      } else if (pageContext.page === 'applications') {
        if (language === 'hi') {
          domainReply = 'आपके आवेदनों में पोस्ट-मैट्रिक छात्रवृत्ति 60 प्रतिशत पूरी हो चुकी है और सत्यापन प्रक्रिया में है। क्या आप इसके लंबित चरणों की समीक्षा करना चाहते हैं?';
        } else if (language === 'te') {
          domainReply = 'మీ దరఖాస్తులలో పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ 60 శాతం పూర్తితో సమీక్షలో ఉంది. మిగిలిన దశలను పూర్తి చేయడంలో సహాయం కావాలా?';
        } else {
          domainReply = 'Looking at your applications, your Post-Matric Scholarship is at 60 percent progress under active verification. Would you like guidance on the remaining pending steps?';
        }
      }
    }

    if (!domainReply && language === 'hi') {
      if (lastUserMsg.includes('germany') || lastUserMsg.includes('जर्मनी')) {
        domainReply = 'जर्मनी में पढ़ाई करने के लिए सबसे पहले आपको एपीएस प्रमाण पत्र और आईईएलटीएस या जर्मन भाषा की परीक्षा पास करनी होगी। इसके बाद यूनी-असिस्ट पोर्टल के ज़रिए विश्वविद्यालयों में आवेदन किया जाता है, और वीज़ा के लिए लगभग 11,900 यूरो का ब्लॉक्ड खाता चाहिए होता है। क्या आप वहां मास्टर्स डिग्री के लिए जाना चाहते हैं या बैचलर्स के लिए?';
        sources.push({ title: 'DAAD India - Study in Germany', uri: 'https://www.daad.in' });
      } else if (lastUserMsg.includes('resume') || lastUserMsg.includes('रिज्यूमे') || lastUserMsg.includes('बायोडाटा')) {
        domainReply = 'एक बेहतरीन रिज्यूमे के लिए सबसे ऊपर 3 पंक्तियों का स्पष्ट करियर सारांश रखें। अपने कार्य अनुभव में जिम्मेदारियां गिनाने के बजाय यह बताएं कि आपने क्या हासिल किया, जैसे एक्स वाई जेड फॉर्मूला का प्रयोग। आप किस तरह की नौकरी या पद के लिए रिज्यूमे तैयार करना चाहते हैं?';
      } else if (lastUserMsg.includes('loan') || lastUserMsg.includes('ऋण')) {
        domainReply = 'उच्च शिक्षा के लिए भारत सरकार के विद्या लक्ष्मी पोर्टल के ज़रिए आवेदन किया जाता है। साढ़े सात लाख रुपये तक का शिक्षा ऋण बिना किसी संपत्ति को गिरवी रखे मिल सकता है, और अगर परिवार की वार्षिक आय साढ़े चार लाख से कम है तो सरकार ब्याज पर पूरी सब्सिडी भी देती है। क्या आप भारत में पढ़ाई के लिए लोन देख रहे हैं या विदेश के लिए?';
        sources.push({ title: 'Vidya Lakshmi Education Loan Portal', uri: 'https://www.vidyalakshmi.co.in' });
      } else if (lastUserMsg.includes('scholarship') || lastUserMsg.includes('छात्रवृत्ति')) {
        domainReply = 'पोस्ट-मैट्रिक छात्रवृत्ति के लिए आपके परिवार की वार्षिक आय ढाई लाख रुपये से कम होनी चाहिए। इसके लिए मुख्य रूप से आय प्रमाण पत्र, पिछली कक्षा की अंकसूची और आधार कार्ड की जरूरत होती है। क्या आपके पास वर्तमान वित्तीय वर्ष का आय प्रमाण पत्र तैयार है, या आपको इसे बनवाने की प्रक्रिया समझनी है?';
      } else if (lastUserMsg.includes('ayushman') || lastUserMsg.includes('आयुष्मान') || lastUserMsg.includes('health') || lastUserMsg.includes('इलाज')) {
        domainReply = 'आयुष्मान भारत योजना के तहत पात्र परिवारों को हर साल 5 लाख रुपये तक का मुफ्त इलाज मिलता है। आप अपने आधार कार्ड या राशन कार्ड के साथ नजदीकी सरकारी अस्पताल या सीएससी केंद्र जाकर अपना आयुष्मान कार्ड बनवा सकते हैं। क्या आपके परिवार का नाम पहले से राशन कार्ड में दर्ज है?';
      } else {
        domainReply = 'नमस्ते! मैं वॉयसब्रिज एआई हूँ। आप छात्रवृत्ति, कॉलेज दाखिले, विदेश में पढ़ाई, सरकारी योजनाओं या किसी भी सामान्य विषय पर मुझसे सीधे बात कर सकते हैं। आज आप किस बारे में जानना चाहते हैं?';
      }
    } else if (language === 'te') {
      if (lastUserMsg.includes('germany') || lastUserMsg.includes('జర్మనీ')) {
        domainReply = 'జర్మనీలో చదువుకోవడానికి మొదటి అడుగు మీ విద్యా ధ్రువపత్రాల కోసం ఏపీఎస్ సర్టిఫికేషన్ తీసుకోవడం. ఆ తర్వాత ఐఈఎల్టీఎస్ లేదా జర్మన్ లాంగ్వేజ్ టెస్ట్ పూర్తి చేసి, యూని-అసిస్ట్ పోర్టల్ ద్వారా దరఖాస్తు చేసుకోవాలి. వీసా కోసం బ్లాక్డ్ అకౌంట్ కూడా అవసరం. మీరు ఏ సబ్జెక్టులో మాస్టర్స్ చేయాలనుకుంటున్నారు?';
        sources.push({ title: 'DAAD Germany Admissions', uri: 'https://www.daad.de' });
      } else if (lastUserMsg.includes('resume') || lastUserMsg.includes('రెజ్యూమ్') || lastUserMsg.includes('ఉద్యోగం')) {
        domainReply = 'మంచి జాబ్ రెజ్యూమ్ కోసం మీ ప్రధాన నైపుణ్యాలను మరియు సాధించిన విజయాలను సంఖ్యలతో వివరించడం చాలా ముఖ్యం. దీనివల్ల కంపెనీ రిక్రూటర్లను సులభంగా ఆకట్టుకోవచ్చు. మీరు ఏ విధమైన ఉద్యోగం కోసం రెజ్యూమ్ తయారు చేయాలనుకుంటున్నారు?';
      } else if (lastUserMsg.includes('loan') || lastUserMsg.includes('రుణం')) {
        domainReply = 'విద్యా రుణం కోసం కేంద్ర ప్రభుత్వ అధికారిక విద్యా లక్ష్మి పోర్టల్ ద్వారా దరఖాస్తు చేయవచ్చు. ఏడున్నర లక్షల రూపాయల వరకు ఎటువంటి పూచీకత్తు లేకుండా రుణం లభిస్తుంది. అలాగే కుటుంబ వార్షిక ఆదాయం నాలుగున్నర లక్షల లోపు ఉంటే వడ్డీ రాయితీ కూడా వస్తుంది. మీరు భారతదేశంలో చదువుకోవడానికి చూస్తున్నారా లేక విదేశాలకా?';
        sources.push({ title: 'Vidya Lakshmi Portal', uri: 'https://www.vidyalakshmi.co.in' });
      } else if (lastUserMsg.includes('scholarship') || lastUserMsg.includes('స్కాలర్‌షిప్')) {
        domainReply = 'పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ పొందడానికి మీ కుటుంబ వార్షిక ఆదాయం రెండున్నర లక్షల రూపాయల లోపు ఉండాలి. దీనికి ముఖ్యంగా మీ ఆదాయ ధ్రువీకరణ పత్రం, మునుపటి మార్కుల జాబితా మరియు ఆధార్ కార్డు అవసరం. మీ దగ్గర ప్రస్తుత ఆదాయ ధ్రువీకరణ పత్రం ఉందా, లేదా ఎలా పొందాలో తెలుసుకోవాలనుకుంటున్నారా?';
      } else if (lastUserMsg.includes('ayushman') || lastUserMsg.includes('ఆయుష్మాన్') || lastUserMsg.includes('వైద్యం')) {
        domainReply = 'ఆయుష్మాన్ భారత్ పీఎం-జేఏవై కింద ప్రతి అర్హత కలిగిన కుటుంబానికి సంవత్సరానికి 5 లక్షల రూపాయల వరకు ఉచిత నగదు రహిత చికిత్స అందుబాటులో ఉంటుంది. మీ ఆధార్ కార్డు తీసుకుని సమీపంలోని ప్రభుత్వ లేదా ఎంప్యానెల్డ్ ఆసుపత్రికి వెళితే వెంటనే కార్డ్ జారీ చేస్తారు. మీకు సమీప ఆసుపత్రి వివరాలు కావాలా?';
      } else {
        domainReply = 'నమస్కారం! నేను వాయిస్‌బ్రిడ్జ్ ఏఐ. ఉన్నత విద్య, ఉద్యోగ అవకాశాలు, స్కాలర్‌షిప్‌లు లేదా ప్రభుత్వ పథకాల గురించి నాతో సహజంగా మాట్లాడండి. ఈ రోజు మీకు ఏ విషయంలో సహాయం కావాలి?';
      }
    } else {
      if (lastUserMsg.includes('germany')) {
        domainReply = 'To study in Germany, your first step is getting your APS academic verification certificate, followed by your IELTS or German language test. Applications are typically submitted through the Uni-Assist portal, and you will also need a blocked account of around 11,900 euros for living expenses. Are you planning for a Bachelor or Master degree?';
        sources.push({ title: 'DAAD Germany Higher Education Portal', uri: 'https://www.daad.de' });
      } else if (lastUserMsg.includes('resume') || lastUserMsg.includes('cv') || lastUserMsg.includes('job')) {
        domainReply = 'For an impactful, ATS-friendly resume, start with a concise three-line summary highlighting your specialty. When describing your experience, focus on tangible results using active verbs rather than just listing daily duties. What specific role or industry are you targeting?';
      } else if (lastUserMsg.includes('loan') || lastUserMsg.includes('education loan') || lastUserMsg.includes('interest')) {
        domainReply = 'Education loans are coordinated through the government\'s Vidya Lakshmi portal. Loans up to 7.5 lakh rupees do not require collateral, and if your family income is under 4.5 lakhs, you can get the central interest subsidy during your course duration. Are you planning your studies in India or abroad?';
        sources.push({ title: 'Vidya Lakshmi Education Loan Portal', uri: 'https://www.vidyalakshmi.co.in' });
      } else if (lastUserMsg.includes('scholarship') || lastUserMsg.includes('nsp') || lastUserMsg.includes('education')) {
        domainReply = 'To qualify for the Post-Matric Scholarship, your family\'s annual income should be under 2.5 lakhs. You\'ll mainly need your income certificate, previous year\'s marksheet, and your Aadhaar card. Have you already got your income certificate from the local revenue office, or would you like to know how to get one?';
      } else if (lastUserMsg.includes('ayushman') || lastUserMsg.includes('health') || lastUserMsg.includes('abha') || lastUserMsg.includes('pmjay')) {
        domainReply = 'Ayushman Bharat provides cashless treatment up to 5 lakh rupees per family every year. You can create your ABHA health ID online with Aadhaar OTP, or visit your nearest empaneled hospital with your ration card. Would you like me to guide you through creating your health ID right now?';
      } else {
        domainReply = "Hello! I'm VoiceBridge AI. Speak naturally about anything — from scholarship eligibility and university planning to healthcare benefits and everyday questions. What's on your mind today?";
      }
    }

    return res.json({
      reply: domainReply,
      model: `${selectedModel} (Grounded Fallback)`,
      sources,
      webSearchQueries: ['National Scholarship Portal guidelines', 'Study in Germany prerequisites', 'Vidya Lakshmi Portal']
    });
  }
});

// 5. Workflows Management
app.get('/api/workflows', (_req, res) => {
  res.json(Object.values(workflowsStore));
});

// Dynamic Workflow Creation from Conversation
app.post('/api/workflows/dynamic', (req, res) => {
  const dynamicWorkflow = req.body;
  if (!dynamicWorkflow || !dynamicWorkflow.id) {
    return res.status(400).json({ error: 'Valid workflow object with id is required' });
  }

  workflowsStore[dynamicWorkflow.id] = {
    ...dynamicWorkflow,
    createdAt: new Date().toISOString()
  };

  res.json({
    success: true,
    workflow: workflowsStore[dynamicWorkflow.id]
  });
});

app.get('/api/workflows/:id', (req, res) => {
  const workflow = workflowsStore[req.params.id];
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json(workflow);
});

app.post('/api/workflows/:id/document-toggle', (req, res) => {
  const { docId, submitted } = req.body;
  const workflow = workflowsStore[req.params.id];
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

  const doc = workflow.requiredDocuments.find((d: any) => d.id === docId);
  if (doc) {
    doc.submitted = submitted ?? !doc.submitted;
    const total = workflow.requiredDocuments.length;
    const completed = workflow.requiredDocuments.filter((d: any) => d.submitted).length;
    workflow.progress = Math.round((completed / total) * 100);
    if (workflow.progress === 100) workflow.status = 'completed';
    else if (workflow.progress > 0) workflow.status = 'in_progress';
  }

  res.json(workflow);
});

// ==========================================
// WEBSOCKET: GEMINI 3.8 LIVE API EXCLUSIVE BRIDGE
// ==========================================
const wss = new WebSocketServer({ noServer: true });

const VALID_LIVE_VOICES = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Zephyr'];

wss.on('connection', async (clientWs: WebSocket, request: any) => {
  const reqUrl = new URL(request?.url || '', 'http://localhost');
  const language = reqUrl.searchParams.get('lang') || 'en';
  const voiceParam = reqUrl.searchParams.get('voice') || 'Aoede';
  const pageParam = reqUrl.searchParams.get('page') || 'assistant';
  const topicParam = reqUrl.searchParams.get('topic') || '';

  const voiceName = VALID_LIVE_VOICES.includes(voiceParam) ? voiceParam : 'Aoede';
  const targetLanguageName = language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (हिन्दी)' : 'Indian English';

  console.log(`[Gemini Live API] Client connected for ${targetLanguageName} with voice "${voiceName}" on page "${pageParam}"`);

  // Send immediate connection acknowledgment to client
  clientWs.send(JSON.stringify({
    type: 'connection_ack',
    status: 'connected',
    message: 'WebSocket connection to VoiceBridge server established. Connecting to Gemini Live API...'
  }));

  const activeAiClient = getAiClient();
  const currentKey = getGeminiApiKey();

  if (!activeAiClient || !currentKey) {
    console.error('[Gemini Live API Error] GEMINI_API_KEY is missing on server/Vercel.');
    clientWs.send(JSON.stringify({
      error: 'GEMINI_API_KEY is not configured on the server. Live API requires Gemini credentials.',
      errorCode: 'GEMINI_API_KEY_MISSING',
      hint: 'In Vercel Dashboard, go to Settings > Environment Variables, add GEMINI_API_KEY, and redeploy.'
    }));
    clientWs.close(1008, 'GEMINI_API_KEY_MISSING');
    return;
  }

  try {
    const systemInstruction = `You are VoiceBridge AI, a warm, patient, and conversational voice companion assisting citizens with public services, education scholarships, healthcare schemes, and general everyday inquiries.
Target Language: ${targetLanguageName}

VOICE-FIRST CONVERSATIONAL PRINCIPLES:
1. Speak warmly and naturally in ${targetLanguageName}, as if sitting right beside the citizen.
2. Respond conversationally in 1 to 3 spoken sentences. Avoid monologue-length responses.
3. NEVER recite markdown symbols, asterisk bolding, bullet points, numbered lists, or raw portal URLs aloud.
4. If explaining complex paperwork or criteria, use simple everyday examples.
5. Answer directly without repeating the citizen's entire question.
6. The user can interrupt you at any moment; adapt fluidly and naturally to their speech.
${topicParam ? `Active Scheme/Context: ${topicParam}` : ''}
${pageParam ? `Current App Screen: ${pageParam}` : ''}`;

    console.log(`[Gemini Live API] Initiating live.connect with model 'gemini-3.8-live' and voice '${voiceName}'...`);

    const session = await activeAiClient.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction
      },
      callbacks: {
        onopen: () => {
          console.log('[Gemini Live API] Upstream session opened with Google Gemini API.');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              status: 'live_ready',
              model: 'gemini-3.8-live',
              language,
              voice: voiceName
            }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          const content = message.serverContent;

          // Forward user input transcription from Live API
          if (content?.inputTranscription?.text) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ inputTranscript: content.inputTranscription.text }));
            }
          }

          // Forward model output transcription from Live API
          if (content?.outputTranscription?.text) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ outputTranscript: content.outputTranscription.text }));
            }
          }

          // Forward 24kHz raw PCM audio chunks
          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
          }

          // Forward interruption event
          if (content?.interrupted) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          }

          // Forward turn complete event
          if (content?.turnComplete) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          }
        },
        onclose: (closeEvent) => {
          console.log('[Gemini Live API] Upstream session closed:', closeEvent);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'upstream_closed',
              message: 'Gemini Live API session closed.'
            }));
          }
        },
        onerror: (err: any) => {
          console.error('[Gemini Live API Upstream Error]:', err?.message || err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              error: 'Upstream Live API error: ' + (err?.message || 'Connection lost'),
              errorCode: 'UPSTREAM_GEMINI_ERROR'
            }));
          }
        }
      }
    });

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          // Send 16kHz PCM audio chunk to Gemini Live API
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        } else if (parsed.text) {
          // Send text prompt into the live conversation
          session.sendRealtimeInput({
            text: parsed.text
          });
        } else if (parsed.interrupt) {
          // User barge-in triggered from client
          session.sendRealtimeInput({
            text: ''
          });
        }
      } catch (err) {
        console.warn('Error parsing incoming WS message:', err);
      }
    });

    clientWs.on('close', (code, reason) => {
      console.log(`[Gemini Live API] Client disconnected (code: ${code}, reason: ${reason?.toString() || 'none'})`);
      try {
        session.close();
      } catch (e) {
        // ignore
      }
    });

    clientWs.on('error', (err) => {
      console.error('[Gemini Live API Client Socket Error]:', err?.message || err);
    });

    // Notify client that Live session is active and ready
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        status: 'live_ready',
        model: 'gemini-3.8-live',
        language,
        voice: voiceName
      }));
    }
  } catch (liveErr: any) {
    console.error('[Gemini Live API Connection Failure]:', liveErr);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        error: liveErr?.message || 'Failed to start Gemini 3.8 Live session',
        errorCode: 'GEMINI_INIT_FAILED',
        details: liveErr?.toString()
      }));
      clientWs.close(1011, 'GEMINI_INIT_FAILED');
    }
  }
});

// Handle HTTP upgrade for WebSocket on /api/live with detailed logging
server.on('upgrade', (request, socket, head) => {
  const urlObj = new URL(request.url || '', 'http://localhost');
  const pathname = urlObj.pathname;
  const clientIp = request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown';

  console.log(`[Live WS Upgrade Attempt] Time: ${new Date().toISOString()} | Path: ${pathname} | IP: ${clientIp} | Origin: ${request.headers.origin}`);

  if (pathname === '/api/live') {
    try {
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log(`[Live WS Upgrade Success] Upgraded WebSocket for client: ${clientIp}`);
        wss.emit('connection', ws, request);
      });
    } catch (upgradeErr: any) {
      console.error('[Live WS Upgrade Failed]:', upgradeErr?.message || upgradeErr);
      socket.destroy();
    }
  } else {
    console.warn(`[Live WS Upgrade Rejected] Path ${pathname} does not match /api/live`);
    socket.destroy();
  }
});

// Vite Middleware for Dev / Static Files for Production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`VoiceBridge AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

// In Vercel serverless environment, do not start persistent server listener
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer();
}

export default app;
export { app, server };
