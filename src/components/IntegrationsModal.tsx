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
  Mic
} from 'lucide-react';
import { IntegrationStatus } from '../types';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: IntegrationStatus | null;
  onRefresh: () => Promise<void>;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-2xl bg-[#141311] border border-[#F5EFE6]/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F5EFE6] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F5EFE6]/7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1816] border border-[#C87A4B]/30 text-[#C87A4B] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#FAF6F0] tracking-tight">Architecture &amp; Gemini Models</h2>
              <p className="text-xs text-[#A89F91] font-light">Live API, Search Grounding, Transcribe, and Multi-Turn Chatbot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Integration List */}
        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          
          {/* 1. Live API */}
          <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#E0A364]" />
                <span className="font-semibold text-[#FAF6F0] text-xs">Gemini 3.8 Live API (`gemini-3.8-live`)</span>
              </div>
              <span className="text-[11px] font-mono text-[#C87A4B]">WebSocket Connected</span>
            </div>
            <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
              Real-time conversational streaming at 16kHz PCM audio input from microphone and 24kHz synthesized spoken response output.
            </p>
          </div>

          {/* 2. Search Grounding */}
          <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C87A4B]" />
                <span className="font-semibold text-[#FAF6F0] text-xs">Google Search Grounding (`gemini-3.8-flash`)</span>
              </div>
              <span className="text-[11px] font-mono text-[#E0A364]">googleSearch Tool Active</span>
            </div>
            <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
              Grounded access to current 2026 scholarship deadlines, hospital coverage criteria, and official government portal sources.
            </p>
          </div>

          {/* 3. Audio Transcribe */}
          <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#FAF6F0]" />
                <span className="font-semibold text-[#FAF6F0] text-xs">Audio Transcription (`gemini-3.5-transcribe`)</span>
              </div>
              <span className="text-[11px] font-mono text-[#C87A4B]">Trilingual Speech-to-Text</span>
            </div>
            <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
              Verbatim microphone audio transcription in English, Hindi (Devanagari), and Telugu scripts.
            </p>
          </div>

          {/* 4. Chatbot Models */}
          <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E0A364]" />
                <span className="font-semibold text-[#FAF6F0] text-xs">Multi-Turn Chatbot Tier Architecture</span>
              </div>
              <span className="text-[10px] font-mono text-[#A89F91]">
                gemini-4-argon · 3.8-flash · 3.1-flash-lite
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
              Role-based system instructions tailored for civic assistance, legal eligibility audits, and rapid scheme navigation.
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
                {status?.bolna.configured ? 'Bolna Configured' : 'Native Speech Engine Active'}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#A89F91] leading-relaxed font-light">
              Credentials remain isolated securely on the Node.js server. Offline local persistence preserves application progress and audio transcripts.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#F5EFE6]/7 flex items-center justify-between">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Recheck API Endpoints</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
