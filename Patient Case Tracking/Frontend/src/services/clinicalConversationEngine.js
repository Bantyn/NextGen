import { CLINICAL_DISEASE_FRAMEWORKS } from '../constants/clinicalFrameworks.js';

/**
 * Initial empty clinical state object
 */
export const INITIAL_CLINICAL_STATE = {
  session_status: 'IN_PROGRESS', // 'IN_PROGRESS' | 'URGENT_REVIEW_REQUIRED' | 'READY_FOR_SUMMARY'
  chief_complaints: [],
  symptoms: [],
  symptom_details: [],
  duration: [],
  severity: [],
  onset: [],
  progression: [],
  associated_symptoms: [],
  past_medical_history: [],
  past_surgical_history: [],
  current_medications: [],
  allergies: [],
  family_history: [],
  personal_history: [],
  review_of_systems: [],
  ayush_history: {
    prakriti: '',
    vikriti: '',
    ahara_agni: '',
    vihara_sleep: '',
    vyayama: '',
  },
  red_flags: [],
  missing_information: [
    'chief_complaint',
    'onset_duration',
    'severity',
    'associated_symptoms',
    'past_medical_history',
  ],
  asked_questions: [],
  answered_questions: [],
  conversation_summary: '',
};

/**
 * Deterministic Red Flag triggers across English, Hindi, Gujarati
 */
export const RED_FLAG_TRIGGERS = [
  {
    category: 'CARDIOVASCULAR_EMERGENCY',
    priority: 'HIGH',
    triggers: [
      'chest pain and sweating', 'chest pain radiating to arm', 'crushing chest pain',
      'left arm pain', 'pressure in chest and cannot breathe',
      'છાતીમાં ભારે દબાણ', 'છાતીનો દુખાવો ડાબા હાથમાં', 'છાતીમાં દુખાવો અને ખૂબ પરસેવો',
      'सीने में भारी दबाव', 'सीने का दर्द बाएं हाथ में', 'सीने में दर्द और पसीना'
    ],
    reason: 'Possible acute coronary syndrome or myocardial ischemia. Immediate triage ECG and emergency review needed.',
    patient_instruction: {
      'en-IN': 'Some of the symptoms you described (chest pain/pressure) may require immediate medical attention. Please speak with a doctor or emergency staff right now.',
      'hi-IN': 'सीने में तेज दर्द और भारीपन के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत इमरजेंसी डॉक्टर या मेडिकल स्टाफ से संपर्क करें।',
      'gu-IN': 'છાતીમાં ભારે દબાણ અથવા દુખાવાના લક્ષણો તાત્કાલિક તબીબી તપાસ માંગી લે છે. કૃપા કરીને હમણાં જ ડૉક્ટર અથવા ઇમરજન્સી સ્ટાફનો સંપર્ક કરો.'
    }
  },
  {
    category: 'RESPIRATORY_DISTRESS',
    priority: 'HIGH',
    triggers: [
      'severe breathing difficulty', 'cannot breathe', 'gasping for air', 'stridor', 'severe breathlessness',
      'શ્વાસ લેવામાં ખૂબ તકલીફ', 'શ્વાસ નથી લઈ શકાતો', 'દમ ઘૂંટાવો',
      'सांस लेने में बहुत तकलीफ', 'सांस नहीं आ रही', 'दम घुट रहा है'
    ],
    reason: 'Acute severe respiratory distress or airway compromise.',
    patient_instruction: {
      'en-IN': 'Severe difficulty in breathing requires immediate medical care. Please inform our clinical staff or emergency physician now.',
      'hi-IN': 'सांस लेने में गंभीर कठिनाई के लिए तुरंत डॉक्टरी मदद चाहिए। कृपया तुरंत मेडिकल स्टाफ से संपर्क करें।',
      'gu-IN': 'શ્વાસ લેવામાં ગંભીર તકલીફ માટે તાત્કાલિક તબીબી સહાય જરૂરી છે. કૃપા કરીને તરત જ મેડિકલ સ્ટાફને જણાવો.'
    }
  },
  {
    category: 'NEUROLOGICAL_EMERGENCY',
    priority: 'HIGH',
    triggers: [
      'sudden weakness', 'facial droop', 'slurred speech', 'cannot speak', 'one side paralyzed', 'sudden numbness',
      'અચાનક એક બાજુ નબળાઈ', 'મોઢું વાંકું થવું', 'બોલવામાં તકલીફ', 'અચાનક લકવો',
      'अचानक एक तरफ कमजोरी', 'मुंह टेढ़ा होना', 'बोलने में लड़खड़ाहट', 'अचानक लकवा'
    ],
    reason: 'Potential acute stroke or focal neurological deficit.',
    patient_instruction: {
      'en-IN': 'Sudden weakness or speech difficulty requires immediate medical evaluation for stroke. Please notify medical staff immediately.',
      'hi-IN': 'अचानक कमजोरी या बोलने में कठिनाई स्ट्रोक का संकेत हो सकती है। कृपया तुरंत डॉक्टर या स्टाफ से संपर्क करें।',
      'gu-IN': 'અચાનક નબળાઈ અથવા બોલવામાં તકલીફ લકવાનો સંકેત હોઈ શકે છે. કૃપા કરીને તાત્કાલિક સ્ટાફને સંપર્ક કરો.'
    }
  },
  {
    category: 'SEVERE_BLEEDING',
    priority: 'HIGH',
    triggers: [
      'vomiting blood', 'coughing blood', 'large blood', 'black stool', 'uncontrolled bleeding',
      'ઉલ્ટીમાં લોહી', 'ખાંસીમાં લોહી', 'કાળા ઝાડા', 'લોહી બંધ ન થવું',
      'उल्टी में खून', 'खांसी में खून', 'काला मल', 'खून बहना बंद न होना'
    ],
    reason: 'Active severe gastrointestinal or respiratory hemorrhage.',
    patient_instruction: {
      'en-IN': 'Active bleeding or coughing/vomiting blood requires immediate medical review. Please consult medical staff now.',
      'hi-IN': 'उल्टी या खांसी में खून आना गंभीर हो सकता है। कृपया तुरंत डॉक्टर या मेडिकल स्टाफ को दिखाएं।',
      'gu-IN': 'ઉલ્ટી કે ખાંસીમાં લોહી આવવું ગંભીર સ્થિતિ હોઈ શકે છે. કૃપા કરીને તરત જ ડૉક્ટરનો સંપર્ક કરો.'
    }
  },
  {
    category: 'LOSS_OF_CONSCIOUSNESS',
    priority: 'HIGH',
    triggers: [
      'passed out', 'fainted', 'loss of consciousness', 'blackout', 'seizure', 'fits',
      'બેહોશ થઈ જવું', 'ચક્કર આવીને પડી જવું', 'ખેંચ આવવી',
      'बेहोश हो जाना', 'चक्कर खाकर गिरना', 'दौरा पड़ना'
    ],
    reason: 'Syncope, seizure, or altered level of consciousness.',
    patient_instruction: {
      'en-IN': 'Loss of consciousness or seizures require urgent medical assessment. Please alert the attending doctor immediately.',
      'hi-IN': 'बेहोशी या दौरा पड़ने के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत डॉक्टर को सूचित करें।',
      'gu-IN': 'બેહોશી અથવા ખેંચ આવવાના લક્ષણો માટે તાત્કાલિક ડૉક્ટરની તપાસ જરૂરી છે. કૃપા કરીને તરત જ સ્ટાફને જણાવો.'
    }
  }
];

