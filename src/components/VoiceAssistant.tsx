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
  Play
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
  
  // Voice engine mode
  const [voiceMode, setVoiceMode] = useState<'browser_native' | 'gemini_live'>('browser_native');
  const [liveSessionStatus, setLiveSessionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);

  // Live streaming transcript
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  // Warm, empathetic human greeting for general-purpose conversational AI
  const getHumanGreeting = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'hi':
        return 'नमस्ते। मैं वॉयसब्रिज एआई हूँ — आपका बहुभाषी साथी। आप शिक्षा, छात्रवृत्ति, करियर, विदेशी अध्ययन, सरकारी योजनाएं या किसी भी सामान्य विषय पर निसंकोच बात कर सकते हैं। आज आपके मन में क्या है?';
      case 'te':
        return 'నమస్కారం. నేను వాయిస్‌బ్రిడ్జ్ ఏఐ — మీ బహుభాషా సహాయకుడిని. ఉన్నత విద్య, స్కాలర్‌షిప్‌లు, ఉద్యోగాలు, ప్రభుత్వ పథకాలు లేదా ఏదైనా సందేహం గురించి నిస్సందేహంగా మాట్లాడండి. ఈ రోజు మీరు ఏ వివరాలు తెలుసుకోవాలనుకుంటున్నారు?';
      case 'en':
      default:
        return "Hello! I'm VoiceBridge AI. Speak naturally about anything — from university applications and career planning to public schemes, translations, or daily questions. What's on your mind?";
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

  // Natural Voice Settings
  const [speechRate, setSpeechRate] = useState<number>(0.96);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);
  const initialPromptTriggered = useRef<boolean>(false);
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  // Load natural voices matching selected language
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = voiceEngine.getVoicesForLanguage(language);
        setAvailableVoices(voices);
        if (voices.length > 0) {
          const currentMatches = voices.some(v => v.voiceURI === selectedVoiceURI);
          if (!currentMatches) {
            setSelectedVoiceURI(voices[0].voiceURI);
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [language]);

  // Synchronize voice settings to VoiceEngine
  useEffect(() => {
    voiceEngine.setSpeechSettings(speechRate, speechPitch, selectedVoiceURI || undefined);
  }, [speechRate, speechPitch, selectedVoiceURI]);

  // Keyboard shortcut: Spacebar or Escape instantly interrupts assistant speech
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (isInput) return;

      if ((e.code === 'Space' || e.key === 'Escape') && orbState === 'speaking') {
        e.preventDefault();
        voiceEngine.cancelSpeech();
        setOrbState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orbState]);

  const handleTestVoice = () => {
    const sampleText = language === 'hi'
      ? 'पोस्ट-मैट्रिक छात्रवृत्ति के लिए परिवार की वार्षिक आय ढाई लाख रुपये से कम होनी चाहिए। क्या आपका आय प्रमाण पत्र तैयार है?'
      : language === 'te'
      ? 'పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ కోసం వార్షిక ఆదాయం రెండున్నర లక్షల రూపాయల లోపు ఉండాలి. మీ దగ్గర సర్టిఫికేట్ సిద్ధంగా ఉందా?'
      : "To qualify for the Post-Matric Scholarship, your family's annual income should be under 2.5 lakhs. Have you got your income certificate ready?";

    voiceEngine.cancelSpeech();
    voiceEngine.speak(
      sampleText,
      language,
      () => setOrbState('speaking'),
      () => setOrbState('idle'),
      () => setOrbState('idle')
    );
  };

  useEffect(() => {
    if (selectedWorkflow && onSelectWorkflowContext) {
      onSelectWorkflowContext(selectedWorkflow);
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    onMessagesChange?.(messages);
    const intel = analyzeConversationIntelligence(messages, language);
    onIntelligenceChange?.(intel);
  }, [messages, interimTranscript, language, onMessagesChange, onIntelligenceChange]);

  // Initial prompt auto-trigger if provided from Explore Services or Dashboard
  useEffect(() => {
    if (initialPrompt && !initialPromptTriggered.current) {
      initialPromptTriggered.current = true;
      handleUserQuery(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    voiceEngine.setAudioLevelCallback((level) => {
      if (voiceMode === 'browser_native') {
        setAudioLevel(level);
      }
    });

    return () => {
      voiceEngine.stopListening();
      voiceEngine.cancelSpeech();
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, [voiceMode]);

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

  const handleToggleVoiceMode = async (mode: 'browser_native' | 'gemini_live') => {
    voiceEngine.stopListening();
    voiceEngine.cancelSpeech();
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    setOrbState('idle');
    setLiveError(null);
    setVoiceMode(mode);

    if (mode === 'gemini_live') {
      const live = new GeminiLiveSession();
      liveSessionRef.current = live;

      live.onStatusChange = (st, err) => {
        setLiveSessionStatus(st);
        if (st === 'connected') {
          setOrbState('listening');
        } else if (st === 'error') {
          setOrbState('idle');
          setLiveError(err || 'Failed to connect to Live API session');
        } else if (st === 'disconnected') {
          setOrbState('idle');
        }
      };

      live.onAudioActivity = (level) => {
        setAudioLevel(level);
        if (level > 0.08) {
          setOrbState('speaking');
        } else {
          setOrbState('listening');
        }
      };

      try {
        await live.start();
      } catch (err: any) {
        setLiveError(err.message || 'Failed to start Live session');
      }
    } else {
      setLiveSessionStatus('disconnected');
    }
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    voiceEngine.cancelSpeech();
    voiceEngine.stopListening();
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
    if (!speechMuted && voiceMode === 'browser_native') {
      voiceEngine.speak(
        greeting,
        newLang,
        () => setOrbState('speaking'),
        () => setOrbState('idle'),
        () => setOrbState('idle')
      );
    }
  };

  const handleToggleListening = () => {
    if (voiceMode === 'gemini_live') {
      if (liveSessionStatus === 'connected') {
        liveSessionRef.current?.stop();
        setLiveSessionStatus('disconnected');
        setOrbState('idle');
      } else {
        handleToggleVoiceMode('gemini_live');
      }
      return;
    }

    if (orbState === 'listening') {
      voiceEngine.stopListening();
      setOrbState('idle');
      return;
    }

    // If currently speaking, interrupt immediately and start listening!
    voiceEngine.cancelSpeech();
    setInterimTranscript('');
    setOrbState('listening');

    voiceEngine.startListening(
      language,
      (transcript, isFinal) => {
        if (isFinal) {
          setInterimTranscript('');
          handleUserQuery(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      (err) => {
        console.warn('Voice notice:', err);
        setOrbState('idle');
      },
      () => setOrbState('listening')
    );
  };

  const handleUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    voiceEngine.stopListening();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
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

  const handleRestart = () => {
    voiceEngine.cancelSpeech();
    voiceEngine.stopListening();
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      setLiveSessionStatus('disconnected');
    }
    setOrbState('idle');
    setInterimTranscript('');
    setMessages([
      {
        id: `rst-${Date.now()}`,
        sender: 'assistant',
        text: getHumanGreeting(language),
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleEnd = () => {
    voiceEngine.cancelSpeech();
    voiceEngine.stopListening();
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
    }
    const duration = Math.max(12, Math.round((Date.now() - sessionStartTime) / 1000));
    
    const firstUserQuery = messages.find(m => m.sender === 'user')?.text;
    const title = firstUserQuery
      ? firstUserQuery.slice(0, 38) + (firstUserQuery.length > 38 ? '...' : '')
      : selectedWorkflow ? selectedWorkflow.title : 'General Inquiry';

    onEndConversation({
      language,
      workflowId: selectedWorkflowId,
      messages,
      durationSeconds: duration,
      title
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const formatted = messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()} (${m.language}):\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicebridge-session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const contextualPrompts = getContextualPrompts();

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 md:py-7 space-y-6 select-none text-[#F5EFE6]">
      
      {/* Top Refined Bar: Context Scheme & Language Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#F5EFE6]/7">
        
        {/* Intelligent Optional Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold text-[#A89F91] tracking-widest font-sans">
            Mode:
          </span>
          <select
            value={selectedWorkflowId || ''}
            onChange={(e) => setSelectedWorkflowId(e.target.value || undefined)}
            className="bg-[#141311] text-xs font-semibold text-[#E0A364] border border-[#F5EFE6]/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C87A4B] cursor-pointer"
          >
            <option value="">Ask me anything (Open Conversation)</option>
            {workflows.length > 0 && (
              <optgroup label="Focus on Tracked Workflow">
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>Focus: {wf.title}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Seamless Language Tabs */}
        <div className="flex items-center gap-1 bg-[#141311] p-1 rounded-xl border border-[#F5EFE6]/6">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                language === lang.code
                  ? 'bg-[#C87A4B] text-[#0D0D0C] font-bold shadow-sm'
                  : 'text-[#A89F91] hover:text-[#F5EFE6]'
              }`}
            >
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>

        {/* Engine mode switcher, voice style & transcript drawer toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showVoiceSettings
                ? 'bg-[#C87A4B]/20 border-[#C87A4B] text-[#C87A4B]'
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6]'
            }`}
            title="Voice Cadence & Neural Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice Style</span>
          </button>

          <button
            onClick={() => handleToggleVoiceMode(voiceMode === 'gemini_live' ? 'browser_native' : 'gemini_live')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              voiceMode === 'gemini_live'
                ? 'bg-[#3A1D13] border-[#E0A364]/40 text-[#F5EFE6]'
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6]'
            }`}
            title="Toggle between Gemini 3.8 Live API and Native Speech Engine"
          >
            <Radio className={`w-3.5 h-3.5 ${voiceMode === 'gemini_live' ? 'text-[#C87A4B] animate-pulse' : 'text-[#A89F91]'}`} />
            <span>{voiceMode === 'gemini_live' ? 'Live API' : 'Native Voice'}</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              showHistory
                ? 'bg-[#C87A4B]/20 border-[#C87A4B] text-[#C87A4B]'
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6]'
            }`}
            title="Toggle Session History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Voice Settings Panel (Collapsible) */}
      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-[#141311] border border-[#C87A4B]/30 space-y-4 max-w-2xl mx-auto shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6]/6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C87A4B]" />
                  <span className="text-xs font-bold text-[#F5EFE6] uppercase tracking-wider">
                    Conversational Voice Settings
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
                    className="text-xs text-[#A89F91] hover:text-[#F5EFE6] cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Speaking Cadence */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#A89F91] block">
                    Speaking Cadence (Pacing)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#0D0D0C] p-1 rounded-xl border border-[#F5EFE6]/5">
                    {[
                      { label: 'Relaxed', rate: 0.90 },
                      { label: 'Natural', rate: 0.96 },
                      { label: 'Brisk', rate: 1.05 }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSpeechRate(opt.rate)}
                        className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all cursor-pointer ${
                          Math.abs(speechRate - opt.rate) < 0.02
                            ? 'bg-[#C87A4B] text-[#0D0D0C] font-bold shadow'
                            : 'text-[#A89F91] hover:text-[#F5EFE6]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#A89F91] block">
                    {speechRate === 0.96 ? 'Natural human pacing with gentle pauses' : speechRate < 0.95 ? 'Deliberate, easy to follow' : 'Faster information delivery'}
                  </span>
                </div>

                {/* Voice Selection for Language */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#A89F91] block">
                    Detected Voice ({availableVoices.length} available)
                  </label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => setSelectedVoiceURI(e.target.value)}
                    className="w-full bg-[#0D0D0C] border border-[#F5EFE6]/10 rounded-xl px-2.5 py-1.5 text-xs text-[#E0A364] focus:outline-none focus:border-[#C87A4B] cursor-pointer"
                  >
                    {availableVoices.length > 0 ? (
                      availableVoices.map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))
                    ) : (
                      <option value="">Default System Natural Voice</option>
                    )}
                  </select>
                  <span className="text-[10px] text-[#A89F91] block">
                    Neural &amp; Natural voices prioritized automatically
                  </span>
                </div>
              </div>

              {/* Expressive Intelligence Features */}
              <div className="pt-2 border-t border-[#F5EFE6]/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A89F91]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Micro-Pauses &amp; Dynamic Intonation: <strong>Active</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] bg-[#1C1A17] px-2 py-0.5 rounded text-[#C87A4B]">
                    Press Space / Esc to interrupt
                  </span>
                </div>
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

        {/* Live Interruption Controls when Assistant is Speaking */}
        {orbState === 'speaking' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3"
          >
            <button
              onClick={() => {
                voiceEngine.cancelSpeech();
                setOrbState('idle');
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#2A1713] hover:bg-[#381F19] text-[#E0A364] border border-[#E0A364]/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Square className="w-3 h-3 text-[#C87A4B] fill-current" />
              <span>Pause Voice</span>
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
          <p className="font-editorial text-2xl sm:text-3xl text-[#F5EFE6] tracking-wide font-bold">
            {orbState === 'listening'
              ? 'Listening intently... Speak naturally in your language'
              : orbState === 'thinking'
              ? 'Understanding your request & consulting verified sources...'
              : orbState === 'speaking'
              ? 'Speaking response in native cadence...'
              : "What's on your mind? Just speak."}
          </p>
          <p className="text-xs sm:text-sm text-[#A89F91]">
            {language === 'hi'
              ? 'शिक्षा, छात्रवृत्ति, विदेशी अध्ययन, करियर, सरकारी सेवाएं या अनुवाद — बिना किसी श्रेणी चयन के बोलें।'
              : language === 'te'
              ? 'ఉన్నత విద్య, స్కాలర్‌షిప్‌లు, ఉద్యోగాలు, ప్రభుత్వ సేవలు లేదా అనువాదం — మీ భాషలో మాట్లాడండి.'
              : 'Ask about scholarships, studying in Germany, loans, resume prep, translations, or any topic.'}
          </p>
        </div>
      </div>

      {/* Live Elegant Interim Streaming Transcript */}
      {interimTranscript && (
        <div className="p-3.5 rounded-2xl bg-[#181512] border border-[#C87A4B]/35 text-[#E0A364] text-sm animate-pulse text-center font-editorial italic max-w-xl mx-auto w-full shadow-lg">
          "{interimTranscript}..."
        </div>
      )}

      {/* Beautiful Conversational Exchange Card */}
      {messages.length > 0 && !interimTranscript && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 max-w-2xl mx-auto w-full space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#A89F91] pb-2 border-b border-[#F5EFE6]/6">
            <span className="font-editorial text-sm text-[#F5EFE6] font-bold">
              {messages[messages.length - 1].sender === 'assistant' ? 'VoiceBridge AI' : 'Citizen'}
            </span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-mono text-[11px]">
                {messages[messages.length - 1].timestamp}
              </span>
              {messages[messages.length - 1].sender === 'assistant' && (
                <button
                  onClick={() => handleReplayAudio(messages[messages.length - 1])}
                  className="hover:text-[#F5EFE6] flex items-center gap-1 transition-colors cursor-pointer text-[#C87A4B]"
                  title="Replay Spoken Audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              )}
              <button
                onClick={() => handleCopy(messages[messages.length - 1].text, messages[messages.length - 1].id)}
                className="hover:text-[#F5EFE6] transition-colors cursor-pointer"
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

          <p className="text-sm sm:text-base text-[#F5EFE6] leading-relaxed font-sans font-normal">
            {messages[messages.length - 1].text}
          </p>
        </div>
      )}

      {/* Contextual Suggested Questions with Shuffle */}
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
              <span className="text-xs text-[#F5EFE6] font-medium block leading-snug line-clamp-2">
                {p.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Improved Unified Message Composer & Mic Controls */}
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
                ? 'bg-[#3A1D13] text-[#F5EFE6] border border-[#C87A4B]/50'
                : 'bg-[#C87A4B] text-[#0D0D0C] hover:bg-[#D48354]'
            }`}
            title={orbState === 'listening' ? 'Stop Listening' : 'Start Speaking'}
          >
            {orbState === 'listening' || liveSessionStatus === 'connected' ? (
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
            className="flex-1 px-4 py-2.5 bg-[#141311] border border-[#F5EFE6]/10 rounded-xl text-xs sm:text-sm text-[#F5EFE6] placeholder-[#A89F91] focus:outline-none focus:border-[#C87A4B] transition-colors font-sans"
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
                  className="p-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6] transition-colors shrink-0 cursor-pointer"
                  title="Search & Legal Advisor (Gemini)"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              {onOpenTranscriber && (
                <button
                  type="button"
                  onClick={onOpenTranscriber}
                  className="p-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6] transition-colors shrink-0 cursor-pointer"
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
                : 'bg-[#141311] border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6]'
            }`}
            title={speechMuted ? 'Unmute Audio Speech' : 'Mute Audio Speech'}
          >
            {speechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-[#A89F91] hover:text-[#F5EFE6] transition-colors shrink-0 cursor-pointer"
            title="Refresh Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleEnd}
            className="px-3 py-2 text-xs font-semibold text-[#F5EFE6] bg-[#1C1A17] hover:bg-[#23201C] border border-[#F5EFE6]/10 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
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
            <span className="font-editorial text-base font-bold text-[#F5EFE6]">
              Session Transcript
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTranscript}
                className="p-1 text-[#A89F91] hover:text-[#F5EFE6] rounded transition-colors cursor-pointer"
                title="Download transcript"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 text-[#A89F91] hover:text-[#F5EFE6] rounded cursor-pointer"
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
                    ? 'bg-[#1A1714] border-[#C87A4B]/30 text-[#F5EFE6]'
                    : 'bg-[#141311] border-[#F5EFE6]/6 text-[#A89F91]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#A89F91] mb-1">
                  <span className="font-semibold text-[#E0A364] uppercase tracking-wider">
                    {m.sender === 'user' ? 'Citizen' : 'VoiceBridge AI'}
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
            <span>English · हिन्दी · తెలుగు</span>
          </div>
        </div>
      )}

    </div>
  );
};
