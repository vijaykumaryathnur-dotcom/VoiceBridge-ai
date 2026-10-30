import { ChatMessage, SupportedLanguage, WorkflowIntelligence, TaskStep, WorkflowItem } from '../types';

/**
 * Intelligent Workflow Engine
 * Dynamically detects user intent from open-ended natural conversation,
 * distinguishes general questions from structured multi-step tasks,
 * collects extracted facts, identifies missing prerequisites, and synthesizes actionable task plans.
 */

interface TopicPattern {
  keywords: string[];
  intentName: { en: string; hi: string; te: string };
  category: string;
  isStructured: boolean;
  defaultObjective: { en: string; hi: string; te: string };
  suggestedTasks: Array<{ title: { en: string; hi: string; te: string }; initialDone?: boolean }>;
  requiredFields: string[];
  safetyDisclaimer?: { en: string; hi: string; te: string };
}

const TOPIC_PATTERNS: TopicPattern[] = [
  // 1. Studying in Germany / Abroad
  {
    keywords: ['germany', 'study in germany', 'german', 'aps certificate', 'uni-assist', 'studienkolleg', 'abroad'],
    intentName: {
      en: 'Higher Education in Germany / Abroad',
      hi: 'जर्मनी में उच्च शिक्षा व प्रवेश प्रक्रिया',
      te: 'జర్మనీలో ఉన్నత విద్య & దరఖాస్తు ప్రక్రియ'
    },
    category: 'education',
    isStructured: true,
    defaultObjective: {
      en: 'Complete prerequisite verification, APS attestation, language exams, and university admission in Germany',
      hi: 'जर्मनी में विश्वविद्यालय प्रवेश, एपीएस प्रमाण पत्र, और भाषा योग्यता पूरी करना',
      te: 'జర్మనీ విశ్వవిద్యాలయ ప్రవేశం, APS సర్టిఫికేషన్ మరియు నిధుల ధ్రువీకరణ పూర్తి చేయడం'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Verify 12th/Bachelor academic qualification eligibility (Anabin database)',
          hi: 'शैक्षणिक योग्यता व डिग्री की मान्यता जांचें (Anabin डेटाबेस)',
          te: 'విద్యా అర్హత గుర్తింపును పరిశీలించండి (Anabin డేటాబేస్)'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Obtain APS India Certification from German Academic Evaluation Centre',
          hi: 'एपीएस इंडिया केंद्र से शैक्षणिक सत्यापन प्रमाण पत्र प्राप्त करें',
          te: 'APS ఇండియా అకడమిక్ ధ్రువీకరణ పత్రం పొందండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Language Proficiency Score (IELTS 6.5+ or Goethe German B2)',
          hi: 'भाषा दक्षता स्कोर कार्ड (IELTS / जर्मन B2)',
          te: 'భాషా ప్రావీణ్య స్కోరు (IELTS లేదా జర్మన్ B2)'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Prepare Letter of Motivation (SOP) & Academic Curriculum Vitae',
          hi: 'प्रेरणा पत्र (SOP) और यूरोपीय फॉर्मेट बायोडाटा तैयार करें',
          te: 'లెటర్ ఆఫ్ మోటివేషన్ (SOP) & యూరోపాస్ రెజ్యూమ్ సిద్ధం చేయండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Setup Blocked Bank Account (€11,904/yr for student visa proof of funds)',
          hi: 'ब्लॉक्ड बैंक खाता खोलें (वीजा वित्तीय प्रमाण हेतु)',
          te: 'బ్లాక్డ్ బ్యాంక్ ఖాతా ఏర్పాటు చేయండి (వీసా నిధుల రుజువు)'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Target Degree / Course', 'Field of Study', 'Language Proficiency (IELTS / German)', 'Current Percentage / CGPA'],
    safetyDisclaimer: {
      en: 'Guidance only. Official university applications must be submitted via Uni-Assist or directly to the respective German university portal.',
      hi: 'केवल मार्गदर्शन। आधिकारिक आवेदन Uni-Assist या संबंधित विश्वविद्यालय के पोर्टल पर ही जमा करें।',
      te: 'కేవలం మార్గదర్శకత్వం. అధికారిక దరఖాస్తులు Uni-Assist లేదా వర్సిటీ పోర్టల్ ద్వారానే సమర్పించాలి.'
    }
  },

  // 2. Resume / CV Preparation & Jobs
  {
    keywords: ['resume', 'cv', 'curriculum vitae', 'interview', 'job application', 'cover letter', 'बायोडाटा', 'రెజ్యూమ్', 'ఉద్యోగం'],
    intentName: {
      en: 'Professional Resume & Career Preparation',
      hi: 'व्यावसायिक बायोडाटा (रिज्यूमे) व करियर तैयारी',
      te: 'ఉద్యోగ రెజ్యూమ్ & కెరీర్ సన్నద్ధత'
    },
    category: 'jobs',
    isStructured: true,
    defaultObjective: {
      en: 'Draft an ATS-optimized professional resume highlighting core strengths and measurable achievements',
      hi: 'एटीएस-अनुकूलित रिज्यूमे तैयार करना और प्रमुख उपलब्धियों को रेखांकित करना',
      te: 'ఏటీఎస్ అనుకూల రెజ్యూమ్ రూపొందించడం మరియు నైపుణ్యాలను పొందుపరచడం'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Define target job role, industry level, and required tech/domain stack',
          hi: 'लक्षित पद, उद्योग और आवश्यक कौशल निर्धारित करें',
          te: 'లక్ష్య ఉద్యోగ హోదా మరియు అవసరమైన నైపుణ్యాలను ఎంచుకోండి'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Structure concise professional summary (3-4 impactful sentences)',
          hi: 'संक्षिप्त करियर सारांश तैयार करें (3-4 प्रभावशाली वाक्य)',
          te: 'ప్రభావవంతమైన కెరీర్ సారాంశాన్ని రాయండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Quantify work experience using XYZ action formula (Action + Context + Metric)',
          hi: 'कार्य अनुभव को ठोस परिणामों व आंकड़ों के साथ लिखें',
          te: 'పని అనుభవాన్ని కొలమానాలతో కూడిన విజయాలతో వివరించండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Audit keyword alignment against target Job Description (ATS pass rate check)',
          hi: 'जॉब डिस्क्रिप्शन के मुख्य कीवर्ड्स का मिलान करें',
          te: 'జాబ్ డిస్క్రిప్షన్‌కు సరిపోయే కీలక పదాలను సరిచూసుకోండి'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Target Job Title', 'Years of Experience', 'Key Technical / Soft Skills', 'Highest Degree']
  },

  // 3. Student Loans & Financial Planning
  {
    keywords: ['student loan', 'education loan', 'loan', 'interest', 'emi', 'vidyalakshmi', 'ऋण', 'लोन', 'రుణం', 'ఎడ్యుకేషన్ లోన్'],
    intentName: {
      en: 'Education Loan Guidance & Subsidy Eligibility',
      hi: 'शिक्षा ऋण मार्गदर्शन व ब्याज सब्सिडी योजनाएं',
      te: 'విద్యా రుణం & వడ్డీ రాయితీ మార్గదర్శకత్వం'
    },
    category: 'finance',
    isStructured: true,
    defaultObjective: {
      en: 'Compare loan interest structures, calculate EMIs, and verify CSIS interest subsidy eligibility on Vidya Lakshmi portal',
      hi: 'ऋण ब्याज दरों की तुलना, ईएमआई गणना और विद्या लक्ष्मी पोर्टल पर सब्सिडी जांच',
      te: 'రుణ వడ్డీ రేట్ల పోలిక, ఈఎంఐ లెక్కింపు మరియు విద్యా లక్ష్మి పోర్టల్ పరిశీలన'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Estimate total sanctioned amount (tuition + living + insurance)',
          hi: 'कुल आवश्यक ऋण राशि का आकलन (फीस + आवास)',
          te: 'మొత్తం అవసరమైన రుణ అంచనా (ఫీజు + నివాస ఖర్చులు)'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Check CSIS (Central Sector Interest Subsidy) eligibility (< ₹4.5L family income)',
          hi: 'सीएसआईएस ब्याज सब्सिडी पात्रता जांचें (< ₹4.5 लाख वार्षिक आय)',
          te: 'CSIS వడ్డీ రాయితీ అర్హతను పరిశీలించండి (< ₹4.5 లక్షల ఆదాయం)'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Gather co-applicant ITR / Form 16 & 6-month bank statements',
          hi: 'सह-आवेदक (माता-पिता) का आईटीआर / फॉर्म 16 और बैंक विवरण एकत्र करें',
          te: 'సహ-దరఖాస్తుదారు ఐటీఆర్ / ఫారం 16 మరియు బ్యాంక్ స్టేట్‌మెంట్ సిద్ధం చేయండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Submit single application via Ministry of Finance Vidya Lakshmi Portal (vidyalakshmi.co.in)',
          hi: 'विद्या लक्ष्मी पोर्टल पर बहु-बैंक आवेदन दर्ज करें',
          te: 'విద్యా లక్ష్మి పోర్టల్ ద్వారా దరఖాస్తు సమర్పించండి'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Required Loan Amount', 'Co-applicant Income Proof', 'Admission Offer Letter', 'Collateral Status (Collateral-free up to ₹7.5L)'],
    safetyDisclaimer: {
      en: 'Financial planning estimate. Terms, interest rates, and loan sanctioning remain at the sole discretion of the lending bank under RBI guidelines.',
      hi: 'वित्तीय मार्गदर्शन केवल सूचनात्मक है। ऋण स्वीकृति बैंक व आरबीआई के नियमों पर निर्भर करती है।',
      te: 'ఆర్థిక సమాచారం మాత్రమే. రుణ మంజూరు పూర్తిగా బ్యాంక్ నిబంధనలపై ఆధారపడి ఉంటుంది.'
    }
  },

  // 4. Income / Domicile / Caste Government Certificates
  {
    keywords: ['income certificate', 'caste certificate', 'domicile', 'tehsildar', 'mandal', 'meeseva', 'आय प्रमाण पत्र', 'जाति प्रमाण पत्र', 'ఆదాయ ధ్రువీకరణ'],
    intentName: {
      en: 'Government Certificate Issuance (Income / Domicile / Caste)',
      hi: 'सरकारी प्रमाण पत्र आवेदन (आय / निवास / जाति प्रमाण पत्र)',
      te: 'ప్రభుత్వ ధ్రువీకరణ పత్రాలు (ఆదాయం / నివాసం / కులం)'
    },
    category: 'government',
    isStructured: true,
    defaultObjective: {
      en: 'Guide documentation and verification for Revenue Dept issuance via District e-District / MeeSeva portals',
      hi: 'राजस्व विभाग / ई-डिस्ट्रिक्ट / मी-सेवा पोर्टल के माध्यम से प्रमाण पत्र आवेदन मार्गदर्शन',
      te: 'రెవెన్యూ శాఖ / ఈ-డిస్ట్రిక్ట్ / మీసేవ ద్వారా అధికారిక ధ్రువీకరణ పత్రం పొందడం'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Confirm jurisdiction Tehsildar / Revenue Inspector Mandal office',
          hi: 'संबंधित तहसील / मंडल राजस्व कार्यालय की पहचान करें',
          te: 'సంబంధిత తహసీల్దార్ / మండల్ రెవెన్యూ కార్యాలయాన్ని గుర్తించండి'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Prepare Self-Declaration Affidavit stamped before Notary / Executive Magistrate',
          hi: 'शपथ पत्र / स्व-घोषणा पत्र नोटरी से सत्यापित कराएं',
          te: 'స్వీయ ప్రకటన అఫిడవిట్ సిద్ధం చేయండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Attach Electricity / Water Bill & Ration Card as proof of local address',
          hi: 'बिजली / पानी का बिल और राशन कार्ड निवास प्रमाण के रूप में संलग्न करें',
          te: 'కరెంట్ బిల్లు మరియు రేషన్ కార్డు నివాస ధ్రువీకరణగా జతచేయండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Apply online on State e-District portal and track Revenue Inspector verification',
          hi: 'राज्य ई-डिस्ट्रिक्ट पोर्टल पर आवेदन करें व राजस्व निरीक्षक सत्यापन ट्रैक करें',
          te: 'ఈ-డిస్ట్రిక్ట్ లేదా మీసేవ పోర్టల్‌లో దరఖాస్తు చేసి ట్రాక్ చేయండి'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Applicant Aadhaar Number', 'Current Address & Ward/Village', 'Annual Family Income Details', 'Ration Card Number']
  },

  // 5. Scholarship Applications (General & Government)
  {
    keywords: ['scholarship', 'scholarships', 'nsp', 'post-matric', 'pre-matric', 'छात्रवृत्ति', 'स्कॉलरशिप', 'స్కాలర్‌షిప్'],
    intentName: {
      en: 'Higher Education Scholarship Guidance',
      hi: 'उच्च शिक्षा छात्रवृत्ति आवेदन मार्गदर्शन',
      te: 'ఉన్నత విద్యా స్కాలర్‌షిప్ మార్గదర్శకత్వం'
    },
    category: 'education',
    isStructured: true,
    defaultObjective: {
      en: 'Complete family income pre-screening, Aadhaar DBT bank linking, and NSP portal registration',
      hi: 'आय पात्रता जांच, आधार-सीडेड बैंक खाता, और राष्ट्रीय छात्रवृत्ति पोर्टल पर आवेदन',
      te: 'ఆదాయ పరిశీలన, ఆధార్ లింక్ అయిన బ్యాంక్ ఖాతా మరియు ఎన్‌ఎస్‌పీ దరఖాస్తు'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Verify family annual income is under ₹2.5 Lakhs threshold',
          hi: 'पारिवारिक वार्षिक आय ₹2.5 लाख से कम होना सत्यापित करें',
          te: 'కుటుంబ వార్షిక ఆదాయం ₹2.5 లక్షల లోపు ఉందని నిర్ధారించుకోండి'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Verify bank account is actively seeded with Aadhaar for DBT transfer',
          hi: 'डीबीटी छात्रवृत्ति के लिए बैंक खाते में आधार सीडिंग जांचें',
          te: 'డీబీటీ కోసం బ్యాంక్ ఖాతా ఆధార్‌తో లింక్ అయిందో లేదో చూడండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Collect previous academic marks sheet and current bonafide certificate',
          hi: 'पिछली अंकतालिका और वर्तमान कॉलेज बोनाफाइड प्रमाण पत्र एकत्र करें',
          te: 'మునుపటి మార్కుల పత్రం మరియు ప్రస్తుత బోనఫైడ్ పత్రం తీసుకోండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Register on National Scholarship Portal (scholarships.gov.in) with OTR',
          hi: 'नेशनल स्कॉलरशिप पोर्टल (NSP) पर वन-टाइम रजिस्ट्रेशन (OTR) पूरा करें',
          te: 'నేషనల్ స్కాలర్‌షిప్ పోర్టల్‌లో OTR నమోదు పూర్తి చేయండి'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Applicant Name', 'Current Academic Course', 'Annual Family Income', 'Aadhaar Seeded Bank Name']
  },

  // 6. Healthcare / Ayushman Bharat / ABHA
  {
    keywords: ['ayushman', 'pmjay', 'health card', 'abha', 'hospital', 'इलाज', 'आयुष्मान', 'ఆయుష్మాన్', 'ఆసుపత్రి', 'ఆరోగ్యం'],
    intentName: {
      en: 'Ayushman Bharat & Cashless Healthcare Cover',
      hi: 'आयुष्मान भारत व ₹5 लाख कैशलेस स्वास्थ्य सुरक्षा',
      te: 'ఆయుష్మాన్ భారత్ & నగదు రహిత ఆరోగ్య రక్షణ'
    },
    category: 'healthcare',
    isStructured: true,
    defaultObjective: {
      en: 'Generate 14-digit ABHA Card, verify SECC eligibility, and find empaneled cashless hospitals',
      hi: '14 अंकों का आभा कार्ड जनरेट करना और नजदीकी कैशलेस अस्पताल खोजना',
      te: '14 అంకెల ఆభా కార్డు సృష్టించడం మరియు ఎంప్యానెల్డ్ ఆసుపత్రులను కనుగొనడం'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Generate 14-digit ABHA Health Number via Aadhaar OTP (abha.abdm.gov.in)',
          hi: 'आधार ओटीपी से 14 अंकों का आभा नंबर जनरेट करें',
          te: 'ఆధార్ ఓటీపీ ద్వారా 14 అంకెల ఆభా నంబర్ తీసుకోండి'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Check family eligibility on PM-JAY beneficiary portal (mera.pmjay.gov.in)',
          hi: 'पीएम-जय पोर्टल पर परिवार की पात्रता सूची में नाम जांचें',
          te: 'పీఎం-జేఏవై లబ్ధిదారుల జాబితాలో అర్హతను పరిశీలించండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Locate nearest empaneled public or private hospital with Ayushman Mitra helpdesk',
          hi: 'आयुष्मान मित्र हेल्पडेस्क वाले नजदीकी अस्पताल का पता लगाएं',
          te: 'సమీపంలోని ఎంప్యానెల్డ్ ఆసుపత్రి మరియు ఆయుష్మాన్ మిత్ర హెల్ప్‌డెస్క్‌ను సంప్రదించండి'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Head of Family Name', 'Aadhaar Number', 'Ration Card / SECC ID', 'Current District'],
    safetyDisclaimer: {
      en: 'Medical information only. For clinical emergencies or urgent medical conditions, contact emergency medical services or visit the nearest hospital directly.',
      hi: 'स्वास्थ्य सूचना केवल मार्गदर्शन हेतु। किसी भी आपातकालीन स्थिति में तुरंत नजदीकी अस्पताल में संपर्क करें।',
      te: 'వైద్య సమాచారం మాత్రమే. అత్యవసర పరిస్థితుల్లో వెంటనే సమీప ఆసుపత్రిని సంప్రదించండి.'
    }
  },

  // 7. Monthly Budget & Financial Planning
  {
    keywords: ['budget', 'monthly budget', 'expenses', 'savings', 'saving money', 'बजट', 'खर्च', 'బడ్జెట్', 'పొదుపు'],
    intentName: {
      en: 'Personal Budgeting & Expense Optimization',
      hi: 'मासिक बजट व वित्तीय बचत योजना',
      te: 'వ్యక్తిగత బడ్జెట్ & నెలవారీ పొదుపు ప్రణాళిక'
    },
    category: 'finance',
    isStructured: true,
    defaultObjective: {
      en: 'Structure a 50/30/20 balanced monthly cash flow plan with debt management and emergency reserve',
      hi: '50/30/20 नियम पर आधारित मासिक बजट तैयार करना और आपातकालीन बचत बनाना',
      te: '50/30/20 సూత్రంతో నెలవారీ బడ్జెట్ మరియు అత్యవసర నిధి ప్రణాళిక'
    },
    suggestedTasks: [
      {
        title: {
          en: 'Calculate fixed monthly take-home income across all sources',
          hi: 'सभी स्रोतों से कुल मासिक शुद्ध आय की गणना करें',
          te: 'అన్ని మార్గాల ద్వారా లభించే నెలవారీ నికర ఆదాయాన్ని లెక్కించండి'
        },
        initialDone: true
      },
      {
        title: {
          en: 'Audit essential 50% fixed needs (rent, groceries, electricity, medicines)',
          hi: 'अनिवार्य 50% आवश्यकताओं (किराया, राशन, बिजली, दवा) का विवरण बनाएं',
          te: '50% నిత్యావసరాల ఖర్చులను (ఇంటి అద్దె, కిరాణా, మందులు) నమోదు చేయండి'
        },
        initialDone: false
      },
      {
        title: {
          en: 'Allocate minimum 20% to debt clearance and high-yield emergency liquid fund',
          hi: 'कम से कम 20% ऋण अदायगी और इमरजेंसी फंड में अलग रखें',
          te: 'కనీసం 20% పొదుపు మరియు రుణ చెల్లింపుల కోసం కేటాయించండి'
        },
        initialDone: false
      }
    ],
    requiredFields: ['Monthly Net Income', 'Fixed Living Expenses', 'Outstanding Debt / EMIs', 'Target Savings Rate']
  },

  // 8. General Translations (Unstructured / Conversational)
  {
    keywords: ['translate', 'translation', 'meaning in', 'telugu translation', 'hindi translation', 'अनुवाद', 'ట్రాన్స్‌లేట్', 'అనువాదం'],
    intentName: {
      en: 'Multilingual Language Translation',
      hi: 'बहुभाषी अनुवाद व भाषाई सहायता',
      te: 'బహుభాషా అనువాదం & భాషా సహాయం'
    },
    category: 'everyday_life',
    isStructured: false,
    defaultObjective: {
      en: 'Provide clear, idiomatically authentic natural translation across English, Hindi, and Telugu',
      hi: 'अंग्रेजी, हिन्दी और तेलुगु में स्पष्ट और स्वाभाविक अनुवाद प्रदान करना',
      te: 'ఇంగ్లీష్, హిందీ మరియు తెలుగులో స్పష్టమైన అనువాదం అందించడం'
    },
    suggestedTasks: [],
    requiredFields: []
  },

  // 9. Mathematics & Conceptual Explanations (Unstructured / Conversational)
  {
    keywords: ['math', 'mathematics', 'equation', 'calculate', 'physics', 'concept', 'explain how', 'what is', 'गणित', 'లెక్కలు'],
    intentName: {
      en: 'Concept Explanation & Problem Solving',
      hi: 'संकल्पना स्पष्टीकरण व समस्या समाधान',
      te: 'కాన్సెప్ట్ వివరణ & గణిత సమస్యల పరిష్కారం'
    },
    category: 'tech',
    isStructured: false,
    defaultObjective: {
      en: 'Break down complex concepts into intuitive step-by-step principles and examples',
      hi: 'जटिल सिद्धांतों को सरल उदाहरणों के साथ चरणबद्ध समझाना',
      te: 'క్లిష్టమైన అంశాలను సులభమైన ఉదాహరణలతో దశలవారీగా వివరించడం'
    },
    suggestedTasks: [],
    requiredFields: []
  }
];

export function analyzeConversationIntelligence(
  messages: ChatMessage[],
  language: SupportedLanguage = 'en'
): WorkflowIntelligence {
  const userMessages = messages.filter(m => m.sender === 'user');
  const allUserText = userMessages.map(m => m.text.toLowerCase()).join(' ');

  // 1. If no user messages yet, return warm conversational ready state
  if (userMessages.length === 0 || !allUserText.trim()) {
    return {
      detectedIntent: language === 'hi' ? 'सामान्य बातचीत व पूछताछ' : language === 'te' ? 'సాధారణ సంభాషణ' : 'General Inquiry / Open Conversation',
      requiresWorkflow: false,
      objective: language === 'hi' ? 'किसी भी विषय पर पूछें — शिक्षा, सरकारी सेवाएं, करियर या दैनिक कार्य' : language === 'te' ? 'ఏ విషయమైనా అడగండి — విద్య, ప్రభుత్వ సేవలు లేదా సాధారణ సందేహాలు' : 'Ask about anything — education, public services, careers, or everyday questions.',
      collectedInfo: {},
      missingInfo: [],
      tasks: [],
      progress: 0,
      nextRecommendedAction: language === 'hi' ? 'माइक दबाकर अपनी भाषा में बात शुरू करें।' : language === 'te' ? 'మైక్ నొక్కి మాట్లాడటం ప్రారంభించండి.' : 'Tap the microphone or type to speak freely in your language.'
    };
  }

  // 2. Match against domain topics
  let matchedPattern: TopicPattern | null = null;
  let highestScore = 0;

  for (const pattern of TOPIC_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (allUserText.includes(kw.toLowerCase())) {
        score += kw.length > 5 ? 3 : 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      matchedPattern = pattern;
    }
  }

  // 3. If no specific topic matched with strong score, check if it contains workflow-indicating action verbs
  const workflowActionKeywords = [
    'how to apply', 'apply for', 'application', 'procedure', 'process', 'step by step',
    'documents needed', 'eligible', 'eligibility', 'register', 'how do i get', 'prepare my',
    'book an appointment', 'file a complaint', 'आवेदन', 'प्रक्रिया', 'దరఖాస్తు', 'విధానం'
  ];

  const hasWorkflowAction = workflowActionKeywords.some(kw => allUserText.includes(kw));

  // If general conversation without workflow keywords
  if (!matchedPattern || (!matchedPattern.isStructured && !hasWorkflowAction)) {
    const isTranslation = allUserText.includes('translate') || allUserText.includes('meaning') || allUserText.includes('अनुवाद') || allUserText.includes('అనువాదం');
    const isMathOrConcept = allUserText.includes('math') || allUserText.includes('solve') || allUserText.includes('explain') || allUserText.includes('why');

    const intentText = isTranslation
      ? (language === 'hi' ? 'बहुभाषी अनुवाद व भाषाई सहयोग' : language === 'te' ? 'బహుభాషా అనువాదం' : 'Multilingual Translation & Phrasing')
      : isMathOrConcept
      ? (language === 'hi' ? 'अवधारणा स्पष्टीकरण व परामर्श' : language === 'te' ? 'కాన్సెప్ట్ వివరణ & విశ్లేషణ' : 'Conceptual Understanding & Explanation')
      : (language === 'hi' ? 'खुली बातचीत व परामर्श' : language === 'te' ? 'సాధారణ సహాయక సంభాషణ' : 'Direct Conversation & Advice');

    return {
      detectedIntent: intentText,
      requiresWorkflow: false,
      objective: language === 'hi' ? 'प्रत्यक्ष उत्तर व संवाद' : language === 'te' ? 'ప్రత్యక్ష సమాధానం & చర్చ' : 'Conversational answer & direct clarification without paperwork',
      collectedInfo: {},
      missingInfo: [],
      tasks: [],
      progress: 100,
      nextRecommendedAction: language === 'hi' ? 'जारी रखने के लिए अगला प्रश्न पूछें।' : language === 'te' ? 'తదుపరి సందేహాన్ని అడగండి.' : 'Ask any follow-up question or explore related topics.'
    };
  }

  // 4. Structured Multi-Step Task Detected!
  // Extract collected facts heuristically from user queries
  const collectedInfo: Record<string, string> = {};
  const missingInfo: string[] = [];

  // Check for income numbers
  const incomeMatch = allUserText.match(/(\d+(\.\d+)?)\s*(lakh|lac|लाख|లక్ష)/i) || allUserText.match(/₹?\s*(\d{4,7})/);
  if (incomeMatch) {
    collectedInfo['Stated Family Income'] = incomeMatch[0];
  }

  // Check for qualification/course
  if (allUserText.includes('b.tech') || allUserText.includes('engineering') || allUserText.includes('btech')) {
    collectedInfo['Degree / Course'] = 'B.Tech / Engineering';
  } else if (allUserText.includes('master') || allUserText.includes('m.s') || allUserText.includes('m.tech') || allUserText.includes('mba')) {
    collectedInfo['Degree / Course'] = "Master's Degree (Postgraduate)";
  } else if (allUserText.includes('12th') || allUserText.includes('inter') || allUserText.includes('intermediate')) {
    collectedInfo['Degree / Course'] = 'Class 12 / Intermediate';
  }

  // Check for caste/category
  if (allUserText.includes('sc') || allUserText.includes('st') || allUserText.includes('obc') || allUserText.includes('general') || allUserText.includes('ews')) {
    const cat = allUserText.includes('sc') ? 'SC' : allUserText.includes('st') ? 'ST' : allUserText.includes('obc') ? 'OBC' : allUserText.includes('ews') ? 'EWS' : 'General';
    collectedInfo['Social Category'] = cat;
  }

  // Check for location/country
  if (allUserText.includes('germany')) {
    collectedInfo['Destination'] = 'Germany (Europe)';
  } else if (allUserText.includes('usa') || allUserText.includes('us')) {
    collectedInfo['Destination'] = 'United States';
  }

  // Determine missing information from pattern's required fields
  for (const field of matchedPattern.requiredFields) {
    const isCollected = Object.keys(collectedInfo).some(k => k.toLowerCase().includes(field.toLowerCase().split(' ')[0]));
    if (!isCollected) {
      missingInfo.push(field);
    }
  }

  // Format tasks based on language
  const tasks: TaskStep[] = matchedPattern.suggestedTasks.map((t, idx) => ({
    id: `task-${idx + 1}`,
    title: language === 'hi' ? t.title.hi : language === 'te' ? t.title.te : t.title.en,
    completed: Boolean(t.initialDone)
  }));

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 35;

  const firstMissingTask = tasks.find(t => !t.completed);
  const nextRecommendedAction = firstMissingTask
    ? (language === 'hi'
        ? `अगला कदम: ${firstMissingTask.title} को पूरा या सत्यापित करें।`
        : language === 'te'
        ? `తదుపరి చర్య: ${firstMissingTask.title} పూర్తి చేయండి.`
        : `Next step: Focus on "${firstMissingTask.title}".`)
    : (language === 'hi'
        ? 'सभी प्रारंभिक कार्य पूर्ण। अब आधिकारिक पोर्टल पर अंतिम समीक्षा करें।'
        : language === 'te'
        ? 'అన్ని ప్రాథమిక చర్యలు పూర్తయ్యాయి. అధికారిక పోర్టల్‌లో సమీక్షించండి.'
        : 'All preparatory steps completed. Ready for official portal submission.');

  return {
    detectedIntent: language === 'hi' ? matchedPattern.intentName.hi : language === 'te' ? matchedPattern.intentName.te : matchedPattern.intentName.en,
    requiresWorkflow: true,
    category: matchedPattern.category,
    objective: language === 'hi' ? matchedPattern.defaultObjective.hi : language === 'te' ? matchedPattern.defaultObjective.te : matchedPattern.defaultObjective.en,
    collectedInfo,
    missingInfo,
    tasks,
    progress,
    nextRecommendedAction,
    safetyDisclaimer: matchedPattern.safetyDisclaimer
      ? (language === 'hi' ? matchedPattern.safetyDisclaimer.hi : language === 'te' ? matchedPattern.safetyDisclaimer.te : matchedPattern.safetyDisclaimer.en)
      : undefined
  };
}

/**
 * Converts dynamic workflow intelligence into a persistent WorkflowItem
 * so the citizen can track it permanently in their Applications & Dashboard.
 */
export function convertIntelligenceToWorkflow(
  intelligence: WorkflowIntelligence,
  language: SupportedLanguage = 'en'
): WorkflowItem {
  const id = `dynamic-${Date.now()}`;
  return {
    id,
    category: intelligence.category || 'education',
    title: intelligence.detectedIntent,
    title_hi: intelligence.detectedIntent,
    title_te: intelligence.detectedIntent,
    department: 'VoiceBridge Dynamic Advisor Engine',
    description: intelligence.objective,
    description_hi: intelligence.objective,
    description_te: intelligence.objective,
    deadline: 'Self-Paced Track',
    status: 'in_progress',
    progress: intelligence.progress,
    isDynamic: true,
    requiredDocuments: intelligence.missingInfo.map((info, idx) => ({
      id: `doc-dyn-${idx}`,
      name: info,
      name_hi: info,
      name_te: info,
      submitted: false
    })),
    tasks: intelligence.tasks,
    fields: intelligence.collectedInfo
  };
}
