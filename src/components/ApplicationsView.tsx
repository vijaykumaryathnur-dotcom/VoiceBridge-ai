import React from 'react';
import { FileCheck2, Calendar, Clock, AlertCircle, ArrowRight, Mic } from 'lucide-react';
import { WorkflowItem, SupportedLanguage } from '../types';

interface ApplicationsViewProps {
  workflows: WorkflowItem[];
  onOpenWorkflow: (id: string) => void;
  onStartAssistantWithWorkflow: (id: string, lang: SupportedLanguage) => void;
  selectedLanguage: SupportedLanguage;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  workflows,
  onOpenWorkflow,
  onStartAssistantWithWorkflow,
  selectedLanguage
}) => {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 select-none text-[#F5EFE6]">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#F5EFE6]/7">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87A4B] font-sans">
          Citizen Registry
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
          Active Applications &amp; Submissions
        </h1>
        <p className="text-xs sm:text-sm text-[#A89F91] mt-1 font-light">
          Overview of ongoing welfare applications, current administrative stages, and submission deadlines.
        </p>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {workflows.map((wf) => {
          const completedDocs = wf.requiredDocuments.filter(d => d.submitted).length;
          const totalDocs = wf.requiredDocuments.length;
          const title =
            selectedLanguage === 'hi'
              ? wf.title_hi
              : selectedLanguage === 'te'
              ? wf.title_te
              : wf.title;

          return (
            <div
              key={wf.id}
              className="p-6 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#C87A4B]/40 transition-colors shadow-sm"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-[#C87A4B] font-semibold uppercase text-[10px]">
                    ID: {wf.id.toUpperCase()}
                  </span>
                  <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                  <span className="text-[#A89F91]">{wf.department}</span>
                  <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                  <span className="font-mono text-[#E0A364]">{wf.status.replace('_', ' ')}</span>
                </div>

                <h3 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                  {title}
                </h3>

                <p className="text-xs text-[#A89F91] line-clamp-2 max-w-xl font-light">
                  {wf.description}
                </p>

                {/* Progress & Docs info */}
                <div className="pt-2 flex items-center gap-6 text-xs text-[#A89F91]">
                  <span>Progress: <strong className="text-[#FAF6F0] font-mono">{wf.progress}%</strong></span>
                  <span>Documents: <strong className="text-[#FAF6F0] font-mono">{completedDocs}/{totalDocs}</strong></span>
                  <span>Deadline: <strong className="text-[#FAF6F0] font-mono">{wf.deadline}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                <button
                  onClick={() => onStartAssistantWithWorkflow(wf.id, selectedLanguage)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Speak to Assist</span>
                </button>

                <button
                  onClick={() => onOpenWorkflow(wf.id)}
                  className="px-4 py-2.5 text-xs font-medium text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
                >
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
