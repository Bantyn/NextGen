/**
 * Sehat Clinical Knowledge Base (CKB)
 * 
 * Safety & Architecture Guarantee:
 * - This knowledge base does NOT diagnose diseases.
 * - It serves as a clinical history-taking, dimension assessment, and question guidance layer.
 * - Easily seedable to MongoDB collection `clinical_knowledge_bases`.
 */

export const CLINICAL_KNOWLEDGE_BASE = [
  // 1. CHEST PAIN
  {
    complaint_id: "ckb_chest_pain",
    complaint: "chest pain",
    synonyms: ["chest discomfort", "chest pressure", "heart pain", "છાતીમાં દુખાવો", "છાતીમાં દબાણ", "सीने में दर्द", "सीने में भारीपन"],
    assessment_dimensions: [
      "onset",
      "duration",
      "severity",
      "location",
      "character",
      "radiation",
      "breathing",
      "sweating",
      "dizziness",
      "exertion",
      "past_cardiac_history"
    ],
    completion_criteria: ["onset", "severity", "radiation", "breathing"],
    questions: [
      {
        dimension: "onset",
        priority: 10,
        question: {
          "en-IN": "When did the chest pain start? Did it come on suddenly or develop gradually?",
          "hi-IN": "सीने में दर्द कब शुरू हुआ? अचानक शुरू हुआ या धीरे-धीरे बढ़ा?",
          "gu-IN": "છાતીમાં દુખાવો ક્યારે શરૂ થયો? અચાનક શરૂ થયો કે ધીમે-ધીમે વધ્યો?"
        },
        quick_chips: {
          "en-IN": ["30 minutes ago", "Since this morning", "Since yesterday", "Came suddenly"],
          "hi-IN": ["30 मिनट पहले", "आज सुबह से", "कल से", "अचानक शुरू हुआ"],
          "gu-IN": ["૩૦ મિનિટ પહેલા", "આજ સવારથી", "ગઈકાલથી", "અચાનક શરૂ થયો"]
        }
      },
      {
        dimension: "severity",
        priority: 10,
        question: {
          "en-IN": "On a scale of 1 to 10, how severe is the chest discomfort right now?",
          "hi-IN": "1 से 10 के पैमाने पर यह दर्द कितना तेज महसूस हो रहा है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર આ દુખાવો કેટલો તીવ્ર છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)", "10 (Unbearable)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (काफी तेज)", "10 (असहनीय)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (ખૂબ વધારે)", "૧૦ (અસહ્ય)"]
        }
      },
      {
        dimension: "radiation",
        priority: 9,
        question: {
          "en-IN": "Does the pain radiate or spread anywhere, such as to your left arm, shoulder, neck, jaw, or back?",
          "hi-IN": "क्या दर्द कहीं और फैल रहा है, जैसे बाएं हाथ, कंधे, गर्दन, जबड़े या पीठ में?",
          "gu-IN": "શું દુખાવો ડાબા હાથ, ખભા, ગળા, જડબા કે પીઠ તરફ ફેલાય છે?"
        },
        quick_chips: {
          "en-IN": ["Spreading to left arm", "Spreading to jaw/neck", "In upper back", "No, stays in chest"],
          "hi-IN": ["बाएं हाथ में फैल रहा है", "जबड़े/गर्दन में", "पीठ में दर्द", "नहीं, केवल सीने में"],
          "gu-IN": ["ડાબા હાથમાં ફેલાય છે", "જડબા/ગળા તરફ", "પીઠમાં દુખાવો", "ના, ફક્ત છાતીમાં જ"]
        }
      },
      {
        dimension: "breathing",
        priority: 9,
        question: {
          "en-IN": "Are you experiencing any shortness of breath or difficulty breathing along with the pain?",
          "hi-IN": "क्या दर्द के साथ सांस लेने में तकलीफ या सांस फूलने की समस्या हो रही है?",
          "gu-IN": "શું દુખાવા સાથે શ્વાસ લેવામાં તકલીફ કે શ્વાસ ચડવાની સમસ્યા થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Yes, hard to breathe", "Mild breathlessness", "No breathing difficulty"],
          "hi-IN": ["हाँ, सांस लेने में तकलीफ", "हल्की सांस फूलना", "नहीं, सांस सामान्य है"],
          "gu-IN": ["હા, શ્વાસ લેવામાં તકલીફ", "હળવો શ્વાસ ચડે છે", "ના, શ્વાસ સામાન્ય છે"]
        }
      },
      {
        dimension: "sweating",
        priority: 8,
        question: {
          "en-IN": "Are you experiencing unusual heavy cold sweating, nausea, or dizziness?",
          "hi-IN": "क्या असामान्य पसीना, जी मिचलाना या चक्कर आने जैसा महसूस हो रहा है?",
          "gu-IN": "શું અસામાન્ય ઠંડો પરસેવો, ઉબકા કે ચક્કર જેવું અનુભવાય છે?"
        },
        quick_chips: {
          "en-IN": ["Yes, heavy sweating", "Feeling dizzy", "No sweating or dizziness"],
          "hi-IN": ["हाँ, पसीना आ रहा है", "चक्कर आ रहे हैं", "नहीं, ऐसा कुछ नहीं"],
          "gu-IN": ["હા, ખૂબ પરસેવો થાય છે", "ચક્કર આવે છે", "ના, એવું કંઈ નથી"]
        }
      }
    ],
    red_flag_indicators: [
      "severe chest pain",
      "chest pain with breathing difficulty",
      "chest pain with fainting",
      "chest pain with severe sweating",
      "crushing chest pain radiating to left arm"
    ]
  },

  // 1.1 COUGH & RESPIRATORY
  {
    complaint_id: "ckb_cough",
    complaint: "cough",
    synonyms: [
      "cold and cough",
      "cough and cold",
      "chest congestion",
      "productive cough",
      "dry cough",
      "bronchitis",
      "cough / cold",
      "phlegm",
      "sputum",
      "ખાંસી",
      "ઉધરસ",
      "કફ",
      "શરદી અને ખાંસી",
      "ગળામાં ખારાશ",
      "છાતીમાં કફ ભરાવો",
      "खांसी",
      "बलगम वाली खांसी",
      "सूखी खांसी",
      "छाती में जकड़न",
      "गले में खराश"
    ],
    assessment_dimensions: [
      "duration",
      "type_dry_wet",
      "sputum_color",
      "breathlessness",
      "fever",
      "chest_pain",
      "hemoptysis",
      "night_sweats",
      "smoking"
    ],
    completion_criteria: ["duration", "type_dry_wet", "breathlessness"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "How long have you had this cough? Is it recent (few days) or ongoing for weeks?",
          "hi-IN": "यह खांसी आपको कितने समय से है? क्या यह कुछ दिनों से है या कई हफ्तों से?",
          "gu-IN": "આ ખાંસી/ઉધરસ તમને કેટલા સમયથી છે? થોડા દિવસથી છે કે ઘણા સમયથી ચાલે છે?"
        },
        quick_chips: {
          "en-IN": ["2 to 3 days", "About 5 days", "1 to 2 weeks", "More than 3 weeks", "3 months or more"],
          "hi-IN": ["2-3 दिन से", "लगभग 5 दिन से", "1-2 हफ्ते से", "3 हफ्ते से अधिक", "3 महीने या ज्यादा"],
          "gu-IN": ["૨-૩ દિવસથી", "૫ દિવસથી", "૧-૨ અઠવાડિયાથી", "૩ અઠવાડિયાથી વધુ", "૩ મહિનાથી"]
        }
      },
      {
        dimension: "type_dry_wet",
        priority: 9,
        question: {
          "en-IN": "Is the cough dry and tickling, or are you bringing up phlegm/mucus?",
          "hi-IN": "क्या खांसी सूखी है, या खांसने पर बलगम/कफ बाहर निकल रहा है?",
          "gu-IN": "શું ખાંસી સૂકી છે, કે ખાંસતી વખતે કફ/બળગમ નીકળે છે?"
        },
        quick_chips: {
          "en-IN": ["Dry tickling cough", "Productive with phlegm", "Watery mucus", "Severe hacking cough"],
          "hi-IN": ["सूखी खांसी", "बलगम/कफ के साथ", "पानी जैसा पतला कफ", "लगातार तेज खांसी"],
          "gu-IN": ["સૂકી ખાંસી", "કફ/બળગમ સાથે", "પાતળો કફ", "સતત આવતી ખાંસી"]
        }
      },
      {
        dimension: "sputum_color",
        priority: 8,
        question: {
          "en-IN": "What color is the phlegm? Is it clear/white, thick yellow, green, or rust-colored?",
          "hi-IN": "बलगम का रंग कैसा है? क्या यह सफेद, पीला, हरा या किसी अन्य रंग का है?",
          "gu-IN": "કફનો રંગ કેવો છે? સફેદ, પીળો કે લીલો?"
        },
        quick_chips: {
          "en-IN": ["Clear / White phlegm", "Yellow / Green phlegm", "Rust / Brownish", "No phlegm / Dry"],
          "hi-IN": ["सफेद/पारदर्शी कफ", "पीला या हरा बलगम", "कत्थई/भूरा", "बलगम नहीं है"],
          "gu-IN": ["સફેદ કફ", "પીળો કે લીલો કફ", "ઘાટો લાલાશ પડતો", "કફ નથી / સૂકી"]
        }
      },
      {
        dimension: "breathlessness",
        priority: 8,
        question: {
          "en-IN": "Are you having any wheezing, chest tightness, or difficulty breathing?",
          "hi-IN": "क्या सीने में सीटी जैसी आवाज, जकड़न या सांस लेने में परेशानी हो रही है?",
          "gu-IN": "શું શ્વાસ લેવામાં તકલીફ, સીટી જેવો અવાજ કે છાતીમાં જકડાઈ જવાની તકલીફ થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Wheezing / whistling sound", "Shortness of breath on walking", "Breathless even at rest", "Normal breathing"],
          "hi-IN": ["सीटी/घरघराहट की आवाज", "चलने पर सांस फूलना", "बैठे-बैठे भी सांस फूलना", "सांस सामान्य है"],
          "gu-IN": ["સીટી જેવો અવાજ આવે છે", "ચાલતી વખતે શ્વાસ ચડે છે", "બેઠા-બેઠા પણ શ્વાસ ચડે છે", "ના, શ્વાસ સામાન્ય છે"]
        }
      },
      {
        dimension: "fever_associated",
        priority: 7,
        question: {
          "en-IN": "Do you also have a fever, chills, or body aches along with the cough?",
          "hi-IN": "क्या खांसी के साथ बुखार, कंपकंपी या बदन दर्द भी है?",
          "gu-IN": "શું ખાંસી સાથે તાવ, ધ્રુજારી કે શરીરમાં દુખાવો પણ થાય છે?"
        },
        quick_chips: {
          "en-IN": ["High fever with chills", "Mild body ache", "No fever at all"],
          "hi-IN": ["तेज बुखार और ठंड", "हल्का बदन दर्द", "कोई बुखार नहीं"],
          "gu-IN": ["તાવ અને ધ્રુજારી છે", "હળવું કળતર છે", "ના, બિલકુલ તાવ નથી"]
        }
      },
      {
        dimension: "chronic_risk_factors",
        priority: 8,
        question: {
          "en-IN": "Do you smoke or have tobacco exposure, or have you noticed weight loss or night sweats?",
          "hi-IN": "क्या आप बीड़ी, सिगरेट या तंबाकू का सेवन करते हैं, या वजन घटने/रात में पसीना आने की समस्या है?",
          "gu-IN": "શું તમે બીડી, સિગારેટ કે તમાકુનું સેવન કરો છો, અથવા વજન ઘટવું કે રાત્રે પરસેવો વળવાની તકલીફ છે?"
        },
        quick_chips: {
          "en-IN": ["Smoke cigarettes / bidi", "Weight loss / night sweats", "History of asthma / allergies", "No smoking or weight loss"],
          "hi-IN": ["सिगरेट/बीड़ी पीते हैं", "वजन कम हुआ / रात में पसीना", "अस्थमा/एलर्जी की शिकायत", "नहीं, ऐसा कुछ नहीं"],
          "gu-IN": ["બીડી/સિગારેટ પીવાની ટેવ છે", "વજન ઘટી ગયું છે / પરસેવો", "અસ્થમા કે એલર્જી છે", "ના, એવું કોઈ લક્ષણ નથી"]
        }
      },
      {
        dimension: "hemoptysis",
        priority: 9,
        question: {
          "en-IN": "Have you noticed any fresh blood or reddish streaks in your cough or sputum?",
          "hi-IN": "क्या खांसी या बलगम में कभी खून के छींटे या लाल रंग दिखा है?",
          "gu-IN": "શું કફ કે ઉધરસમાં લોહીના અંશ કે લાલ રંગનું લોહી જણાયું છે?"
        },
        quick_chips: {
          "en-IN": ["Yes, blood in cough", "Dark streaks", "No blood at all"],
          "hi-IN": ["हाँ, खांसी में खून दिखा", "कत्थई धागे जैसे", "नहीं, बिल्कुल खून नहीं"],
          "gu-IN": ["હા, ખાંસીમાં લોહી નીકળ્યું", "ઘાટા ડાઘા દેખાયા", "ના, બિલકુલ લોહી નથી"]
        }
      }
    ],
    red_flag_indicators: [
      "coughing up blood (hemoptysis)",
      "severe stridor or inability to speak full sentences",
      "cough with high fever and sudden pleuritic chest pain",
      "chronic cough >3 weeks with unexplained weight loss and drenching night sweats"
    ]
  },

  // 2. JOINT PAIN
  {
    complaint_id: "ckb_joint_pain",
    complaint: "joint pain",
    synonyms: ["arthralgia", "body joint ache", "સાંધાનો દુખાવો", "સાંધા જકડાઈ જવા", "जोड़ों में दर्द", "गठिया दर्द"],
    assessment_dimensions: [
      "location",
      "duration",
      "severity",
      "onset",
      "swelling",
      "stiffness",
      "movement_difficulty",
      "previous_injury",
      "fever",
      "progression"
    ],
    completion_criteria: ["location", "duration", "severity", "stiffness"],
    questions: [
      {
        dimension: "location",
        priority: 10,
        question: {
          "en-IN": "Which specific joints are hurting (e.g. knees, hips, hands, shoulders, or ankles)?",
          "hi-IN": "शरीर के कौन-से जोड़ों में दर्द हो रहा है (जैसे घुटने, कूल्हे, हाथ, कंधे या टखने)?",
          "gu-IN": "કયા સાંધામાં દુખાવો થાય છે (દા.ત. ઘૂંટણ, થાપા, હાથની આંગળીઓ કે ખભા)?"
        },
        quick_chips: {
          "en-IN": ["Both knees", "Hand & finger joints", "Shoulders", "Multiple joints"],
          "hi-IN": ["दोनों घुटनों में", "हाथ और उंगलियों में", "कंधों में", "कई जोड़ों में"],
          "gu-IN": ["બંને ઘૂંટણમાં", "હાથ અને આંગળીઓમાં", "ખભામાં", "બધા સાંધામાં"]
        }
      },
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "How long have you had this joint pain?",
          "hi-IN": "यह जोड़ों का दर्द आपको कितने समय से है?",
          "gu-IN": "આ સાંધાનો દુખાવો તમને કેટલા સમયથી છે?"
        },
        quick_chips: {
          "en-IN": ["Since 2 years", "For 2-3 months", "Few weeks", "Few days"],
          "hi-IN": ["पिछले 2 साल से", "2-3 महीने से", "कुछ हफ्तों से", "कुछ दिनों से"],
          "gu-IN": ["છેલ્લા ૨ વર્ષથી", "૨-૩ મહિનાથી", "થોડા અઠવાડિયાથી", "થોડા દિવસથી"]
        }
      },
      {
        dimension: "severity",
        priority: 9,
        question: {
          "en-IN": "On a scale of 1 to 10, how severe is the joint pain?",
          "hi-IN": "1 से 10 के पैमाने पर यह दर्द कितना तीव्र है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર દુખાવો કેટલો તીવ્ર છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (तेज)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (તીવ્ર)"]
        }
      },
      {
        dimension: "stiffness",
        priority: 8,
        question: {
          "en-IN": "Do you experience stiffness in the joints, especially in the morning after waking up?",
          "hi-IN": "क्या जोड़ों में जकड़न (अकड़न) महसूस होती है, विशेषकर सुबह उठने पर?",
          "gu-IN": "શું સાંધામાં કઠિનતા (અકડાઈ જવું) અનુભવાય છે, ખાસ કરીને સવારે ઊઠ્યા પછી?"
        },
        quick_chips: {
          "en-IN": ["Morning stiffness (>30 mins)", "Mild stiffness", "No stiffness"],
          "hi-IN": ["सुबह तेज जकड़न (>30 मिनट)", "हल्की जकड़न", "कोई जकड़न नहीं"],
          "gu-IN": ["સવારે કઠિનતા (>૩૦ મિનિટ)", "હળવી કઠિનતા", "ના, કઠિનતા નથી"]
        }
      },
      {
        dimension: "swelling",
        priority: 8,
        question: {
          "en-IN": "Is there any visible swelling, redness, or heat around the joints?",
          "hi-IN": "क्या जोड़ों के आसपास कोई सूजन, लालिमा या गर्माहट है?",
          "gu-IN": "શું સાંધાની આસપાસ સોજો, લાલાશ કે ગરમી જણાય છે?"
        },
        quick_chips: {
          "en-IN": ["Visible swelling present", "Red & warm to touch", "No swelling"],
          "hi-IN": ["सूजन दिखाई दे रही है", "लालिमा और गर्माहट", "कोई सूजन नहीं"],
          "gu-IN": ["સોજો દેખાય છે", "લાલાશ અને ગરમ છે", "ના, સોજો નથી"]
        }
      }
    ],
    red_flag_indicators: [
      "severe sudden joint pain",
      "inability to move the joint",
      "inability to bear weight",
      "severe swelling",
      "joint symptoms with high fever"
    ]
  },

  // 3. KNEE PAIN
  {
    complaint_id: "ckb_knee_pain",
    complaint: "knee pain",
    synonyms: ["knee ache", "knee stiffness", "ઘૂંટણનો દુખાવો", "ગોઠણનો દુખાવો", "ઘૂંટણમાં કટક અવાજ", "घुटने का दर्द", "घुटनों में दर्द"],
    assessment_dimensions: [
      "location",
      "duration",
      "severity",
      "onset",
      "stiffness",
      "swelling",
      "walking_difficulty",
      "crepitus_sound",
      "stairs_difficulty"
    ],
    completion_criteria: ["duration", "severity", "onset", "stiffness"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "How long have you had this knee pain?",
          "hi-IN": "यह घुटनों का दर्द आपको कितने समय से है?",
          "gu-IN": "આ ઘૂંટણનો દુખાવો તમને કેટલા સમયથી છે?"
        },
        quick_chips: {
          "en-IN": ["Since 2 years", "2-3 months", "Few weeks", "Since few days"],
          "hi-IN": ["पिछले 2 साल से", "2-3 महीने से", "कुछ हफ्तों से", "कुछ दिनों से"],
          "gu-IN": ["છેલ્લા ૨ વર્ષથી", "૨-૩ મહિનાથી", "થોડા અઠવાડિયાથી", "થોડા દિવસથી"]
        }
      },
      {
        dimension: "severity",
        priority: 9,
        question: {
          "en-IN": "On a scale of 1 to 10, how intense is the knee pain?",
          "hi-IN": "1 से 10 के पैमाने पर घुटने का दर्द कितना है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર ઘૂંટણનો દુખાવો કેટલો છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (तेज)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (તીવ્ર)"]
        }
      },
      {
        dimension: "onset",
        priority: 8,
        question: {
          "en-IN": "Did the knee pain start gradually over time or suddenly after an injury?",
          "hi-IN": "घुटने का दर्द धीरे-धीरे बढ़ा या चोट लगने के बाद अचानक शुरू हुआ?",
          "gu-IN": "દુખાવો ધીમે-ધીમે વધ્યો કે ઈજા પછી અચાનક શરૂ થયો?"
        },
        quick_chips: {
          "en-IN": ["Gradually over time", "Suddenly after injury", "Comes and goes"],
          "hi-IN": ["धीरे-धीरे समय के साथ", "चोट के बाद अचानक", "कम-ज्यादा होता है"],
          "gu-IN": ["ધીમે ધીમે વધ્યો", "ઈજા પછી અચાનક", "વધતો-ઓછો થાય છે"]
        }
      },
      {
        dimension: "stiffness",
        priority: 8,
        question: {
          "en-IN": "Do your knees feel stiff or make cracking/clicking sounds when bending or walking?",
          "hi-IN": "क्या घुटने मुड़ते या चलते समय जकड़े हुए लगते हैं या कटक-कटक की आवाज आती है?",
          "gu-IN": "શું ઘૂંટણ વાળતી કે ચાલતી વખતે કઠિનતા (અકડાઈ જવું) લાગે છે કે અવાજ આવે છે?"
        },
        quick_chips: {
          "en-IN": ["Yes, stiffness & clicking", "Only stiffness", "Difficulty on stairs", "None"],
          "hi-IN": ["हाँ, जकड़न और आवाज", "केवल जकड़न", "सीढ़ियां चढ़ने में दर्द", "नहीं"],
          "gu-IN": ["હા, કઠિનતા અને અવાજ", "ફક્ત કઠિનતા", "પગથિયાં ચડવામાં તકલીફ", "ના"]
        }
      }
    ],
    red_flag_indicators: [
      "inability to bear any weight on knee",
      "knee joint locked in one position",
      "severe sudden knee swelling and hot red joint",
      "knee deformity following acute trauma"
    ]
  },

  // 4. FEVER
  {
    complaint_id: "ckb_fever",
    complaint: "fever",
    synonyms: ["high temperature", "pyrexia", "તાવ", "બુખાર", "ધ્રુજારી સાથે તાવ", "बुखार", "तेज बुखार"],
    assessment_dimensions: [
      "onset",
      "duration",
      "temperature_grade",
      "chills",
      "cough",
      "body_ache",
      "rash",
      "burning_urination"
    ],
    completion_criteria: ["duration", "temperature_grade", "chills"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "How many days have you had this fever?",
          "hi-IN": "यह बुखार आपको कितने दिनों से आ रहा है?",
          "gu-IN": "આ તાવ તમને કેટલા દિવસથી આવી રહ્યો છે?"
        },
        quick_chips: {
          "en-IN": ["Since today", "2-3 days", "4-7 days", "More than a week"],
          "hi-IN": ["आज से", "2-3 दिन से", "4-7 दिन से", "एक हफ्ते से ज्यादा"],
          "gu-IN": ["આજથી", "૨-૩ દિવસથી", "૪-૭ દિવસથી", "૧ અઠવાડિયાથી વધુ"]
        }
      },
      {
        dimension: "chills",
        priority: 9,
        question: {
          "en-IN": "Does the fever come with shivering, chills, or heavy sweating?",
          "hi-IN": "क्या बुखार के साथ ठंड, कंपकंपी या तेज पसीना आता है?",
          "gu-IN": "શું તાવ સાથે ઠંડી, ધ્રુજારી કે ખૂબ પરસેવો વળે છે?"
        },
        quick_chips: {
          "en-IN": ["Fever with shivering/chills", "Continuous fever", "Fever with severe body ache"],
          "hi-IN": ["कंपकंपी के साथ बुखार", "लगातार तेज बुखार", "तेज बदन दर्द के साथ"],
          "gu-IN": ["ધ્રુજારી સાથે તાવ", "સતત તાવ રહે છે", "આખા શરીરમાં કળતર સાથે"]
        }
      },
      {
        dimension: "associated_symptoms",
        priority: 8,
        question: {
          "en-IN": "Do you have any cough, sore throat, vomiting, skin rash, or burning sensation while passing urine?",
          "hi-IN": "क्या खांसी, गले में खराश, उल्टी, त्वचा पर दाने या पेशाब में जलन जैसी तकलीफ है?",
          "gu-IN": "શું ખાંસી, ગળામાં દુખાવો, ઉલ્ટી, ચામડી પર ચકામા કે પેશાબમાં બળતરા થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Cough & throat pain", "Severe headache & body ache", "Burning in urine", "No other symptoms"],
          "hi-IN": ["खांसी और गले में दर्द", "सिर और बदन में दर्द", "पेशाब में जलन", "कोई अन्य लक्षण नहीं"],
          "gu-IN": ["ખાંસી અને ગળામાં દુખાવો", "માથા અને શરીરમાં કળતર", "પેશાબમાં બળતરા", "ના, અન્ય લક્ષણ નથી"]
        }
      }
    ],
    red_flag_indicators: [
      "fever with stiff neck and altered mental state",
      "fever with persistent vomiting and extreme lethargy",
      "fever with breathing difficulty or blue lips",
      "petechial dark bleeding spots on skin with fever"
    ]
  },

  // 5. COUGH
  {
    complaint_id: "ckb_cough",
    complaint: "cough",
    synonyms: ["cold and cough", "chest congestion", "ખાંસી", "ઉધરસ", "કફ", "खांसी", "बलगम वाली खांसी", "सूखी खांसी"],
    assessment_dimensions: [
      "duration",
      "type_dry_wet",
      "sputum_color",
      "breathlessness",
      "fever",
      "chest_pain",
      "hemoptysis"
    ],
    completion_criteria: ["duration", "type_dry_wet", "breathlessness"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "How long have you had this cough?",
          "hi-IN": "यह खांसी आपको कितने समय से है?",
          "gu-IN": "આ ખાંસી/ઉધરસ તમને કેટલા સમયથી છે?"
        },
        quick_chips: {
          "en-IN": ["Since 2-3 days", "1-2 weeks", "More than 3 weeks", "Since this morning"],
          "hi-IN": ["2-3 दिन से", "1-2 हफ्ते से", "3 हफ्ते से अधिक", "आज सुबह से"],
          "gu-IN": ["૨-૩ દિવસથી", "૧-૨ અઠવાડિયાથી", "૩ અઠવાડિયાથી વધારે", "આજ સવારથી"]
        }
      },
      {
        dimension: "type_dry_wet",
        priority: 9,
        question: {
          "en-IN": "Is it a dry cough or are you bringing up mucus/phlegm?",
          "hi-IN": "क्या यह सूखी खांसी है या बलगम/कफ आ रहा है?",
          "gu-IN": "શું આ સૂકી ખાંસી છે કે કફ/બળગમ નીકળે છે?"
        },
        quick_chips: {
          "en-IN": ["Dry cough", "Wet cough with yellow/green phlegm", "Clear mucus"],
          "hi-IN": ["सूखी खांसी", "पीला/हरा बलगम", "साफ कफ"],
          "gu-IN": ["સૂકી ખાંસી", "પીળો/લીલો કફ નીકળે છે", "સામાન્ય કફ"]
        }
      },
      {
        dimension: "breathlessness",
        priority: 8,
        question: {
          "en-IN": "Are you having any wheezing, chest tightness, or trouble breathing?",
          "hi-IN": "क्या सीने में जकड़न, सीटी जैसी आवाज (घरघराहट) या सांस लेने में परेशानी है?",
          "gu-IN": "શું છાતીમાં જકડન, સીટી જેવો અવાજ કે શ્વાસ લેવામાં મુશ્કેલી થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Mild breathlessness on walking", "Wheezing sound", "No breathing trouble"],
          "hi-IN": ["चलने पर हल्की सांस फूलना", "घरघराहट की आवाज", "कोई तकलीफ नहीं"],
          "gu-IN": ["ચાલતી વખતે શ્વાસ ચડે છે", "સીટી જેવો અવાજ", "ના, શ્વાસ સામાન્ય છે"]
        }
      }
    ],
    red_flag_indicators: [
      "coughing up blood (hemoptysis)",
      "severe stridor or inability to speak full sentences",
      "cough with high fever and sudden chest pain",
      "unexplained weight loss with chronic cough >3 weeks"
    ]
  },

  // 6. HEADACHE
  {
    complaint_id: "ckb_headache",
    complaint: "headache",
    synonyms: ["head pain", "migraine", "માથાનો દુખાવો", "માથું ચડવું", "અડધા માથાનો દુખાવો", "सिर दर्द", "माइग्रेन दर्द"],
    assessment_dimensions: [
      "onset",
      "duration",
      "severity",
      "location_one_both",
      "vision_blur",
      "nausea",
      "neck_stiffness",
      "fever"
    ],
    completion_criteria: ["onset", "severity", "vision_blur"],
    questions: [
      {
        dimension: "onset",
        priority: 10,
        question: {
          "en-IN": "Did the headache start suddenly like a thunderclap or build up slowly?",
          "hi-IN": "क्या सिर दर्द अचानक बिजली के झटके की तरह शुरू हुआ या धीरे-धीरे बढ़ा?",
          "gu-IN": "શું માથાનો દુખાવો અચાનક વીજળીના ઝટકાની જેમ શરૂ થયો કે ધીમે-ધીમે વધ્યો?"
        },
        quick_chips: {
          "en-IN": ["Gradual build up", "Sudden thunderclap start", "Throbbing on one side"],
          "hi-IN": ["धीरे-धीरे बढ़ा", "अचानक बहुत तेज हुआ", "एक तरफ धड़कने वाला दर्द"],
          "gu-IN": ["ધીમે ધીમે વધ્યો", "અચાનક ખૂબ તીવ્ર થયો", "એક બાજુ ધબકારા સાથે દુખાવો"]
        }
      },
      {
        dimension: "severity",
        priority: 9,
        question: {
          "en-IN": "On a scale of 1 to 10, how intense is the headache?",
          "hi-IN": "1 से 10 के पैमाने पर सिर दर्द कितना तेज है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર માથાનો દુખાવો કેટલો તીવ્ર છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)", "10 (Worst headache ever)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (काफी तेज)", "10 (असहनीय)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (ખૂબ વધારે)", "૧૦ (અસહ્ય)"]
        }
      },
      {
        dimension: "associated_symptoms",
        priority: 8,
        question: {
          "en-IN": "Are you experiencing any vomiting, blurred vision, sensitivity to light, or neck stiffness?",
          "hi-IN": "क्या उल्टी, धुंधला दिखना, रोशनी से परेशानी या गर्दन में अकड़न हो रही है?",
          "gu-IN": "શું ઉલ્ટી, ઝાંખું દેખાવું, પ્રકાશથી અકળામણ કે ગળામાં કઠિનતા થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Light sensitivity & nausea", "Blurred vision", "Neck stiffness", "No other symptoms"],
          "hi-IN": ["रोशनी से परेशानी और जी मिचलाना", "धुंधला दिखना", "गर्दन में अकड़न", "कोई अन्य लक्षण नहीं"],
          "gu-IN": ["પ્રકાશથી અકળામણ અને ઉબકા", "ઝાંખું દેખાય છે", "ગળામાં અકડાઈ", "ના, સામાન્ય દુખાવો છે"]
        }
      }
    ],
    red_flag_indicators: [
      "thunderclap headache reaching max intensity in seconds",
      "headache with neck stiffness and high fever",
      "headache with sudden weakness or speech difficulty",
      "headache following head injury with confusion"
    ]
  },

  // 7. ABDOMINAL / STOMACH PAIN
  {
    complaint_id: "ckb_abdominal_pain",
    complaint: "abdominal pain",
    synonyms: ["stomach pain", "belly ache", "gut pain", "પેટમાં દુખાવો", "પેટમાં ચૂંક", "પેટનો દુખાવો", "पेट में दर्द", "पेट दर्द", "मरोड़"],
    assessment_dimensions: [
      "location_quadrant",
      "duration",
      "severity",
      "onset",
      "vomiting",
      "bowel_habits",
      "fever",
      "food_relation"
    ],
    completion_criteria: ["location_quadrant", "duration", "severity", "vomiting"],
    questions: [
      {
        dimension: "location_quadrant",
        priority: 10,
        question: {
          "en-IN": "Where in the stomach is the pain located (e.g. upper abdomen, lower right, around navel, or all over)?",
          "hi-IN": "पेट में दर्द किस जगह हो रहा है (जैसे ऊपर, दाईं तरफ नीचे, नाभि के पास या पूरे पेट में)?",
          "gu-IN": "પેટમાં દુખાવો કઈ જગ્યાએ થાય છે (જેમ કે ઉપર, નીચે જમણી બાજુ, નાભિ પાસે કે આખા પેટમાં)?"
        },
        quick_chips: {
          "en-IN": ["Upper abdomen (acidity area)", "Lower right side", "Around belly button", "All over stomach"],
          "hi-IN": ["ऊपरी पेट (गैस/जलन वाली जगह)", "दाईं तरफ नीचे", "नाभि के आसपास", "पूरे पेट में"],
          "gu-IN": ["ઉપર પેટમાં (બળતરા પાસે)", "જમણી બાજુ નીચે", "નાભિ પાસે", "આખા પેટમાં"]
        }
      },
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "When did the stomach pain start and is it continuous or coming in waves (cramps)?",
          "hi-IN": "पेट दर्द कब शुरू हुआ और क्या यह लगातार है या मरोड़ के साथ रुक-रुक कर आता है?",
          "gu-IN": "પેટમાં દુખાવો ક્યારથી શરૂ થયો અને શું તે સતત રહે છે કે ચૂંક સાથે વધતો-ઓછો થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Since morning (continuous)", "Cramping waves", "Yesterday", "For 2-3 days"],
          "hi-IN": ["सुबह से (लगातार)", "मरोड़ के साथ", "कल से", "2-3 दिन से"],
          "gu-IN": ["સવારથી (સતત)", "ચૂંક સાથે આવે છે", "ગઈકાલથી", "૨-૩ દિવસથી"]
        }
      },
      {
        dimension: "severity",
        priority: 9,
        question: {
          "en-IN": "On a scale of 1 to 10, how severe is the stomach pain?",
          "hi-IN": "1 से 10 के पैमाने पर पेट दर्द कितना तेज है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર પેટનો દુખાવો કેટલો તીવ્ર છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (काफी तेज)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (તીવ્ર)"]
        }
      },
      {
        dimension: "associated_symptoms",
        priority: 8,
        question: {
          "en-IN": "Are you experiencing any vomiting, loose motions (diarrhea), inability to pass gas, or fever?",
          "hi-IN": "क्या उल्टी, दस्त, गैस पास न होना या बुखार जैसी कोई तकलीफ हो रही है?",
          "gu-IN": "શું ઉલ્ટી, ઝાડા, ગેસ પાસ ન થવો કે તાવ જેવી કોઈ તકલીફ થાય છે?"
        },
        quick_chips: {
          "en-IN": ["Vomiting & nausea", "Loose motions (diarrhea)", "Acidity & gas", "No other symptoms"],
          "hi-IN": ["उल्टी और जी मिचलाना", "दस्त हो रहे हैं", "गैस और जलन", "कोई अन्य लक्षण नहीं"],
          "gu-IN": ["ઉલ્ટી અને ઉબકા", "ઝાડા થઈ રહ્યા છે", "ગેસ અને બળતરા", "ના, અન્ય લક્ષણ નથી"]
        }
      }
    ],
    red_flag_indicators: [
      "severe rigid abdomen with extreme tenderness",
      "vomiting blood or black coffee ground vomit",
      "black tarry stools with abdominal pain",
      "inability to pass urine, gas, or stool with abdominal swelling"
    ]
  },

  // 8. BACK PAIN
  {
    complaint_id: "ckb_back_pain",
    complaint: "back pain",
    synonyms: ["lumbago", "lower back ache", "spine pain", "કમરનો દુખાવો", "પીઠનો દુખાવો", "કમર જકડાઈ જવી", "कमर दर्द", "पीठ दर्द", "रीढ़ की हड्डी में दर्द"],
    assessment_dimensions: [
      "onset",
      "duration",
      "severity",
      "radiation_legs",
      "numbness_tingling",
      "bladder_bowel_control",
      "trauma_lifting"
    ],
    completion_criteria: ["duration", "severity", "radiation_legs", "bladder_bowel_control"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "How long have you had this back pain?",
          "hi-IN": "यह कमर दर्द आपको कितने समय से है?",
          "gu-IN": "આ કમરનો દુખાવો તમને કેટલા સમયથી છે?"
        },
        quick_chips: {
          "en-IN": ["Since few days", "1-2 weeks", "Several months / chronic", "Started after lifting heavy"],
          "hi-IN": ["कुछ दिनों से", "1-2 हफ्ते से", "कई महीनों से", "वजन उठाने के बाद शुरू हुआ"],
          "gu-IN": ["થોડા દિવસથી", "૧-૨ અઠવાડિયાથી", "ઘણા મહિનાઓથી", "વજન ઊંચક્યા પછી"]
        }
      },
      {
        dimension: "severity",
        priority: 9,
        question: {
          "en-IN": "On a scale of 1 to 10, how intense is the back pain?",
          "hi-IN": "1 से 10 के पैमाने पर कमर दर्द कितना तेज है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર કમરનો દુખાવો કેટલો તીવ્ર છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (तेज)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (તીવ્ર)"]
        }
      },
      {
        dimension: "radiation_legs",
        priority: 8,
        question: {
          "en-IN": "Does the pain shoot down into your buttocks, thighs, or legs with tingling/numbness?",
          "hi-IN": "क्या दर्द नीचे पैरों में झनझनाहट या सुन्नपन के साथ जा रहा है?",
          "gu-IN": "શું દુખાવો પગમાં ઝણઝણાટી કે બહેરાશ સાથે નીચે ઉતરે છે?"
        },
        quick_chips: {
          "en-IN": ["Shooting pain down leg (sciatica)", "Tingling in feet", "Only in lower back"],
          "hi-IN": ["पैर में नीचे उतरता दर्द (सायटिका)", "पैरों में झनझनाहट", "केवल कमर में दर्द"],
          "gu-IN": ["પગમાં નીચે ઉતરતો દુખાવો (રાંઝણ)", "પગમાં ઝણઝણાટી", "ના, ફક્ત કમરમાં જ"]
        }
      }
    ],
    red_flag_indicators: [
      "back pain with loss of bladder or bowel control (Cauda Equina)",
      "back pain with sudden numbness around saddle/groin area",
      "back pain with sudden bilateral leg paralysis",
      "back pain with unexplained high fever and spine tenderness"
    ]
  },

  // 9. VOMITING
  {
    complaint_id: "ckb_vomiting",
    complaint: "vomiting",
    synonyms: ["emesis", "nausea and throwing up", "ઉલ્ટી", "ઉબકા", "ઉલ્ટી થવી", "उल्टी", "जी मिचलाना", "उल्टी होना"],
    assessment_dimensions: [
      "duration",
      "frequency",
      "fluid_retention",
      "vomitus_content",
      "diarrhea",
      "abdominal_pain",
      "fever",
      "blood_in_vomit"
    ],
    completion_criteria: ["duration", "frequency", "fluid_retention"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "When did the vomiting start and how many times have you thrown up?",
          "hi-IN": "उल्टी कब शुरू हुई और अब तक कितनी बार उल्टी हो चुकी है?",
          "gu-IN": "ઉલ્ટી ક્યારથી શરૂ થઈ છે અને કેટલી વાર થઈ?"
        },
        quick_chips: {
          "en-IN": ["1-2 times today", "3-5 times", "More than 6 times", "Started after food"],
          "hi-IN": ["आज 1-2 बार", "3-5 बार", "6 बार से ज्यादा", "खाना खाने के बाद"],
          "gu-IN": ["આજે ૧-૨ વાર", "૩-૫ વાર", "૬ વારથી વધારે", "જમ્યા પછી શરૂ થઈ"]
        }
      },
      {
        dimension: "fluid_retention",
        priority: 9,
        question: {
          "en-IN": "Are you able to keep water or liquids down, or are you vomiting everything out?",
          "hi-IN": "क्या आप पानी या तरल पदार्थ पी पा रहे हैं, या पानी पीने पर भी उल्टी हो रही है?",
          "gu-IN": "શું તમે પાણી કે પ્રવાહી પી શકો છો, કે પાણી પીવાથી પણ ઉલ્ટી થઈ જાય છે?"
        },
        quick_chips: {
          "en-IN": ["Able to drink water", "Cannot keep fluids down", "Extreme thirst & dry mouth"],
          "hi-IN": ["पानी पी पा रहे हैं", "पानी भी नहीं रुक रहा", "बहुत ज्यादा प्यास और सूखापन"],
          "gu-IN": ["પાણી પી શકું છું", "પાણી પણ નથી ટકતું", "ખૂબ તરસ અને મોં સુકાવું"]
        }
      }
    ],
    red_flag_indicators: [
      "vomiting fresh red blood or black coffee ground material",
      "vomiting with severe unremitting abdominal pain",
      "inability to keep any fluids for >24h with severe dehydration",
      "vomiting following head injury with lethargy or confusion"
    ]
  },

  // 10. DIZZINESS
  {
    complaint_id: "ckb_dizziness",
    complaint: "dizziness",
    synonyms: ["vertigo", "lightheadedness", "fainting feeling", "ચક્કર", "ચક્કર આવવા", "માથું ઘૂમવું", "चक्कर आना", "सिर घूमना", "कमजोरी से चक्कर"],
    assessment_dimensions: [
      "onset",
      "room_spinning_vertigo",
      "duration",
      "syncope_fainting",
      "hearing_loss_tinnitus",
      "postural_change",
      "chest_palpitations"
    ],
    completion_criteria: ["onset", "room_spinning_vertigo", "syncope_fainting"],
    questions: [
      {
        dimension: "room_spinning_vertigo",
        priority: 10,
        question: {
          "en-IN": "Does the room feel like it is spinning around you, or is it a general feeling of faintness/lightheadedness?",
          "hi-IN": "क्या कमरा चारों तरफ घूमता हुआ लगता है या सिर्फ कमजोरी और सिर हल्का लग रहा है?",
          "gu-IN": "શું આખી દુનિયા કે રૂમ ગોળ-ગોળ ફરતી લાગે છે કે ફક્ત નબળાઈ અને માથું હળવું લાગે છે?"
        },
        quick_chips: {
          "en-IN": ["Room spinning (vertigo)", "Feeling faint on standing up", "General weakness"],
          "hi-IN": ["कमरा घूम रहा है (चक्कर)", "खड़े होने पर चक्कर", "सामान्य कमजोरी"],
          "gu-IN": ["રૂમ ગોળ ફરતી લાગે છે (ચક્કર)", "ઊભા થતાં જ ચક્કર", "સામાન્ય નબળાઈ"]
        }
      },
      {
        dimension: "syncope_fainting",
        priority: 9,
        question: {
          "en-IN": "Did you black out, lose consciousness, or fall down when the dizziness happened?",
          "hi-IN": "क्या चक्कर आने पर आप बेहोश हो गए थे या आंखों के सामने अंधेरा छा गया था?",
          "gu-IN": "શું ચક્કર આવતાં તમે બેહોશ થઈ ગયા હતા કે આંખે અંધારા આવી ગયા હતા?"
        },
        quick_chips: {
          "en-IN": ["No loss of consciousness", "Vision went black for a moment", "Fell down"],
          "hi-IN": ["बेहोश नहीं हुए", "पल भर के लिए अंधेरा छाया", "चक्कर खाकर गिरे"],
          "gu-IN": ["ના, બેહોશ નથી થયા", "ક્ષણ માટે અંધારા આવ્યા", "ચક્કર આવીને પડી ગયા"]
        }
      }
    ],
    red_flag_indicators: [
      "dizziness with sudden loss of consciousness (syncope)",
      "dizziness with sudden speech slurring or one-sided arm weakness",
      "dizziness accompanied by severe chest pressure or palpitations",
      "dizziness with severe sudden ataxia (inability to stand or walk)"
    ]
  },
  // 9. ACUTE DIARRHEA & LOOSE MOTIONS
  {
    complaint_id: "ckb_diarrhea",
    complaint: "Acute Diarrhea / Loose Motions",
    synonyms: [
      "diarrhea", "loose motions", "watery stool", "watery diarrhea", "gastroenteritis", "stomach upset", "dysentery",
      "ઝાડા", "પાણી જેવી ટોઈલતે", "પાણી જેવા ઝાડા", "લૂઝ મોશન", "પાતળા ઝાડા", "ઉલટી-ઝાડા", "ટોયલેટ", "ટોઈલતે",
      "તરસ", "સ્તૂલ", "દસ્ત", "लूज मोशन", "पतले दस्त", "पानी जैसे दस्त", "उल्टी दस्त", "पेट खराब"
    ],
    assessment_dimensions: [
      "frequency",
      "hydration_status",
      "blood_in_stool",
      "associated_symptoms",
      "duration"
    ],
    completion_criteria: ["frequency", "hydration_status", "blood_in_stool"],
    questions: [
      {
        dimension: "frequency",
        priority: 10,
        question: {
          "en-IN": "How many episodes or times have you had loose or watery motions today?",
          "hi-IN": "आज आपको कितनी बार पानी जैसे पतले दस्त या लूज मोशन हुए हैं?",
          "gu-IN": "આજે તમને કેટલી વાર પાણી જેવી ટોઈલતે કે ઝાડા થયા છે?"
        },
        quick_chips: {
          "en-IN": ["1 to 2 times", "3 to 5 times", "More than 5 times", "Continuous watery stools"],
          "hi-IN": ["1 से 2 बार", "3 से 5 बार", "5 से अधिक बार", "लगातार पानी जैसे दस्त"],
          "gu-IN": ["૧ થી ૨ વાર", "૩ થી ૫ વાર", "૫ થી વધુ વાર", "વારંવાર પાણી જેવી ટોઈલતે"]
        }
      },
      {
        dimension: "hydration_status",
        priority: 9,
        question: {
          "en-IN": "Are you experiencing extreme thirst, dizziness, dry mouth, or reduced urine output?",
          "hi-IN": "क्या आपको बहुत ज्यादा प्यास लग रही है, चक्कर आ रहे हैं, मुंह सूख रहा है या पेशाब कम आ रहा है?",
          "gu-IN": "શું તમને ખૂબ વધારે તરસ લાગે છે, ચક્કર આવે છે, મોં સુકાય છે કે પેશાબ ઓછો થયો છે?"
        },
        quick_chips: {
          "en-IN": ["Extreme thirst & dizziness", "Dry mouth only", "Feeling weak", "No dehydration signs"],
          "hi-IN": ["बहुत प्यास और चक्कर", "सिर्फ मुंह सूख रहा है", "कमजोरी लग रही है", "डिहाइड्रेशन के कोई लक्षण नहीं"],
          "gu-IN": ["ખૂબ તરસ અને ચક્કર છે", "માત્ર મોં સુકાય છે", "નબળાઈ લાગે છે", "ના, હાઈડ્રેશન સામાન્ય છે"]
        }
      },
      {
        dimension: "blood_in_stool",
        priority: 9,
        question: {
          "en-IN": "Have you noticed any blood, black tarry appearance, or mucus in the stools?",
          "hi-IN": "क्या दस्त में खून, कालापन या आंव (म्यूकस) आ रहा है?",
          "gu-IN": "શું ટોઈલતે કે ઝાડામાં લોહી, કાળો રંગ કે ચીકાશ (આમ) જોવા મળ્યું છે?"
        },
        quick_chips: {
          "en-IN": ["No blood or mucus", "Yes, blood is present", "Mucus only", "Dark black stool"],
          "hi-IN": ["कोई खून नहीं", "हाँ, खून आ रहा है", "सिर्फ आंव/म्यूकस है", "काला मल"],
          "gu-IN": ["ના, લોહી કે ચીકાશ નથી", "હા, લોહી દેખાયું છે", "માત્ર ચીકાશ છે", "કાળા રંગની ટોઈલતે"]
        }
      },
      {
        dimension: "associated_symptoms",
        priority: 8,
        question: {
          "en-IN": "Do you also have abdominal cramping, vomiting, or fever?",
          "hi-IN": "क्या पेट में मरोड़/दर्द, उल्टी या बुखार भी है?",
          "gu-IN": "સાથે પેટમાં ચૂક કે દુખાવો, ઉલટી અથવા તાવ પણ છે?"
        },
        quick_chips: {
          "en-IN": ["Abdominal cramps present", "Vomiting and nausea", "Fever present", "No other symptoms"],
          "hi-IN": ["पेट में मरोड़ है", "उल्टी और जी मिचलाना", "बुखार है", "कोई अन्य लक्षण नहीं"],
          "gu-IN": ["પેટમાં ચૂક આવે છે", "ઉલટી થાય છે", "તાવ છે", "ના, માત્ર ઝાડા છે"]
        }
      }
    ],
    red_flag_indicators: [
      "blood in stool or black tarry stools (hematochezia/melena)",
      "severe dehydration signs: sunken eyes, lethargy, unable to drink fluids",
      "persistent high fever with acute severe diarrhea",
      "diarrhea with severe unremitting abdominal pain"
    ]
  }
];

