import React from 'react';
import {
  Mic,
  LayoutDashboard,
  Layers,
  FileCheck2,
  FolderOpen,
  History,
  Settings,
  Globe,
  X,
  Compass
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, IntegrationStatus } from '../types';

export type NavigationTarget =
  | 'landing'
  | 'assistant'
  | 'services'
  | 'dashboard'
  | 'workflows'
  | 'applications'
  | 'documents'
  | 'history'
  | 'chat'
  | 'transcribe'
  | 'settings';

interface SidebarProps {
  currentView: NavigationTarget;
  onNavigate: (view: NavigationTarget) => void;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenSettings: () => void;
  integrationStatus?: IntegrationStatus | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  selectedLanguage,
  onLanguageChange,
  onOpenSettings,
  integrationStatus,
  mobileOpen,
  onCloseMobile
}) => {
  // Minimal primary navigation items
  const primaryNavItems = [
    { id: 'assistant' as NavigationTarget, label: 'Voice Assistant', icon: Mic, badge: 'Hero' },
    { id: 'services' as NavigationTarget, label: 'Explore Services', icon: Compass, badge: '10 Areas' },
    { id: 'dashboard' as NavigationTarget, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workflows' as NavigationTarget, label: 'Workflows', icon: Layers },
    { id: 'applications' as NavigationTarget, label: 'Applications', icon: FileCheck2 },
    { id: 'documents' as NavigationTarget, label: 'Documents', icon: FolderOpen },
    { id: 'history' as NavigationTarget, label: 'Conversation History', icon: History }
  ];

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 bg-[#121110] border-r border-[#F5EFE6]/7 text-[#F5EFE6] select-none box-border overflow-hidden">
      
      {/* Brand & Waveform Identity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              onNavigate('assistant');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
          >
            {/* Atelier Waveform Monogram Identity */}
            <div className="w-8 h-8 rounded-lg bg-[#181614] border border-[#C87A4B]/35 flex items-center justify-center gap-0.5 px-1.5 group-hover:border-[#C87A4B] transition-colors shadow-inner">
              <span className="w-0.5 h-2 bg-[#C87A4B] rounded-full" />
              <span className="w-0.5 h-4 bg-[#E0A364] rounded-full" />
              <span className="w-0.5 h-5 bg-[#C87A4B] rounded-full" />
              <span className="w-0.5 h-3 bg-[#F5EFE6] rounded-full" />
              <span className="w-0.5 h-1.5 bg-[#C87A4B] rounded-full" />
            </div>

            <div>
              <span className="font-editorial text-lg font-bold tracking-wide text-[#F5EFE6] block leading-none">
                VoiceBridge
              </span>
              <span className="text-[9px] tracking-widest text-[#A89F91] uppercase font-sans mt-1 block">
                Midnight Atelier
              </span>
            </div>
          </button>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#A89F91] hover:text-[#F5EFE6] rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Primary Navigation Links */}
        <nav className="space-y-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1A17] text-[#F5EFE6] border-l-2 border-[#C87A4B] font-semibold shadow-sm'
                    : 'text-[#A89F91] hover:text-[#F5EFE6] hover:bg-[#161412]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#C87A4B]' : 'text-[#A89F91] group-hover:text-[#F5EFE6]'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#C87A4B]/15 text-[#C87A4B] font-sans shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Language & Settings with Robust Zero-Overflow Layout */}
      <div className="pt-4 border-t border-[#F5EFE6]/7 space-y-3 box-border w-full">
        
        {/* Language Selector: Fully Contained 3-Column Responsive Grid (No Overflow) */}
        <div className="w-full box-border rounded-xl bg-[#161412] p-2 border border-[#F5EFE6]/8 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#A89F91] tracking-wider px-0.5">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#C87A4B]" />
              <span>Language</span>
            </span>
            <span className="text-[#C87A4B] font-mono text-[9px]">
              {currentLangObj?.name}
            </span>
          </div>

          <div className="flex w-full box-border gap-1 p-0.5 bg-[#0D0D0C] rounded-lg border border-[#F5EFE6]/5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`flex-1 min-w-0 py-1.5 px-0.5 rounded-md text-[11px] font-medium transition-all text-center truncate cursor-pointer box-border ${
                  selectedLanguage === lang.code
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-bold shadow-sm'
                    : 'text-[#A89F91] hover:text-[#F5EFE6] hover:bg-[#1C1A17]'
                }`}
                title={`Switch to ${lang.name}`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Consolidated Tools & Settings Link */}
        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#A89F91] hover:text-[#F5EFE6] hover:bg-[#161412] border border-transparent hover:border-[#F5EFE6]/5 transition-colors cursor-pointer box-border"
        >
          <div className="flex items-center gap-2 truncate">
            <Settings className="w-3.5 h-3.5 text-[#A89F91] shrink-0" />
            <span className="truncate">Settings &amp; Engines</span>
          </div>
          <span className="text-[9px] text-[#C87A4B] font-mono px-1.5 py-0.5 rounded bg-[#181614] border border-[#C87A4B]/20 shrink-0">
            {integrationStatus?.bolna.configured ? 'Bolna SDK' : 'Gemini 3.8'}
          </span>
        </button>

        {/* User Workspace Profile */}
        <div className="p-2.5 rounded-xl bg-[#161412] border border-[#F5EFE6]/7 flex items-center justify-between gap-2.5 box-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#201D19] border border-[#C87A4B]/40 text-[#E0A364] font-editorial text-xs flex items-center justify-center shrink-0">
              C
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-[#F5EFE6] block truncate">
                Citizen Workspace
              </span>
              <span className="text-[10px] text-[#A89F91] block truncate">
                {currentLangObj?.name} Voice Mode
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0 z-30 box-border">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
