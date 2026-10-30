export type SupportedLanguage = 'en' | 'hi' | 'te';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechLocale: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLocale: 'hi-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLocale: 'te-IN' }
];

export interface RequiredDocument {
  id: string;
  name: string;
  name_hi: string;
  name_te: string;
  submitted: boolean;
}

export interface TaskStep {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export type ServiceCategory =
  | 'education'
  | 'government'
  | 'healthcare'
  | 'finance'
  | 'jobs'
  | 'travel'
  | 'legal'
  | 'business'
  | 'tech'
  | 'everyday_life';

export interface WorkflowIntelligence {
  detectedIntent: string;
  requiresWorkflow: boolean;
  category?: string;
  objective: string;
  collectedInfo: Record<string, string>;
  missingInfo: string[];
  tasks: TaskStep[];
  progress: number;
  nextRecommendedAction: string;
  safetyDisclaimer?: string;
}

export interface WorkflowItem {
  id: string;
  category: string;
  title: string;
  title_hi: string;
  title_te: string;
  department: string;
  description: string;
  description_hi: string;
  description_te: string;
  deadline: string;
  status: 'draft' | 'in_progress' | 'pending_verification' | 'completed';
  progress: number;
  requiredDocuments: RequiredDocument[];
  tasks?: TaskStep[];
  fields?: Record<string, any>;
  isDynamic?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  language: SupportedLanguage;
  timestamp: string;
  audioPlaying?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  date: string;
  language: SupportedLanguage;
  durationSeconds: number;
  workflowId?: string;
  messages: ChatMessage[];
  summary: string;
  intelligence?: WorkflowIntelligence;
}

export interface IntegrationStatus {
  status: string;
  bolna: {
    configured: boolean;
    agentId: string | null;
    mode: 'bolna_cloud_ready' | 'browser_speech_engine';
    provider: string;
  };
  supabase: {
    configured: boolean;
    mode: 'cloud_supabase_ready' | 'in_memory_persistence';
    provider: string;
  };
  gemini: {
    configured: boolean;
    model?: string;
    models?: Record<string, any>;
    provider: string;
  };
}
