import React, { useState } from 'react';
import {
  GraduationCap,
  HeartPulse,
  FileText,
  CheckSquare,
  Square,
  Calendar,
  Building,
  Mic,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { WorkflowItem, SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';
import { toggleWorkflowDocument } from '../services/api';

interface WorkflowCenterProps {
  workflows: WorkflowItem[];
  onUpdateWorkflow: (updated: WorkflowItem) => void;
  onStartAssistantWithWorkflow: (workflowId: string, lang: SupportedLanguage) => void;
}

export const WorkflowCenter: React.FC<WorkflowCenterProps> = ({
  workflows,
  onUpdateWorkflow,
  onStartAssistantWithWorkflow
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'education' | 'healthcare' | 'public_service'>('all');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(workflows[0]?.id || 'wf-scholarship-1');
  const [displayLanguage, setDisplayLanguage] = useState<SupportedLanguage>('en');
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0];

  const filteredWorkflows = workflows.filter(wf => {
    if (selectedCategory === 'all') return true;
    return wf.category === selectedCategory;
  });

  const handleToggleDoc = async (docId: string, currentStatus: boolean) => {
    if (!activeWorkflow) return;
    setUpdatingDocId(docId);
    try {
      const updated = await toggleWorkflowDocument(activeWorkflow.id, docId, !currentStatus);
      onUpdateWorkflow(updated);
    } catch (err) {
      console.error('Failed to toggle doc:', err);
    } finally {
      setUpdatingDocId(null);
    }
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

  const completedDocs = activeWorkflow ? activeWorkflow.requiredDocuments.filter(d => d.submitted) : [];
  const missingDocs = activeWorkflow ? activeWorkflow.requiredDocuments.filter(d => !d.submitted) : [];

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 select-none text-[#F5EFE6]">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87A4B] font-sans">
            Welfare &amp; Service Pathways
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
            Workflows Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#A89F91] mt-1 font-light">
            Verified step-by-step guidance for education scholarships, healthcare cards, and civil records.
          </p>
        </div>

        {/* Script Selector */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-[#141311] p-1 rounded-xl border border-[#F5EFE6]/6">
          <span className="text-[11px] text-[#A89F91] px-2 font-mono">Script:</span>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setDisplayLanguage(lang.code)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                displayLanguage === lang.code
                  ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold shadow-sm'
                  : 'text-[#A89F91] hover:text-[#FAF6F0]'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-[#141311] p-1 rounded-xl border border-[#F5EFE6]/6 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#1A1816] text-[#FAF6F0] border border-[#F5EFE6]/10'
              : 'text-[#A89F91] hover:text-[#FAF6F0]'
          }`}
        >
          All Schemes ({workflows.length})
        </button>
        <button
          onClick={() => setSelectedCategory('education')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'education'
              ? 'bg-[#1A1816] text-[#FAF6F0] border border-[#F5EFE6]/10'
              : 'text-[#A89F91] hover:text-[#FAF6F0]'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-[#C87A4B]" />
          <span>Education &amp; Scholarships</span>
        </button>
        <button
          onClick={() => setSelectedCategory('healthcare')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'healthcare'
              ? 'bg-[#1A1816] text-[#FAF6F0] border border-[#F5EFE6]/10'
              : 'text-[#A89F91] hover:text-[#FAF6F0]'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 text-[#E0A364]" />
          <span>Healthcare Administration</span>
        </button>
        <button
          onClick={() => setSelectedCategory('public_service')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'public_service'
              ? 'bg-[#1A1816] text-[#FAF6F0] border border-[#F5EFE6]/10'
              : 'text-[#A89F91] hover:text-[#FAF6F0]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#A89F91]" />
          <span>Public Service Guidance</span>
        </button>
      </div>

      {/* Split Layout: Scheme Navigation on Left, Detailed Workspace on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Scheme Cards */}
        <div className="lg:col-span-5 space-y-3">
          {filteredWorkflows.map((wf) => {
            const isSelected = wf.id === activeWorkflow?.id;
            const completed = wf.requiredDocuments.filter(d => d.submitted).length;
            const title =
              displayLanguage === 'hi'
                ? wf.title_hi
                : displayLanguage === 'te'
                ? wf.title_te
                : wf.title;

            return (
              <button
                key={wf.id}
                type="button"
                onClick={() => setActiveWorkflowId(wf.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1816] border-[#C87A4B] shadow-xl'
                    : 'bg-[#141311] border-[#F5EFE6]/6 hover:border-[#C87A4B]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(wf.category)}
                    <span className="text-[10px] uppercase font-semibold text-[#A89F91] tracking-wider">
                      {wf.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#C87A4B] tabular-nums font-semibold">
                    {wf.progress}%
                  </span>
                </div>

                <h3 className="font-editorial text-base font-bold text-[#FAF6F0] mt-2">
                  {title}
                </h3>

                <p className="text-xs text-[#A89F91] mt-1 line-clamp-2 leading-relaxed font-light">
                  {displayLanguage === 'hi' ? wf.description_hi : displayLanguage === 'te' ? wf.description_te : wf.description}
                </p>

                <div className="mt-3 pt-3 border-t border-[#F5EFE6]/6 flex items-center justify-between text-[11px] text-[#A89F91]">
                  <span className="tabular-nums">Documents: {completed}/{wf.requiredDocuments.length}</span>
                  <span className="tabular-nums">Deadline: {wf.deadline}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Detailed Workflow View */}
        {activeWorkflow && (
          <div className="lg:col-span-7 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(ellipse_at_top_right,rgba(200,122,75,0.06),transparent_70%)] pointer-events-none" />

            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-[#F5EFE6]/6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#A89F91]">
                  {getCategoryIcon(activeWorkflow.category)}
                  <span className="uppercase font-semibold tracking-wider text-[11px]">
                    {activeWorkflow.category.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#C87A4B]">
                  Status: {activeWorkflow.status.replace('_', ' ')}
                </span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FAF6F0] tracking-tight">
                {displayLanguage === 'hi' ? activeWorkflow.title_hi : displayLanguage === 'te' ? activeWorkflow.title_te : activeWorkflow.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A89F91]">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#A89F91]" />
                  <span>{activeWorkflow.department}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#A89F91]" />
                  <span>Deadline: <strong className="text-[#FAF6F0] font-mono">{activeWorkflow.deadline}</strong></span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed pt-1 font-light">
                {displayLanguage === 'hi' ? activeWorkflow.description_hi : displayLanguage === 'te' ? activeWorkflow.description_te : activeWorkflow.description}
              </p>

              {/* Minimal Burnished Copper Progress Line */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-[#A89F91] mb-1.5">
                  <span>Current Progress</span>
                  <span className="font-mono text-[#C87A4B] font-semibold">{activeWorkflow.progress}%</span>
                </div>
                <div className="w-full bg-[#0D0D0C] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#C87A4B] h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeWorkflow.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 1. What the user wants to accomplish */}
            <div className="space-y-1.5 relative z-10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C87A4B]">
                Fulfillment Target
              </span>
              <p className="text-xs text-[#FAF6F0] leading-relaxed bg-[#1A1816] p-3.5 rounded-xl border border-[#F5EFE6]/6 font-light">
                {activeWorkflow.category === 'education'
                  ? 'Access state and central government scholarship grants for higher education fees. Submit family income certificate (< ₹2.5 Lakhs) and link your Aadhaar with direct benefit transfer (DBT).'
                  : activeWorkflow.category === 'healthcare'
                  ? 'Enroll your household into Ayushman Bharat PM-JAY for ₹5 Lakhs annual cashless hospitalization and obtain a secure 14-digit ABHA digital health account number.'
                  : 'Renew subsidized food grain benefits, update household address records, and verify family member biometric seeding for Fair Price Shop supplies.'}
              </p>
            </div>

            {/* 2. Information already collected */}
            {activeWorkflow.fields && (
              <div className="space-y-2 relative z-10">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89F91]">
                  Information Collected
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(activeWorkflow.fields).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6">
                      <span className="text-[10px] text-[#A89F91] block capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-semibold text-[#FAF6F0] mt-0.5 block truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Missing Information & Required Documents */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89F91]">
                  Required Documents Checklist
                </span>
                <span className="text-xs font-mono text-[#C87A4B]">
                  {completedDocs.length} of {activeWorkflow.requiredDocuments.length} Verified
                </span>
              </div>

              <div className="space-y-1.5">
                {activeWorkflow.requiredDocuments.map((doc) => {
                  const docTitle =
                    displayLanguage === 'hi'
                      ? doc.name_hi
                      : displayLanguage === 'te'
                      ? doc.name_te
                      : doc.name;

                  return (
                    <button
                      key={doc.id}
                      onClick={() => handleToggleDoc(doc.id, doc.submitted)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        doc.submitted
                          ? 'bg-[#1A1816] border-[#F5EFE6]/10 text-[#FAF6F0]'
                          : 'bg-[#141311] border-[#F5EFE6]/6 text-[#A89F91] hover:border-[#C87A4B]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {doc.submitted ? (
                          <CheckSquare className="w-4 h-4 text-[#C87A4B] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#A89F91] shrink-0" />
                        )}
                        <span className={doc.submitted ? 'text-[#FAF6F0] font-medium' : 'text-[#A89F91]'}>
                          {docTitle}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono shrink-0">
                        {doc.submitted ? 'Submitted' : 'Pending'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Next Recommended Action */}
            <div className="p-4 rounded-xl bg-[#1A1816] border border-[#C87A4B]/30 flex items-start gap-3 text-xs relative z-10">
              <AlertCircle className="w-4 h-4 text-[#C87A4B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#E0A364] block">Next Recommended Step</span>
                <p className="text-[#A89F91] text-[11px] mt-0.5 leading-relaxed font-light">
                  {missingDocs[0]
                    ? `Upload or authenticate ${missingDocs[0].name} using Aadhaar OTP verification to proceed.`
                    : 'All requirements completed. Tap below to speak with VoiceBridge AI for final submission review.'}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#F5EFE6]/6 flex items-center justify-between gap-4 relative z-10">
              <button
                onClick={() => onStartAssistantWithWorkflow(activeWorkflow.id, displayLanguage)}
                className="w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C87A4B]/15 active:scale-98"
              >
                <Mic className="w-4 h-4" />
                <span>Speak to Complete This Workflow</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
