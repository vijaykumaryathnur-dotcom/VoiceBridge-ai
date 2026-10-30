import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { ActiveView } from './Header';

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
  onOpenIntegrations: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenIntegrations }) => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/70 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand & Models */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="font-semibold text-slate-200">VoiceBridge AI</span>
          <span className="hidden sm:inline text-slate-700" aria-hidden="true">·</span>
          <span>gemini-3.8-live · gemini-3.8-flash (Search Grounding) · gemini-3.5-transcribe</span>
          <span className="hidden sm:inline text-slate-700" aria-hidden="true">·</span>
          <span className="text-slate-500">English · हिन्दी · తెలుగు</span>
        </div>

        {/* Right: Clean links & Security notice */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => onNavigate('chat')}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Gemini Chat
          </button>
          <button
            onClick={() => onNavigate('transcribe')}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Transcribe Audio
          </button>
          <button
            onClick={() => onNavigate('workflows')}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Schemes &amp; Services
          </button>
          <button
            onClick={onOpenIntegrations}
            className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Integrations &amp; Models
          </button>
          <span className="text-slate-600">© 2026 VoiceBridge</span>
        </div>

      </div>
    </footer>
  );
};