/**
 * Clean Abstraction Layer: Retrieve relevant Clinical Knowledge for a patient's complaint
 * In future: This function will query MongoDB `clinical_knowledge_bases` collection.
 */
export function getClinicalKnowledge(complaintText) {
  if (!complaintText) return null;
  const textLower = String(complaintText).toLowerCase().trim();

  // 1. Direct match or synonym match
  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    if (textLower.includes(entry.complaint.toLowerCase()) || entry.complaint.toLowerCase().includes(textLower)) {
      return entry;
    }
    for (const syn of entry.synonyms) {
      if (textLower.includes(syn.toLowerCase()) || syn.toLowerCase().includes(textLower)) {
        return entry;
      }
    }
  }

  // 2. Generic fallback if no specific match
  return {
    complaint_id: "ckb_general",
    complaint: "general",
    synonyms: [],
    assessment_dimensions: ["onset", "duration", "severity", "associated_symptoms"],
    completion_criteria: ["duration", "severity"],
    questions: [
      {
        dimension: "duration",
        priority: 10,
        question: {
          "en-IN": "When did this symptom start and how long has it been troubling you?",
          "hi-IN": "यह लक्षण कब शुरू हुआ और कितने समय से आपको परेशान कर रहा है?",
          "gu-IN": "આ તકલીફ ક્યારે શરૂ થઈ અને કેટલા સમયથી તમને પરેશાન કરે છે?"
        },
        quick_chips: {
          "en-IN": ["Since this morning", "Yesterday", "Few days ago", "More than a week"],
          "hi-IN": ["आज सुबह से", "कल से", "कुछ दिनों से", "एक हफ्ते से ज्यादा"],
          "gu-IN": ["આજ સવારથી", "ગઈકાલથી", "થોડા દિવસથી", "૧ અઠવાડિયાથી વધુ"]
        }
      },
      {
        dimension: "severity",
        priority: 9,
        question: {
          "en-IN": "On a scale of 1 to 10, how severe is this discomfort?",
          "hi-IN": "1 से 10 के पैमाने पर यह तकलीफ कितनी है?",
          "gu-IN": "૧ થી ૧૦ ના સ્કેલ પર આ તકલીફ કેટલી તીવ્ર છે?"
        },
        quick_chips: {
          "en-IN": ["3 (Mild)", "5 (Moderate)", "8 (Severe)"],
          "hi-IN": ["3 (हल्का)", "5 (मध्यम)", "8 (काफी तेज)"],
          "gu-IN": ["૩ (હળવો)", "૫ (મધ્યમ)", "૮ (તીવ્ર)"]
        }
      }
    ],
    red_flag_indicators: ["severe acute distress", "loss of consciousness", "severe breathing difficulty"]
  };
}

