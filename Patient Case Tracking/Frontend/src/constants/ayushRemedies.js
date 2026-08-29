/**
 * Predefined AYUSH Remedies, Ahara (Diet) & Vihara (Lifestyle) Knowledge Base
 * Ministry of Ayush & AIIA Clinical Guidelines for MediKiosk Pre-Consultation Care.
 */
export const AYUSH_REMEDIES = {
  COUGH_COLD: {
    id: 'AYUSH_COUGH_COLD',
    category: 'COUGH_COLD',
    dosha_imbalance: 'Kapha-Vata',
    title: {
      'gu-IN': 'શરદી અને ઉધરસ માટે આયુર્વેદિક ઉપચાર',
      'hi-IN': 'खांसी व जुकाम के लिए आयुर्वेदिक उपचार',
      'en-IN': 'Ayurvedic Remedies for Cough & Cold'
    },
    primary_remedy: {
      'gu-IN': 'હૂંફાળા પાણીમાં આદુ, તુલસી અને કાળા મરીનો ઉકાળો દિવસમાં ૨ વાર પીવો.',
      'hi-IN': 'गुनगुने पानी में अदरक, तुलसी और काली मिर्च का काढ़ा दिन में 2 बार पिएं।',
      'en-IN': 'Drink warm decoction of ginger, tulsi, and black pepper twice daily.'
    },
    steam_therapy: {
      'gu-IN': 'અજમો અથવા નીલગીરીના તેલના ૨ ટીપાં નાખીને દિવસમાં ૨ વાર વરાળ (બાફ) લો.',
      'hi-IN': 'अजवाइन या नीलगिरी तेल की 2 बूंदें डालकर दिन में 2 बार भाप लें।',
      'en-IN': 'Take steam inhalation with carom seeds (Ajwain) or 2 drops of eucalyptus oil.'
    },
    ahara_diet: {
      'gu-IN': 'ગરમ મગનો સૂપ, હળદરવાળું ગરમ દૂધ, હળવો ખોરાક. ઠંડા પીણાં અને આઈસ્ક્રીમ સંપૂર્ણ બંધ રાખો.',
      'hi-IN': 'गर्म मूंग दाल सूप, हल्दी वाला दूध, हल्का भोजन। ठंडी चीजें व कोल्ड ड्रिंक्स बिल्कुल न लें।',
      'en-IN': 'Warm moong soup, turmeric milk, light easily digestible meals. Strictly avoid iced drinks.'
    },
    vihara_lifestyle: {
      'gu-IN': 'ગળા અને છાતીને ગરમ કપડાંથી ઢાંકી રાખો. સીધા પંખા કે AC ના ઠંડા પવનમાં ન સૂવું.',
      'hi-IN': 'गले व सीने को गर्म रखें। सीधे AC या कूलर की सीधी ठंडी हवा से बचें।',
      'en-IN': 'Keep neck and chest warm. Avoid direct exposure to cold AC/cooler breeze.'
    }
  },

  FEVER: {
    id: 'AYUSH_FEVER',
    category: 'FEVER',
    dosha_imbalance: 'Pitta-Vata (Jwara)',
    title: {
      'gu-IN': 'તાવ માટે આયુર્વેદિક ઉપચાર',
      'hi-IN': 'बुखार के लिए आयुर्वेदिक उपचार',
      'en-IN': 'Ayurvedic Remedies for Fever (Jwara)'
    },
    primary_remedy: {
      'gu-IN': 'ગિલોય (ગળો) નો ઉકાળો અથવા ષડંગ પાનીય (ઉકાળીને ઠંડુ કરેલું પાણી) પીવો.',
      'hi-IN': 'गिलोय का काढ़ा पिएं और उबला हुआ गुनगुना पानी पर्याप्त मात्रा में लें।',
      'en-IN': 'Consume Giloy (Guduchi) decoction and frequently sip boiled lukewarm water.'
    },
    ahara_diet: {
      'gu-IN': 'મગનું પાણી, પાતળી ખીચડી, દાડમનો રસ. ભારે, તેલવાળો કે તળેલો ખોરાક ન લેવો.',
      'hi-IN': 'मूंग का पानी, पतली खिचड़ी, अनार का रस। भारी व तला-भुना खाना बिल्कुल न खाएं।',
      'en-IN': 'Thin moong broth, soft khichdi, pomegranate juice. Avoid heavy or oily foods.'
    },
    vihara_lifestyle: {
      'gu-IN': 'સંપૂર્ણ આરામ કરવો, કપાળ પર સામાન્ય તાપમાનના પાણીની પટ્ટી મૂકવી.',
      'hi-IN': 'पूर्ण विश्राम करें और तेज बुखार होने पर माथे पर ताजे पानी की पट्टी रखें।',
      'en-IN': 'Complete physical bed rest. Apply cool water cloth on forehead if temperature is high.'
    }
  },

  STOMACH_PAIN: {
    id: 'AYUSH_STOMACH_PAIN',
    category: 'STOMACH_PAIN',
    dosha_imbalance: 'Pitta-Samana Vayu (Agni Mandya / Amlapitta)',
    title: {
      'gu-IN': 'પેટમાં દુખાવો અને એસિડિટી માટે આયુર્વેદિક ઉપચાર',
      'hi-IN': 'पेट दर्द व एसिडिटी के लिए आयुर्वेदिक उपचार',
      'en-IN': 'Ayurvedic Care for Abdominal Discomfort & Acidity'
    },
    primary_remedy: {
      'gu-IN': 'વરિયાળી અને જીરુંને પાણીમાં ઉકાળી નવશેકું પીવું. જમ્યા પછી થોડી વરિયાળી ચાવવી.',
      'hi-IN': 'सौंफ और जीरे का पानी उबालकर गुनगुना पिएं। भोजन के बाद सौंफ चबाएं।',
      'en-IN': 'Drink boiled fennel and cumin seed water. Chew a pinch of fennel seeds after meals.'
    },
    ahara_diet: {
      'gu-IN': 'તાજી મોળી છાશમાં શેકેલું જીરું નાખી પીવું. તીખાં-તળેલાં, આથેલાં (ઢોકળા, હાંડવો) ખોરાક ટાળવા.',
      'hi-IN': 'ताजी छाछ में भुना जीरा डालकर लें। अत्यधिक मिर्च-मसाले, खटाई व तली चीजों से बचें।',
      'en-IN': 'Fresh buttermilk with roasted cumin powder. Avoid deep-fried, sour, or fermented foods.'
    },
    vihara_lifestyle: {
      'gu-IN': 'જમ્યા પછી તરત ન સૂવું (ઓછામાં ઓછું ૧૦૦ ડગલાં ચાલવું - શતપદી). સમયસર ભોજન લેવું.',
      'hi-IN': 'खाने के तुरंत बाद न सोएं (100 कदम टहलें - शतपदी)। समय पर भोजन करें।',
      'en-IN': 'Do not lie down immediately after eating. Walk 100 steps (Shatapadi) gently.'
    }
  },

  HEADACHE: {
    id: 'AYUSH_HEADACHE',
    category: 'HEADACHE',
    dosha_imbalance: 'Vata-Pitta (Shirashula)',
    title: {
      'gu-IN': 'માથાના દુખાવા માટે આયુર્વેદિક ઉપચાર',
      'hi-IN': 'सिरदर्द के लिए आयुर्वेदिक उपचार',
      'en-IN': 'Ayurvedic Care for Headache & Migraine'
    },
    primary_remedy: {
      'gu-IN': 'સૂંઠ (આદુ પાવડર) ની હળવી પેસ્ટ બનાવી કપાળ પર લગાવવી અથવા ગાયના ઘીના ૨ ટીપાં નાકમાં નાખવા (નસ્ય).',
      'hi-IN': 'सोंठ (अदरक पाउडर) का हल्का लेप माथे पर लगाएं या नाक में 2 बूंद देसी घी डालें (नस्य)।',
      'en-IN': 'Apply a mild dry-ginger paste on the forehead or put 2 drops of warm cow ghee in nostrils (Nasya).'
    },
    ahara_diet: {
      'gu-IN': 'પુષ્કળ પાણી પીવું, ગરમ દૂધ અથવા બ્રાહ્મી/તુલસીની ચા પીવી. લાંબો સમય ભૂખ્યા ન રહેવું.',
      'hi-IN': 'भरपूर पानी पिएं, गर्म दूध या ब्राह्मी की चाय लें। देर तक भूखे पेट न रहें।',
      'en-IN': 'Stay well hydrated with warm fluids or Brahmi tea. Do not skip meals.'
    },
    vihara_lifestyle: {
      'gu-IN': 'ઓછા અજવાળાવાળા શાંત રૂમમાં આંખો બંધ કરી આરામ કરવો. મોબાઈલ/સ્ક્રીન સમય ઘટાડવો.',
      'hi-IN': 'शांत और कम रोशनी वाले कमरे में विश्राम करें। मोबाइल/स्क्रीन का उपयोग कम करें।',
      'en-IN': 'Rest in a quiet, dark room. Minimize mobile/screen exposure.'
    }
  },

  BODY_JOINT_PAIN: {
    id: 'AYUSH_BODY_JOINT_PAIN',
    category: 'BODY_JOINT_PAIN',
    dosha_imbalance: 'Vata (Sandhigata Vata)',
    title: {
      'gu-IN': 'સાંધા અને શરીરના દુખાવા માટે આયુર્વેદિક ઉપચાર',
      'hi-IN': 'जोड़ों व बदन दर्द के लिए आयुर्वेदिक उपचार',
      'en-IN': 'Ayurvedic Care for Joint & Body Pain'
    },
    primary_remedy: {
      'gu-IN': 'તલના તેલ અથવા મહાનારાયણ તેલથી સાંધા પર હળવી માલિશ કરી ગરમ પાણીની થેલીથી શેક કરવો.',
      'hi-IN': 'तिल के तेल या महानारायण तेल से जोड़ों की हल्की मालिश करें और गर्म पानी से सिकाई करें।',
      'en-IN': 'Gently massage joints with warm sesame oil and apply dry hot water fomentation.'
    },
    ahara_diet: {
      'gu-IN': 'મેથીના દાણાનું પાણી, હળદરવાળું દૂધ, લસણવાળો ગરમ આહાર. વાસી કે ઠંડો ખોરાક ટાળવો.',
      'hi-IN': 'मेथी दाना पानी, हल्दी वाला दूध, लहसुन युक्त भोजन। ठंडा व बासी खाना न खाएं।',
      'en-IN': 'Fenugreek water, golden turmeric milk, warm garlic-infused meals. Avoid stale cold foods.'
    },
    vihara_lifestyle: {
      'gu-IN': 'હળવી કસરત કરવી, સવારે ૧૫ મિનિટ સૂર્યપ્રકાશમાં બેસવું. લાંબો સમય ઊભા રહેવાનું ટાળવું.',
      'hi-IN': 'हल्के व्यायाम करें, सुबह 15 मिनट धूप में बैठें। देर तक लगातार खड़े रहने से बचें।',
      'en-IN': 'Gentle joint mobility exercises, 15 minutes morning sunlight exposure.'
    }
  },

  SKIN_PROBLEM: {
    id: 'AYUSH_SKIN_PROBLEM',
    category: 'SKIN_PROBLEM',
    dosha_imbalance: 'Rakta-Pitta (Kushtha/Tvak Roga)',
    title: {
      'gu-IN': 'ચામડીના રોગ અને ખંજવાળ માટે આયુર્વેદિક ઉપચાર',
      'hi-IN': 'त्वचा रोग व खुजली के लिए आयुर्वेदिक उपचार',
      'en-IN': 'Ayurvedic Care for Skin Allergy & Rash'
    },
    primary_remedy: {
      'gu-IN': 'લીમડાના પાન ઉકાળેલા પાણીથી સ્નાન કરવું. ચામડી પર નારિયેળ તેલ અથવા એલોવેરા જેલ લગાવવી.',
      'hi-IN': 'नीम की पत्तियों के उबले पानी से स्नान करें। त्वचा पर नारियल तेल या एलोवेरा लगाएं।',
      'en-IN': 'Bathe with neem-infused boiled water. Apply pure coconut oil or fresh aloe vera gel.'
    },
    ahara_diet: {
      'gu-IN': 'કડવા અને તૂરા શાકભાજી (કારેલા, પરવળ) ખાવા. વધારે પડતી ખટાશ, ગોળ અને આથેલો ખોરાક ટાળવો.',
      'hi-IN': 'करेला, परवल जैसी हरी सब्जियां खाएं। अधिक खटाई, गुड़ व फर्मेंटेड फूड न लें।',
      'en-IN': 'Consume bitter vegetables like bitter gourd (Karela). Avoid excess sour or fermented food.'
    },
    vihara_lifestyle: {
      'gu-IN': 'સુતરાઉ (કોટન) ના ઢીલાં કપડાં પહેરવાં. તડકામાં વધારે ન ફરવું.',
      'hi-IN': 'सूती व ढीले कपड़े पहनें। तेज धूप में अधिक घूमने से बचें।',
      'en-IN': 'Wear loose breathable cotton clothing. Avoid prolonged direct sun exposure.'
    }
  },

  OTHER: {
    id: 'AYUSH_GENERAL',
    category: 'OTHER',
    dosha_imbalance: 'General Tridosha Balance',
    title: {
      'gu-IN': 'સામાન્ય સ્વાસ્થ્ય માટે આયુર્વેદિક દિનચર્યા',
      'hi-IN': 'सामान्य स्वास्थ्य के लिए आयुर्वेदिक दिनचर्या',
      'en-IN': 'General Ayurvedic Wellness & Lifestyle'
    },
    primary_remedy: {
      'gu-IN': 'સવારે નવશેકું પાણી પીવું (ઉષઃપાન) અને ૧ ચમચી ચ્યવનપ્રાશ લેવું.',
      'hi-IN': 'सुबह उठकर गुनगुना पानी पिएं (उषःपान) और 1 चम्मच च्यवनप्राश लें।',
      'en-IN': 'Drink warm water upon waking (Ushapan) and take 1 teaspoon Chyawanprash.'
    },
    ahara_diet: {
      'gu-IN': 'ઋતુ પ્રમાણે તાજો અને સુપાચ્ય ખોરાક લેવો. જમવાના નિશ્ચિત સમયનું પાલન કરવું.',
      'hi-IN': 'ऋतु अनुसार ताजा व सुपाच्य भोजन करें। भोजन का समय नियमित रखें।',
      'en-IN': 'Eat fresh, seasonal, warm meals at regular fixed hours.'
    },
    vihara_lifestyle: {
      'gu-IN': 'દરરોજ ૨૦ મિનિટ પ્રાણાયામ (અનુલોમ-વિલોમ) કરવો અને સમયસર પૂરતી ઊંઘ લેવી.',
      'hi-IN': 'प्रतिदिन 20 मिनट प्राणायाम (अनुलोम-विलोम) करें और समय पर पर्याप्त नींद लें।',
      'en-IN': 'Practice 20 minutes of daily Pranayama and ensure 7-8 hours of sound sleep.'
    }
  }
};

export default AYUSH_REMEDIES;
