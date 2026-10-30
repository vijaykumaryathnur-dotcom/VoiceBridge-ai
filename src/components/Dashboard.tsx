import React, { useState } from 'react';
import {
  Mic,
  GraduationCap,
  HeartPulse,
  FileText,
  Clock,
  CheckSquare,
  Square,
  AlertCircle,
  Play,
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { WorkflowItem, ConversationSession, SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';
import { voiceEngine } from '../services/voice';

interface DashboardProps {
  workflows: WorkflowItem[];
  recentConversations: ConversationSession[];
  onStartConversation: (language: SupportedLanguage, workflowId?: string) => void;
  onOpenWorkflow: (workflowId: string) => void;
  onSelectConversation: (convo: ConversationSession) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  workflows,
  recentConversations,
  onStartConversation,
  onOpenWorkflow,
  onSelectConversation
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handlePlaySampleAudio = (convo: ConversationSession) => {
    if (playingAudioId === convo.id) {
      voiceEngine.cancelSpeech();
      setPlayingAudioId(null);
      return;
    }

    voiceEngine.cancelSpeech();
    setPlayingAudioId(convo.id);
    const textToSpeak = convo.messages.find(m => m.sender === 'assistant')?.text || convo.summary;

    voiceEngine.speak(
      textToSpeak,
      convo.language,
      () => setPlayingAudioId(convo.id),
      () => setPlayingAudioId(null),
      () => setPlayingAudioId(null)
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education':
        return <GraduationCap className="w-4 h-4 text-[#C87A4B]" />;
      case 'healthcare':
        return <HeartPulse className="w-4 h-4 text-[#E0A364]" />;
      case 'public_service':
      default:
        return <FileText className="w-4 h-4 text-[#A89F91]" />;
    }
  };

  // Collect pending documents across all workflows
  const pendingDocs = workflows.flatMap(wf =>
    wf.requiredDocuments
      .filter(d => !d.submitted)
      .map(d => ({ ...d, workflowTitle: wf.title, workflowId: wf.id }))
  );

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-9 select-none text-[#F5EFE6]">
      
      {/* 1. Midnight Atelier Editorial Welcome & Quick Launch */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(200,122,75,0.08),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#A89F91]">
              <span className="uppercase tracking-widest text-[#C87A4B] font-semibold text-[10px]">
                Citizen Atelier
              </span>
              <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
              <span className="tabular-nums text-[#A89F91]">{workflows.length} Active Workflows</span>
            </div>
            
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FAF6F0] tracking-tight">
              Citizen Portal &amp; Active Applications
            </h1>
            
            <p className="text-xs sm:text-sm text-[#A89F91] max-w-lg leading-relaxed font-light">
              Speak naturally in English, Hindi, or Telugu to fulfill required prerequisites, verify eligibility thresholds, and track public submissions.
            </p>
          </div>

          {/* Quick Voice Bar with burnished copper accent */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center bg-[#0D0D0C] p-1 rounded-xl border border-[#F5EFE6]/6">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold shadow-sm'
                      : 'text-[#A89F91] hover:text-[#FAF6F0]'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>

            <button
              onClick={() => onStartConversation(selectedLang)}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-[#C87A4B]/15 cursor-pointer active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Speak</span>
            </button>
          </div>

        </div>

        {/* Status Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-[#F5EFE6]/6">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#A89F91]">Active Applications</span>
            <p className="font-editorial text-2xl font-bold text-[#FAF6F0] tabular-nums">
              {workflows.length}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#A89F91]">Pending Documents</span>
            <p className="font-editorial text-2xl font-bold text-[#C87A4B] tabular-nums">
              {pendingDocs.length}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#A89F91]">Verified Schemes</span>
            <p className="font-editorial text-2xl font-bold text-[#E0A364]">
              3 Programs
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#A89F91]">Current Voice Profile</span>
            <p className="font-editorial text-2xl font-bold text-[#FAF6F0]">
              {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.nativeName}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Active Applications & Workflow Completion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6]/6">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#FAF6F0] tracking-tight">
              Active Applications
            </h2>
            <p className="text-xs text-[#A89F91]">
              Review fulfillment progress and resume voice-guided submissions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {workflows.map((wf) => {
            const completed = wf.requiredDocuments.filter(d => d.submitted).length;
            const total = wf.requiredDocuments.length;

            return (
              <div
                key={wf.id}
                className="p-5 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 flex flex-col justify-between space-y-4 hover:border-[#C87A4B]/40 transition-colors shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(wf.category)}
                      <span className="text-[10px] uppercase font-semibold text-[#A89F91] tracking-wider">
                        {wf.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#E0A364] tabular-nums">
                      {wf.progress}%
                    </span>
                  </div>

                  <h3 className="font-editorial text-base font-bold text-[#FAF6F0] leading-snug">
                    {wf.title}
                  </h3>

                  <p className="text-xs text-[#A89F91] line-clamp-2 leading-relaxed">
                    {wf.description}
                  </p>

                  {/* Minimal Copper Progress Bar */}
                  <div className="w-full bg-[#0D0D0C] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#C87A4B] h-full rounded-full transition-all duration-500"
                      style={{ width: `${wf.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#A89F91] pt-1">
                    <span>Documents: <strong className="text-[#FAF6F0] tabular-nums">{completed}/{total}</strong></span>
                    <span>Target: <span className="text-[#FAF6F0]">{wf.deadline}</span></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5EFE6]/6 flex items-center gap-2">
                  <button
                    onClick={() => onStartConversation(selectedLang, wf.id)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-[#FAF6F0] hover:text-[#0D0D0C] bg-[#1A1816] hover:bg-[#C87A4B] border border-[#F5EFE6]/8 hover:border-[#C87A4B] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Speak to Assist</span>
                  </button>

                  <button
                    onClick={() => onOpenWorkflow(wf.id)}
                    className="p-2 text-[#A89F91] hover:text-[#FAF6F0] bg-[#1A1816] border border-[#F5EFE6]/6 rounded-xl transition-colors cursor-pointer"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Pending Actions & Registry Services */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Pending Actions */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6]/6">
            <div>
              <h3 className="font-editorial text-lg font-bold text-[#FAF6F0]">
                Pending Actions
              </h3>
              <p className="text-xs text-[#A89F91]">Specific criteria requiring citizen attestation</p>
            </div>
            <span className="text-xs font-mono text-[#C87A4B]">
              {pendingDocs.length} items
            </span>
          </div>

          <div className="space-y-2">
            {pendingDocs.map((doc, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#C87A4B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-[#FAF6F0] block">{doc.name}</span>
                    <span className="text-[11px] text-[#A89F91] block">{doc.workflowTitle}</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartConversation(selectedLang, doc.workflowId)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#C87A4B] hover:text-[#0D0D0C] bg-[#0D0D0C] hover:bg-[#C87A4B] border border-[#C87A4B]/20 hover:border-[#C87A4B] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Ask Voice AI
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Accessed Services */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-4">
          <div className="pb-2 border-b border-[#F5EFE6]/6">
            <h3 className="font-editorial text-lg font-bold text-[#FAF6F0]">
              Official Registries
            </h3>
            <p className="text-xs text-[#A89F91]">Authenticated departmental endpoints</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6 space-y-1">
              <span className="font-semibold text-[#FAF6F0] block">
                Ministry of Social Justice &amp; Empowerment
              </span>
              <p className="text-[#A89F91] text-[11px]">National Scholarship Portal (NSP) · Active Verification</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6 space-y-1">
              <span className="font-semibold text-[#FAF6F0] block">
                National Health Authority (NHA)
              </span>
              <p className="text-[#A89F91] text-[11px]">Ayushman Bharat PM-JAY &amp; ABHA Health Account</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6 space-y-1">
              <span className="font-semibold text-[#FAF6F0] block">
                Food &amp; Civil Supplies
              </span>
              <p className="text-[#A89F91] text-[11px]">Public Distribution System Smart Ration Renewal</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Recent Conversations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6]/6">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#FAF6F0] tracking-tight">
              Recent Consultations
            </h2>
            <p className="text-xs text-[#A89F91]">Audio playback and multilingual transcripts</p>
          </div>
        </div>

        <div className="divide-y divide-[#F5EFE6]/5 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 overflow-hidden">
          {recentConversations.map((convo) => {
            const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === convo.language);
            const isPlaying = playingAudioId === convo.id;

            return (
              <div
                key={convo.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1A1816] transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-editorial font-bold text-sm text-[#FAF6F0]">{convo.title}</span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className="text-[#C87A4B] font-medium">{langConfig?.nativeName || convo.language}</span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className="text-[#A89F91] tabular-nums">{convo.date}</span>
                  </div>

                  <p className="text-xs text-[#A89F91] truncate font-light">
                    {convo.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePlaySampleAudio(convo)}
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
                    className="px-3 py-1.5 text-xs text-[#FAF6F0] hover:text-[#FAF6F0] bg-[#0D0D0C] border border-[#F5EFE6]/8 hover:border-[#C87A4B]/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Transcript
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
