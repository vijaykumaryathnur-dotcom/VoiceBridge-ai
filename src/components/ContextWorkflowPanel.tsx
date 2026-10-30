import React from 'react';
import {
  X,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  Mic,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Wallet,
  Landmark,
  Scale,
  Compass,
  BookmarkPlus,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import {
  WorkflowItem,
  SupportedLanguage,
  ChatMessage,
  WorkflowIntelligence,
  TaskStep
} from '../types';
import { analyzeConversationIntelligence } from '../services/workflowEngine';

interface ContextWorkflowPanelProps {
  workflow: WorkflowItem | null;
  intelligence?: WorkflowIntelligence | null;
  conversationMessages?: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onToggleDocument?: (docId: string, current: boolean) => void;
  onToggleTask?: (taskId: string) => void;
  onStartVoiceAssistant: (workflowId?: string, lang?: SupportedLanguage) => void;
  onSaveDynamicWorkflow?: () => void;
  selectedLanguage: SupportedLanguage;
}

export const ContextWorkflowPanel: React.FC<ContextWorkflowPanelProps> = ({
  workflow,
  intelligence: propIntelligence,
  conversationMessages = [],
  isOpen,
  onClose,
  onToggleDocument,
  onToggleTask,
  onStartVoiceAssistant,
  onSaveDynamicWorkflow,
  selectedLanguage
}) => {
  if (!isOpen) return null;

  // Use passed intelligence or dynamically compute from live messages
  const intelligence: WorkflowIntelligence =
    propIntelligence ||
    analyzeConversationIntelligence(conversationMessages, selectedLanguage);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'education':
        return <GraduationCap className="w-3.5 h-3.5 text-[#C87A4B]" />;
      case 'healthcare':
        return <HeartPulse className="w-3.5 h-3.5 text-[#E0A364]" />;
      case 'jobs':
        return <Briefcase className="w-3.5 h-3.5 text-[#C87A4B]" />;
      case 'finance':
        return <Wallet className="w-3.5 h-3.5 text-[#A89F91]" />;
      case 'legal':
        return <Scale className="w-3.5 h-3.5 text-[#F5EFE6]" />;
      case 'government':
      case 'public_service':
      default:
        return <Landmark className="w-3.5 h-3.5 text-[#C87A4B]" />;
    }
  };

  return (
    <aside className="w-64 xl:w-72 shrink-0 h-screen sticky top-0 border-l border-[#F5EFE6]/7 bg-[#121110] text-[#F5EFE6] flex flex-col justify-between p-4 z-20 overflow-y-auto select-none box-border">
      
      {/* Top Header & Content */}
      <div className="space-y-4">
        
        {/* Panel Title Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F5EFE6]/7">
          <div className="flex items-center gap-1.5 text-[#C87A4B]">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider font-sans">
              {intelligence.requiresWorkflow ? 'Active Task Intelligence' : 'Conversation Context'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#A89F91] hover:text-[#F5EFE6] rounded transition-colors cursor-pointer"
            title="Collapse panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Detected User Intent */}
        <div className="p-3 rounded-xl bg-[#161412] border border-[#C87A4B]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[#E0A364] text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#C87A4B]" />
            <span>Detected Intent</span>
          </div>
          <p className="text-xs text-[#F5EFE6] leading-snug font-medium">
            {intelligence.detectedIntent}
          </p>
        </div>

        {/* ============================================================ */}
        {/* CASE A: GENERAL CONVERSATION (No Structured Workflow Required) */}
        {/* ============================================================ */}
        {!intelligence.requiresWorkflow ? (
          <div className="space-y-3 pt-1">
            
            {/* Objective / Focus */}
            <div className="p-3 rounded-xl bg-[#161412] border border-[#F5EFE6]/6 space-y-1 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A89F91] block">
                Conversational Focus
              </span>
              <p className="text-[11px] text-[#F5EFE6] leading-relaxed">
                {intelligence.objective}
              </p>
            </div>

            {/* Direct Dialogue Mode Card */}
            <div className="p-3 rounded-xl bg-[#181614] border border-[#F5EFE6]/6 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#E0A364] text-[10px] font-semibold uppercase tracking-wider">
                <MessageSquare className="w-3 h-3 text-[#C87A4B]" />
                <span>Direct Dialogue Active</span>
              </div>
              <p className="text-[11px] text-[#A89F91] leading-relaxed">
                VoiceBridge AI responds directly to your question. No structured forms or unnecessary paperwork required.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#A89F91] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Listening in {selectedLanguage === 'hi' ? 'हिन्दी' : selectedLanguage === 'te' ? 'తెలుగు' : 'English'}</span>
              </div>
            </div>

            {/* Optional Convert to Workflow prompt */}
            <div className="p-2.5 rounded-lg bg-[#181614] border border-[#C87A4B]/15 text-[11px] text-[#A89F91] space-y-1">
              <span className="text-[#E0A364] font-semibold text-[10px] block">
                Need a Structured Action Plan?
              </span>
              <p className="text-[10px] leading-tight text-[#A89F91]">
                Say: <span className="text-[#F5EFE6]">"Create a step-by-step plan for this"</span> to initiate a tracked workflow anytime.
              </p>
            </div>

          </div>
        ) : (
          /* ============================================================ */
          /* CASE B: STRUCTURED TASK WORKFLOW ACTIVE                      */
          /* ============================================================ */
          <div className="space-y-3.5">
            
            {/* Objective & Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#A89F91]">
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(intelligence.category)}
                  <span className="capitalize text-[10px]">{intelligence.category || 'General Task'}</span>
                </div>
                <span className="text-[#C87A4B] font-mono font-semibold tabular-nums">{intelligence.progress}%</span>
              </div>

              <p className="text-xs text-[#F5EFE6] font-medium leading-snug">
                {intelligence.objective}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-[#181614] h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-[#C87A4B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${intelligence.progress}%` }}
                />
              </div>
            </div>

            {/* Information Collected */}
            {intelligence.collectedInfo && Object.keys(intelligence.collectedInfo).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A89F91]">
                  Information Collected
                </span>
                <div className="space-y-1 text-xs">
                  {Object.entries(intelligence.collectedInfo).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between p-1.5 rounded bg-[#161412] border border-[#F5EFE6]/6 text-[11px]"
                    >
                      <span className="text-[#A89F91] capitalize text-[10px] truncate max-w-[100px]">
                        {k}
                      </span>
                      <span className="font-medium text-[#F5EFE6] tabular-nums truncate max-w-[110px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Information Still Required */}
            {intelligence.missingInfo && intelligence.missingInfo.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87A4B]">
                  Information Still Required ({intelligence.missingInfo.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {intelligence.missingInfo.map((info, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#1C1814] border border-[#C87A4B]/25 text-[#E0A364]"
                    >
                      {info}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tasks / Steps */}
            {intelligence.tasks && intelligence.tasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A89F91]">
                    Action Plan ({intelligence.tasks.filter(t => t.completed).length}/{intelligence.tasks.length})
                  </span>
                </div>

                <div className="space-y-1">
                  {intelligence.tasks.map((task: TaskStep) => (
                    <button
                      key={task.id}
                      onClick={() => onToggleTask && onToggleTask(task.id)}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-start gap-2 cursor-pointer ${
                        task.completed
                          ? 'bg-[#141210] border-[#F5EFE6]/5 text-[#A89F91]'
                          : 'bg-[#181614] border-[#C87A4B]/30 text-[#F5EFE6] hover:border-[#C87A4B]'
                      }`}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#C87A4B] shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#A89F91] shrink-0 mt-0.5" />
                      )}
                      <span className={`block text-[11px] leading-tight ${task.completed ? 'line-through text-[#A89F91]' : 'text-[#F5EFE6] font-medium'}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Next Action */}
            <div className="p-2.5 rounded-xl bg-[#161412] border border-[#F5EFE6]/6 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-[#E0A364] text-[10px] font-semibold">
                <AlertCircle className="w-3 h-3 text-[#C87A4B]" />
                <span>Recommended Next Step</span>
              </div>
              <p className="text-[11px] text-[#A89F91] leading-relaxed">
                {intelligence.nextRecommendedAction}
              </p>
            </div>

            {/* Safety & Submission Boundaries Notice */}
            <div className="p-2 rounded-lg bg-[#161412] border border-[#F5EFE6]/6 text-[10px] text-[#A89F91] flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C87A4B] shrink-0 mt-0.5" />
              <span>
                {intelligence.safetyDisclaimer || 'Advisory Preparation: Final submission must be executed directly on the official portal.'}
              </span>
            </div>

            {/* Save as Active Workflow Button */}
            {onSaveDynamicWorkflow && (
              <button
                onClick={onSaveDynamicWorkflow}
                className="w-full py-1.5 px-2.5 rounded-lg border border-[#C87A4B]/30 bg-[#1A1816] hover:bg-[#221F1B] text-xs text-[#E0A364] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#C87A4B]" />
                <span>Save to My Workflows</span>
              </button>
            )}

          </div>
        )}

      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#F5EFE6]/7">
        <button
          onClick={() => onStartVoiceAssistant(workflow?.id, selectedLanguage)}
          className="w-full py-2 px-3 text-xs font-semibold text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Speak with VoiceBridge</span>
        </button>
      </div>

    </aside>
  );
};
