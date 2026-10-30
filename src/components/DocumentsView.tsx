import React from 'react';
import { FolderOpen, CheckSquare, Square, FileText, AlertCircle, Mic, ArrowRight } from 'lucide-react';
import { WorkflowItem, SupportedLanguage } from '../types';

interface DocumentsViewProps {
  workflows: WorkflowItem[];
  onToggleDocument: (wfId: string, docId: string, current: boolean) => void;
  onStartAssistantWithWorkflow: (wfId: string, lang: SupportedLanguage) => void;
  selectedLanguage: SupportedLanguage;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  workflows,
  onToggleDocument,
  onStartAssistantWithWorkflow,
  selectedLanguage
}) => {
  const allDocs = workflows.flatMap(wf =>
    wf.requiredDocuments.map(doc => ({
      ...doc,
      workflowId: wf.id,
      workflowTitle: wf.title,
      category: wf.category
    }))
  );

  const verifiedCount = allDocs.filter(d => d.submitted).length;
  const pendingCount = allDocs.length - verifiedCount;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 select-none text-[#F5EFE6]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87A4B] font-sans">
            Citizen Documentation
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
            Documents Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#A89F91] mt-1 font-light">
            Manage required identity, income, and residence proofs across all your applications.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-[#141311] border border-[#F5EFE6]/8 text-[#C87A4B]">
            {verifiedCount} Verified
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#141311] border border-[#F5EFE6]/8 text-[#E0A364]">
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Documents List */}
      <div className="divide-y divide-[#F5EFE6]/5 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 overflow-hidden">
        {allDocs.map((doc, idx) => {
          const docTitle =
            selectedLanguage === 'hi'
              ? doc.name_hi
              : selectedLanguage === 'te'
              ? doc.name_te
              : doc.name;

          return (
            <div
              key={`${doc.workflowId}-${doc.id}-${idx}`}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1A1816] transition-colors"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleDocument(doc.workflowId, doc.id, doc.submitted)}
                  className="mt-0.5 focus:outline-none cursor-pointer"
                >
                  {doc.submitted ? (
                    <CheckSquare className="w-5 h-5 text-[#C87A4B]" />
                  ) : (
                    <Square className="w-5 h-5 text-[#A89F91]" />
                  )}
                </button>

                <div>
                  <span className="text-sm font-medium block text-[#FAF6F0]">
                    {docTitle}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#A89F91] mt-0.5 font-light">
                    <span>{doc.workflowTitle}</span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className="font-mono text-[11px] text-[#C87A4B]">
                      {doc.submitted ? 'Submitted & Linked' : 'Required for Verification'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => onStartAssistantWithWorkflow(doc.workflowId, selectedLanguage)}
                  className="px-3 py-1.5 text-xs text-[#A89F91] hover:text-[#0D0D0C] hover:bg-[#C87A4B] bg-[#1A1816] border border-[#F5EFE6]/6 hover:border-[#C87A4B] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Ask Voice Assistant</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
