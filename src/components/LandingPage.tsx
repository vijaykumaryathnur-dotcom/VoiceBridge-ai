import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, ArrowRight, ShieldCheck, Globe, GraduationCap, HeartPulse, FileText, CheckCircle2 } from 'lucide-react';
import { VoiceOrb, OrbState } from './VoiceOrb';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';
import { voiceEngine } from '../services/voice';
import { sendVoiceMessage } from '../services/api';

interface LandingPageProps {
  onStartAssistant: (lang?: SupportedLanguage, workflowId?: string) => void;
  onExploreWorkflows: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAssistant,
  onExploreWorkflows
}) => {
  const [demoLanguage, setDemoLanguage] = useState<SupportedLanguage>('en');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [demoTranscript, setDemoTranscript] = useState<string>('');
  const [demoAiReply, setDemoAiReply] = useState<string>(
    'Tap the microphone or choose an inquiry below to experience natural voice assistance in your language.'
  );

  const samplePrompts: Record<SupportedLanguage, string[]> = {
    en: [
      'Help me apply for a scholarship and check eligibility.',
      'I want to study in Germany. What are the requirements?',
      'Help me prepare my resume for a technology role.',
      'Explain how student education loans and subsidies work.'
    ],
    hi: [
      'पोस्ट-मैट्रिक छात्रवृत्ति के लिए आवेदन कैसे करें?',
      'मैं जर्मनी में पढ़ाई करना चाहता हूँ। आवश्यक प्रक्रिया क्या है?',
      'सॉफ्टवेयर पद के लिए मेरा रिज्यूमे तैयार करने में मदद करें।',
      'शिक्षा ऋण और ब्याज सब्सिडी योजनाएं कैसे काम करती हैं?'
    ],
    te: [
      'పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ ఎలా దరఖాస్తు చేసుకోవాలి?',
      'నేను జర్మనీలో చదువుకోవాలనుకుంటున్నాను. అర్హతలు ఏమిటి?',
      'ఉద్యోగం కోసం నా రెజ్యూమ్ సిద్ధం చేయడానికి సహాయం చేయండి.',
      'విద్యా రుణం & వడ్డీ రాయితీ ఎలా పనిచేస్తాయి?'
    ]
  };

  const handleTestPrompt = async (promptText: string) => {
    setDemoTranscript(promptText);
    setOrbState('thinking');
    voiceEngine.cancelSpeech();

    try {
      const res = await sendVoiceMessage(promptText, demoLanguage);
      setDemoAiReply(res.reply);
      setOrbState('speaking');
      voiceEngine.speak(
        res.reply,
        demoLanguage,
        () => setOrbState('speaking'),
        () => setOrbState('idle'),
        () => setOrbState('idle')
      );
    } catch {
      setDemoAiReply('VoiceBridge is ready. Please check connection.');
      setOrbState('idle');
    }
  };

  const handleToggleDemoMic = () => {
    voiceEngine.cancelSpeech();
    onStartAssistant(demoLanguage);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0C] text-[#F5EFE6]">
      
      {/* 1. Midnight Atelier Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden">
        
        {/* Subtle Architectural Atmosphere & Copper Backdrops */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#C87A4B_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#C87A4B]/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-[400px] h-[400px] bg-[#BA6C3D]/6 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Vision & Identity */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center gap-2 text-xs font-medium text-[#E0A364] uppercase tracking-wider font-sans">
                <span>Voice-First Multilingual Access</span>
                <span aria-hidden="true" className="text-[#A89F91]/40">·</span>
                <span className="text-[#A89F91]">English · हिन्दी · తెలుగు</span>
              </div>

              {/* Exact Headline */}
              <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#FAF6F0] leading-[1.08] text-balance">
                Real Conversations. Real Access.
              </h1>

              {/* Exact Supporting Text */}
              <p className="text-base sm:text-lg text-[#A89F91] leading-relaxed max-w-xl font-sans font-light">
                Speak in your language. Get guidance, complete applications, and access the services you need.
              </p>

              {/* Prominent Action */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onStartAssistant(demoLanguage)}
                  className="px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl shadow-lg shadow-[#C87A4B]/15 transition-all duration-150 flex items-center gap-2.5 active:scale-95 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Speaking</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={onExploreWorkflows}
                  className="px-6 py-3.5 text-xs font-semibold text-[#FAF6F0] hover:text-white bg-[#141311] hover:bg-[#1A1816] border border-[#F5EFE6]/8 rounded-xl transition-colors cursor-pointer"
                >
                  <span>Explore Services (10 Areas)</span>
                </button>
              </div>

              {/* Subtle Trust Indicators */}
              <div className="pt-6 border-t border-[#F5EFE6]/7 flex flex-wrap items-center gap-6 text-xs text-[#A89F91]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C87A4B]" />
                  <span>National Scholarship Portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E0A364]" />
                  <span>Ayushman Bharat PM-JAY</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FAF6F0]" />
                  <span>Civil Records &amp; PDS</span>
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive Voice Orb Showcase */}
            <div className="lg:col-span-5">
              <div className="p-6 md:p-8 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-[radial-gradient(ellipse_at_top_right,rgba(200,122,75,0.08),transparent_70%)] pointer-events-none" />
                
                {/* Trilingual Segmented Switcher */}
                <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]/6 relative z-10">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89F91]">
                    Voice Demonstration
                  </span>
                  <div className="flex items-center gap-1 bg-[#0D0D0C] p-1 rounded-xl border border-[#F5EFE6]/6">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setDemoLanguage(lang.code);
                          voiceEngine.cancelSpeech();
                          setOrbState('idle');
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          demoLanguage === lang.code
                            ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold shadow-sm'
                            : 'text-[#A89F91] hover:text-[#FAF6F0]'
                        }`}
                      >
                        {lang.nativeName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orb interaction */}
                <div className="py-6 flex flex-col items-center justify-center relative z-10">
                  <VoiceOrb
                    state={orbState}
                    audioLevel={audioLevel}
                    onClick={handleToggleDemoMic}
                    size="md"
                  />
                  <p className="mt-3 text-xs text-[#A89F91] text-center font-sans font-light">
                    {orbState === 'listening'
                      ? 'Listening to speech... Speak clearly.'
                      : orbState === 'speaking'
                      ? 'VoiceBridge is responding with natural speech.'
                      : orbState === 'thinking'
                      ? 'Consulting official guidelines...'
                      : 'Tap orb or select an inquiry below'}
                  </p>
                </div>

                {/* Preview text */}
                <div className="p-3.5 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6 space-y-2 text-xs relative z-10">
                  {demoTranscript && (
                    <div className="flex items-start gap-2 text-[#E0A364]">
                      <span className="font-semibold text-[#C87A4B] shrink-0 font-editorial text-sm">You:</span>
                      <p className="italic leading-relaxed">{demoTranscript}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-[#FAF6F0]">
                    <span className="font-semibold text-[#E0A364] shrink-0 font-editorial text-sm">AI:</span>
                    <p className="leading-relaxed font-sans font-light">{demoAiReply}</p>
                  </div>
                </div>

                {/* Sample Prompt Chips */}
                <div className="mt-4 pt-3 border-t border-[#F5EFE6]/6 space-y-1.5 relative z-10">
                  <span className="text-[10px] text-[#A89F91] block uppercase tracking-wider font-semibold">
                    Try asking in {SUPPORTED_LANGUAGES.find(l => l.code === demoLanguage)?.nativeName}:
                  </span>
                  {samplePrompts[demoLanguage].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTestPrompt(prompt)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#1A1816] hover:bg-[#23201C] text-[#FAF6F0] text-xs transition-colors flex items-center justify-between group border border-[#F5EFE6]/5 cursor-pointer font-light"
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <ArrowRight className="w-3 h-3 text-[#A89F91] group-hover:text-[#C87A4B] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Curated Service Domains */}
      <section className="py-20 md:py-28 bg-[#141311] border-t border-[#F5EFE6]/6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl space-y-3 mb-14">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#C87A4B] font-sans">
              Human-Centered Public Access
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] tracking-tight">
              Essential services, navigated by natural voice.
            </h2>
            <p className="text-sm text-[#A89F91] leading-relaxed font-light">
              Eliminating confusing government paperwork, technical jargon, and multi-step digital forms for everyday citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Domain 1: Education */}
            <div className="space-y-4 p-6 rounded-2xl bg-[#1A1816] border border-[#F5EFE6]/7">
              <div className="w-10 h-10 rounded-xl bg-[#141311] border border-[#C87A4B]/30 text-[#C87A4B] flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                Education &amp; Scholarships
              </h3>
              <p className="text-xs text-[#A89F91] leading-relaxed font-light">
                Step-by-step guidance for National Scholarship Portal (NSP), Post-Matric scholarships, and fee reimbursements with clear income threshold checks.
              </p>
              <div className="pt-2 text-xs text-[#A89F91] font-mono">
                <span>Income limits &lt; ₹2.5L</span> · <span>Marksheet verification</span>
              </div>
            </div>

            {/* Domain 2: Healthcare */}
            <div className="space-y-4 p-6 rounded-2xl bg-[#1A1816] border border-[#F5EFE6]/7">
              <div className="w-10 h-10 rounded-xl bg-[#141311] border border-[#E0A364]/30 text-[#E0A364] flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                Healthcare Administration
              </h3>
              <p className="text-xs text-[#A89F91] leading-relaxed font-light">
                Ayushman Bharat PM-JAY registration, 14-digit ABHA health account generation, and cashless hospital treatment explained calmly.
              </p>
              <div className="pt-2 text-xs text-[#A89F91] font-mono">
                <span>₹5 Lakh cashless cover</span> · <span>ABHA card creation</span>
              </div>
            </div>

            {/* Domain 3: Civic Services */}
            <div className="space-y-4 p-6 rounded-2xl bg-[#1A1816] border border-[#F5EFE6]/7">
              <div className="w-10 h-10 rounded-xl bg-[#141311] border border-[#FAF6F0]/20 text-[#FAF6F0] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                Public Service Guidance
              </h3>
              <p className="text-xs text-[#A89F91] leading-relaxed font-light">
                Smart Ration Card renewals, caste and income certificate applications, and pension status inquiries with Aadhaar biometric assistance.
              </p>
              <div className="pt-2 text-xs text-[#A89F91] font-mono">
                <span>Fair Price Shop access</span> · <span>Mandal certificates</span>
              </div>
            </div>

          </div>

          {/* Midnight Atelier Callout Banner */}
          <div className="mt-14 p-8 rounded-2xl bg-[#0D0D0C] border border-[#F5EFE6]/8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="font-editorial text-xl font-bold text-[#FAF6F0]">
                Ready to speak in your language?
              </h4>
              <p className="text-xs text-[#A89F91] font-light">
                Experience conversational voice assistance designed for every citizen.
              </p>
            </div>
            <button
              onClick={() => onStartAssistant('en')}
              className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all cursor-pointer shadow-lg shadow-[#C87A4B]/15 active:scale-95"
            >
              Open Voice Assistant
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
