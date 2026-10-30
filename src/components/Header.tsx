import React from 'react';
import { Sparkles, Layers, MessageSquare, Mic } from 'lucide-react';
import { IntegrationStatus } from '../types';

export type ActiveView = 'landing' | 'dashboard' | 'assistant' | 'chat' | 'transcribe' | 'workflows';

interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  integrationStatus?: IntegrationStatus | null;
  onOpenIntegrations: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  integrationStatus,
  onOpenIntegrations
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-left text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span>VoiceBridge AI</span>
        </button>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'landing' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'dashboard' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'assistant' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Voice Assistant
          </button>
          <button
            onClick={() => onNavigate('chat')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'chat' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Gemini Chat</span>
          </button>
          <button
            onClick={() => onNavigate('transcribe')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'transcribe' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Transcribe
          </button>
          <button
            onClick={() => onNavigate('workflows')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'workflows' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Workflows
          </button>
        </nav>

        {/* Zone 3: 1 primary action & architecture status link */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenIntegrations}
            title="View Model & Integration status"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tabular-nums">
              Gemini 3.8 &amp; Live
            </span>
          </button>

          <button
            onClick={() => onNavigate('assistant')}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-sm shadow-cyan-500/20 transition-all duration-150 active:scale-95 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
          >
            Start Speaking
          </button>
        </div>
      </div>
    </header>
  );
};
