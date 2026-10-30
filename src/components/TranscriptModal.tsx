import React from 'react';
import { X, Clock, Download, Volume2 } from 'lucide-react';
import { ConversationSession, SUPPORTED_LANGUAGES } from '../types';
import { voiceEngine } from '../services/voice';

interface TranscriptModalProps {
  conversation: ConversationSession | null;
  onClose: () => void;
}

export const TranscriptModal: React.FC<TranscriptModalProps> = ({
  conversation,
  onClose
}) => {
  if (!conversation) return null;

  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === conversation.language);

  const handleReplayMessage = (text: string) => {
    voiceEngine.cancelSpeech();
    voiceEngine.speak(text, conversation.language);
  };

  const handleExportText = () => {
    const formatted = conversation.messages
      .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()} (${m.language}):\n${m.text}\n`)
      .join('\n---\n\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${conversation.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-2xl bg-[#141311] border border-[#F5EFE6]/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F5EFE6] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F5EFE6]/7">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A89F91]">
              <span className="font-semibold text-[#C87A4B]">{langConfig?.nativeName || conversation.language}</span>
              <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
              <span className="tabular-nums font-mono">{conversation.date}</span>
              <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
              <span className="tabular-nums font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#A89F91]/60" />
                {Math.floor(conversation.durationSeconds / 60)}m {conversation.durationSeconds % 60}s
              </span>
            </div>
            <h2 className="font-editorial text-2xl font-bold text-[#FAF6F0] mt-1 tracking-tight">{conversation.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="py-4 space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
          {conversation.messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-xl border ${
                m.sender === 'user'
                  ? 'bg-[#1A1816] border-[#C87A4B]/30 ml-6 text-[#FAF6F0]'
                  : 'bg-[#0D0D0C] border-[#F5EFE6]/6 mr-6 text-[#A89F91]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1.5 text-[#A89F91]">
                <span className="font-semibold uppercase tracking-wider text-[#E0A364]">
                  {m.sender === 'user' ? 'Citizen' : 'VoiceBridge AI'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums font-mono text-[#A89F91]/70">{m.timestamp}</span>
                  {m.sender === 'assistant' && (
                    <button
                      onClick={() => handleReplayMessage(m.text)}
                      className="hover:text-[#FAF6F0] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Listen audio"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#C87A4B]" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="leading-relaxed font-sans font-light">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#F5EFE6]/7 flex items-center justify-between">
          <button
            onClick={handleExportText}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C87A4B]" />
            <span>Export Transcript</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
