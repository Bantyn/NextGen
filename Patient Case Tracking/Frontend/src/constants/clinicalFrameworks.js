/**
 * 8 Common Clinical Disease Question Frameworks (SOCRATES & Adaptive Clinical Protocols)
 * Standardized for Sehat Pre-Consultation History Engine.
 */
export const CLINICAL_DISEASE_FRAMEWORKS = {
  CHEST_PAIN: {
    category: 'Chest Pain (છાતીમાં દુખાવો / सीने में दर्द)',
    framework: 'SOCRATES',
    red_flag_triggers: ['breathlessness', 'sweating', 'left arm radiation', 'jaw pain', 'choking', 'crushing pressure', 'ઘબરામણ', 'ચક્કર', 'ડાબા હાથમાં દુખાવો'],
    steps: [
      {
        step_id: 'onset_timing',
        socrates_code: 'O',
        topic: 'Onset & Duration',
        question: {
          'gu-IN': 'છાતીમાં દુખાવો ક્યારે અને કેવી રીતે શરૂ થયો? અચાનક કે ધીમે-ધીમે?',
          'hi-IN': 'सीने में दर्द कब और कैसे शुरू हुआ? अचानक या धीरे-धीरे?',
          'en-IN': 'When and how did the chest pain start? Suddenly or gradually?'
        },
        quick_chips: {
          'gu-IN': ['અચાનક ૧ કલાક પહેલા', 'આજ સવારથી', '૨-૩ દિવસથી', 'ચાલતી વખતે'],
          'hi-IN': ['अचानक 1 घंटे पहले', 'आज सुबह से', '2-3 दिन से', 'चलते समय'],
          'en-IN': ['Suddenly 1 hour ago', 'Since this morning', '2-3 days ago', 'While walking']
        }
      },
      {
        step_id: 'site_location',
        socrates_code: 'S',
        topic: 'Site & Location',
        question: {
          'gu-IN': 'દુખાવો છાતીમાં બરાબર કઈ જગ્યાએ થાય છે? ડાબી બાજુ, વચ્ચે કે જમણી બાજુ?',
          'hi-IN': 'दर्द सीने में ठीक किस जगह हो रहा है? बाईं तरफ, बीच में या दाईं तरफ?',
          'en-IN': 'Where exactly is the pain located? Left side, center, or right side?'
        },
        quick_chips: {
          'gu-IN': ['ડાબી બાજુ', 'બરાબર વચ્ચે', 'જમણી બાજુ', 'આખી છાતીમાં'],
          'hi-IN': ['बाईं तरफ', 'बिल्कुल बीच में', 'दाईं तरफ', 'पूरे सीने में'],
          'en-IN': ['Left side', 'Center of chest', 'Right side', 'All over chest']
        }
      },
      {
        step_id: 'character_nature',
        socrates_code: 'C',
        topic: 'Character of Pain',
        question: {
          'gu-IN': 'દુખાવો કેવો લાગે છે? દબાણ/ભારેપણું જેવો, સોય ભોંકાતી હોય તેવો કે બળતરા જેવો?',
          'hi-IN': 'दर्द कैसा महसूस होता है? भारीपन/दबाव जैसा, चुभने वाला या जलन जैसा?',
          'en-IN': 'How does the pain feel? Heavy pressure, sharp stabbing, or burning sensation?'
        },
        quick_chips: {
          'gu-IN': ['ભારે દબાણ જેવો', 'તીક્ષ્ણ સોય જેવો', 'એસિડિટી જેવી બળતરા', 'ખેંચાણ જેવો'],
          'hi-IN': ['भारी दबाव जैसा', 'तेज चुभन जैसा', 'एसिडिटी जैसी जलन', 'खिंचाव जैसा'],
          'en-IN': ['Heavy squeezing pressure', 'Sharp stabbing', 'Burning acidity sensation', 'Muscle pull']
        }
      },
      {
        step_id: 'radiation',
        socrates_code: 'R',
        topic: 'Radiation',
        question: {
          'gu-IN': 'શું આ દુખાવો તમારા ડાબા હાથ, ગરદન, જડબા કે પીઠ તરફ ફેલાય છે?',
          'hi-IN': 'क्या यह दर्द आपके बाएं हाथ, गर्दन, जबड़े या पीठ की तरफ फैलता है?',
          'en-IN': 'Does the pain radiate or spread to your left arm, neck, jaw, or back?'
        },
        quick_chips: {
          'gu-IN': ['હા, ડાબા હાથમાં ફેલાય છે', 'હા, પીઠ તરફ જાય છે', 'ના, ફક્ત છાતીમાં જ છે'],
          'hi-IN': ['हाँ, बाएं हाथ में फैलता है', 'हाँ, पीठ की तरफ जाता है', 'नहीं, सिर्फ सीने में है'],
          'en-IN': ['Yes, spreads to left arm', 'Yes, goes to back', 'No, only in chest']
        }
      },
      {
        step_id: 'associated_symptoms',
        socrates_code: 'A',
        topic: 'Associated Symptoms',
        question: {
          'gu-IN': 'દુખાવાની સાથે શ્વાસ લેવામાં તકલીફ, પરસેવો વળવો કે ગભરામણ થાય છે?',
          'hi-IN': 'दर्द के साथ सांस फूलना, पसीना आना या घबराहट महसूस हो रही है?',
          'en-IN': 'Are you experiencing breathing difficulty, excessive sweating, or dizziness?'
        },
        quick_chips: {
          'gu-IN': ['હા, શ્વાસ ચડે છે', 'ખૂબ પરસેવો થાય છે', 'ઉબકા/ઉલટી જેવું થાય છે', 'ના, બીજું કંઈ નથી'],
          'hi-IN': ['हाँ, सांस फूल रही है', 'बहुत पसीना आ रहा है', 'उल्टी/जी मिचलाना', 'नहीं, कुछ और नहीं'],
          'en-IN': ['Yes, shortness of breath', 'Profuse sweating', 'Nausea/Vomiting', 'No other symptoms']
        }
      },
      {
        step_id: 'exacerbating_factors',
        socrates_code: 'E',
        topic: 'Exacerbating & Relieving Factors',
        question: {
          'gu-IN': 'ચાલવાથી કે વજન ઉપાડવાથી દુખાવો વધે છે? આરામ કરવાથી રાહત મળે છે?',
          'hi-IN': 'चलने या भारी वजन उठाने से दर्द बढ़ता है? आराम करने से कुछ राहत मिलती है?',
          'en-IN': 'Does walking or exertion make it worse? Does resting provide relief?'
        },
        quick_chips: {
          'gu-IN': ['ચાલવાથી વધે છે', 'આરામ કરવાથી રાહત થાય છે', 'જમ્યા પછી વધે છે', 'કંઈ ફેર નથી પડતો'],
          'hi-IN': ['चलने से बढ़ता है', 'आराम से राहत मिलती है', 'खाना खाने के बाद बढ़ता है', 'कोई फर्क नहीं पड़ता'],
          'en-IN': ['Worse with exertion', 'Relieved by rest', 'Worse after meals', 'Constant no change']
        }
      },
      {
        step_id: 'severity',
        socrates_code: 'S',
        topic: 'Severity (1 to 10 scale)',
        question: {
          'gu-IN': '૧ થી ૧૦ ના સ્કેલ પર આ દુખાવો કેટલો તીવ્ર છે? (૧ = સામાન્ય, ૧૦ = અસહ્ય)',
          'hi-IN': '1 से 10 के पैमाने पर यह दर्द कितना तेज है? (1 = हल्का, 10 = असहनीय)',
          'en-IN': 'On a scale of 1 to 10, how severe is the pain right now?'
        },
        quick_chips: {
          'gu-IN': ['હળવો (૧-૩)', 'મધ્યમ (૪-૬)', 'તીવ્ર (૭-૮)', 'અસહ્ય (૯-૧૦)'],
          'hi-IN': ['हल्का (1-3)', 'मध्यम (4-6)', 'तेज (7-8)', 'असहनीय (9-10)'],
          'en-IN': ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-8)', 'Unbearable (9-10)']
        }
      }
    ]
  },

  FEVER: {
    category: 'Fever & Shivering (તાવ / बुखार)',
    framework: 'INFECTIOUS_OPD',
    red_flag_triggers: ['high fever with rash', 'stiff neck', 'altered consciousness', 'continuous vomiting', 'ખૂબ ધ્રુજારી'],
    steps: [
      {
        step_id: 'duration',
        topic: 'Duration',
        question: {
          'gu-IN': 'તાવ કેટલા દિવસથી આવે છે? દિવસમાં કયા સમયે વધારે રહે છે?',
          'hi-IN': 'बुखार कितने दिनों से आ रहा है? दिन में किस समय ज्यादा तेज होता है?',
          'en-IN': 'How many days have you had the fever? Does it peak at a specific time?'
        },
        quick_chips: {
          'gu-IN': ['આજથી જ શરૂ થયો', '૨-૩ દિવસથી', '૫ દિવસથી વધુ', 'સાંજે વધારે આવે છે'],
          'hi-IN': ['आज से ही शुरू हुआ', '2-3 दिनों से', '5 दिन से ज्यादा', 'शाम को तेज होता है'],
          'en-IN': ['Started today', '2-3 days', 'More than 5 days', 'Higher in evening']
        }
      },
      {
        step_id: 'chills_rigors',
        topic: 'Chills & Shivering',
        question: {
          'gu-IN': 'શું તાવ આવતા પહેલા ઠંડી લાગીને ધ્રુજારી આવે છે?',
          'hi-IN': 'क्या बुखार आने से पहले तेज ठंड लगकर कंपकंपी छूटती है?',
          'en-IN': 'Do you experience chills or severe shivering before the fever rises?'
        },
        quick_chips: {
          'gu-IN': ['હા, ખૂબ ધ્રુજારી આવે છે', 'ના, સામાન્ય ગરમ લાગે છે', 'તાવ ઉતરતી વખતે પરસેવો વળે છે'],
          'hi-IN': ['हाँ, तेज कंपकंपी आती है', 'नहीं, सिर्फ शरीर गर्म रहता है', 'उतरते समय पसीना आता है'],
          'en-IN': ['Yes, severe shivering', 'No, just feeling hot', 'Profuse sweating when fever drops']
        }
      },
      {
        step_id: 'associated_symptoms',
        topic: 'Associated Symptoms',
        question: {
          'gu-IN': 'તાવ સાથે માથું દુખવું, ઉધરસ, પેશાબમાં બળતરા કે પેટમાં દુખાવો જેવું કંઈ છે?',
          'hi-IN': 'बुखार के साथ सिरदर्द, खांसी, पेशाब में जलन या पेट दर्द जैसी कोई तकलीफ है?',
          'en-IN': 'Along with fever, do you have headache, cough, burning urination, or body pain?'
        },
        quick_chips: {
          'gu-IN': ['માથું અને શરીર તૂટે છે', 'ગળામાં દુખાવો અને ઉધરસ', 'પેશાબમાં બળતરા થાય છે', 'બીજું કંઈ નથી'],
          'hi-IN': ['सिर और बदन दर्द', 'गले में दर्द और खांसी', 'पेशाब में जलन', 'कोई अन्य लक्षण नहीं'],
          'en-IN': ['Headache & Body ache', 'Sore throat & cough', 'Burning urination', 'No other symptoms']
        }
      }
    ]
  },

  COUGH_COLD: {
    category: 'Cough & Respiratory (ઉધરસ / खांसी व जुकाम)',
    framework: 'RESPIRATORY_OPD',
    red_flag_triggers: ['blood in cough', 'severe breathlessness', 'stridor', 'cyanosis', 'લોહી આવવું'],
    steps: [
      {
        step_id: 'cough_nature',
        topic: 'Dry or Wet Cough',
        question: {
          'gu-IN': 'ઉધરસ સૂકી આવે છે કે કફ/ગળફા સાથે નીકળે છે?',
          'hi-IN': 'खांसी सूखी है या बलगम/कफ के साथ आ रही है?',
          'en-IN': 'Is your cough dry, or do you have phlegm/mucus?'
        },
        quick_chips: {
          'gu-IN': ['સૂકી ઉધરસ છે', 'પીળો/લીલો કફ નીકળે છે', 'સફેદ કફ છે', 'રાત્રે ઉધરસ વધી જાય છે'],
          'hi-IN': ['सूखी खांसी है', 'पीला/हरा बलगम आता है', 'सफेद कफ आता है', 'रात में खांसी बढ़ जाती है'],
          'en-IN': ['Dry hacking cough', 'Yellow/green phlegm', 'Clear white mucus', 'Worse at night']
        }
      },
      {
        step_id: 'hemoptysis',
        topic: 'Blood in Sputum',
        question: {
          'gu-IN': 'ઉધરસમાં ક્યારેય લોહી કે લાલ રંગનો કફ જોવા મળ્યો છે?',
          'hi-IN': 'क्या खांसी में कभी खून या लाल रंग का बलगम दिखाई दिया है?',
          'en-IN': 'Have you ever noticed any blood or reddish tinge in your cough?'
        },
        quick_chips: {
          'gu-IN': ['ના, ક્યારેય નથી આવ્યું', 'હા, થોડું લોહી દેખાયું હતું'],
          'hi-IN': ['नहीं, कभी नहीं आया', 'हाँ, थोड़ा खून दिखा था'],
          'en-IN': ['No blood at all', 'Yes, noticed blood streak']
        }
      },
      {
        step_id: 'breathlessness',
        topic: 'Breathing Difficulty / Wheezing',
        question: {
          'gu-IN': 'શું શ્વાસ લેતી વખતે સીટી જેવો અવાજ આવે છે કે શ્વાસ ચડે છે?',
          'hi-IN': 'क्या सांस लेते समय सीटी जैसी आवाज (घरघराहट) आती है या सांस फूलती है?',
          'en-IN': 'Do you have wheezing sounds in chest or difficulty breathing?'
        },
        quick_chips: {
          'gu-IN': ['હા, શ્વાસ ચડે છે', 'હા, સીટી જેવો અવાજ આવે છે', 'ના, શ્વાસ સામાન્ય છે'],
          'hi-IN': ['हाँ, सांस फूलती है', 'हाँ, घरघराहट होती है', 'नहीं, सांस सामान्य है'],
          'en-IN': ['Yes, breathlessness', 'Yes, wheezing sound', 'No, breathing is normal']
        }
      }
    ]
  },

  STOMACH_PAIN: {
    category: 'Abdominal / Gastrointestinal (પેટમાં દુખાવો / पेट दर्द)',
    framework: 'GASTRO_OPD',
    red_flag_triggers: ['black tarry stools', 'persistent vomiting', 'rigid board-like abdomen', 'high fever with jaundice'],
    steps: [
      {
        step_id: 'location',
        topic: 'Location in Abdomen',
        question: {
          'gu-IN': 'પેટમાં દુખાવો ઉપરના ભાગમાં (છાતી નીચે), નાભિ પાસે કે નીચેના ભાગમાં થાય છે?',
          'hi-IN': 'पेट में दर्द ऊपरी हिस्से (सीने के नीचे), नाभि के पास या निचले हिस्से में है?',
          'en-IN': 'Where in the stomach is the pain? Upper abdomen, around navel, or lower abdomen?'
        },
        quick_chips: {
          'gu-IN': ['ઉપરના ભાગમાં (એસિડિટી)', 'નાભિની આસપાસ', 'નીચે જમણી બાજુ', 'આખા પેટમાં ચૂંક આવે છે'],
          'hi-IN': ['ऊपरी हिस्से में (एसिडिटी)', 'नाभि के चारों ओर', 'निचले दाएं हिस्से में', 'पूरे पेट में मरोड़'],
          'en-IN': ['Upper epigastric (Acidity)', 'Around navel', 'Lower right side', 'Cramping all over']
        }
      },
      {
        step_id: 'meals_relation',
        topic: 'Relation to Meals',
        question: {
          'gu-IN': 'શું જમ્યા પછી દુખાવો વધે છે કે ભૂખ્યા પેટે વધારે દુખે છે?',
          'hi-IN': 'क्या खाना खाने के बाद दर्द बढ़ता है या खाली पेट ज्यादा दर्द होता है?',
          'en-IN': 'Does the pain worsen after eating meals or when your stomach is empty?'
        },
        quick_chips: {
          'gu-IN': ['જમ્યા પછી તરત વધે છે', 'ભૂખ્યા પેટે વધારે દુખે છે', 'તીખું-તળેલું ખાધા પછી', 'કંઈ સંબંધ નથી'],
          'hi-IN': ['खाने के तुरंत बाद बढ़ता है', 'खाली पेट ज्यादा दर्द होता है', 'मसालेदार खाने के बाद', 'कोई संबंध नहीं'],
          'en-IN': ['Worse immediately after food', 'Worse on empty stomach', 'Worse after oily/spicy food', 'No relation to food']
        }
      },
      {
        step_id: 'bowel_vomiting',
        topic: 'Bowel Habits & Vomiting',
        question: {
          'gu-IN': 'ઝાડા (ડાયરીયા), કબજિયાત કે ઉલ્ટી જેવી કોઈ તકલીફ છે?',
          'hi-IN': 'दस्त (लूज मोशन), कब्ज या उल्टी जैसी कोई परेशानी हो रही है?',
          'en-IN': 'Are you experiencing loose motions, constipation, or vomiting?'
        },
        quick_chips: {
          'gu-IN': ['પાતળા ઝાડા થાય છે', 'ખૂબ કબજિયાત છે', 'ઉલટી અને ઉબકા થાય છે', 'ઝાડા-પેશાબ સામાન્ય છે'],
          'hi-IN': ['दस्त लग रहे हैं', 'बहुत कब्ज है', 'उल्टी और मिचली', 'मल-मूत्र सामान्य है'],
          'en-IN': ['Loose watery stools', 'Severe constipation', 'Nausea & vomiting', 'Normal bowel movement']
        }
      }
    ]
  },

  HEADACHE: {
    category: 'Headache & Neurological (માથાનો દુખાવો / सिरदर्द)',
    framework: 'NEURO_OPD',
    red_flag_triggers: ['worst headache of life (thunderclap)', 'vision loss', 'paralysis or limb weakness', 'neck stiffness with fever'],
    steps: [
      {
        step_id: 'nature_location',
        topic: 'Character & Side',
        question: {
          'gu-IN': 'માથાનો દુખાવો અડધા માથામાં થાય છે કે આખા માથામાં? નસ ખેંચાતી હોય તેવો ધબકારા વાળો છે?',
          'hi-IN': 'सिरदर्द आधे सिर में है या पूरे सिर में? क्या नसों में धड़कन (माइग्रेन) जैसा महसूस होता है?',
          'en-IN': 'Is the headache on one side or all over? Is it a throbbing/pulsating pain?'
        },
        quick_chips: {
          'gu-IN': ['અડધા માથામાં (માઈગ્રેન)', 'કપાળ અને આંખો પાછળ', 'પાછળ ગરદન તરફ', 'આખું માથું ભારે લાગે છે'],
          'hi-IN': ['आधे सिर में (माइग्रेन)', 'माथे और आंखों के पीछे', 'पीछे गर्दन की तरफ', 'पूरा सिर भारी है'],
          'en-IN': ['One side (Migraine-like)', 'Forehead & behind eyes', 'Back of head/neck', 'Heavy dull ache all over']
        }
      },
      {
        step_id: 'aura_nausea',
        topic: 'Visual Aura & Light Sensitivity',
        question: {
          'gu-IN': 'શું અજવાળું કે અવાજ અસહ્ય લાગે છે? આંખો સામે ઝબકારા કે ઉલટી જેવું થાય છે?',
          'hi-IN': 'क्या रोशनी या तेज आवाज से परेशानी होती है? आंखों के आगे धुंधलापन या उल्टी का मन होता है?',
          'en-IN': 'Do bright light or loud sounds bother you? Any nausea or visual sparkles?'
        },
        quick_chips: {
          'gu-IN': ['હા, અજવાળામાં દુખાવો વધે છે', 'ઉલટી જેવું થાય છે', 'ના, એવું કંઈ નથી'],
          'hi-IN': ['हाँ, रोशनी से तकलीफ बढ़ती है', 'उल्टी जैसा महसूस होता है', 'नहीं, ऐसा कुछ नहीं है'],
          'en-IN': ['Yes, sensitive to light', 'Nausea present', 'No sensitivity']
        }
      }
    ]
  },

  BODY_JOINT_PAIN: {
    category: 'Joint & Musculoskeletal / Sandhigata Vata (સાંધા અને શરીરનો દુખાવો / जोड़ों का दर्द)',
    framework: 'AYUSH_RHEUMATOID_OPD',
    red_flag_triggers: ['hot red swollen joint with fever', 'inability to bear weight'],
    steps: [
      {
        step_id: 'affected_joints',
        topic: 'Affected Joints',
        question: {
          'gu-IN': 'કયા સાંધામાં દુખાવો થાય છે? ઘૂંટણ, કમર, ખભા કે આંગળીઓમાં?',
          'hi-IN': 'किन जोड़ों में दर्द हो रहा है? घुटने, कमर, कंधे या उंगलियों में?',
          'en-IN': 'Which joints are affected? Knees, lower back, shoulders, or small finger joints?'
        },
        quick_chips: {
          'gu-IN': ['બંને ઘૂંટણમાં', 'કમર અને પીઠમાં', 'હાથ-પગની આંગળીઓમાં', 'આખા શરીરમાં દુખાવો'],
          'hi-IN': ['दोनों घुटनों में', 'कमर और पीठ में', 'हाथ-पैर की उंगलियों में', 'पूरे बदन में दर्द'],
          'en-IN': ['Both knees', 'Lower back', 'Small finger joints', 'Generalized body ache']
        }
      },
      {
        step_id: 'morning_stiffness',
        topic: 'Morning Stiffness (Vata Lakshan)',
        question: {
          'gu-IN': 'શું સવારે ઊઠતી વખતે સાંધા જકડાઈ જાય છે? ચાલ્યા પછી થોડી રાહત થાય છે?',
          'hi-IN': 'क्या सुबह उठने पर जोड़ों में जकड़न (Stiffness) रहती है? चलने-फिरने से आराम मिलता है?',
          'en-IN': 'Do you experience joint stiffness in the morning? Does movement ease the pain?'
        },
        quick_chips: {
          'gu-IN': ['હા, સવારે અડધો કલાક જકડાઈ રહે છે', 'હા, સાંધામાં સોજો આવે છે', 'ના, જકડન નથી'],
          'hi-IN': ['हाँ, सुबह आधा घंटा जकड़न रहती है', 'हाँ, जोड़ों में सूजन है', 'नहीं, जकड़न नहीं है'],
          'en-IN': ['Yes, morning stiffness > 30 mins', 'Yes, swelling present', 'No stiffness']
        }
      }
    ]
  },

  SKIN_PROBLEM: {
    category: 'Skin & Dermatological / Kushtha (ચામડીના રોગ / त्वचा रोग)',
    framework: 'DERMA_OPD',
    red_flag_triggers: ['rapidly spreading rash with fever', 'mucosal involvement or blistering'],
    steps: [
      {
        step_id: 'rash_itching',
        topic: 'Itching & Lesion Appearance',
        question: {
          'gu-IN': 'ચામડી પર ખંજવાળ વધારે આવે છે? લાલ ચકામા, ફોલ્લીઓ કે સૂકી પોપડી જેવું છે?',
          'hi-IN': 'त्वचा पर खुजली ज्यादा है? लाल चकत्ते, दाने या सूखी पपड़ी जैसी दिख रही है?',
          'en-IN': 'Is there intense itching? Are there red patches, pimples, or dry scaling?'
        },
        quick_chips: {
          'gu-IN': ['ખૂબ ખંજવાળ આવે છે', 'લાલ ચકામા થયા છે', 'પાણી/પરુ જેવું નીકળે છે', 'સૂકી પોપડી વળે છે'],
          'hi-IN': ['बहुत तेज खुजली है', 'लाल चकत्ते बने हैं', 'पानी/मवाद जैसा निकलता है', 'सूखी पपड़ी जमती है'],
          'en-IN': ['Severe itching', 'Red itchy patches', 'Oozing/weeping fluid', 'Dry flaky scales']
        }
      }
    ]
  },

  OTHER: {
    category: 'General Clinical Complaint (સામાન્ય તપાસ / अन्य सामान्य तकलीफ)',
    framework: 'GENERAL_OPD',
    red_flag_triggers: ['sudden syncope', 'unexplained weight loss'],
    steps: [
      {
        step_id: 'general_onset',
        topic: 'Onset & Primary Concern',
        question: {
          'gu-IN': 'આ તકલીફ ક્યારથી શરૂ થઈ અને આનાથી તમારા રોજિંદા કામમાં શું મુશ્કેલી પડે છે?',
          'hi-IN': 'यह परेशानी कब से शुरू हुई और इससे आपकी दिनचर्या में क्या असर पड़ रहा है?',
          'en-IN': 'When did this issue begin, and how is it impacting your daily activities?'
        },
        quick_chips: {
          'gu-IN': ['તાજેતરમાં શરૂ થઈ', 'લાંબા સમયથી છે', 'ખૂબ નબળાઈ લાગે છે', 'ઊંઘ નથી આવતી'],
          'hi-IN': ['हाल ही में शुरू हुई', 'काफी समय से है', 'बहुत कमजोरी लगती है', 'नींद नहीं आती'],
          'en-IN': ['Started recently', 'Long-standing chronic', 'Extreme fatigue/weakness', 'Sleep disturbances']
        }
      }
    ]
  }
};

export default CLINICAL_DISEASE_FRAMEWORKS;
