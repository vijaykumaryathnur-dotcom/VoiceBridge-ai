import React, { useState } from 'react';
import {
  FileCheck2,
  Calendar,
  Clock,
  AlertCircle,
  ArrowRight,
  Mic,
  Volume2,
  Search,
  Filter,
  CheckCircle2,
  Building,
  ChevronRight,
  X,
  FileText,
  ListTodo
} from 'lucide-react';
import { WorkflowItem, SupportedLanguage, WorkflowStatus } from '../types';

interface ApplicationsViewProps {
  workflows: WorkflowItem[];
  onOpenWorkflow: (id: string) => void;
  onStartAssistantWithWorkflow: (id: string, lang: SupportedLanguage) => void;
  onTriggerPageNarration: (narrationText: string) => void;
  selectedLanguage: SupportedLanguage;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  workflows,
  onOpenWorkflow,
  onStartAssistantWithWorkflow,
  onTriggerPageNarration,
  selectedLanguage
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAppDetail, setSelectedAppDetail] = useState<WorkflowItem | null>(null);

  // Status mapping
  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', color: 'text-[#C87A4B] bg-[#C87A4B]/10 border-[#C87A4B]/30' };
      case 'pending_verification':
      case 'awaiting_documents':
        return { label: 'Awaiting Documents', color: 'text-[#E0A364] bg-[#E0A364]/10 border-[#E0A364]/30' };
      case 'ready_for_review':
        return { label: 'Ready for Review', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
      case 'completed':
      case 'submitted':
        return { label: 'Submitted (Pending Processing)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      default:
        return { label: 'Draft', color: 'text-[#A89F91] bg-[#A89F91]/10 border-[#A89F91]/20' };
    }
  };

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedStatusFilter === 'all') return matchesSearch;
    if (selectedStatusFilter === 'in_progress') return matchesSearch && wf.status === 'in_progress';
    if (selectedStatusFilter === 'pending') return matchesSearch && (wf.status === 'pending_verification' || wf.status === 'awaiting_documents');
    if (selectedStatusFilter === 'completed') return matchesSearch && (wf.status === 'completed' || wf.status === 'submitted');
    return matchesSearch;
  });

  const handleTriggerNarration = () => {
    const count = workflows.length;
    const topWf = workflows[0];
    let narration = '';

    if (selectedLanguage === 'hi') {
      narration = `आपके पास कुल ${count} सक्रिय आवेदन हैं। पोस्ट-मैट्रिक छात्रवृत्ति 60 प्रतिशत पूरी हो चुकी है और सत्यापन के अधीन है। क्या आप इसके लंबित चरणों की समीक्षा करना चाहते हैं?`;
    } else if (selectedLanguage === 'te') {
      narration = `మీ వద్ద ప్రస్తుతం ${count} దరఖాస్తులు ఉన్నాయి. పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ పథకం 60 శాతం పూర్తయింది. మిగిలిన దశలను పూర్తి చేయడంలో సహాయం కావాలా?`;
    } else {
      narration = `You currently have ${count} active welfare applications in your registry. Your ${topWf ? topWf.title : 'Post-Matric Scholarship'} is at ${topWf ? topWf.progress : 60} percent progress under active verification. Would you like me to walk you through the remaining steps?`;
    }

    onTriggerPageNarration(narration);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 select-none text-[#F5EFE6]">
      
      {/* Header & Contextual Narration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87A4B] font-sans">
            Citizen Registry &amp; Applications
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
            Active Applications
          </h1>
          <p className="text-xs sm:text-sm text-[#A89F91] mt-1 font-light">
            Track administrative stages, completed milestones, pending steps, and deadlines with voice assistance.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleTriggerNarration}
            className="px-3.5 py-2 rounded-xl bg-[#1A1816] hover:bg-[#23201C] border border-[#C87A4B]/40 text-[#FAF6F0] text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:border-[#C87A4B]"
            title="Listen to human narration of your application status"
          >
            <Volume2 className="w-4 h-4 text-[#C87A4B] animate-pulse" />
            <span>Listen &amp; Explain</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg bg-[#141311] border border-[#F5EFE6]/8 text-xs font-mono text-[#C87A4B]">
            {workflows.length} Registered
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All (${workflows.length})` },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'pending', label: 'Awaiting Documents' },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatusFilter === tab.id
                  ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                  : 'bg-[#141311] border border-[#F5EFE6]/7 text-[#A89F91] hover:text-[#FAF6F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89F91]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-9 pr-3 py-2 bg-[#141311] border border-[#F5EFE6]/8 rounded-xl text-xs text-[#FAF6F0] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#C87A4B]"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredWorkflows.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-2">
            <AlertCircle className="w-8 h-8 text-[#A89F91] mx-auto opacity-50" />
            <h3 className="font-editorial text-lg font-bold text-[#FAF6F0]">No applications found</h3>
            <p className="text-xs text-[#A89F91] font-light">
              Clear the search filter or explore services to initiate a new application.
            </p>
          </div>
        ) : (
          filteredWorkflows.map((wf) => {
            const completedDocs = wf.requiredDocuments.filter((d) => d.submitted).length;
            const totalDocs = wf.requiredDocuments.length;
            const statusInfo = getStatusBadge(wf.status);

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
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="font-mono text-[#C87A4B] font-semibold uppercase text-[10px]">
                      ID: {wf.id.toUpperCase()}
                    </span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className="text-[#A89F91]">{wf.department}</span>
                    <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <h3 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                    {title}
                  </h3>

                  <p className="text-xs text-[#A89F91] line-clamp-2 max-w-xl font-light">
                    {wf.description}
                  </p>

                  {/* Progress Line */}
                  <div className="pt-1 w-full max-w-md">
                    <div className="flex justify-between text-[11px] text-[#A89F91] mb-1">
                      <span>Fulfillment Progress</span>
                      <span className="font-mono text-[#C87A4B] font-semibold">{wf.progress}%</span>
                    </div>
                    <div className="w-full bg-[#0D0D0C] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C87A4B] h-full rounded-full transition-all duration-500"
                        style={{ width: `${wf.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="pt-1 flex flex-wrap items-center gap-5 text-xs text-[#A89F91]">
                    <span>Documents: <strong className="text-[#FAF6F0] font-mono">{completedDocs}/{totalDocs}</strong></span>
                    <span>Deadline: <strong className="text-[#FAF6F0] font-mono">{wf.deadline}</strong></span>
                    <span>Created: <strong className="text-[#FAF6F0] font-mono">{wf.createdAt || '2026-10-15'}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                  <button
                    onClick={() => onStartAssistantWithWorkflow(wf.id, selectedLanguage)}
                    className="px-4 py-2.5 text-xs font-semibold text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Speak to Assist</span>
                  </button>

                  <button
                    onClick={() => setSelectedAppDetail(wf)}
                    className="px-4 py-2.5 text-xs font-medium text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
                  >
                    View Progress
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Application Progress Detail Modal */}
      {selectedAppDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-[#141311] border border-[#F5EFE6]/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F5EFE6] space-y-6 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F5EFE6]/7">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#A89F91]">
                  <span className="font-mono text-[#C87A4B]">{selectedAppDetail.id.toUpperCase()}</span>
                  <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                  <span>{selectedAppDetail.department}</span>
                </div>
                <h2 className="font-editorial text-2xl font-bold text-[#FAF6F0] tracking-tight">
                  {selectedAppDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAppDetail(null)}
                className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar & Stage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#A89F91]">
                <span>Overall Completion</span>
                <span className="font-mono text-[#C87A4B] font-semibold">{selectedAppDetail.progress}%</span>
              </div>
              <div className="w-full bg-[#0D0D0C] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C87A4B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedAppDetail.progress}%` }}
                />
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C87A4B]">
                Prerequisites &amp; Attestations
              </h3>
              <div className="space-y-2">
                {selectedAppDetail.requiredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {doc.submitted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#C87A4B]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#E0A364]" />
                      )}
                      <span className={doc.submitted ? 'text-[#FAF6F0]' : 'text-[#A89F91]'}>
                        {doc.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#A89F91]">
                      {doc.submitted ? 'Submitted' : 'Pending Verification'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Collected Fields if any */}
            {selectedAppDetail.fields && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A89F91]">
                  Recorded Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedAppDetail.fields).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
                      <span className="text-[10px] text-[#A89F91] block capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-semibold text-[#FAF6F0] block truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory Disclaimer */}
            <div className="p-3.5 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/8 text-[11px] text-[#A89F91] leading-relaxed">
              <span className="font-semibold text-[#E0A364] block mb-0.5">Government Portal Execution</span>
              VoiceBridge AI assists with document readiness, eligibility audits, and pre-filling. Final legal submission and OTP authentication must be executed on the official departmental portal.
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#F5EFE6]/7 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  const id = selectedAppDetail.id;
                  setSelectedAppDetail(null);
                  onOpenWorkflow(id);
                }}
                className="px-4 py-2 text-xs font-medium text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
              >
                Go to Workflow Pathway
              </button>

              <button
                onClick={() => {
                  const id = selectedAppDetail.id;
                  setSelectedAppDetail(null);
                  onStartAssistantWithWorkflow(id, selectedLanguage);
                }}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Mic className="w-4 h-4" />
                <span>Resume with Voice AI</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
