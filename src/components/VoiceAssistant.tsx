import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  VolumeX,
  History,
  Download,
  Copy,
  Check,
  Radio,
  Sparkles,
  Square,
  Send,
  MessageSquare,
  Shuffle,
  SlidersHorizontal,
  Play,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { VoiceOrb, OrbState } from './VoiceOrb';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  ChatMessage,
  WorkflowItem,
  IntegrationStatus,
  WorkflowIntelligence
} from '../types';
import { voiceEngine } from '../services/voice';
import { sendVoiceMessage, GeminiLiveSession } from '../services/api';
import { analyzeConversationIntelligence } from '../services/workflowEngine';

interface VoiceAssistantProps {
  initialLanguage?: SupportedLanguage;
  initialWorkflowId?: string;
  initialPrompt?: string;
  workflows: WorkflowItem[];
  integrationStatus?: IntegrationStatus | null;
  onOpenIntegrations: () => void;
  onOpenTranscriber?: () => void;
  onOpenChatAdvisor?: () => void;
  onSelectWorkflowContext?: (wf: WorkflowItem | null) => void;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onIntelligenceChange?: (intelligence: WorkflowIntelligence) => void;
  onEndConversation: (sessionData: {
    language: SupportedLanguage;
    workflowId?: string;
    messages: ChatMessage[];
    durationSeconds: number;
    title: string;
    intelligence?: WorkflowIntelligence;
  }) => void;
}

