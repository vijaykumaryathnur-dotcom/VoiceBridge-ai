import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTarget } from './components/Sidebar';
import { ContextWorkflowPanel } from './components/ContextWorkflowPanel';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ExploreServicesView } from './components/ExploreServicesView';
import { WorkflowCenter } from './components/WorkflowCenter';
import { ApplicationsView } from './components/ApplicationsView';
import { DocumentsView } from './components/DocumentsView';
import { HistoryView } from './components/HistoryView';
import { GeminiChatbot } from './components/GeminiChatbot';
import { AudioTranscriber } from './components/AudioTranscriber';
import { IntegrationsModal } from './components/IntegrationsModal';
import { TranscriptModal } from './components/TranscriptModal';
import { GlobalVoiceDock } from './components/GlobalVoiceDock';
import {
  WorkflowItem,
  ConversationSession,
  SupportedLanguage,
  IntegrationStatus,
  ChatMessage,
  WorkflowIntelligence,
  UserUploadedDocument
} from './types';
import { fetchIntegrationStatus, fetchWorkflows, toggleWorkflowDocument, createDynamicWorkflow } from './services/api';
import { convertIntelligenceToWorkflow } from './services/workflowEngine';
import { Menu, PanelRight, Mic, Sparkles } from 'lucide-react';

const INITIAL_CONVERSATIONS: ConversationSession[] = [
  {
    id: 'convo-101',
    title: 'Post-Matric Scholarship Income Criteria',
    date: 'Today, 10:45 AM',
    language: 'hi',
    durationSeconds: 145,
    workflowId: 'wf-scholarship-1',
    summary: 'नागरिक ने पोस्ट-मैट्रिक छात्रवृत्ति के लिए 2.5 लाख की आय सीमा और आवश्यक जाति प्रमाण पत्र के बारे में पूछा।',
    messages: [
      {
        id: 'c1-1',
        sender: 'user',
        text: 'नमस्ते, पोस्ट-मैट्रिक स्कॉलरशिप के लिए पारिवारिक आय की क्या सीमा है?',
        language: 'hi',
        timestamp: '10:45 AM'
      },
      {
        id: 'c1-2',
        sender: 'assistant',
        text: 'नमस्ते! पोस्ट-मैट्रिक छात्रवृत्ति के लिए आपकी पारिवारिक वार्षिक आय ₹2.5 लाख से कम होनी चाहिए। इसके लिए आपको तहसीलदार द्वारा जारी वैध आय प्रमाण पत्र संलग्न करना होगा।',
        language: 'hi',
        timestamp: '10:45 AM'
      },
      {
        id: 'c1-3',
        sender: 'user',
        text: 'और बैंक खाता आधार से लिंक होना जरूरी है?',
        language: 'hi',
        timestamp: '10:46 AM'
      },
      {
        id: 'c1-4',
        sender: 'assistant',
        text: 'हाँ, बिल्कुल। डीबीटी (प्रत्यक्ष लाभ अंतरण) के माध्यम से छात्रवृत्ति प्राप्त करने के लिए बैंक खाते का आधार से सक्रिय रूप से सीड होना अनिवार्य है।',
        language: 'hi',
        timestamp: '10:46 AM'
      }
    ]
  },
  {
    id: 'convo-102',
    title: 'ఆయుష్మాన్ భారత్ ఆసుపత్రి చికిత్స వివరాలు',
    date: 'Yesterday, 4:15 PM',
    language: 'te',
    durationSeconds: 190,
    workflowId: 'wf-health-1',
    summary: 'ఆయుష్మాన్ భారత్ పీఎం-జేఏవై కింద వార్షిక ₹5 లక్షల నగదు రహిత చికిత్స మరియు ఆభా కార్డు జనరేషన్ గురించి చర్చించారు.',
    messages: [
      {
        id: 'c2-1',
        sender: 'user',
        text: 'ఆయుష్మాన్ భారత్ కార్డు ఉంటే ప్రైవేట్ ఆసుపత్రిలో కూడా ఉచితంగా వైద్యం అందుతుందా?',
        language: 'te',
        timestamp: '4:15 PM'
      },
      {
        id: 'c2-2',
        sender: 'assistant',
        text: 'అవును, పీఎం-జేఏవై పథకంలో నమోదైన అన్ని ప్రభుత్వ మరియు ప్రైవేట్ ఎంప్యానెల్డ్ ఆసుపత్రులలో కుటుంబానికి సంవత్సరానికి ₹5 లక్షల వరకు నగదు రహిత చికిత్స లభిస్తుంది.',
        language: 'te',
        timestamp: '4:16 PM'
      }
    ]
  },
  {
    id: 'convo-103',
    title: 'Smart Ration Card Verification Guidelines',
    date: 'Oct 28, 2026',
    language: 'en',
    durationSeconds: 110,
    workflowId: 'wf-public-1',
    summary: 'Clarified residence address documentation and biometric e-KYC requirement for fair price shop renewals.',
    messages: [
      {
        id: 'c3-1',
        sender: 'user',
        text: 'What electricity bill date is accepted for ration card address proof?',
        language: 'en',
        timestamp: '2:10 PM'
      },
      {
        id: 'c3-2',
        sender: 'assistant',
        text: 'The utility bill should have been issued within the last 3 months and must clearly show the consumer address matching the ration card head of family name.',
        language: 'en',
        timestamp: '2:11 PM'
      }
    ]
  }
];

