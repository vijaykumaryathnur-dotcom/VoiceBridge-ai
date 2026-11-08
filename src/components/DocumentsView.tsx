import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  CheckSquare,
  Square,
  FileText,
  AlertCircle,
  Mic,
  ArrowRight,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Volume2,
  FileUp,
  X
} from 'lucide-react';
import {
  WorkflowItem,
  SupportedLanguage,
  DocumentCategory,
  UserUploadedDocument
} from '../types';

interface DocumentsViewProps {
  workflows: WorkflowItem[];
  uploadedDocuments: UserUploadedDocument[];
  onUploadDocument: (doc: UserUploadedDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleDocument: (wfId: string, docId: string, current: boolean) => void;
  onStartAssistantWithWorkflow: (wfId: string, lang: SupportedLanguage) => void;
  onTriggerPageNarration: (narrationText: string) => void;
  selectedLanguage: SupportedLanguage;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  workflows,
  uploadedDocuments,
  onUploadDocument,
  onDeleteDocument,
  onToggleDocument,
  onStartAssistantWithWorkflow,
  onTriggerPageNarration,
  selectedLanguage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<UserUploadedDocument | null>(null);
  const [uploadWorkflowId, setUploadWorkflowId] = useState<string>('wf-scholarship-1');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('identity');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive workflow checklist documents
  const workflowDocs = workflows.flatMap(wf =>
    wf.requiredDocuments.map(doc => {
      let cat: DocumentCategory = 'identity';
      const nameLower = doc.name.toLowerCase();
      if (nameLower.includes('income') || nameLower.includes('आय') || nameLower.includes('ఆదాయ')) cat = 'income';
      else if (nameLower.includes('bill') || nameLower.includes('residence') || nameLower.includes('बिजली')) cat = 'residence';
      else if (nameLower.includes('marks') || nameLower.includes('academic') || nameLower.includes('अंक')) cat = 'education';

      return {
        ...doc,
        workflowId: wf.id,
        workflowTitle: wf.title,
        category: cat
      };
    })
  );

  const verifiedCount = workflowDocs.filter(d => d.submitted).length;
  const pendingCount = workflowDocs.length - verifiedCount;

  // Filter both uploaded and scheme documents
  const filteredSchemeDocs = workflowDocs.filter(d => {
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.workflowTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredUserUploads = uploadedDocuments.filter(d => {
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Please upload a valid PDF, JPG, JPEG, or PNG document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newDoc: UserUploadedDocument = {
        id: `upload-${Date.now()}`,
        name: file.name,
        category: uploadCategory,
        fileType: file.type.includes('pdf') ? 'PDF' : file.type.includes('png') ? 'PNG' : 'JPEG',
        fileSize: file.size,
        uploadedAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        verificationStatus: 'pending_verification', // Strictly truthful: never claim verified until official check
        associatedWorkflowId: uploadWorkflowId
      };
      onUploadDocument(newDoc);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (doc: UserUploadedDocument) => {
    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.name;
      a.click();
    } else {
      // Mock download representation
      const blob = new Blob([`VoiceBridge AI Document: ${doc.name}\nUploaded: ${doc.uploadedAt}`], {
        type: 'text/plain;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleTriggerNarration = () => {
    const missingItems = workflowDocs.filter(d => !d.submitted).map(d => d.name);
    let narration = '';
    if (selectedLanguage === 'hi') {
      narration = `मैंने आपकी दस्तावेज़ सूची की समीक्षा की है। आपके पास ${verifiedCount} सत्यापित दस्तावेज़ हैं, लेकिन ${missingItems.slice(0, 2).join(' और ')} अभी सत्यापन के लिए आवश्यक हैं। क्या आप जानना चाहते हैं कि नया आय प्रमाण पत्र कैसे प्राप्त करें?`;
    } else if (selectedLanguage === 'te') {
      narration = `నేను మీ ధ్రువపత్రాల జాబితాను పరిశీలించాను. మీ వద్ద ${verifiedCount} సమర్పించబడిన పత్రాలు ఉన్నాయి. అయితే ${missingItems.slice(0, 2).join(' మరియు ')} ఇంకా అవసరం. వీటిని సమర్పించడంలో సహాయం కావాలా?`;
    } else {
      narration = `I have inspected your document vault. You have ${verifiedCount} verified documents, but your ${missingItems.slice(0, 2).join(' and ')} are still required for submission. Let me know if you would like guidance on obtaining them.`;
    }
    onTriggerPageNarration(narration);
  };

  const categoriesList = [
    { id: 'all', label: 'All Documents' },
    { id: 'identity', label: 'Identity Proofs' },
    { id: 'income', label: 'Income Certificates' },
    { id: 'residence', label: 'Residence & Bills' },
    { id: 'education', label: 'Academic Records' },
    { id: 'other', label: 'Other Attestations' }
  ];

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 select-none text-[#F5EFE6]">
      
      {/* Header & Contextual Spoken Narration Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87A4B] font-sans">
            Citizen Documentation Vault
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] mt-1 tracking-tight">
            Documents Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#A89F91] mt-1 font-light">
            Manage required identity, income, and residence proofs with drag-and-drop upload and voice guidance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Spoken Narration Trigger */}
          <button
            onClick={handleTriggerNarration}
            className="px-3.5 py-2 rounded-xl bg-[#1A1816] hover:bg-[#23201C] border border-[#C87A4B]/40 text-[#FAF6F0] text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:border-[#C87A4B]"
            title="Listen to human explanation of your documents status"
          >
            <Volume2 className="w-4 h-4 text-[#C87A4B] animate-pulse" />
            <span>Listen &amp; Explain</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-[#141311] border border-[#F5EFE6]/8 text-[#C87A4B]">
              {verifiedCount} Verified
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#141311] border border-[#F5EFE6]/8 text-[#E0A364]">
              {pendingCount} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Drag & Drop File Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer ${
          isDragging
            ? 'bg-[#1A1816] border-[#C87A4B] scale-[1.01]'
            : 'bg-[#141311] border-[#F5EFE6]/10 hover:border-[#C87A4B]/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-[#1A1816] border border-[#C87A4B]/30 text-[#C87A4B] flex items-center justify-center shadow-inner">
          <FileUp className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#FAF6F0]">
            Drag &amp; drop document, or <span className="text-[#C87A4B] underline underline-offset-4">browse files</span>
          </p>
          <p className="text-xs text-[#A89F91] font-light">
            Supports PDF, JPG, JPEG, and PNG formats up to 15 MB.
          </p>
        </div>

        {/* Upload Association Controls */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs"
        >
          <div className="flex items-center gap-1.5 bg-[#0D0D0C] px-3 py-1.5 rounded-xl border border-[#F5EFE6]/8">
            <span className="text-[#A89F91]">Category:</span>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="bg-transparent text-[#FAF6F0] focus:outline-none cursor-pointer"
            >
              <option value="identity" className="bg-[#141311]">Identity</option>
              <option value="income" className="bg-[#141311]">Income Proof</option>
              <option value="residence" className="bg-[#141311]">Residence Proof</option>
              <option value="education" className="bg-[#141311]">Education</option>
              <option value="other" className="bg-[#141311]">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0D0D0C] px-3 py-1.5 rounded-xl border border-[#F5EFE6]/8">
            <span className="text-[#A89F91]">Scheme:</span>
            <select
              value={uploadWorkflowId}
              onChange={(e) => setUploadWorkflowId(e.target.value)}
              className="bg-transparent text-[#FAF6F0] focus:outline-none cursor-pointer"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id} className="bg-[#141311]">
                  {wf.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                  : 'bg-[#141311] border border-[#F5EFE6]/7 text-[#A89F91] hover:text-[#FAF6F0]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89F91]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 bg-[#141311] border border-[#F5EFE6]/8 rounded-xl text-xs text-[#FAF6F0] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#C87A4B]"
          />
        </div>
      </div>

      {/* 1. User Uploaded Documents Section */}
      {filteredUserUploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-bold text-[#FAF6F0]">
              Citizen Uploads ({filteredUserUploads.length})
            </h2>
            <span className="text-[11px] font-mono text-[#E0A364]">
              Awaiting Official Verification
            </span>
          </div>

          <div className="divide-y divide-[#F5EFE6]/5 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 overflow-hidden">
            {filteredUserUploads.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1A1816] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D0D0C] border border-[#C87A4B]/20 text-[#C87A4B] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#FAF6F0] block">
                      {doc.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#A89F91] mt-0.5 font-light">
                      <span className="uppercase font-mono text-[10px] text-[#E0A364]">{doc.fileType}</span>
                      <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                      <span className="capitalize">{doc.category}</span>
                      <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                      <span>Uploaded {doc.uploadedAt}</span>
                      <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                      <span className="font-mono text-[10px] text-[#E0A364]">
                        Status: Pending Verification
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg bg-[#1A1816] border border-[#F5EFE6]/6 transition-colors cursor-pointer"
                    title="Preview document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg bg-[#1A1816] border border-[#F5EFE6]/6 transition-colors cursor-pointer"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-2 text-[#A89F91] hover:text-rose-400 rounded-lg bg-[#1A1816] border border-[#F5EFE6]/6 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Scheme Required Documents Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-xl font-bold text-[#FAF6F0]">
            Required Application Prerequisites ({filteredSchemeDocs.length})
          </h2>
          <span className="text-xs text-[#A89F91]">
            Tap checkbox to update submission status
          </span>
        </div>

        {filteredSchemeDocs.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-2">
            <AlertCircle className="w-8 h-8 text-[#A89F91] mx-auto opacity-50" />
            <h3 className="font-editorial text-lg font-bold text-[#FAF6F0]">No matching documents found</h3>
            <p className="text-xs text-[#A89F91] font-light">Try searching for a different name or clear category filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]/5 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 overflow-hidden">
            {filteredSchemeDocs.map((doc, idx) => {
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
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#141311] border border-[#F5EFE6]/10 rounded-2xl shadow-2xl p-6 text-[#F5EFE6] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]/7">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C87A4B]" />
                <h3 className="font-editorial text-lg font-bold text-[#FAF6F0] truncate max-w-xs">
                  {previewDoc.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6 flex flex-col items-center justify-center space-y-3 min-h-[160px]">
              {previewDoc.dataUrl && previewDoc.fileType !== 'PDF' ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-48 rounded object-contain"
                />
              ) : (
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 text-[#C87A4B] mx-auto opacity-70" />
                  <p className="text-xs font-semibold text-[#FAF6F0]">
                    {previewDoc.name}
                  </p>
                  <p className="text-[11px] text-[#A89F91] font-mono">
                    Format: {previewDoc.fileType} · Size: {previewDoc.fileSize ? (previewDoc.fileSize / 1024).toFixed(1) + ' KB' : (previewDoc.fileSizeFormatted || 'Verified')}
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs space-y-1 text-[#A89F91]">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="capitalize text-[#FAF6F0]">{previewDoc.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification State:</span>
                <span className="text-[#E0A364] font-mono">Pending Official Verification</span>
              </div>
              <div className="flex justify-between">
                <span>Upload Date:</span>
                <span className="text-[#FAF6F0] font-mono">{previewDoc.uploadedAt}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F5EFE6]/7 flex items-center justify-end gap-3">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="px-4 py-2 text-xs font-semibold text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#C87A4B]" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