/**
 * Check if patient statement contains any deterministic red flags
 */
export function detectRedFlags(patientText) {
  if (!patientText) return null;
  const lower = patientText.toLowerCase();

  for (const item of RED_FLAG_TRIGGERS) {
    for (const trigger of item.triggers) {
      if (lower.includes(trigger.toLowerCase()) || patientText.includes(trigger)) {
        return {
          detected: true,
          priority: item.priority,
          category: item.category,
          reason: item.reason,
          patient_instruction: item.patient_instruction,
        };
      }
    }
  }
  return null;
}

/**
 * Extract Clinical Entities Heuristically from patient text
 */
export function extractClinicalInformation(patientText, currentClinicalState = {}) {
  const textLower = patientText.toLowerCase();
  const extracted = {
    chief_complaint: null,
    symptoms: [],
    duration: null,
    severity: null,
    associated_symptoms: [],
    past_medical_history: [],
    current_medications: [],
    negated_symptoms: [],
  };

  // 1. Detect Negations (e.g. "No fever", "નહીં તાવ નથી", "नहीं बुखार नहीं है")
  if (
    textLower.includes("don't have") ||
    textLower.includes("no fever") ||
    textLower.includes("no pain") ||
    textLower.includes("not having") ||
    patientText.includes("નથી") ||
    patientText.includes("નહીં") ||
    patientText.includes("नहीं")
  ) {
    if (textLower.includes("fever") || patientText.includes("તાવ") || patientText.includes("बुखार")) {
      extracted.negated_symptoms.push("Fever");
    }
    if (textLower.includes("pain") || patientText.includes("દુખાવો") || patientText.includes("दर्द")) {
      extracted.negated_symptoms.push("Pain");
    }
    if (textLower.includes("cough") || patientText.includes("ઉધરસ") || patientText.includes("खांसी")) {
      extracted.negated_symptoms.push("Cough");
    }
  }

  // 2. Chief Complaints & Symptoms
  if (
    textLower.includes("chest pain") ||
    textLower.includes("chest pressure") ||
    patientText.includes("છાતીમાં દુખાવો") ||
    patientText.includes("સીને મેં દર્દ") ||
    patientText.includes("सीने में दर्द")
  ) {
    extracted.chief_complaint = "Chest Pain";
    extracted.symptoms.push("Chest Pain");
  } else if (
    textLower.includes("fever") ||
    textLower.includes("temperature") ||
    patientText.includes("તાવ") ||
    patientText.includes("તપ") ||
    patientText.includes("બુખાર") ||
    patientText.includes("बुखार")
  ) {
    if (!extracted.negated_symptoms.includes("Fever")) {
      extracted.chief_complaint = "Fever";
      extracted.symptoms.push("Fever");
    }
  } else if (
    textLower.includes("stomach") ||
    textLower.includes("belly") ||
    textLower.includes("abdominal") ||
    patientText.includes("પેટ") ||
    patientText.includes("ઝાડા") ||
    patientText.includes("पेट")
  ) {
    extracted.chief_complaint = "Abdominal Pain / GI Symptoms";
    extracted.symptoms.push("Stomach Pain");
  } else if (
    textLower.includes("headache") ||
    textLower.includes("head ache") ||
    textLower.includes("head pain") ||
    patientText.includes("માથું") ||
    patientText.includes("માથાનો") ||
    patientText.includes("सिर दर्द") ||
    patientText.includes("सर दर्द")
  ) {
    extracted.chief_complaint = "Headache";
    extracted.symptoms.push("Headache");
  } else if (
    textLower.includes("cough") ||
    textLower.includes("cold") ||
    patientText.includes("ઉધરસ") ||
    patientText.includes("ખાંસી") ||
    patientText.includes("શરદી") ||
    patientText.includes("कफ") ||
    patientText.includes("खांसी")
  ) {
    if (!extracted.negated_symptoms.includes("Cough")) {
      extracted.chief_complaint = "Cough and Cold";
      extracted.symptoms.push("Cough / Cold");
    }
  } else if (
    textLower.includes("joint") ||
    textLower.includes("knee") ||
    textLower.includes("back pain") ||
    patientText.includes("સાંધા") ||
    patientText.includes("ઘૂંટણ") ||
    patientText.includes("કમર") ||
    patientText.includes("जोड़ों") ||
    patientText.includes("घुटने")
  ) {
    extracted.chief_complaint = "Joint / Musculoskeletal Pain";
    extracted.symptoms.push("Joint Pain");
  }

  // 3. Duration Extraction
  const durationMatch = patientText.match(
    /(\d+\s*(?:days?|hours?|weeks?|months?|दिवस|દહાડા|કલાક|મહિના|दिन|घंटे|हफ्ते|साल))/i
  );
  if (durationMatch) {
    extracted.duration = durationMatch[1];
  } else if (
    textLower.includes("today") ||
    patientText.includes("આજે") ||
    patientText.includes("आज")
  ) {
    extracted.duration = "Today";
  } else if (
    textLower.includes("yesterday") ||
    patientText.includes("ગઈકાલ") ||
    patientText.includes("कल")
  ) {
    extracted.duration = "1 day (Yesterday)";
  } else if (
    textLower.includes("since morning") ||
    patientText.includes("સવારથી") ||
    patientText.includes("सुबह से")
  ) {
    extracted.duration = "Since morning";
  }

  // 4. Severity Extraction
  const severityMatch = patientText.match(/(\b\d{1,2}\s*(?:\/\s*10|out of 10)\b)/i);
  if (severityMatch) {
    extracted.severity = severityMatch[1];
  } else if (
    textLower.includes("severe") ||
    textLower.includes("very high") ||
    textLower.includes("unbearable") ||
    patientText.includes("તીવ્ર") ||
    patientText.includes("ખૂબ વધારે") ||
    patientText.includes("बहुत तेज")
  ) {
    extracted.severity = "Severe";
  } else if (
    textLower.includes("moderate") ||
    patientText.includes("મધ્યમ") ||
    patientText.includes("मध्यम")
  ) {
    extracted.severity = "Moderate";
  } else if (
    textLower.includes("mild") ||
    textLower.includes("little") ||
    patientText.includes("હળવો") ||
    patientText.includes("થોડું") ||
    patientText.includes("हल्का") ||
    patientText.includes("थोड़ा")
  ) {
    extracted.severity = "Mild";
  }

  // 5. Associated Symptoms
  if (
    textLower.includes("vomit") ||
    textLower.includes("nausea") ||
    patientText.includes("ઉલ્ટી") ||
    patientText.includes("ઉબકા") ||
    patientText.includes("उल्टी") ||
    patientText.includes("जी मिचलाना")
  ) {
    extracted.associated_symptoms.push("Nausea / Vomiting");
  }
  if (
    textLower.includes("chills") ||
    textLower.includes("shivering") ||
    patientText.includes("ધ્રુજારી") ||
    patientText.includes("કાંપવું") ||
    patientText.includes("कम्पकंपी") ||
    patientText.includes("ठंड लगना")
  ) {
    extracted.associated_symptoms.push("Chills");
  }
  if (
    textLower.includes("sweat") ||
    patientText.includes("પરસેવો") ||
    patientText.includes("पसीना")
  ) {
    extracted.associated_symptoms.push("Diaphoresis (Sweating)");
  }
  if (
    textLower.includes("breathless") ||
    textLower.includes("shortness of breath") ||
    patientText.includes("શ્વાસ ચડે") ||
    patientText.includes("સાંસ ફૂલના")
  ) {
    extracted.associated_symptoms.push("Shortness of Breath");
  }

  // 6. Past Medical History
  if (
    textLower.includes("diabetes") ||
    textLower.includes("sugar") ||
    patientText.includes("ડાયાબિટીસ") ||
    patientText.includes("સુગર") ||
    patientText.includes("डायबिटीज") ||
    patientText.includes("शुगर")
  ) {
    extracted.past_medical_history.push("Diabetes Mellitus");
  }
  if (
    textLower.includes("hypertension") ||
    textLower.includes("high bp") ||
    textLower.includes("blood pressure") ||
    patientText.includes("બીપી") ||
    patientText.includes("બ્લડ પ્રેશર") ||
    patientText.includes("बीपी")
  ) {
    extracted.past_medical_history.push("Hypertension");
  }
  if (
    textLower.includes("thyroid") ||
    patientText.includes("થાઇરોઇડ") ||
    patientText.includes("थायराइड")
  ) {
    extracted.past_medical_history.push("Thyroid Disorder");
  }
  if (
    textLower.includes("asthma") ||
    patientText.includes("અસ્થમા") ||
    patientText.includes("દમ") ||
    patientText.includes("अस्थमा")
  ) {
    extracted.past_medical_history.push("Bronchial Asthma");
  }

  // 7. Medications
  const medMatches = patientText.match(
    /\b(metformin|paracetamol|crocin|aspirin|amlodipine|telmisartan|pantoprazole|thyronorm|inhaler)\b/gi
  );
  if (medMatches) {
    extracted.current_medications = Array.from(new Set(medMatches.map((m) => m.trim())));
  }

  return extracted;
}

