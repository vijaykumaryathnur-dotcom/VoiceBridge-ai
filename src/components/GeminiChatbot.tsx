import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Search,
  Globe,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Download
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, WorkflowItem } from '../types';
import { sendGeminiChat, GroundingSource } from '../services/api';

type ModelTier = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';

interface ChatRole {
  id: string;
  name: string;
  description: string;
  recommendedModel: ModelTier;
  systemInstruction: string;
}

const CHAT_ROLES: ChatRole[] = [
  {
    id: 'specialist',
    name: 'Civic Scheme Specialist',
    description: 'Guides citizens on rules, application steps, and eligibility for scholarships & healthcare.',
    recommendedModel: 'gemini-3.8-flash',
    systemInstruction: `You are VoiceBridge AI's Civic Scheme Specialist. You help Indian citizens navigate public welfare schemes including Post-Matric Scholarships, Central Sector Schemes, Ayushman Bharat PM-JAY, ABHA health IDs, and Ration Card renewals.
Explain requirements clearly, highlight deadlines, and provide step-by-step procedures. Be empathetic, practical, and courteous.`
  },
  {
    id: 'auditor',
    name: 'Eligibility & Legal Auditor',
    description: 'Deep reasoning for complex edge cases, income verification, and rejection appeals.',
    recommendedModel: 'gemini-4-argon',
    systemInstruction: `You are VoiceBridge AI's Legal & Eligibility Auditor. Analyze complex citizen documentation criteria, domicile proof discrepancies, caste validity issues, and grievance redressal pathways for denied welfare benefits.
Perform thorough, logical auditing of applicant scenarios and structure actionable appeals with reference to relevant central or state guidelines.`
  },
  {
    id: 'navigator',
    name: 'Rapid Scheme Navigator',
    description: 'Fast, concise answers, quick document lists, and immediate eligibility checks.',
    recommendedModel: 'gemini-3.1-flash-lite',
    systemInstruction: `You are VoiceBridge AI's Rapid Navigator. Provide brief, bulleted, high-speed responses. List only required documents, official portal links, or eligibility numbers without preamble. Keep answers crisp and immediately scannable.`
  }
];

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  sources?: GroundingSource[];
  timestamp: string;
}