/**
 * Question Selection Engine using Structured Clinical Knowledge Base
 */
export function selectNextQuestionFromKnowledgeBase(clinicalState, language = "gu-IN", opdMode = "GENERAL") {
  const langKey = language.toLowerCase().startsWith("gu") ? "gu-IN" : language.toLowerCase().startsWith("hi") ? "hi-IN" : "en-IN";
  
  const chief = (clinicalState.chief_complaints?.[0] || clinicalState.symptoms?.[0] || "").toLowerCase();
  const ckbEntry = getClinicalKnowledge(chief);

  // Determine which dimensions are already answered in clinicalState
  const answeredDimensions = new Set(clinicalState.answered_questions || []);

  if (clinicalState.duration && clinicalState.duration.length > 0) {
    answeredDimensions.add("duration");
    answeredDimensions.add("onset");
  }
  if (clinicalState.severity && clinicalState.severity.length > 0) {
    answeredDimensions.add("severity");
  }
  if (clinicalState.location && clinicalState.location.length > 0) {
    answeredDimensions.add("location");
    answeredDimensions.add("location_quadrant");
  }
  if (clinicalState.onset && clinicalState.onset.length > 0) {
    answeredDimensions.add("onset");
  }
  if (clinicalState.associated_symptoms && clinicalState.associated_symptoms.length > 0) {
    // If associated symptoms recorded, mark relevant dimensions answered
    answeredDimensions.add("associated_symptoms");
    const assocStr = clinicalState.associated_symptoms.join(" ").toLowerCase();
    if (assocStr.includes("stiff") || assocStr.includes("કઠિનતા")) answeredDimensions.add("stiffness");
    if (assocStr.includes("swell") || assocStr.includes("સોજો")) answeredDimensions.add("swelling");
    if (assocStr.includes("breath") || assocStr.includes("શ્વાસ")) answeredDimensions.add("breathing");
    if (assocStr.includes("sweat") || assocStr.includes("પરસેવો")) answeredDimensions.add("sweating");
  }

  // Filter and sort remaining candidate questions by priority
  const candidateQuestions = ckbEntry.questions.filter((q) => !answeredDimensions.has(q.dimension));
  candidateQuestions.sort((a, b) => b.priority - a.priority);

  if (candidateQuestions.length > 0) {
    const selected = candidateQuestions[0];
    return {
      next_question: selected.question[langKey] || selected.question["en-IN"],
      dimension: selected.dimension,
      priority: selected.priority,
      reason: `Clinical Knowledge Base dimension '${selected.dimension}' has priority ${selected.priority} for '${ckbEntry.complaint}'.`,
      quick_chips: selected.quick_chips?.[langKey] || selected.quick_chips?.["en-IN"] || [],
      ckb_complaint: ckbEntry.complaint
    };
  }

  // If all CKB dimensions are answered
  const completedText = {
    "gu-IN": "તમારો સંપૂર્ણ તબીબી ઈતિહાસ નોંધી લેવામાં આવ્યો છે. ડૉક્ટર સમક્ષ સારાંશ તૈયાર છે.",
    "hi-IN": "आपका मेडिकल इतिहास सफलतापूर्वक दर्ज कर लिया गया है। डॉक्टर के लिए सारांश तैयार है।",
    "en-IN": "Your medical history has been recorded. We are preparing it for the doctor."
  };

  return {
    next_question: completedText[langKey] || completedText["en-IN"],
    dimension: "completed",
    priority: 0,
    reason: "All essential clinical dimensions gathered from knowledge base.",
    quick_chips: [],
    ckb_complaint: ckbEntry.complaint
  };
}