/**
 * Update Clinical State with newly extracted entities & corrections
 */
export function updateClinicalState(currentState, extracted) {
  const updated = { ...currentState };

  // Handle Negations & Corrections
  if (extracted.negated_symptoms && extracted.negated_symptoms.length > 0) {
    extracted.negated_symptoms.forEach((neg) => {
      updated.symptoms = (updated.symptoms || []).filter((s) => !s.toLowerCase().includes(neg.toLowerCase()));
      updated.chief_complaints = (updated.chief_complaints || []).filter((c) => !c.toLowerCase().includes(neg.toLowerCase()));
    });
  }

  // Update Chief Complaints
  if (extracted.chief_complaint) {
    if (!updated.chief_complaints.includes(extracted.chief_complaint)) {
      updated.chief_complaints = [extracted.chief_complaint, ...updated.chief_complaints];
    }
  }

  // Update Symptoms
  if (extracted.symptoms && extracted.symptoms.length > 0) {
    const existing = new Set(updated.symptoms || []);
    extracted.symptoms.forEach((s) => existing.add(s));
    updated.symptoms = Array.from(existing);
  }

  // Update Duration
  if (extracted.duration) {
    if (!updated.duration.includes(extracted.duration)) {
      updated.duration = [...updated.duration, extracted.duration];
    }
  }

  // Update Severity
  if (extracted.severity) {
    if (!updated.severity.includes(extracted.severity)) {
      updated.severity = [...updated.severity, extracted.severity];
    }
  }

  // Update Associated Symptoms
  if (extracted.associated_symptoms && extracted.associated_symptoms.length > 0) {
    const existing = new Set(updated.associated_symptoms || []);
    extracted.associated_symptoms.forEach((s) => existing.add(s));
    updated.associated_symptoms = Array.from(existing);
  }

  // Update Past Medical History
  if (extracted.past_medical_history && extracted.past_medical_history.length > 0) {
    const existing = new Set(updated.past_medical_history || []);
    extracted.past_medical_history.forEach((pmh) => existing.add(pmh));
    updated.past_medical_history = Array.from(existing);
  }

  // Update Medications
  if (extracted.current_medications && extracted.current_medications.length > 0) {
    const existing = new Set(updated.current_medications || []);
    extracted.current_medications.forEach((med) => existing.add(med));
    updated.current_medications = Array.from(existing);
  }

  // Re-calculate Missing Information
  const missing = [];
  if (!updated.chief_complaints || updated.chief_complaints.length === 0) missing.push('chief_complaint');
  if (!updated.duration || updated.duration.length === 0) missing.push('onset_duration');
  if (!updated.severity || updated.severity.length === 0) missing.push('severity');
  if (!updated.associated_symptoms || updated.associated_symptoms.length === 0) missing.push('associated_symptoms');
  if (!updated.past_medical_history || updated.past_medical_history.length === 0) missing.push('past_medical_history');

  updated.missing_information = missing;

  return updated;
}