const INITIAL_DOCUMENTS: UserUploadedDocument[] = [
  {
    id: 'doc-seed-1',
    name: 'Aadhaar_Card_Masked_FrontBack.pdf',
    category: 'identity',
    fileType: 'application/pdf',
    fileSizeFormatted: '1.4 MB',
    uploadedAt: 'Today, 9:30 AM',
    status: 'verified',
    dataUrl: '',
    linkedWorkflowIds: ['wf-scholarship-1', 'wf-health-1', 'wf-public-1']
  },
  {
    id: 'doc-seed-2',
    name: 'Tehsildar_Income_Certificate_2026.pdf',
    category: 'income',
    fileType: 'application/pdf',
    fileSizeFormatted: '820 KB',
    uploadedAt: 'Yesterday, 3:15 PM',
    status: 'uploaded',
    dataUrl: '',
    linkedWorkflowIds: ['wf-scholarship-1']
  },
  {
    id: 'doc-seed-3',
    name: 'Electricity_Bill_Latest_AddressProof.jpg',
    category: 'residence',
    fileType: 'image/jpeg',
    fileSizeFormatted: '640 KB',
    uploadedAt: 'Oct 28, 2026',
    status: 'uploaded',
    dataUrl: '',
    linkedWorkflowIds: ['wf-public-1']
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<NavigationTarget>('assistant');
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('wf-scholarship-1');
  const [isContextPanelOpen, setIsContextPanelOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [recentConversations, setRecentConversations] = useState<ConversationSession[]>(() => {
    try {
      const saved = localStorage.getItem('voicebridge_conversations_redesign');
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UserUploadedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('voicebridge_uploaded_docs');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [globalNarrationText, setGlobalNarrationText] = useState<string | null>(null);

  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState<boolean>(false);
  const [activeTranscriptConvo, setActiveTranscriptConvo] = useState<ConversationSession | null>(null);

  // Notification Toast
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [currentVoiceMessages, setCurrentVoiceMessages] = useState<ChatMessage[]>([]);
  const [currentWorkflowIntelligence, setCurrentWorkflowIntelligence] = useState<WorkflowIntelligence | null>(null);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadStatus();
    loadWorkflowsData();
  }, []);

  const loadStatus = async () => {
    const status = await fetchIntegrationStatus();
    setIntegrationStatus(status);
  };

  const loadWorkflowsData = async () => {
    const data = await fetchWorkflows();
    if (data && data.length > 0) {
      setWorkflows(data);
    }
  };

  const handleToggleDocument = async (wfId: string, docId: string, current: boolean) => {
    try {
      const updated = await toggleWorkflowDocument(wfId, docId, !current);
      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    } catch (err) {
      console.warn('Local toggle fallback:', err);
      setWorkflows(prev => prev.map(w => {
        if (w.id !== wfId) return w;
        const docs = w.requiredDocuments.map(d => d.id === docId ? { ...d, submitted: !current } : d);
        const comp = docs.filter(d => d.submitted).length;
        const progress = Math.round((comp / docs.length) * 100);
        return { ...w, requiredDocuments: docs, progress };
      }));
    }
  };

  const handleUploadDocument = (doc: UserUploadedDocument) => {
    const updated = [doc, ...uploadedDocuments];
    setUploadedDocuments(updated);
    try {
      localStorage.setItem('voicebridge_uploaded_docs', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write notice:', e);
    }
    setSaveToast(`Document "${doc.name}" saved to your Secure Vault.`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = uploadedDocuments.filter(d => d.id !== docId);
    setUploadedDocuments(updated);
    try {
      localStorage.setItem('voicebridge_uploaded_docs', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write notice:', e);
    }
    setSaveToast('Document deleted from vault.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteConversation = (convoId: string) => {
    const updated = recentConversations.filter(c => c.id !== convoId);
    setRecentConversations(updated);
    try {
      localStorage.setItem('voicebridge_conversations_redesign', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write notice:', e);
    }
    setSaveToast('Consultation removed from history.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleTriggerPageNarration = (text: string) => {
    setGlobalNarrationText(text);
  };

  const handleStartVoice = (wfId?: string, lang?: SupportedLanguage) => {
    if (wfId) setActiveWorkflowId(wfId);
    else setActiveWorkflowId('');
    if (lang) setSelectedLanguage(lang);
    setAssistantInitialPrompt(undefined);
    setCurrentView('assistant');
  };

  const handleStartVoiceWithPrompt = (prompt: string, lang?: SupportedLanguage, wfId?: string) => {
    if (wfId) setActiveWorkflowId(wfId);
    else setActiveWorkflowId('');
    if (lang) setSelectedLanguage(lang);
    setAssistantInitialPrompt(prompt);
    setCurrentView('assistant');
  };

  const handleToggleTask = (taskId: string) => {
    if (!currentWorkflowIntelligence) return;
    const updatedTasks = currentWorkflowIntelligence.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);
    setCurrentWorkflowIntelligence({
      ...currentWorkflowIntelligence,
      tasks: updatedTasks,
      progress
    });
  };

  const handleSaveDynamicWorkflow = async () => {
    if (!currentWorkflowIntelligence) return;
    const newWorkflow = convertIntelligenceToWorkflow(currentWorkflowIntelligence, selectedLanguage);
    const saved = await createDynamicWorkflow(newWorkflow);
    setWorkflows(prev => [saved, ...prev]);
    setActiveWorkflowId(saved.id);
    setSaveToast(`Workflow "${saved.title}" saved to your tracked applications.`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleEndConversation = (sessionData: {
    language: SupportedLanguage;
    workflowId?: string;
    messages: ChatMessage[];
    durationSeconds: number;
    title: string;
  }) => {
    const newSession: ConversationSession = {
      id: `convo-${Date.now()}`,
      title: sessionData.title,
      date: 'Just now',
      language: sessionData.language,
      durationSeconds: sessionData.durationSeconds,
      workflowId: sessionData.workflowId,
      messages: sessionData.messages,
      summary: sessionData.messages[sessionData.messages.length - 1]?.text || 'Voice session completed.'
    };

    const updatedList = [newSession, ...recentConversations];
    setRecentConversations(updatedList);
    try {
      localStorage.setItem('voicebridge_conversations_redesign', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Storage write notice:', e);
    }

    setSaveToast('Voice conversation saved to your session records.');
    setTimeout(() => setSaveToast(null), 3500);
    setCurrentView('dashboard');
  };

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0] || null;

  // Compute Page Info for Global Dock
  const getPageInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Citizen Portal & Dashboard',
          summary: `${workflows.length} active applications, ${uploadedDocuments.length} documents in vault, ${recentConversations.length} consultations.`
        };
      case 'applications':
        return {
          title: 'Active Applications & Milestones',
          summary: `${workflows.length} public applications being tracked with official portals.`
        };
      case 'documents':
        return {
          title: 'Documents Vault & Attestation',
          summary: `${uploadedDocuments.length} documents stored (${uploadedDocuments.filter(d => d.status === 'verified').length} verified, ${uploadedDocuments.filter(d => d.status === 'uploaded').length} pending review).`
        };
      case 'workflows':
        return {
          title: 'Welfare Workflows Directory',
          summary: `${workflows.length} active service guides and prerequisites.`
        };
      case 'services':
        return {
          title: 'Capabilities & Services Discovery',
          summary: '10 civic and open-ended assistance domains available.'
        };
      case 'history':
        return {
          title: 'Consultation Transcripts & Audio',
          summary: `${recentConversations.length} recorded voice inquiries.`
        };
      case 'assistant':
        return {
          title: 'Voice Assistant Interactive Session',
          summary: activeWorkflow ? `Guided session on ${activeWorkflow.title}` : 'Open-ended voice consultation'
        };
      default:
        return {
          title: 'VoiceBridge AI',
          summary: 'Multilingual voice assistant for public welfare and civic services.'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0D0D0C] text-[#F5EFE6] font-sans selection:bg-[#C87A4B]/30 selection:text-[#E0A364]">
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={(lang) => setSelectedLanguage(lang)}
        onOpenSettings={() => setIsIntegrationsModalOpen(true)}
        integrationStatus={integrationStatus}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Spacious Central Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0D0C] relative">
        
        {/* Mobile & Tablet Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#121110] border-b border-[#F5EFE6]/7 shrink-0 z-20">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-[#A89F91] hover:text-[#F5EFE6] rounded-lg cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-editorial text-base font-bold text-[#F5EFE6]">VoiceBridge AI</span>
          </div>

          <button
            onClick={() => setCurrentView('assistant')}
            className="px-3 py-1.5 text-xs font-semibold text-[#0D0D0C] bg-[#C87A4B] rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Speak</span>
          </button>
        </header>

        {/* Desktop Context Panel Toggle Button (Top Right of Workspace) */}
        <div className="hidden lg:flex items-center justify-end px-6 pt-3 shrink-0">
          <button
            onClick={() => setIsContextPanelOpen(!isContextPanelOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isContextPanelOpen
                ? 'bg-[#1A1816] border-[#C87A4B]/30 text-[#E0A364]'
                : 'bg-[#141311] border-[#F5EFE6]/7 text-[#A89F91] hover:text-[#F5EFE6]'
            }`}
            title="Toggle Contextual Scheme Panel"
          >
            <PanelRight className="w-3.5 h-3.5 text-[#C87A4B]" />
            <span>{isContextPanelOpen ? 'Hide Scheme Context' : 'Show Scheme Context'}</span>
          </button>
        </div>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto flex flex-col pb-24">
          {currentView === 'landing' && (
            <LandingPage
              onStartAssistant={(lang, wfId) => handleStartVoice(wfId, lang)}
              onExploreWorkflows={() => setCurrentView('services')}
            />
          )}

          {currentView === 'services' && (
            <ExploreServicesView
              onStartWithPrompt={(prompt, lang) => handleStartVoiceWithPrompt(prompt, lang)}
              selectedLanguage={selectedLanguage}
              onTriggerPageNarration={handleTriggerPageNarration}
            />
          )}

          {currentView === 'assistant' && (
            <VoiceAssistant
              initialLanguage={selectedLanguage}
              initialWorkflowId={activeWorkflowId}
              initialPrompt={assistantInitialPrompt}
              workflows={workflows}
              integrationStatus={integrationStatus}
              onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
              onOpenTranscriber={() => setCurrentView('transcribe')}
              onOpenChatAdvisor={() => setCurrentView('chat')}
              onSelectWorkflowContext={(wf) => setActiveWorkflowId(wf ? wf.id : '')}
              onMessagesChange={setCurrentVoiceMessages}
              onIntelligenceChange={setCurrentWorkflowIntelligence}
              onEndConversation={handleEndConversation}
            />
          )}

          {currentView === 'dashboard' && (
            <Dashboard
              workflows={workflows}
              recentConversations={recentConversations}
              uploadedDocumentsCount={uploadedDocuments.length}
              onStartConversation={(lang, wfId) => handleStartVoice(wfId, lang)}
              onOpenWorkflow={(wfId) => {
                setActiveWorkflowId(wfId);
                setCurrentView('workflows');
              }}
              onSelectConversation={(convo) => setActiveTranscriptConvo(convo)}
              onTriggerPageNarration={handleTriggerPageNarration}
              selectedLanguage={selectedLanguage}
            />
          )}

          {currentView === 'workflows' && (
            <WorkflowCenter
              workflows={workflows}
              onUpdateWorkflow={(up) => setWorkflows(prev => prev.map(w => w.id === up.id ? up : w))}
              onStartAssistantWithWorkflow={(wfId, lang) => handleStartVoice(wfId, lang)}
              onTriggerPageNarration={handleTriggerPageNarration}
              selectedLanguage={selectedLanguage}
            />
          )}

          {currentView === 'applications' && (
            <ApplicationsView
              workflows={workflows}
              onOpenWorkflow={(id) => {
                setActiveWorkflowId(id);
                setCurrentView('workflows');
              }}
              onStartAssistantWithWorkflow={(id, lang) => handleStartVoice(id, lang)}
              selectedLanguage={selectedLanguage}
              onTriggerPageNarration={handleTriggerPageNarration}
            />
          )}

          {currentView === 'documents' && (
            <DocumentsView
              workflows={workflows}
              uploadedDocuments={uploadedDocuments}
              onUploadDocument={handleUploadDocument}
              onDeleteDocument={handleDeleteDocument}
              onToggleDocument={handleToggleDocument}
              onStartAssistantWithWorkflow={(id, lang) => handleStartVoice(id, lang)}
              selectedLanguage={selectedLanguage}
              onTriggerPageNarration={handleTriggerPageNarration}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              conversations={recentConversations}
              onSelectConversation={(convo) => setActiveTranscriptConvo(convo)}
              onStartNewConversation={(lang) => handleStartVoice(undefined, lang)}
              onDeleteConversation={handleDeleteConversation}
              onTriggerPageNarration={handleTriggerPageNarration}
              selectedLanguage={selectedLanguage}
            />
          )}

          {currentView === 'chat' && (
            <GeminiChatbot
              workflows={workflows}
              initialWorkflowId={activeWorkflowId}
              onNavigateToVoice={(lang, wfId) => handleStartVoice(wfId, lang)}
            />
          )}

          {currentView === 'transcribe' && (
            <AudioTranscriber
              onSendToChat={(_txt) => setCurrentView('chat')}
              onSendToAssistant={(txt, lang) => handleStartVoice(undefined, lang)}
            />
          )}
        </main>
      </div>

      {/* 3. Contextual Right-Side Panel for Active Workflows */}
      {isContextPanelOpen && (
        <div className="hidden lg:block shrink-0">
          <ContextWorkflowPanel
            workflow={activeWorkflow}
            intelligence={currentWorkflowIntelligence}
            conversationMessages={currentVoiceMessages}
            isOpen={isContextPanelOpen}
            onClose={() => setIsContextPanelOpen(false)}
            onToggleDocument={(docId, curr) => {
              if (activeWorkflow) handleToggleDocument(activeWorkflow.id, docId, curr);
            }}
            onToggleTask={handleToggleTask}
            onSaveDynamicWorkflow={
              currentWorkflowIntelligence?.requiresWorkflow ? handleSaveDynamicWorkflow : undefined
            }
            onStartVoiceAssistant={(wfId, lang) => handleStartVoice(wfId, lang)}
            selectedLanguage={selectedLanguage}
          />
        </div>
      )}

      {/* 4. Global Persistent Voice Assistant Dock across all views */}
      <GlobalVoiceDock
        currentPage={currentView}
        pageTitle={pageInfo.title}
        pageDataSummary={pageInfo.summary}
        currentLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        externalNarrationText={globalNarrationText}
        onClearNarration={() => setGlobalNarrationText(null)}
        onNavigate={(target: string) => setCurrentView(target as NavigationTarget)}
      />

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-2.5 rounded-xl bg-[#181614] border border-[#C87A4B]/60 text-[#F5EFE6] text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#C87A4B]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Integrations & Voice Settings Modal */}
      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        status={integrationStatus}
        onRefresh={loadStatus}
        selectedLanguage={selectedLanguage}
      />

      {/* Transcript Modal */}
      <TranscriptModal
        conversation={activeTranscriptConvo}
        onClose={() => setActiveTranscriptConvo(null)}
      />

    </div>
  );
}
