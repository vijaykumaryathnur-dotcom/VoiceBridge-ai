import React, { useState } from 'react';
import {
  GraduationCap,
  Landmark,
  HeartPulse,
  Wallet,
  Briefcase,
  Plane,
  Scale,
  Building2,
  Cpu,
  Sparkles,
  Search,
  Mic,
  ArrowRight,
  Compass,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { requestPageExplanation } from '../services/api';
import { voiceEngine } from '../services/voice';

interface ServiceCategoryItem {
  id: string;
  name: { en: string; hi: string; te: string };
  icon: React.ReactNode;
  description: { en: string; hi: string; te: string };
  examples: string[];
  suggestedPrompts: Array<{ label: string; query: string }>;
  badge?: string;
}

interface ExploreServicesViewProps {
  onStartWithPrompt: (prompt: string, lang?: SupportedLanguage) => void;
  selectedLanguage: SupportedLanguage;
  onTriggerPageNarration?: (text: string) => void;
}

export const ExploreServicesView: React.FC<ExploreServicesViewProps> = ({
  onStartWithPrompt,
  selectedLanguage,
  onTriggerPageNarration
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const handleExplainServices = async () => {
    setIsExplaining(true);
    try {
      const summary = {
        totalCategories: 10,
        featuredDomains: ['Education & Careers', 'Healthcare & ABHA', 'Government Schemes', 'Career & Job Prep', 'Digital & Cyber Safety', 'Everyday Life & Translations']
      };
      const text = await requestPageExplanation(
        'services',
        'Capabilities & Services Catalog',
        JSON.stringify(summary),
        selectedLanguage
      );
      if (onTriggerPageNarration) onTriggerPageNarration(text);
      else voiceEngine.speak(text, selectedLanguage);
    } catch (e) {
      console.warn('Explain services error:', e);
      const fallback = selectedLanguage === 'hi'
        ? 'VoiceBridge AI 10 प्रमुख श्रेणियों में आपकी सहायता कर सकता है—जैसे छात्रवृत्ति, स्वास्थ्य सेवाएं, करियर तैयारी और अनुवाद।'
        : selectedLanguage === 'te'
        ? 'VoiceBridge AI విద్య, స్కాలర్‌షిప్‌లు, ఆరోగ్య పథకాలు మరియు అనువాదాల వంటి అనేక రంగాలలో సహాయం చేయగలదు.'
        : 'VoiceBridge AI assists across 10 major capability domains including scholarships, healthcare schemes, career preparation, and translations.';
      if (onTriggerPageNarration) onTriggerPageNarration(fallback);
      else voiceEngine.speak(fallback, selectedLanguage);
    } finally {
      setIsExplaining(false);
    }
  };

  const categories: ServiceCategoryItem[] = [
    {
      id: 'education',
      name: {
        en: 'Education and Careers',
        hi: 'शिक्षा व करियर विकास',
        te: 'విద్య & కెరీర్ ప్రణాళిక'
      },
      icon: <GraduationCap className="w-5 h-5 text-[#D97945]" />,
      badge: 'Popular',
      description: {
        en: 'Higher education admissions, scholarship schemes, international study (Germany, US, UK), and exam guidance.',
        hi: 'उच्च शिक्षा प्रवेश, छात्रवृत्ति योजनाएं, विदेशी अध्ययन (जर्मनी, यूएस) व प्रतियोगी परीक्षाओं की तैयारी।',
        te: 'ఉన్నత విద్యా ప్రవేశాలు, స్కాలర్‌షిప్‌లు, విదేశీ విద్య (జర్మనీ, యూఎస్) మరియు పరీక్షల మార్గదర్శకత్వం.'
      },
      examples: [
        'National Scholarship Portal (NSP) Pre & Post-Matric',
        'Study in Germany (APS, Uni-Assist & Blocked Account)',
        'Central Sector Interest Subsidy (CSIS) Loans',
        'College & University Admission Counseling'
      ],
      suggestedPrompts: [
        { label: 'Study in Germany', query: 'I want to study in Germany. What are the APS and language requirements?' },
        { label: 'Scholarship Application', query: 'Help me apply for a post-matric scholarship and check my income eligibility.' },
        { label: 'Student Loans', query: 'Explain how student education loans work and what subsidies are available.' }
      ]
    },
    {
      id: 'government',
      name: {
        en: 'Government Services',
        hi: 'सरकारी सेवाएं व प्रमाण पत्र',
        te: 'ప్రభుత్వ సేవలు & ధ్రువీకరణలు'
      },
      icon: <Landmark className="w-5 h-5 text-[#F2B99A]" />,
      description: {
        en: 'Official revenue certificates, Aadhaar e-KYC, Smart Ration Cards, voter registration, and portal walkthroughs.',
        hi: 'आय/जाति/निवास प्रमाण पत्र, आधार ई-केवाईसी, स्मार्ट राशन कार्ड, और मतदाता पहचान पत्र सहायता।',
        te: 'ఆదాయం/కులం/నివాస ధ్రువీకరణలు, ఆధార్ ఈ-కేవైసీ, రేషన్ కార్డు మరియు ఓటర్ ఐడీ సేవలు.'
      },
      examples: [
        'Tehsildar & Mandal Income/Caste Certificates',
        'Smart Ration Card & Family Member Addition',
        'Aadhaar Mobile Link & Biometric Updation',
        'Voter ID (EPIC) Registration & Address Correction'
      ],
      suggestedPrompts: [
        { label: 'Income Certificate', query: 'How do I obtain an income certificate from the Tehsildar office?' },
        { label: 'Ration Card Renewal', query: 'What documents are accepted as proof of residence for ration card renewal?' },
        { label: 'Government Document', query: 'I need help understanding an official government notification and requirements.' }
      ]
    },
    {
      id: 'healthcare',
      name: {
        en: 'Healthcare & Wellness',
        hi: 'स्वास्थ्य सेवाएं व कल्याण',
        te: 'ఆరోగ్య సేవలు & సంరక్షణ'
      },
      icon: <HeartPulse className="w-5 h-5 text-[#D97945]" />,
      badge: 'Essential',
      description: {
        en: 'Ayushman Bharat PM-JAY coverage, ABHA 14-digit digital health IDs, hospital empaneled search, and immunization.',
        hi: 'आयुष्मान भारत ₹5 लाख कैशलेस स्वास्थ्य सुरक्षा, 14 अंकों का आभा कार्ड, और अस्पताल पैनल खोज।',
        te: 'ఆయుష్మాన్ భారత్ ₹5 లక్షల ఉచిత వైద్య రక్షణ, ఆభా కార్డు మరియు ఎంప్యానెల్డ్ ఆసుపత్రుల వివరాలు.'
      },
      examples: [
        '14-Digit ABHA Health Account Generation',
        'PM-JAY Cashless Hospitalization Coverage (< ₹5 Lakhs)',
        'Nearest Empaneled Public/Private Hospital Finder',
        'National Immunization & Health Scheme Guidelines'
      ],
      suggestedPrompts: [
        { label: 'ABHA Health Card', query: 'How can I generate my 14-digit ABHA card using Aadhaar OTP?' },
        { label: 'Cashless Hospitalization', query: 'Is private hospital treatment covered under Ayushman Bharat PM-JAY?' },
        { label: 'Book Appointment', query: 'I want to book an appointment and understand OPD timings.' }
      ]
    },
    {
      id: 'finance',
      name: {
        en: 'Finance & Personal Planning',
        hi: 'वित्त व व्यक्तिगत वित्तीय नियोजन',
        te: 'ఆర్థికం & వ్యక్తిగత ప్రణాళిక'
      },
      icon: <Wallet className="w-5 h-5 text-[#A69A8D]" />,
      description: {
        en: 'Personal monthly budgeting (50/30/20 rule), emergency funds, bank DBT seeding, and retirement savings.',
        hi: 'मासिक बजट योजना, आपातकालीन बचत कोष, बैंक आधार सीडिंग, और जन सुरक्षा बीमा योजनाएं।',
        te: 'నెలవారీ బడ్జెట్ ప్రణాళిక, అత్యవసర పొదుపు నిధి మరియు ప్రభుత్వ బీమా పథకాలు.'
      },
      examples: [
        'Monthly Budget & 50/30/20 Expense Planning',
        'Direct Benefit Transfer (DBT) Bank Linking',
        'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
        'Atal Pension Yojana & Sukanya Samriddhi'
      ],
      suggestedPrompts: [
        { label: 'Monthly Budget', query: 'I need help planning my monthly budget and optimizing fixed living expenses.' },
        { label: 'Debt & Loans', query: 'How do I calculate EMI and plan repayment for multiple debts?' },
        { label: 'Savings Plan', query: 'What is a balanced way to save 20% of my income into an emergency fund?' }
      ]
    },
    {
      id: 'jobs',
      name: {
        en: 'Jobs and Employment',
        hi: 'रोजगार व नौकरी की तैयारी',
        te: 'ఉద్యోగాలు & ఉపాధి సేవలు'
      },
      icon: <Briefcase className="w-5 h-5 text-[#F2B99A]" />,
      description: {
        en: 'ATS-optimized resume structuring, cover letters, mock interview practice, and employment portals.',
        hi: 'एटीएस-अनुकूलित रिज्यूमे (बायोडाटा) निर्माण, साक्षात्कार तैयारी, और करियर परिवर्तन मार्गदर्शन।',
        te: 'రెజ్యూమ్ రూపకల్పన, ఉద్యోగ ఇంటర్వ్యూల సన్నద్ధత మరియు కెరీర్ మార్గదర్శకత్వం.'
      },
      examples: [
        'ATS-Compliant Professional Resume Drafting',
        'XYZ Action Formula for Work Experience Bullet Points',
        'National Career Service (NCS) Portal Enrollment',
        'Behavioral & Technical Interview Preparation'
      ],
      suggestedPrompts: [
        { label: 'Resume Help', query: 'Help me prepare my resume and make it ATS-friendly for software roles.' },
        { label: 'Cover Letter', query: 'How do I write an impactful professional cover letter for a junior engineer position?' },
        { label: 'Interview Prep', query: 'Can we do a mock interview for a customer operations role?' }
      ]
    },
    {
      id: 'travel',
      name: {
        en: 'Travel and Tourism',
        hi: 'यात्रा व पर्यटन सहायता',
        te: 'ప్రయాణం & పర్యాటక సమాచారం'
      },
      icon: <Plane className="w-5 h-5 text-[#D97945]" />,
      description: {
        en: 'Passport Seva Kendra appointments, visa requirements, railway bookings, and cultural itineraries.',
        hi: 'पासपोर्ट सेवा केंद्र अपॉइंटमेंट, तत्काल आवेदन, वीजा आवश्यकताएं, और यात्रा कार्यक्रम।',
        te: 'పాస్‌పోర్ట్ సేవా కేంద్రం అపాయింట్‌మెంట్, వీసా నిబంధనలు మరియు ప్రయాణ ప్రణాళిక.'
      },
      examples: [
        'Passport Seva Kendra (PSK) & Tatkaal Slots',
        'Schengen & Student Visa Documentation Checklists',
        'IRCTC Train Booking & Tatkal Rules',
        'State Tourism Circuit Itineraries'
      ],
      suggestedPrompts: [
        { label: 'Passport Appointment', query: 'What documents do I need for a fresh Indian passport appointment at PSK?' },
        { label: 'German Student Visa', query: 'Walk me through the VFS German student visa appointment and document checklist.' },
        { label: 'Travel Itinerary', query: 'Help me plan a 4-day historical itinerary across Telangana and Warangal.' }
      ]
    },
    {
      id: 'legal',
      name: {
        en: 'Legal Information',
        hi: 'कानूनी जानकारी व उपभोक्ता अधिकार',
        te: 'చట్టపరమైన సమాచారం & హక్కులు'
      },
      icon: <Scale className="w-5 h-5 text-[#F4EBDD]" />,
      description: {
        en: 'Consumer dispute redressal, Right to Information (RTI) drafting, tenancy rights, and Lok Adalat aid.',
        hi: 'उपभोक्ता फोरम शिकायत, सूचना का अधिकार (RTI) प्रारूप, और कानूनी सहायता केंद्र।',
        te: 'వినియోగదారుల హక్కులు, సమాచార హక్కు చట్టం (RTI) మరియు ఉచిత న్యాయ సహాయ సమాచారం.'
      },
      examples: [
        'Right to Information (RTI) Application Drafting',
        'National Consumer Helpline (NCH) Complaints',
        'Rental & Tenancy Agreement Core Safeguards',
        'NALSA Free Legal Services Eligibility'
      ],
      suggestedPrompts: [
        { label: 'File RTI', query: 'How do I draft an RTI application to check the status of my road repair complaint?' },
        { label: 'Consumer Rights', query: 'A vendor refused a refund for a defective product. What are my legal consumer rights?' },
        { label: 'Tenancy Terms', query: 'What standard clauses should be included in an 11-month residential rent agreement?' }
      ]
    },
    {
      id: 'business',
      name: {
        en: 'Business Assistance',
        hi: 'व्यापार व एमएसएमई सहायता',
        te: 'వ్యాపారం & MSME పథకాలు'
      },
      icon: <Building2 className="w-5 h-5 text-[#D97945]" />,
      description: {
        en: 'MSME Udyam registration, GST basics, PMEGP government credit subsidies, and startup licensing.',
        hi: 'उद्यम पंजीकरण, जीएसटी अनुपालन, पीएमईजीपी सब्सिडी ऋण योजनाएं, और व्यापारिक लाइसेंस।',
        te: 'ఉద్యమ్ రిజిస్ట్రేషన్, జీఎస్టీ ప్రాథమిక అంశాలు మరియు పీఎంఈజీపీ సబ్సిడీ రుణాలు.'
      },
      examples: [
        'Free MSME Udyam Registration (udyamregistration.gov.in)',
        'PMEGP 15-35% Government Project Cost Subsidy',
        'GST Thresholds & Monthly Return Filing Basics',
        'Shop & Commercial Establishment Licenses'
      ],
      suggestedPrompts: [
        { label: 'MSME Registration', query: 'How do I register my small business on the official MSME Udyam portal?' },
        { label: 'PMEGP Subsidy', query: 'Explain the PMEGP subsidy scheme for setting up a rural manufacturing unit.' },
        { label: 'GST Basics', query: 'What is the annual turnover threshold for mandatory GST registration in India?' }
      ]
    },
    {
      id: 'tech',
      name: {
        en: 'Technology & Digital Help',
        hi: 'प्रौद्योगिकी व डिजिटल सहायता',
        te: 'సాంకేతికత & డిజిటల్ సహాయం'
      },
      icon: <Cpu className="w-5 h-5 text-[#F2B99A]" />,
      description: {
        en: 'DigiLocker certificate verification, UPI fraud reporting (1930), cyber safety, and digital literacy.',
        hi: 'डिजिलॉकर से दस्तावेज डाउनलोड, यूपीआई फ्रॉड शिकायत (1930), और साइबर सुरक्षा टिप्स।',
        te: 'డిజిలాకర్ ధ్రువీకరణలు, యూపీఐ భద్రత మరియు సైబర్ హెల్ప్‌లైన్ (1930) సమాచారం.'
      },
      examples: [
        'DigiLocker Legally Valid Digital Documents (IT Act Rule 9A)',
        'National Cyber Crime Reporting (cybercrime.gov.in / 1930)',
        'UPI Security, Daily Limits & Reverse Charge Protocols',
        'Mathematical & Algorithm Conceptual Explanations'
      ],
      suggestedPrompts: [
        { label: 'DigiLocker Setup', query: 'How do I fetch my driving licence and marksheet into DigiLocker?' },
        { label: 'UPI Safety', query: 'What should I do immediately if money was deducted in a fraudulent UPI transaction?' },
        { label: 'Explain Concept', query: 'Can you explain this mathematical problem and concept step by step?' }
      ]
    },
    {
      id: 'everyday_life',
      name: {
        en: 'Everyday Life & Communication',
        hi: 'दैनिक जीवन व भाषाई अनुवाद',
        te: 'రోజువారీ జీవితం & అనువాదాలు'
      },
      icon: <Sparkles className="w-5 h-5 text-[#D97945]" />,
      description: {
        en: 'Natural translations across English/Hindi/Telugu, drafting formal letters, utility bills, and daily queries.',
        hi: 'अंग्रेजी, हिन्दी और तेलुगु में स्वाभाविक अनुवाद, औपचारिक पत्र लेखन, और दैनिक सहायता।',
        te: 'ఇంగ్లీష్, హిందీ, తెలుగు మధ్య సహజ అనువాదాలు, లేఖలు రాయడం మరియు సాధారణ సహాయం.'
      },
      examples: [
        'Idiomatic Translation (English <-> Hindi <-> Telugu)',
        'Drafting Formal Municipal & Grievance Letters',
        'Electricity, Water & LPG Gas Subsidy Questions',
        'Daily Scheduling, Problem Solving & Brainstorming'
      ],
      suggestedPrompts: [
        { label: 'Translate to Telugu', query: 'Translate this sentence into Telugu: "Please submit your documents by tomorrow."' },
        { label: 'Formal Letter', query: 'Draft a polite formal letter to the municipal commissioner requesting street light repair.' },
        { label: 'LPG Subsidy', query: 'How do I check if my bank account is receiving the PAHAL LPG gas subsidy?' }
      ]
    }
  ];

  const filteredCategories = categories.filter(cat => {
    const query = searchQuery.toLowerCase().trim();
    const matchesFilter = activeCategoryFilter === 'all' || cat.id === activeCategoryFilter;
    if (!query) return matchesFilter;

    const matchesName =
      cat.name.en.toLowerCase().includes(query) ||
      cat.name.hi.toLowerCase().includes(query) ||
      cat.name.te.toLowerCase().includes(query);
    const matchesDesc =
      cat.description.en.toLowerCase().includes(query) ||
      cat.description.hi.toLowerCase().includes(query);
    const matchesExamples = cat.examples.some(e => e.toLowerCase().includes(query));
    const matchesPrompts = cat.suggestedPrompts.some(p => p.label.toLowerCase().includes(query) || p.query.toLowerCase().includes(query));

    return matchesFilter && (matchesName || matchesDesc || matchesExamples || matchesPrompts);
  });

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-8 text-[#F5EFE6]">
      
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#141311] via-[#1A1816] to-[#141311] border border-[#F5EFE6]/8 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#C87A4B]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1A17] border border-[#C87A4B]/30 text-[#E0A364] text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-[#C87A4B]" />
            <span>General-Purpose Multilingual Discovery</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#F5EFE6] tracking-tight">
            Explore Capabilities &amp; Services
          </h1>

          <p className="text-sm text-[#A89F91] leading-relaxed">
            VoiceBridge AI assists across any domain in English, हिन्दी, and తెలుగు. Browse these 10 curated areas for inspiration—or speak freely on any question at any time.
          </p>

          {/* Quick Voice Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartWithPrompt('')}
              className="px-4 py-2.5 rounded-xl bg-[#C87A4B] hover:bg-[#D48354] text-[#0D0D0C] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Mic className="w-4 h-4" />
              <span>Start Speaking: "Ask me anything"</span>
            </button>

            <button
              onClick={handleExplainServices}
              disabled={isExplaining}
              className="px-3.5 py-2.5 rounded-xl bg-[#141311] hover:bg-[#1A1816] border border-[#C87A4B]/40 hover:border-[#C87A4B] text-[#FAF6F0] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              title="Narrate services overview out loud"
            >
              <Volume2 className={`w-4 h-4 text-[#C87A4B] ${isExplaining ? 'animate-pulse' : ''}`} />
              <span>{isExplaining ? 'Preparing Audio...' : 'Listen & Explain Services'}</span>
            </button>

            <span className="text-xs text-[#A89F91]">No predefined categories required</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services, scholarships, Germany study, loans, resume, etc..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141311] border border-[#F5EFE6]/10 text-xs text-[#F5EFE6] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#C87A4B] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A89F91] hover:text-[#F5EFE6]"
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-[#C87A4B] border-[#C87A4B] text-[#0D0D0C] font-semibold'
                : 'bg-[#141311] border-[#F5EFE6]/7 text-[#A89F91] hover:text-[#F5EFE6]'
            }`}
          >
            All 10 Areas
          </button>
          {categories.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
                activeCategoryFilter === c.id
                  ? 'bg-[#C87A4B] border-[#C87A4B] text-[#0D0D0C] font-semibold'
                  : 'bg-[#141311] border-[#F5EFE6]/7 text-[#A89F91] hover:text-[#F5EFE6]'
              }`}
            >
              {selectedLanguage === 'hi' ? c.name.hi : selectedLanguage === 'te' ? c.name.te : c.name.en}
            </button>
          ))}
        </div>

      </div>

      {/* Grid of 10 Service Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredCategories.map((cat) => {
          const categoryTitle = selectedLanguage === 'hi' ? cat.name.hi : selectedLanguage === 'te' ? cat.name.te : cat.name.en;
          const categoryDesc = selectedLanguage === 'hi' ? cat.description.hi : selectedLanguage === 'te' ? cat.description.te : cat.description.en;

          return (
            <div
              key={cat.id}
              className="rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 p-5 flex flex-col justify-between hover:border-[#C87A4B]/35 transition-all group shadow-sm"
            >
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1A1816] border border-[#F5EFE6]/6 group-hover:border-[#C87A4B]/25 transition-colors">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="font-editorial text-lg font-bold text-[#F5EFE6] leading-tight">
                        {categoryTitle}
                      </h3>
                      {cat.badge && (
                        <span className="inline-block mt-0.5 text-[9px] uppercase font-bold tracking-wider text-[#C87A4B] bg-[#1C1A17] px-1.5 py-0.5 rounded border border-[#C87A4B]/20">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#A89F91] leading-relaxed">
                  {categoryDesc}
                </p>

                {/* Examples */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E0A364]">
                    Capabilities &amp; Guidelines:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#A89F91]">
                    {cat.examples.map((ex, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3 h-3 text-[#C87A4B] shrink-0" />
                        <span className="truncate">{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sample Voice Prompts */}
              <div className="mt-5 pt-4 border-t border-[#F5EFE6]/6 space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#A89F91] tracking-wider block">
                  Quick Voice Prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => onStartWithPrompt(p.query, selectedLanguage)}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-[#181614] hover:bg-[#1E1B18] border border-[#F5EFE6]/6 hover:border-[#C87A4B]/40 text-[11px] text-[#F5EFE6] transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={p.query}
                    >
                      <Mic className="w-3 h-3 text-[#C87A4B] shrink-0" />
                      <span className="truncate max-w-[220px]">{p.label}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#A89F91] group-hover:text-[#F5EFE6] shrink-0 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 space-y-3">
          <p className="text-sm text-[#A89F91]">No curated categories match "{searchQuery}".</p>
          <p className="text-xs text-[#E0A364]">
            Remember, VoiceBridge AI answers any question directly. You do not need to find a category to speak!
          </p>
          <button
            onClick={() => onStartWithPrompt(searchQuery)}
            className="px-4 py-2 rounded-xl bg-[#C87A4B] text-[#0D0D0C] font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Ask "{searchQuery}" with VoiceBridge</span>
          </button>
        </div>
      )}

      {/* Safety & Realism Notice Banner */}
      <div className="p-4 rounded-xl bg-[#141311] border border-[#F5EFE6]/6 text-xs text-[#A89F91] space-y-1.5">
        <div className="flex items-center gap-2 text-[#E0A364] font-semibold text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#C87A4B]" />
          <span>Intelligent Advisory &amp; Safe Action Boundaries</span>
        </div>
        <p className="leading-relaxed">
          VoiceBridge AI provides step-by-step guidance, prerequisite checklists, document audits, and draft preparation. Official applications (such as NSP scholarships, German APS attestation, and Ayushman Bharat PM-JAY registration) must be finalized on the respective verified government or university portals using your authorized credentials or Aadhaar OTP.
        </p>
      </div>

    </div>
  );
};
