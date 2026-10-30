import React, { useState } from 'react';
import { History, Play, Clock, Download, Copy, Check, Mic, Volume2 } from 'lucide-react';
import { ConversationSession, SUPPORTED_LANGUAGES, SupportedLanguage } from '../types';
import { voiceEngine } from '../services/voice';

interface HistoryViewProps {
  conversations: ConversationSession[];
  onSelectConversation: (convo: ConversationSession) => void;
  onStartNewConversation: (lang: SupportedLanguage) => void;
  selectedLanguage: SupportedLanguage;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  conversations,
  onSelectConversation,
  onStartNewConversation,
  selectedLanguage
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayAudio = (convo: ConversationSession) => {
    if (playingId === convo.id) {
      voiceEngine.cancelSpeech();
      setPlayingId(null);
      return;
    }

    voiceEngine.cancelSpeech();
    setPlayingId(convo.id);
    const textToSpeak = convo.messages.find(m => m.sender === 'assistant')?.text || convo.summary;

    voiceEngine.speak(
      textToSpeak,
      convo.language,
      () => setPlayingId(convo.id),
      () => setPlayingId(null),
      () => setPlayingId(null)
    );
  };

  const handleExportAll = () => {
    const formatted = conversations
      .map(c => `=== ${c.title} (${c.date}) [${c.language}] ===\nSummary: ${c.summary}\n\n` +
        c.messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n')
      )
      .join('\n\n========================\n\n');

    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicebridge-full-history-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 select-none text-[#F5EFE6]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87A4B] font-sans">
            Session Transcripts
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
            Consultation History
          </h1>
          <p className="text-xs sm:text-sm text-[#A89F91] mt-1 font-light">
            Review past voice dialogues, listen to synthesized responses, and export documented session logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {conversations.length > 0 && (
            <button
              onClick={handleExportAll}
              className="px-3.5 py-2 text-xs font-medium text-[#FAF6F0] bg-[#141311] hover:bg-[#1A1816] border border-[#F5EFE6]/8 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#C87A4B]" />
              <span>Export All</span>
            </button>
          )}

          <button
            onClick={() => onStartNewConversation(selectedLanguage)}
            className="px-4 py-2 text-xs font-semibold text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>New Voice Session</span>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-3">
          <History className="w-8 h-8 text-[#A89F91] mx-auto opacity-50" />
          <h3 className="font-editorial text-lg font-bold text-[#FAF6F0]">No Consultations Recorded</h3>
          <p className="text-xs text-[#A89F91] font-light">Launch the Voice Assistant to begin your first spoken inquiry.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5EFE6]/5 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 overflow-hidden">
          {conversations.map((convo) => {
            const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === convo.language);
            const isPlaying = playingId === convo.id;

            return (
              <div
                key={convo.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1A1816] transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-editorial font-bold text-base text-[#FAF6F0]">{convo.title}</span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className="text-[#C87A4B] font-medium">{langConfig?.nativeName || convo.language}</span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className="text-[#A89F91] tabular-nums font-mono">{convo.date}</span>
                  </div>

                  <p className="text-xs text-[#A89F91] line-clamp-2 leading-relaxed font-light">
                    {convo.summary}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-[#A89F91] pt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-[#A89F91]/60" />
                      {Math.floor(convo.durationSeconds / 60)}m {convo.durationSeconds % 60}s
                    </span>
                    <span className="font-mono text-[#A89F91]/80">{convo.messages.length} exchanges</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePlayAudio(convo)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isPlaying
                        ? 'bg-[#BA6C3D] text-[#FAF6F0]'
                        : 'bg-[#1A1816] hover:bg-[#C87A4B] hover:text-[#0D0D0C] text-[#FAF6F0] border border-[#F5EFE6]/6'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isPlaying ? 'Playing...' : 'Audio'}</span>
                  </button>

                  <button
                    onClick={() => onSelectConversation(convo)}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#FAF6F0] bg-[#0D0D0C] hover:bg-[#1A1816] border border-[#F5EFE6]/8 hover:border-[#C87A4B]/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Transcript
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