interface GeminiChatbotProps {
  workflows: WorkflowItem[];
  initialWorkflowId?: string;
  onNavigateToVoice?: (lang: SupportedLanguage, wfId?: string) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  workflows,
  initialWorkflowId,
  onNavigateToVoice
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRole>(CHAT_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<ModelTier>(CHAT_ROLES[0].recommendedModel);
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>(initialWorkflowId);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'init-bot',
      role: 'assistant',
      content: `Greetings. I am your VoiceBridge AI Advisor powered by Google Gemini. 
I can analyze higher education scholarships, Ayushman Bharat healthcare schemes, and civil registry services with real-time Google Search Grounding enabled.

How may I assist you today? You can write in English, हिन्दी, or తెలుగు.`,
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleRoleSelect = (role: ChatRole) => {
    setSelectedRole(role);
    setSelectedModel(role.recommendedModel);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');

    const userMessage: ChatMessageItem = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const historyFormatted = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      historyFormatted.push({ role: 'user', content: text });

      const response = await sendGeminiChat(
        historyFormatted,
        selectedModel,
        selectedRole.systemInstruction,
        useSearchGrounding,
        language,
        selectedWorkflowId
      );

      const botMessage: ChatMessageItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        modelUsed: response.model,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Notice: ${err.message || 'Please check connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    const transcript = messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()} (${m.modelUsed || ''}):\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicebridge-gemini-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const samplePrompts: Record<SupportedLanguage, string[]> = {
    en: [
      'What are the 2026 application deadlines on the National Scholarship Portal?',
      'Check eligibility criteria for Ayushman Bharat PM-JAY and list required documents.',
      'My scholarship was rejected due to an income certificate mismatch. How do I appeal?'
    ],
    hi: [
      'नेशनल स्कॉलरशिप पोर्टल (NSP) पर 2026 की अंतिम तिथि क्या है?',
      'आयुष्मान भारत कार्ड के लिए परिवार की पात्रता की जांच कैसे करें?',
      'जाति प्रमाण पत्र में नाम की गलती सुधारने की क्या प्रक्रिया है?'
    ],
    te: [
      'జాతీయ స్కాలర్‌షిప్ పోర్టల్ (NSP) 2026 చివరి తేదీ వివరాలు తెలపండి.',
      'ఆయుష్మాన్ భారత్ పథకం కోసం రేషన్ కార్డు మరియు ఆధార్ లింకింగ్ ఎలా చేయాలి?',
      'ఆదాయ ధ్రువీకరణ పత్రం గడువు ముగిస్తే కొత్తది ఎలా పొందాలి?'
    ]
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-6 flex-1 flex flex-col text-[#F5EFE6] select-none">
      
      {/* Top Configuration Bar */}
      <div className="p-6 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#C87A4B] font-medium uppercase tracking-wider font-sans">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Turn Gemini Advisor</span>
              <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
              <span className="text-[#A89F91]">Search Grounded</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
              Gemini Civic &amp; Healthcare Advisor
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-[#0D0D0C] p-1 rounded-xl border border-[#F5EFE6]/6">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold shadow-sm'
                    : 'text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Roles Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CHAT_ROLES.map((role) => {
            const isSelected = selectedRole.id === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1816] border-[#C87A4B] shadow-lg'
                    : 'bg-[#0D0D0C] border-[#F5EFE6]/6 hover:border-[#C87A4B]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-[#E0A364]' : 'text-[#FAF6F0]'}`}>
                    {role.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1A1816] text-[#A89F91]">
                    {role.recommendedModel === 'gemini-4-argon' ? 'Complex' : role.recommendedModel === 'gemini-3.1-flash-lite' ? 'Fast' : 'General'}
                  </span>
                </div>
                <p className="text-[11px] text-[#A89F91] mt-1 line-clamp-2 leading-relaxed font-light">
                  {role.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Model Engine & Search Grounding */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#A89F91]">Model Engine:</span>
            <div className="flex items-center bg-[#0D0D0C] p-1 rounded-xl border border-[#F5EFE6]/6">
              <button
                onClick={() => setSelectedModel('gemini-3.8-flash')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                    : 'text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
              >
                gemini-3.8-flash (General)
              </button>
              <button
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                    : 'text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
              >
                gemini-3.1-flash-lite (Fast)
              </button>
              <button
                onClick={() => setSelectedModel('gemini-4-argon')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                  selectedModel === 'gemini-4-argon'
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                    : 'text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
              >
                gemini-4-argon (Complex)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-[#FAF6F0]">
              <input
                type="checkbox"
                checked={useSearchGrounding}
                onChange={(e) => setUseSearchGrounding(e.target.checked)}
                className="w-4 h-4 rounded text-[#C87A4B] bg-[#0D0D0C] border-[#F5EFE6]/20 focus:ring-[#C87A4B]"
              />
              <span className="flex items-center gap-1.5 text-xs text-[#A89F91] hover:text-[#FAF6F0]">
                <Search className="w-3.5 h-3.5 text-[#C87A4B]" />
                <span>Search Grounding Enabled</span>
              </span>
            </label>

            <button
              onClick={handleExportChat}
              className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#A89F91]" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Messages Thread */}
      <div className="flex-1 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-[460px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#1A1816] border border-[#C87A4B]/30 text-[#C87A4B] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1A1816] border border-[#C87A4B]/30 text-[#FAF6F0] rounded-tr-none'
                    : 'bg-[#0D0D0C] border border-[#F5EFE6]/6 text-[#FAF6F0] rounded-tl-none font-light'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-2 pb-1.5 border-b border-[#F5EFE6]/6 text-[#A89F91]">
                  <span className="font-semibold text-[#E0A364]">
                    {msg.role === 'user' ? 'Citizen' : 'VoiceBridge AI'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-mono text-[#A89F91]/70">{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-[#FAF6F0] transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-[#E0A364]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-sans text-[#FAF6F0]">
                  {msg.content}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#F5EFE6]/6 text-[11px] space-y-1.5">
                    <div className="flex items-center gap-1 text-[#C87A4B] font-medium">
                      <Globe className="w-3 h-3" />
                      <span>Verified Google Search Grounding Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#141311] hover:bg-[#1A1816] border border-[#F5EFE6]/6 text-[#E0A364] hover:text-[#FAF6F0] transition-colors flex items-center gap-1 text-[10px]"
                        >
                          <span className="truncate max-w-[200px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#1A1816] border border-[#F5EFE6]/10 text-[#FAF6F0] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A1816] border border-[#C87A4B]/30 text-[#C87A4B] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6 text-xs text-[#A89F91] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C87A4B]" />
                <span>Consulting {selectedModel} with Search Grounding...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pt-4 border-t border-[#F5EFE6]/6 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            <span className="text-[#A89F91] shrink-0">Inquiries:</span>
            {samplePrompts[language].map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-[#0D0D0C] hover:bg-[#1A1816] border border-[#F5EFE6]/6 text-[#A89F91] hover:text-[#FAF6F0] whitespace-nowrap transition-colors cursor-pointer font-light"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#0D0D0C] border border-[#F5EFE6]/8 rounded-xl text-xs sm:text-sm text-[#FAF6F0] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#C87A4B] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-3 bg-[#C87A4B] hover:bg-[#D48354] disabled:opacity-30 text-[#0D0D0C] font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer text-xs uppercase tracking-wider shrink-0 active:scale-95"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
