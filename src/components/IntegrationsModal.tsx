import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Shield,
  Cpu,
  RefreshCw,
  Radio,
  Search,
  Sparkles,
  Mic,
  Volume2,
  Sliders,
  Play,
  Square
} from 'lucide-react';
import { IntegrationStatus, VoiceStyle, SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';
import { voiceEngine } from '../services/voice';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: IntegrationStatus | null;
  onRefresh: () => Promise<void>;
  selectedLanguage?: SupportedLanguage;
}

const VOICE_STYLES: Array<{
  id: VoiceStyle;
  label: string;
  persona: string;
  desc: string;
}> = [
  {
    id: 'natural',
    label: 'Natural Atelier (Aoede)',
    persona: 'Aoede',
    desc: 'Warm, human-centered conversational tone with natural breathing cadence and empathetic delivery.'
  },
  {
    id: 'professional',
    label: 'Official Civic (Fenrir)',
    persona: 'Fenrir',
    desc: 'Clear, steady, and authoritative tone suitable for legal criteria and document verification.'
  },
  {
    id: 'friendly',
    label: 'Empathetic Guide (Kore)',
    persona: 'Kore',
    desc: 'Supportive, patient delivery ideal for students, senior citizens, and first-time applicants.'
  },
  {
    id: 'explainer',
    label: 'Public Explainer (Charon)',
    persona: 'Charon',
    desc: 'Structured, articulate cadence designed for unpacking complex regulations and welfare steps.'
  }
];

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
  selectedLanguage: initialLang = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'architecture'>('voice');
  const [refreshing, setRefreshing] = useState(false);

  // Voice Settings State
  const [currentStyle, setCurrentStyle] = useState<VoiceStyle>(() => voiceEngine.getSettings().style);
  const [currentSpeed, setCurrentSpeed] = useState<number>(() => voiceEngine.getSettings().speed);
  const [previewLang, setPreviewLang] = useState<SupportedLanguage>(initialLang);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleSelectStyle = (style: VoiceStyle) => {
    setCurrentStyle(style);
    voiceEngine.setVoiceStyle(style);
  };

  const handleSelectSpeed = (speed: number) => {
    setCurrentSpeed(speed);
    voiceEngine.setPlaybackSpeed(speed);
  };

  const handlePreview = () => {
    if (isPreviewPlaying) {
      voiceEngine.cancelSpeech();
      setIsPreviewPlaying(false);
      return;
    }

    voiceEngine.previewVoice(
      currentStyle,
      currentSpeed,
      previewLang,
      () => setIsPreviewPlaying(true),
      () => setIsPreviewPlaying(false),
      () => setIsPreviewPlaying(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-2xl bg-[#141311] border border-[#F5EFE6]/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F5EFE6] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F5EFE6]/7 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1816] border border-[#C87A4B]/30 text-[#C87A4B] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#FAF6F0] tracking-tight">
                Voice Experience &amp; Architecture
              </h2>
              <p className="text-xs text-[#A89F91] font-light">
                Configure voice styles, audio speed, and inspect verified Gemini APIs
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPreviewPlaying) voiceEngine.cancelSpeech();
              onClose();
            }}
            className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-[#F5EFE6]/7 shrink-0">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-[#C87A4B] text-[#0D0D0C]'
                : 'text-[#A89F91] hover:text-[#FAF6F0] bg-[#1A1816]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice &amp; Personality</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-[#C87A4B] text-[#0D0D0C]'
                : 'text-[#A89F91] hover:text-[#FAF6F0] bg-[#1A1816]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>APIs &amp; Gemini Models</span>
          </button>
        </div>

        {/* Tab 1: Voice & Personality */}
        {activeTab === 'voice' && (
          <div className="py-4 space-y-5 overflow-y-auto pr-1 flex-1">
            
            {/* Persona Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#FAF6F0] block">
                Assistant Voice Delivery &amp; Persona
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOICE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleSelectStyle(style.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      currentStyle === style.id
                        ? 'bg-[#1F1C18] border-[#C87A4B] text-[#FAF6F0] ring-1 ring-[#C87A4B]/40'
                        : 'bg-[#0D0D0C] border-[#F5EFE6]/6 text-[#A89F91] hover:border-[#F5EFE6]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#FAF6F0]">{style.label}</span>
                      {currentStyle === style.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C87A4B]" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#A89F91] leading-relaxed line-clamp-2">
                      {style.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Speed Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#FAF6F0]">
                  Speech Pace &amp; Cadence
                </label>
                <span className="text-xs font-mono text-[#C87A4B]">{currentSpeed}x</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { speed: 0.8, label: '0.8x (Patient & Slow)' },
                  { speed: 1.0, label: '1.0x (Natural Default)' },
                  { speed: 1.2, label: '1.2x (Brisk Cadence)' }
                ].map(opt => (
                  <button
                    key={opt.speed}
                    onClick={() => handleSelectSpeed(opt.speed)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      currentSpeed === opt.speed
                        ? 'bg-[#C87A4B] text-[#0D0D0C] border-[#C87A4B] font-semibold'
                        : 'bg-[#0D0D0C] border-[#F5EFE6]/6 text-[#A89F91] hover:text-[#FAF6F0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Audio Preview Bar */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#C87A4B]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FAF6F0] flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#C87A4B]" />
                  Preview Audio Delivery
                </span>

                <div className="flex items-center gap-1 bg-[#141311] p-0.5 rounded-lg border border-[#F5EFE6]/6">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setPreviewLang(lang.code)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                        previewLang === lang.code
                          ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                          : 'text-[#A89F91] hover:text-[#FAF6F0]'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-[#A89F91] font-light max-w-sm">
                  Generates authentic speech with Gemini 3.8 Flash Lite TTS and streams live voice via Gemini 3.8 Live API.
                </p>

                <button
                  onClick={handlePreview}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPreviewPlaying
                      ? 'bg-red-500 text-white'
                      : 'bg-[#C87A4B] hover:bg-[#D48354] text-[#0D0D0C] shadow-md'
                  }`}
                >
                  {isPreviewPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Spoken Voice</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Architecture & Gemini Integrations */}
        {activeTab === 'architecture' && (
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1 flex-1">
            
            {/* 1. Speech Generation */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#C87A4B]" />
                  <span className="font-semibold text-[#FAF6F0] text-xs">Gemini 3.8 Flash Lite TTS (`gemini-3.8-flash-lite-tts`)</span>
                </div>
                <span className="text-[11px] font-mono text-[#C87A4B]">Active · 24kHz Audio</span>
              </div>
              <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
                Generates high-fidelity natural speech using Indian English, conversational Hindi, and Telugu voices without robotic markdown reading.
              </p>
            </div>

            {/* 2. Live API */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#C87A4B]/40 ring-1 ring-[#C87A4B]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#C87A4B] animate-pulse" />
                  <span className="font-semibold text-[#FAF6F0] text-xs">Gemini 3.8 Live API (`gemini-3.8-live`)</span>
                </div>
                <span className="text-[11px] font-mono text-[#E0A364]">Exclusive Real-Time Engine</span>
              </div>
              <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
                Low-latency bidirectional WebSocket audio streaming at 16kHz PCM microphone input and 24kHz model output with instant barge-in interruption.
              </p>
            </div>

            {/* 3. Search Grounding */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#C87A4B]" />
                  <span className="font-semibold text-[#FAF6F0] text-xs">Google Search Grounding (`gemini-3.8-flash`)</span>
                </div>
                <span className="text-[11px] font-mono text-[#E0A364]">googleSearch Tool Active</span>
              </div>
              <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
                Grounded access to current scholarship deadlines, hospital coverage criteria, and official government portal sources.
              </p>
            </div>

            {/* 4. Multi-Turn Chatbot */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E0A364]" />
                  <span className="font-semibold text-[#FAF6F0] text-xs">Trilingual Intelligence Tier</span>
                </div>
                <span className="text-[10px] font-mono text-[#A89F91]">
                  gemini-4-argon · 3.8-flash · 3.1-flash-lite
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
                Intelligent conversational assistant with contextual page awareness for Dashboard, Documents Vault, and Applications.
              </p>
            </div>

            {/* 5. Bolna & Supabase Isolation */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#A89F91]" />
                  <span className="font-semibold text-[#FAF6F0] text-xs">Bolna AI &amp; Supabase Backend Isolation</span>
                </div>
                <span className="text-[10px] font-mono text-[#A89F91]">
                  Gemini Live Engine Active
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
                Credentials remain isolated securely on the Node.js server. Offline local persistence preserves application progress and audio transcripts.
              </p>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#F5EFE6]/7 flex items-center justify-between shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Recheck API Endpoints</span>
          </button>

          <button
            onClick={() => {
              if (isPreviewPlaying) voiceEngine.cancelSpeech();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