/**
 * Check if the minimum necessary clinical history has been collected
 */
export function isHistoryComplete(clinicalState, turnCount = 0) {
  const hasChief = clinicalState.chief_complaints && clinicalState.chief_complaints.length > 0;
  const hasDuration = clinicalState.duration && clinicalState.duration.length > 0;
  const hasSeverity = clinicalState.severity && clinicalState.severity.length > 0;
  const hasHistoryOrAssoc = (clinicalState.associated_symptoms && clinicalState.associated_symptoms.length > 0) ||
                            (clinicalState.past_medical_history && clinicalState.past_medical_history.length > 0);

  // If 4 core domains are answered OR patient has answered 4-5 focused turns
  if ((hasChief && hasDuration && hasSeverity && hasHistoryOrAssoc) || turnCount >= 5) {
    return true;
  }
  return false;
}

/**
 * Select the single next adaptive question based on prioritized missing clinical domains
 */
export function selectNextAdaptiveQuestion(clinicalState, language = 'gu-IN', opdMode = 'GENERAL') {
  const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
  const chief = (clinicalState.chief_complaints?.[0] || clinicalState.symptoms?.[0] || '').toLowerCase();

  // 1. Missing Chief Complaint
  if (!clinicalState.chief_complaints || clinicalState.chief_complaints.length === 0) {
    const questions = {
      'gu-IN': 'નમસ્તે, તમને હાલમાં કઈ મુખ્ય તકલીફ થઈ રહી છે?',
      'hi-IN': 'नमस्ते, आपको इस समय मुख्य रूप से क्या परेशानी या तकलीफ हो रही है?',
      'en-IN': 'Hello, what is the main health complaint or symptom you are experiencing today?'
    };
    const chips = {
      'gu-IN': ['તાવ અને શરદી', 'પેટમાં દુખાવો', 'માથું દુખે છે', 'છાતીમાં દુખાવો'],
      'hi-IN': ['बुखार और सर्दी', 'पेट में दर्द', 'सिर दर्द', 'सीने में दर्द'],
      'en-IN': ['Fever & Cold', 'Stomach Pain', 'Headache', 'Chest Discomfort']
    };
    return {
      topic: 'chief_complaint',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 2. Missing Duration / Onset
  if (!clinicalState.duration || clinicalState.duration.length === 0) {
    const questions = {
      'gu-IN': 'આ તકલીફ તમને ક્યારથી શરૂ થઈ છે? કેટલા દિવસ કે કલાક થયા?',
      'hi-IN': 'यह परेशानी आपको कब से शुरू हुई है? कितने दिन या घंटे हुए हैं?',
      'en-IN': 'When did this symptom start? How many days or hours has it been?'
    };
    const chips = {
      'gu-IN': ['આજ સવારથી', 'ગઈકાલથી (૧ દિવસ)', '૨-૩ દિવસથી', '૧ અઠવાડિયાથી વધારે'],
      'hi-IN': ['आज सुबह से', 'कल से (1 दिन)', '2-3 दिन से', '1 हफ्ते से अधिक'],
      'en-IN': ['Since this morning', 'Yesterday (1 day)', '2-3 days ago', 'More than a week']
    };
    return {
      topic: 'onset_duration',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 3. Missing Severity / Pain Scale
  if (!clinicalState.severity || clinicalState.severity.length === 0) {
    const questions = {
      'gu-IN': 'આ તકલીફ કેટલી તીવ્ર છે? ૧ થી ૧૦ ના સ્કેલ પર કેટલો દુખાવો કે અસ્વસ્થતા લાગે છે?',
      'hi-IN': 'यह तकलीफ कितनी गंभीर है? 1 से 10 के पैमाने पर कितना दर्द या बेचैनी महसूस होती है?',
      'en-IN': 'How severe is this discomfort? On a scale of 1 to 10, how intense is it?'
    };
    const chips = {
      'gu-IN': ['હળવી (૧-૩)', 'મધ્યમ (૪-૬)', 'ખૂબ તીવ્ર (૭-૯)', 'અસહ્ય (૧૦)'],
      'hi-IN': ['हल्की (1-3)', 'मध्यम (4-6)', 'काफी तेज (7-9)', 'असहनीय (10)'],
      'en-IN': ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-9)', 'Unbearable (10)']
    };
    return {
      topic: 'severity',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 4. Missing Specific Associated Symptoms based on Chief Complaint
  if (!clinicalState.associated_symptoms || clinicalState.associated_symptoms.length === 0) {
    if (chief.includes('stomach') || chief.includes('abdominal') || chief.includes('પેટ')) {
      const questions = {
        'gu-IN': 'શું તમને ઉલ્ટી, ઉબકા, ઝાડા કે ગેસ જેવી અન્ય કોઈ તકલીફ સાથે થઈ રહી છે?',
        'hi-IN': 'क्या आपको उल्टी, जी मिचलाना, दस्त या गैस जैसी कोई अन्य तकलीफ भी हो रही है?',
        'en-IN': 'Are you experiencing any vomiting, nausea, loose motions, or acidity along with it?'
      };
      const chips = {
        'gu-IN': ['હા, ઉલ્ટી/ઉબકા છે', 'ઝાડા થઈ રહ્યા છે', 'ગેસ અને બળતરા', 'ના, અન્ય કોઈ તકલીફ નથી'],
        'hi-IN': ['हाँ, उल्टी/जी मिचलाना', 'दस्त हो रहे हैं', 'गैस और जलन', 'नहीं, कोई अन्य लक्षण नहीं'],
        'en-IN': ['Yes, Nausea/Vomiting', 'Loose motions', 'Acidity & gas', 'No other symptoms']
      };
      return { topic: 'associated_symptoms', question: questions[langKey] || questions['en-IN'], chips: chips[langKey] || chips['en-IN'] };
    }

    if (chief.includes('fever') || chief.includes('તાવ') || chief.includes('बुखार')) {
      const questions = {
        'gu-IN': 'શું તાવ સાથે ધ્રુજારી, ખાંસી, ગળામાં દુખાવો કે શરીરમાં કળતર થાય છે?',
        'hi-IN': 'क्या बुखार के साथ ठंड/कंपकंपी, खांसी, गले में दर्द या बदन दर्द हो रहा है?',
        'en-IN': 'Are you experiencing chills, cough, sore throat, or body aches with the fever?'
      };
      const chips = {
        'gu-IN': ['ખૂબ ધ્રુજારી સાથે તાવ', 'ખાંસી અને ગળામાં દુખાવો', 'આખા શરીરમાં કળતર', 'ના, ફક્ત સામાન્ય તાવ'],
        'hi-IN': ['कंपकंपी के साथ बुखार', 'खांसी और गले में दर्द', 'बदन में तेज दर्द', 'नहीं, सिर्फ बुखार'],
        'en-IN': ['Fever with chills', 'Cough & throat pain', 'Severe body ache', 'No other symptoms']
      };
      return { topic: 'associated_symptoms', question: questions[langKey] || questions['en-IN'], chips: chips[langKey] || chips['en-IN'] };
    }

    if (chief.includes('headache') || chief.includes('માથું') || chief.includes('सिर')) {
      const questions = {
        'gu-IN': 'શું માથાના દુખાવા સાથે આંખોમાં ઝાંખપ, ઉબકા કે ગરદન અકડાઈ જવી જેવું થાય છે?',
        'hi-IN': 'क्या सिरदर्द के साथ आंखों में धुंधलापन, जी मिचलाना या गर्दन में अकड़न है?',
        'en-IN': 'Do you have blurry vision, nausea, sensitivity to light, or neck stiffness with the headache?'
      };
      const chips = {
        'gu-IN': ['ઉબકા આવે છે', 'પ્રકાશ/અવાજ સહન નથી થતો', 'આખો દિવસ ભારે લાગે છે', 'ના, સામાન્ય દુખાવો'],
        'hi-IN': ['जी मिचला रहा है', 'रोशनी/आवाज से परेशानी', 'पूरे दिन भारीपन', 'नहीं, सिर्फ सिरदर्द'],
        'en-IN': ['Nausea present', 'Light/noise sensitivity', 'Constant heaviness', 'No other symptoms']
      };
      return { topic: 'associated_symptoms', question: questions[langKey] || questions['en-IN'], chips: chips[langKey] || chips['en-IN'] };
    }
  }

  // 5. Missing Past Medical History & Medications
  if (!clinicalState.past_medical_history || clinicalState.past_medical_history.length === 0) {
    const questions = {
      'gu-IN': 'શું તમને પહેલાથી ડાયાબિટીસ, બીપી, થાઇરોઇડ જેવી કોઈ જૂની બીમારી છે? કોઈ દવા ચાલુ છે?',
      'hi-IN': 'क्या आपको पहले से डायबिटीज, बीपी, थायराइड जैसी कोई पुरानी बीमारी है? कोई दवा ले रहे हैं?',
      'en-IN': 'Do you have any past medical conditions like Diabetes, BP, or Thyroid? Are you taking any regular medications?'
    };
    const chips = {
      'gu-IN': ['ડાયાબિટીસ છે', 'બ્લડ પ્રેશર (BP) છે', 'થાઇરોઇડ છે', 'ના, કોઈ જૂની બીમારી નથી'],
      'hi-IN': ['डायबिटीज है', 'हाई बीपी है', 'थायराइड है', 'नहीं, कोई पुरानी बीमारी नहीं'],
      'en-IN': ['Diabetes', 'Hypertension (BP)', 'Thyroid disorder', 'None / Healthy']
    };
    return {
      topic: 'past_medical_history',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 6. AYUSH Specific Inquiry (if in AYUSH OPD Mode)
  if (opdMode === 'AYUSH') {
    const questions = {
      'gu-IN': 'તમારી ભૂખ અને પાચનશક્તિ (અગ્નિ) કેવી છે? ઊંઘ બરાબર આવે છે?',
      'hi-IN': 'आपकी भूख और पाचन शक्ति कैसी है? नींद ठीक से आती है?',
      'en-IN': 'How is your appetite, digestive fire (Agni), and sleep pattern?'
    };
    const chips = {
      'gu-IN': ['ભૂખ ઓછી લાગે છે', 'પાચન ધીમું છે (ગેસ/અપચો)', 'ઊંઘ અનિયમિત છે', 'ભૂખ અને ઊંઘ સારી છે'],
      'hi-IN': ['भूख कम लगती है', 'पाचन कमजोर है', 'नींद अनियमित है', 'भूख और नींद सामान्य है'],
      'en-IN': ['Low appetite', 'Slow digestion/Gas', 'Irregular sleep', 'Normal appetite & sleep']
    };
    return {
      topic: 'ayush_history',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 7. Completion Question
  const completeQ = {
    'gu-IN': 'તમારો સંપૂર્ણ તબીબી ઈતિહાસ નોંધી લેવામાં આવ્યો છે. ડૉક્ટર સમક્ષ સારાંશ તૈયાર છે.',
    'hi-IN': 'आपका मेडिकल इतिहास सफलतापूर्वक दर्ज कर लिया गया है। डॉक्टर के लिए सारांश तैयार है।',
    'en-IN': 'Your medical history has been recorded. We are preparing it for the doctor.'
  };
  return {
    topic: 'completed',
    question: completeQ[langKey] || completeQ['en-IN'],
    chips: [],
  };
}

/**
 * Main Clinical Conversation Engine Processor
 * Unifies Voice, Text, and Touch inputs into an adaptive, context-aware reasoning loop
 */
export async function processPatientClinicalResponse({
  patientText,
  clinicalState = INITIAL_CLINICAL_STATE,
  language = 'gu-IN',
  opdMode = 'GENERAL',
  conversationHistory = [],
  turnCount = 1,
}) {
  const trimmed = (patientText || '').trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Empty input',
    };
  }

  // STEP 1 & 4: Red Flag Detection (Deterministic First Line)
  const redFlag = detectRedFlags(trimmed);
  if (redFlag && redFlag.detected) {
    const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const warningMsg = redFlag.patient_instruction[langKey] || redFlag.patient_instruction['en-IN'];

    // TODO: Future: Send alert to doctor/staff backend and MongoDB
    const doctorAlert = {
      alert_id: `alert-${Date.now()}`,
      session_id: 'current-session',
      priority: 'HIGH',
      status: 'PENDING_REVIEW',
      category: redFlag.category,
      reason: redFlag.reason,
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      assistant_message: warningMsg,
      next_question: '',
      quick_chips: [],
      clinical_state_update: {
        ...clinicalState,
        session_status: 'URGENT_REVIEW_REQUIRED',
        red_flags: [...(clinicalState.red_flags || []), redFlag],
      },
      red_flag: {
        detected: true,
        priority: 'HIGH',
        category: redFlag.category,
        reason: redFlag.reason,
      },
      doctor_alert: doctorAlert,
      doctor_review_required: true,
      history_complete: false,
      session_status: 'URGENT_REVIEW_REQUIRED',
    };
  }

  // STEP 2 & 3: Extract Entities & Update Clinical State
  const extracted = extractClinicalInformation(trimmed, clinicalState);
  const updatedState = updateClinicalState(clinicalState, extracted);

  // STEP 5, 6, 7 & 8: Try Backend Groq API first, else use Deterministic Adaptive Engine
  let aiResponse = null;

  try {
    const response = await fetch('http://localhost:5000/api/v1/intake/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_answer: trimmed,
        language: language.toLowerCase().startsWith('gu') ? 'Gujarati' : language.toLowerCase().startsWith('hi') ? 'Hindi' : 'English',
        opd_mode: opdMode,
        current_clinical_state: updatedState,
        conversation_history: conversationHistory,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.assistant_message) {
        aiResponse = data;
      }
    }
  } catch (apiErr) {
    console.warn('[Backend Intake API Offline/Error, using local Clinical Engine]:', apiErr.message);
  }

  // Fallback to local adaptive reasoning engine if server API not reachable
  if (!aiResponse) {
    const isComplete = isHistoryComplete(updatedState, turnCount);
    if (isComplete) {
      const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
      const completeMsgs = {
        'gu-IN': 'તમારો તબીબી ઈતિહાસ સફળતાપૂર્વક નોંધાઈ ગયો છે. હવે ડૉક્ટર તમારી વિગતોની સમીક્ષા કરશે.',
        'hi-IN': 'आपका मेडिकल इतिहास सफलतापूर्वक दर्ज कर लिया गया है। अब डॉक्टर आपकी जानकारी की समीक्षा करेंगे।',
        'en-IN': 'Your medical history has been recorded. We are preparing it for the doctor.'
      };
      return {
        success: true,
        assistant_message: completeMsgs[langKey] || completeMsgs['en-IN'],
        next_question: '',
        quick_chips: [],
        clinical_state_update: {
          ...updatedState,
          session_status: 'READY_FOR_SUMMARY',
        },
        red_flag: { detected: false, priority: 'LOW', reason: '' },
        doctor_review_required: false,
        history_complete: true,
        session_status: 'READY_FOR_SUMMARY',
      };
    }

    const nextSelection = selectNextAdaptiveQuestion(updatedState, language, opdMode);
    aiResponse = {
      assistant_message: nextSelection.question,
      next_question: nextSelection.question,
      quick_chips: nextSelection.chips,
      red_flag: { detected: false, priority: 'LOW', reason: '' },
      history_complete: false,
      doctor_review_required: false,
      session_status: 'IN_PROGRESS',
    };
  }

  return {
    success: true,
    assistant_message: aiResponse.assistant_message,
    next_question: aiResponse.next_question || aiResponse.assistant_message,
    quick_chips: aiResponse.quick_chips || [],
    clinical_state_update: updatedState,
    red_flag: aiResponse.red_flag || { detected: false, priority: 'LOW', reason: '' },
    doctor_review_required: aiResponse.doctor_review_required || false,
    history_complete: aiResponse.history_complete || false,
    session_status: aiResponse.session_status || (aiResponse.history_complete ? 'READY_FOR_SUMMARY' : 'IN_PROGRESS'),
    doctor_alert: aiResponse.doctor_alert || null,
  };
}