const GEMINI_LIVE_VOICES = [
  { id: 'Aoede', name: 'Aoede', description: 'Natural conversational soprano, warm and empathetic (Default)' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Resonant civic baritone, steady and articulate' },
  { id: 'Kore', name: 'Kore', description: 'Supportive, friendly cadence for citizen guidance' },
  { id: 'Charon', name: 'Charon', description: 'Clear and structured public policy narrator' },
  { id: 'Zephyr', name: 'Zephyr', description: 'Bright, crisp, and balanced delivery' },
  { id: 'Puck', name: 'Puck', description: 'Brisk and engaging conversational pace' }
];

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  initialLanguage = 'en',
  initialWorkflowId,
  initialPrompt,
  workflows,
  integrationStatus,
  onOpenIntegrations,
  onOpenTranscriber,
  onOpenChatAdvisor,
  onSelectWorkflowContext,
  onMessagesChange,
  onIntelligenceChange,
  onEndConversation
}) => {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>(initialWorkflowId);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [speechMuted, setSpeechMuted] = useState<boolean>(false);
  const [composerText, setComposerText] = useState<string>('');
  
  // Gemini Live API state (Exclusive Voice Engine)
  const [liveSessionStatus, setLiveSessionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [selectedLiveVoice, setSelectedLiveVoice] = useState<string>('Aoede');

  // Real-time live streaming transcripts from Live API
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  // Human greeting for multilingual conversational AI
  const getHumanGreeting = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'hi':
        return 'नमस्ते। मैं वॉयसब्रिज एआई हूँ — आपका जेमिनी 3.8 लाइव वॉयस साथी। आप छात्रवृत्ति, करियर, सरकारी योजनाएं या किसी भी विषय पर स्वाभाविक रूप से बोल सकते हैं। आज आप क्या जानना चाहते हैं?';
      case 'te':
        return 'నమస్కారం. నేను వాయిస్‌బ్రిడ్జ్ ఏఐ — మీ జెమిని 3.8 లైవ్ వాయిస్ సహాయకుడిని. ఉన్నత విద్య, స్కాలర్‌షిప్‌లు, ఉద్యోగాలు, సంక్షేమ పథకాలు లేదా ఏదైనా విషయం గురించి సహజంగా మాట్లాడండి.';
      case 'en':
      default:
        return "Hello! I'm VoiceBridge AI, powered exclusively by Gemini 3.8 Live API. Speak naturally about anything — from scholarship schemes and career planning to public paperwork, translations, or daily questions.";
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      sender: 'assistant',
      text: getHumanGreeting(initialLanguage),
      language: initialLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promptBatchIndex, setPromptBatchIndex] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);
  const initialPromptTriggered = useRef<boolean>(false);
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  // Keyboard shortcut: Spacebar or Escape instantly interrupts Gemini Live speech
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (isInput) return;

      if ((e.code === 'Space' || e.key === 'Escape') && (orbState === 'speaking' || liveSessionStatus === 'connected')) {
        e.preventDefault();
        handleInterrupt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orbState, liveSessionStatus]);

  // Sync state upward
  useEffect(() => {
    if (onMessagesChange) onMessagesChange(messages);
    if (messages.length > 2 && onIntelligenceChange) {
      const intel = analyzeConversationIntelligence(messages, language);
      onIntelligenceChange(intel);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Handle initial prompt passed from another view
  useEffect(() => {
    if (initialPrompt && !initialPromptTriggered.current) {
      initialPromptTriggered.current = true;
      handleUserQuery(initialPrompt);
    }
  }, [initialPrompt]);

  // Clean up Live API session on unmount
  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      voiceEngine.cancelSpeech();
    };
  }, []);

  // Broad, open-ended conversational prompts covering all capabilities
  const getContextualPrompts = (): Array<{ text: string; kicker: string }> => {
    const ALL_PROMPTS = [
      // Batch 0
      [
        {
          text: language === 'hi'
            ? 'पोस्ट-मैट्रिक छात्रवृत्ति के लिए आवेदन कैसे करें?'
            : language === 'te'
            ? 'పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ ఎలా దరఖాస్తు చేసుకోవాలి?'
            : 'Help me apply for a scholarship.',
          kicker: 'Scholarships'
        },
        {
          text: language === 'hi'
            ? 'मैं जर्मनी में पढ़ाई करना चाहता हूँ। आवश्यक प्रक्रिया क्या है?'
            : language === 'te'
            ? 'నేను జర్మనీలో చదువుకోవాలనుకుంటున్నాను. అర్హతలు ఏమిటి?'
            : 'I want to study in Germany.',
          kicker: 'Study Abroad'
        },
        {
          text: language === 'hi'
            ? 'शिक्षा ऋण और ब्याज सब्सिडी योजनाएं कैसे काम करती हैं?'
            : language === 'te'
            ? 'విద్యా రుణం & వడ్డీ రాయితీ ఎలా పనిచేస్తాయి?'
            : 'Explain how student loans work.',
          kicker: 'Student Loans'
        }
      ],
      // Batch 1
      [
        {
          text: language === 'hi'
            ? 'तहसीलदार से आय प्रमाण पत्र प्राप्त करने की प्रक्रिया क्या है?'
            : language === 'te'
            ? 'తహసీల్దార్ నుండి ఆదాయ ధ్రువీకరణ పత్రం ఎలా పొందాలి?'
            : 'How do I obtain an income certificate?',
          kicker: 'Certificates'
        },
        {
          text: language === 'hi'
            ? 'सॉफ्टवेयर पद के लिए मेरा रिज्यूमे तैयार करने में मदद करें।'
            : language === 'te'
            ? 'ఉద్యోగం కోసం నా రెజ్యూమ్ సిద్ధం చేయడానికి సహాయం చేయండి.'
            : 'Help me prepare my resume.',
          kicker: 'Career & Resume'
        },
        {
          text: language === 'hi'
            ? 'इस वाक्य का तेलुगु में अनुवाद करें: "सभी दस्तावेज तैयार हैं।"'
            : language === 'te'
            ? 'ఈ వాక్యాన్ని తెలుగులోకి అనువదించండి: "All documents are ready."'
            : 'Translate this sentence into Telugu.',
          kicker: 'Translation'
        }
      ],
      // Batch 2
      [
        {
          text: language === 'hi'
            ? 'सरकारी दस्तावेज और आवश्यक पात्रता समझने में मदद करें।'
            : language === 'te'
            ? 'ప్రభుత్వ నోటిఫికేషన్ వివరాలను అర్థం చేసుకోవడానికి సహాయం చేయండి.'
            : 'I need help understanding a government document.',
          kicker: 'Public Guidance'
        },
        {
          text: language === 'hi'
            ? 'इस गणितीय समस्या को चरणबद्ध तरीके से समझाएं।'
            : language === 'te'
            ? 'ఈ గణిత సమస్యను దశలవారీగా వివరించండి.'
            : 'Can you explain this mathematical problem?',
          kicker: 'Explanation'
        },
        {
          text: language === 'hi'
            ? 'मासिक बजट और बचत योजना बनाने में मेरी सहायता करें।'
            : language === 'te'
            ? 'నెలవారీ బడ్జెట్ మరియు పొదుపు ప్రణాళిక సిద్ధం చేయండి.'
            : 'I need help planning my monthly budget.',
          kicker: 'Finance'
        }
      ]
    ];

    return ALL_PROMPTS[promptBatchIndex % ALL_PROMPTS.length];
  };

  /**
   * Connects and maintains the Gemini 3.8 Live API real-time audio session.
   * Exclusively streams 16kHz microphone input to Gemini Live API and plays 24kHz response audio.
   */
  const connectLiveSession = async (lang: SupportedLanguage = language, voice: string = selectedLiveVoice) => {
    voiceEngine.cancelSpeech();
    setLiveSessionStatus('connecting');
    setLiveError(null);
    setOrbState('thinking');

    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }

    const live = new GeminiLiveSession(lang, voice, 'assistant', selectedWorkflow?.title || '');
    liveSessionRef.current = live;

    live.onStatusChange = (st, err) => {
      setLiveSessionStatus(st);
      if (st === 'connected') {
        setOrbState('listening');
      } else if (st === 'error') {
        setOrbState('idle');
        setLiveError(err || 'Gemini Live API connection interrupted.');
      } else if (st === 'disconnected') {
        setOrbState('idle');
      }
    };

    live.onAudioActivity = (level, source) => {
      setAudioLevel(level);
      if (source === 'model' && level > 0.05) {
        setOrbState('speaking');
      } else if (source === 'mic' && level > 0.08) {
        setOrbState('listening');
      }
    };

    live.onInputTranscript = (text) => {
      setInterimTranscript(text);
    };

    live.onOutputTranscript = (text) => {
      setInterimTranscript('');
      setOrbState('speaking');

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'assistant' && last.id.startsWith('live-stream-')) {
          return [...prev.slice(0, -1), { ...last, text: (last.text + ' ' + text).trim() }];
        } else {
          return [...prev, {
            id: `live-stream-${Date.now()}`,
            sender: 'assistant',
            text,
            language: lang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        }
      });
    };

    live.onInterrupted = () => {
      setOrbState('listening');
    };

    live.onTurnComplete = () => {
      setInterimTranscript('');
      setOrbState('listening');
    };

    try {
      await live.start(lang, voice, 'assistant', selectedWorkflow?.title);
    } catch (err: any) {
      setLiveError(err.message || 'Failed to initialize Gemini Live API session');
      setOrbState('idle');
    }
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    voiceEngine.cancelSpeech();
    setOrbState('idle');

    const greeting = getHumanGreeting(newLang);
    const greetingMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: greeting,
      language: newLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, greetingMsg]);

    // If already connected in Live API, reconnect with the new language instruction
    if (liveSessionRef.current?.isLiveConnected()) {
      connectLiveSession(newLang, selectedLiveVoice);
    }
  };

  const handleToggleListening = () => {
    if (liveSessionRef.current?.isLiveConnected()) {
      liveSessionRef.current.stop();
      setLiveSessionStatus('disconnected');
      setOrbState('idle');
    } else {
      connectLiveSession(language, selectedLiveVoice);
    }
  };

  const handleInterrupt = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.interrupt();
    }
    voiceEngine.cancelSpeech();
    setOrbState('listening');
  };

  const handleUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);

    // If Gemini Live is connected, send text into the bidirectional stream directly
    if (liveSessionRef.current?.isLiveConnected()) {
      setOrbState('thinking');
      liveSessionRef.current.sendText(queryText);
      return;
    }

    // If not connected, connect Live session with this prompt as topic, or generate spoken response
    setOrbState('thinking');
    try {
      const historyFormatted = messages.map(m => ({ sender: m.sender, text: m.text }));
      const response = await sendVoiceMessage(queryText, language, selectedWorkflowId, historyFormatted);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      if (!speechMuted) {
        voiceEngine.speak(
          response.reply,
          language,
          () => setOrbState('speaking'),
          () => setOrbState('idle'),
          () => setOrbState('idle')
        );
      } else {
        setOrbState('idle');
      }
    } catch (err) {
      console.error('Failed to get voice reply:', err);
      setOrbState('idle');
    }
  };

  const handleReplayAudio = (msg: ChatMessage) => {
    voiceEngine.cancelSpeech();
    voiceEngine.speak(
      msg.text,
      msg.language,
      () => setOrbState('speaking'),
      () => setOrbState('idle'),
      () => setOrbState('idle')
    );
  };

  const handleTestVoice = () => {
    voiceEngine.previewVoice(
      'natural',
      1.0,
      language,
      () => setOrbState('speaking'),
      () => setOrbState('idle'),
      () => setOrbState('idle')
    );
  };

  const handleRestart = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    voiceEngine.cancelSpeech();
    setOrbState('idle');
    setLiveError(null);
    setLiveSessionStatus('disconnected');
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: getHumanGreeting(language),
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleEnd = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    voiceEngine.cancelSpeech();
    setOrbState('idle');

    const durationSeconds = Math.max(15, Math.round((Date.now() - sessionStartTime) / 1000));
    const title =
      selectedWorkflow?.title ||
      messages.find(m => m.sender === 'user')?.text.slice(0, 48) ||
      'Multilingual Voice Consultation';

    const intel = messages.length > 2 ? analyzeConversationIntelligence(messages, language) : undefined;

    onEndConversation({
      language,
      workflowId: selectedWorkflowId,
      messages,
      durationSeconds,
      title,
      intelligence: intel
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const formatted = messages
      .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicebridge-live-session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const contextualPrompts = getContextualPrompts();

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 md:py-6 relative select-none">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5EFE6]/7">
        
        {/* Left: General Context Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedWorkflowId || ''}
              onChange={(e) => {
                const wfId = e.target.value || undefined;
                setSelectedWorkflowId(wfId);
                const wf = workflows.find(w => w.id === wfId) || null;
                if (onSelectWorkflowContext) onSelectWorkflowContext(wf);
              }}
              className="bg-[#141311] border border-[#F5EFE6]/10 rounded-xl px-3 py-1.5 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C87A4B] cursor-pointer"
            >
              <option value="">Ask me anything (Open Conversation)</option>
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>
                  {wf.title}
                </option>
              ))}
            </select>
          </div>

          {selectedWorkflow && (
            <span className="hidden md:inline-flex text-[11px] font-mono text-[#E0A364] px-2 py-0.5 rounded bg-[#1A1816] border border-[#C87A4B]/20">
              {selectedWorkflow.progress}% fulfilled
            </span>
          )}
        </div>

        {/* Right: Language, Voice Settings, Gemini Live Status, Transcript Drawer */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          
          {/* Language Switcher */}
          <div className="flex items-center bg-[#141311] p-1 rounded-xl border border-[#F5EFE6]/7">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold shadow-sm'
                    : 'text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
              >
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>

          {/* Voice Persona Selector */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showVoiceSettings
                ? 'bg-[#C87A4B]/20 border-[#C87A4B] text-[#C87A4B]'
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#FAF6F0]'
            }`}
            title="Configure Gemini Live Voice Persona"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice: {selectedLiveVoice}</span>
          </button>

          {/* Exclusive Gemini Live API Status Badge */}
          <div className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[#C87A4B]/40 bg-[#141311] text-[#FAF6F0] flex items-center gap-2 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${liveSessionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : liveSessionStatus === 'connecting' ? 'bg-[#C87A4B] animate-pulse' : 'bg-[#A89F91]'}`} />
            <span className="font-mono text-[11px] text-[#E0A364]">
              {liveSessionStatus === 'connected' ? 'Gemini 3.8 Live API Active · 24kHz' : liveSessionStatus === 'connecting' ? 'Connecting Live API...' : 'Gemini Live Ready'}
            </span>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              showHistory
                ? 'bg-[#C87A4B]/20 border-[#C87A4B] text-[#C87A4B]'
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#FAF6F0]'
            }`}
            title="Toggle Session History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Live Error Notification */}
      {liveError && (
        <div className="mt-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center justify-between">
          <span>{liveError}</span>
          <button onClick={() => setLiveError(null)} className="text-red-300 hover:text-white cursor-pointer">&times;</button>
        </div>
      )}

      {/* Voice Settings Panel (Collapsible) */}
      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-[#141311] border border-[#C87A4B]/30 space-y-4 max-w-2xl mx-auto shadow-xl my-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6]/6">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#C87A4B]" />
                  <span className="text-xs font-bold text-[#FAF6F0] uppercase tracking-wider">
                    Gemini Live Voice Persona
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestVoice}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#C87A4B]/15 hover:bg-[#C87A4B]/25 text-[#E0A364] border border-[#C87A4B]/30 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-[#C87A4B] fill-current" />
                    <span>Test Voice</span>
                  </button>
                  <button
                    onClick={() => setShowVoiceSettings(false)}
                    className="text-xs text-[#A89F91] hover:text-[#FAF6F0] cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Gemini Live Persona Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GEMINI_LIVE_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedLiveVoice(v.id);
                      if (liveSessionRef.current?.isLiveConnected()) {
                        connectLiveSession(language, v.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedLiveVoice === v.id
                        ? 'bg-[#1F1C18] border-[#C87A4B] text-[#FAF6F0] ring-1 ring-[#C87A4B]/40'
                        : 'bg-[#0D0D0C] border-[#F5EFE6]/6 text-[#A89F91] hover:border-[#F5EFE6]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#FAF6F0]">{v.name}</span>
                      {selectedLiveVoice === v.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#C87A4B]" />}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#A89F91] line-clamp-1">
                      {v.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F5EFE6]/5 flex items-center justify-between text-[11px] text-[#A89F91]">
                <span className="font-mono text-[10px] text-[#C87A4B]">
                  Live API 16kHz PCM In · 24kHz PCM Out
                </span>
                <span className="font-mono text-[10px] bg-[#1C1A17] px-2 py-0.5 rounded text-[#A89F91]">
                  Press Space / Esc to interrupt
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Visual Center: Organic Layered Voice Orb */}
      <div className="flex flex-col items-center justify-center my-1">
        <VoiceOrb
          state={orbState}
          audioLevel={audioLevel}
          onClick={handleToggleListening}
          size="lg"
        />

        {/* Live Interruption Controls when Assistant is Speaking or Connected */}
        {orbState === 'speaking' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3"
          >
            <button
              onClick={handleInterrupt}
              className="px-3.5 py-1.5 rounded-full bg-[#2A1713] hover:bg-[#381F19] text-[#E0A364] border border-[#E0A364]/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Square className="w-3 h-3 text-[#C87A4B] fill-current" />
              <span>Pause / Interrupt</span>
            </button>

            <button
              onClick={handleToggleListening}
              className="px-3.5 py-1.5 rounded-full bg-[#C87A4B] hover:bg-[#D48354] text-[#0D0D0C] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Interrupt &amp; Speak</span>
            </button>
          </motion.div>
        )}

        <div className="mt-4 text-center space-y-1.5 max-w-xl mx-auto">
          <p className="font-editorial text-2xl sm:text-3xl text-[#FAF6F0] tracking-wide font-bold">
            {orbState === 'listening'
              ? 'Listening intently... Speak naturally in your language'
              : orbState === 'thinking'
              ? 'Gemini Live is processing...'
              : orbState === 'speaking'
              ? 'Gemini Live speaking response...'
              : "What's on your mind? Just speak."}
          </p>
          <p className="text-xs sm:text-sm text-[#A89F91]">
            {language === 'hi'
              ? 'जेमिनी 3.8 लाइव एपीआई के साथ सीधे बात करें — शिक्षा, छात्रवृत्ति, विदेशी अध्ययन, या कोई भी सवाल पूछें।'
              : language === 'te'
              ? 'జెమిని 3.8 లైవ్ ఏపీఐతో నేరుగా మాట్లాడండి — విద్య, స్కాలర్‌షిప్‌లు, ఉద్యోగాలు లేదా ఏదైనా ప్రశ్న అడగండి.'
              : 'Streaming directly via Gemini 3.8 Live API with real-time audio and natural interruption.'}
          </p>
        </div>
      </div>

      {/* Live Interim Streaming Transcript */}
      {interimTranscript && (
        <div className="p-3.5 rounded-2xl bg-[#181512] border border-[#C87A4B]/35 text-[#E0A364] text-sm animate-pulse text-center font-editorial italic max-w-xl mx-auto w-full shadow-lg">
          "{interimTranscript}..."
        </div>
      )}

      {/* Conversational Exchange Card */}
      {messages.length > 0 && !interimTranscript && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 max-w-2xl mx-auto w-full space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#A89F91] pb-2 border-b border-[#F5EFE6]/6">
            <span className="font-editorial text-sm text-[#FAF6F0] font-bold">
              {messages[messages.length - 1].sender === 'assistant' ? 'VoiceBridge AI (Gemini Live)' : 'Citizen'}
            </span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-mono text-[11px]">
                {messages[messages.length - 1].timestamp}
              </span>
              {messages[messages.length - 1].sender === 'assistant' && (
                <button
                  onClick={() => handleReplayAudio(messages[messages.length - 1])}
                  className="hover:text-[#FAF6F0] flex items-center gap-1 transition-colors cursor-pointer text-[#C87A4B]"
                  title="Replay Spoken Audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              )}
              <button
                onClick={() => handleCopy(messages[messages.length - 1].text, messages[messages.length - 1].id)}
                className="hover:text-[#FAF6F0] transition-colors cursor-pointer"
                title="Copy text"
              >
                {copiedId === messages[messages.length - 1].id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#FAF6F0] leading-relaxed font-sans font-normal">
            {messages[messages.length - 1].text}
          </p>
        </div>
      )}

      {/* Suggested Questions */}
      <div className="space-y-2 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between text-[11px] text-[#A89F91] px-1">
          <span className="uppercase tracking-wider font-semibold text-[10px]">
            Explore Possibilities
          </span>
          <button
            onClick={() => setPromptBatchIndex(prev => prev + 1)}
            className="flex items-center gap-1 text-[11px] text-[#C87A4B] hover:text-[#E0A364] transition-colors cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            <span>Shuffle ideas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {contextualPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuery(p.text)}
              className="p-3 text-left rounded-xl bg-[#141311] hover:bg-[#1C1A17] border border-[#F5EFE6]/6 hover:border-[#C87A4B]/40 transition-all group cursor-pointer"
            >
              <span className="text-[10px] text-[#C87A4B] font-mono block uppercase tracking-wider mb-1">
                {p.kicker}
              </span>
              <span className="text-xs text-[#FAF6F0] font-medium block leading-snug line-clamp-2">
                {p.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Unified Message Composer & Mic Controls */}
      <div className="pt-2 border-t border-[#F5EFE6]/7 space-y-3">
        
        {/* Composer Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (composerText.trim()) {
              handleUserQuery(composerText.trim());
              setComposerText('');
            }
          }}
          className="flex items-center gap-2 max-w-2xl mx-auto w-full"
        >
          {/* Main Voice Toggle */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`p-3 rounded-xl font-semibold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md ${
              orbState === 'listening' || liveSessionStatus === 'connected'
                ? 'bg-[#3A1D13] text-[#FAF6F0] border border-[#C87A4B]/50'
                : 'bg-[#C87A4B] text-[#0D0D0C] hover:bg-[#D48354]'
            }`}
            title={liveSessionStatus === 'connected' ? 'Disconnect Gemini Live Session' : 'Connect Gemini 3.8 Live API'}
          >
            {liveSessionStatus === 'connected' ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Unified Input Field */}
          <input
            type="text"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder={`Speak or type in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName}...`}
            className="flex-1 px-4 py-2.5 bg-[#141311] border border-[#F5EFE6]/10 rounded-xl text-xs sm:text-sm text-[#FAF6F0] placeholder-[#A89F91] focus:outline-none focus:border-[#C87A4B] transition-colors font-sans"
          />

          {composerText.trim() ? (
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#C87A4B] hover:bg-[#D48354] text-[#0D0D0C] font-bold rounded-xl transition-colors text-xs uppercase tracking-wider shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              {onOpenChatAdvisor && (
                <button
                  type="button"
                  onClick={onOpenChatAdvisor}
                  className="p-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#FAF6F0] transition-colors shrink-0 cursor-pointer"
                  title="Search & Legal Advisor (Gemini)"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              {onOpenTranscriber && (
                <button
                  type="button"
                  onClick={onOpenTranscriber}
                  className="p-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#FAF6F0] transition-colors shrink-0 cursor-pointer"
                  title="Transcribe Voice Recording (gemini-3.5-transcribe)"
                >
                  <Sparkles className="w-4 h-4 text-[#C87A4B]" />
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (!speechMuted) voiceEngine.cancelSpeech();
              setSpeechMuted(!speechMuted);
            }}
            className={`p-2.5 rounded-xl border text-xs transition-colors shrink-0 cursor-pointer ${
              speechMuted
                ? 'bg-[#1C1A17] border-[#C87A4B] text-[#C87A4B]'
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#FAF6F0]'
            }`}
            title={speechMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {speechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#FAF6F0] transition-colors shrink-0 cursor-pointer"
            title="Refresh Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleEnd}
            className="px-3 py-2 text-xs font-semibold text-[#FAF6F0] bg-[#1C1A17] hover:bg-[#23201C] border border-[#F5EFE6]/10 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Square className="w-3 h-3 text-[#C87A4B]" />
            <span className="hidden sm:inline">End &amp; Save</span>
          </button>
        </form>

      </div>

      {/* Collapsible History Drawer */}
      {showHistory && (
        <div className="fixed inset-y-0 right-0 z-40 w-80 max-w-[90vw] bg-[#121110] border-l border-[#F5EFE6]/8 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]/7">
            <span className="font-editorial text-base font-bold text-[#FAF6F0]">
              Session Transcript
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTranscript}
                className="p-1 text-[#A89F91] hover:text-[#FAF6F0] rounded transition-colors cursor-pointer"
                title="Download transcript"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 text-[#A89F91] hover:text-[#FAF6F0] rounded cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="py-3 space-y-3 overflow-y-auto flex-1 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border ${
                  m.sender === 'user'
                    ? 'bg-[#1A1714] border-[#C87A4B]/30 text-[#FAF6F0]'
                    : 'bg-[#141311] border-[#F5EFE6]/6 text-[#A89F91]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#A89F91] mb-1">
                  <span className="font-semibold text-[#E0A364] uppercase tracking-wider">
                    {m.sender === 'user' ? 'Citizen' : 'VoiceBridge AI (Gemini Live)'}
                  </span>
                  <span className="tabular-nums font-mono">{m.timestamp}</span>
                </div>
                <p className="leading-relaxed">{m.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="pt-3 border-t border-[#F5EFE6]/7 text-[11px] text-[#A89F91] flex justify-between font-mono">
            <span>{messages.length} exchanges</span>
            <span>Gemini Live API · Trilingual</span>
          </div>
        </div>
      )}

    </div>
  );
};
