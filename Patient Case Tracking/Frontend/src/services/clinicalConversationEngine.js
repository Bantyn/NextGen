import { CLINICAL_DISEASE_FRAMEWORKS } from '../constants/clinicalFrameworks.js';

/**
 * Initial empty clinical state object
 */
export const INITIAL_CLINICAL_STATE = {
  session_id: '',
  language: 'gu-IN',
  mode: 'general',
  session_status: 'IN_PROGRESS', // 'IN_PROGRESS' | 'URGENT_REVIEW_REQUIRED' | 'READY_FOR_SUMMARY'

  chief_complaints: [],
  symptoms: [],
  symptom_details: [],
  duration: [],
  severity: [],
  onset: [],
  location: [],
  progression: [],
  associated_symptoms: [],
  aggravating_factors: [],
  relieving_factors: [],
  past_medical_history: [],
  past_surgical_history: [],
  medications: [],
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
  asked_questions: [],
  answered_questions: [],
  missing_information: [
    'chief_complaint',
    'onset_duration',
    'severity',
    'associated_symptoms',
    'past_medical_history',
  ],
  patient_intent: 'UNKNOWN',
  history_complete: false,
  doctor_review_required: false,
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
      'સીને મેં ભારે દબાવ', 'સીને કા દર્દ હાથ મેં', 'સીને મેં દર્દ ઔર પસીના',
      'सीने में भारी दबाव', 'सीने का दर्द बाएं हाथ में', 'सीने में दर्द और पसीना', 'सीने में तेज दर्द'
    ],
    reason: 'Possible acute coronary syndrome or myocardial ischemia. Immediate triage ECG and emergency review needed.',
    patient_instruction: {
      'en-IN': 'Some of the symptoms you described (chest pain/pressure) may require immediate medical attention. Please speak with a doctor or emergency staff right now.',
      'hi-IN': 'सीने में तेज दर्द और भारीपन के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत इमरजेंसी डॉक्टर या मेडिकल स्टाफ से संपर्क करें।',
      'gu-IN': 'તમારા જણાવેલા લક્ષણો (છાતીમાં દુખાવો/દબાણ) તાત્કાલિક તબીબી તપાસ માંગી લે છે. કૃપા કરીને અત્યારે જ ડૉક્ટર અથવા તબીબી સ્ટાફનો સંપર્ક કરો.'
    }
  },
  {
    category: 'RESPIRATORY_DISTRESS',
    priority: 'HIGH',
    triggers: [
      'severe breathing difficulty', 'cannot breathe', 'gasping for air', 'stridor', 'severe breathlessness',
      'શ્વાસ લેવામાં ખૂબ તકલીફ', 'શ્વાસ નથી લઈ શકાતો', 'દમ ઘૂંટાવો',
      'સાંસ લેને મેં બહુત તકલીફ', 'સાંસ નહીં આ રહી',
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
 * Classify Patient Intent
 */
export function detectPatientIntent(patientText, clinicalState = {}) {
  const textLower = patientText.toLowerCase().trim();

  // 1. Direct Questions by Patient (e.g. "Should I see a doctor?", "શું મારે ડૉક્ટરની સલાહ લેવી જોઈએ?")
  if (
    textLower.includes("should i") ||
    textLower.includes("do i need to see") ||
    textLower.includes("is this serious") ||
    textLower.includes("what should i do") ||
    patientText.includes("શું મારે") ||
    patientText.includes("સલાહ લેવી જોઈએ") ||
    patientText.includes("ડૉક્ટરને મળવું") ||
    patientText.includes("શું કરવું") ||
    patientText.includes("क्या मुझे") ||
    patientText.includes("डॉक्टर को दिखाना") ||
    patientText.includes("क्या करूं") ||
    patientText.endsWith("?")
  ) {
    return 'PATIENT_QUESTION';
  }

  // 2. Request for Medical Guidance / Doctor Consultation / Helplessness
  if (
    textLower.includes("doctor advice") ||
    textLower.includes("refer to doctor") ||
    textLower.includes("consult doctor") ||
    textLower.includes("i don't know what to do") ||
    patientText.includes("સલાહ માટે ડૉક્ટર") ||
    patientText.includes("ડૉક્ટરની સલાહ") ||
    patientText.includes("કાઈજ ખબર નથી પડતી") ||
    patientText.includes("ખબર નથી પડતી") ||
    patientText.includes("કંઈ સમજાતું નથી") ||
    patientText.includes("सलाह के लिए डॉक्टर") ||
    patientText.includes("कुछ समझ नहीं आ रहा") ||
    patientText.includes("डॉक्टर की सलाह")
  ) {
    return 'REQUEST_FOR_MEDICAL_GUIDANCE';
  }

  // 3. Negations / Corrections (e.g. "No fever", "મને તાવ નથી")
  if (
    textLower.includes("no,") ||
    textLower.includes("i don't have") ||
    textLower.includes("not having") ||
    patientText.includes("નથી") ||
    patientText.includes("ના,") ||
    patientText.includes("नहीं,") ||
    patientText.includes("नहीं है")
  ) {
    return 'CORRECTION';
  }

  // 4. Stop Request / Goodbye / Completion (e.g. "That's all", "બસ એટલું જ")
  if (
    textLower.includes("that's all") ||
    textLower.includes("nothing else") ||
    textLower.includes("stop") ||
    patientText.includes("બસ એટલું જ") ||
    patientText.includes("બીજું કંઈ નથી") ||
    patientText.includes("बस इतना ही") ||
    patientText.includes("और कुछ नहीं")
  ) {
    return 'STOP_REQUEST';
  }

  // 5. Initial Complaint vs Symptom Information
  if (!clinicalState.chief_complaints || clinicalState.chief_complaints.length === 0) {
    return 'INITIAL_COMPLAINT';
  }

  return 'SYMPTOM_INFORMATION';
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
    onset: null,
    location: null,
    associated_symptoms: [],
    past_medical_history: [],
    medications: [],
    negated_symptoms: [],
  };

  // 1. Negations & Corrections
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
    if (textLower.includes("cough") || patientText.includes("ઉધરસ") || patientText.includes("ખાંસી") || patientText.includes("खांसी")) {
      extracted.negated_symptoms.push("Cough");
    }
    if (patientText.includes("કઠિનતા") || textLower.includes("stiffness")) {
      extracted.negated_symptoms.push("Stiffness");
    }
  }

  // 2. Chief Complaints & Location
  if (
    textLower.includes("knee") ||
    textLower.includes("joint") ||
    patientText.includes("સાંધા") ||
    patientText.includes("ઘૂંટણ") ||
    patientText.includes("ગોઠણ") ||
    patientText.includes("જોડો") ||
    patientText.includes("घुटने") ||
    patientText.includes("जोड़ों")
  ) {
    extracted.chief_complaint = "Joint and Knee Pain (સાંધા અને ઘૂંટણમાં દુખાવો)";
    extracted.symptoms.push("Joint / Knee Pain");
    extracted.location = "Knee and Joints (સાંધા અને ઘૂંટણ)";
  } else if (
    textLower.includes("chest pain") ||
    textLower.includes("chest pressure") ||
    patientText.includes("છાતીમાં દુખાવો") ||
    patientText.includes("સીને મેં દર્દ") ||
    patientText.includes("सीने में दर्द")
  ) {
    extracted.chief_complaint = "Chest Pain (છાતીમાં દુખાવો)";
    extracted.symptoms.push("Chest Pain");
    extracted.location = "Chest (છાતી)";
  } else if (
    textLower.includes("fever") ||
    textLower.includes("temperature") ||
    patientText.includes("તાવ") ||
    patientText.includes("બુખાર") ||
    patientText.includes("बुखार")
  ) {
    if (!extracted.negated_symptoms.includes("Fever")) {
      extracted.chief_complaint = "Fever (તાવ / बुखार)";
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
    extracted.chief_complaint = "Abdominal Pain (પેટમાં દુખાવો)";
    extracted.symptoms.push("Abdominal Pain");
    extracted.location = "Abdomen (પેટ)";
  } else if (
    textLower.includes("headache") ||
    textLower.includes("head pain") ||
    patientText.includes("માથું") ||
    patientText.includes("માથાનો") ||
    patientText.includes("सिर दर्द") ||
    patientText.includes("सर दर्द")
  ) {
    extracted.chief_complaint = "Headache (માથાનો દુખાવો)";
    extracted.symptoms.push("Headache");
    extracted.location = "Head (માથું)";
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
      extracted.chief_complaint = "Cough and Cold (શરદી અને ખાંસી)";
      extracted.symptoms.push("Cough / Cold");
    }
  }

  // 3. Duration Extraction
  const durationMatch = patientText.match(
    /(\d+\s*(?:years?|yrs?|months?|weeks?|days?|hours?|વર્ષ|વરસ|મહિના|અઠવાડિયા|દિવસ|દહાડા|કલાક|साल|महीने|हफ्ते|दिन|घंटे))/i
  );
  if (durationMatch) {
    let dur = durationMatch[1];
    if (dur.includes("વર્ષ") || dur.includes("વરસ") || dur.includes("साल") || dur.toLowerCase().includes("year")) {
      extracted.duration = `${dur.match(/\d+/)[0]} Years (${dur})`;
    } else {
      extracted.duration = dur;
    }
  } else if (
    textLower.includes("today") ||
    patientText.includes("આજે") ||
    patientText.includes("आज")
  ) {
    extracted.duration = "Today (આજથી)";
  } else if (
    textLower.includes("yesterday") ||
    patientText.includes("ગઈકાલ") ||
    patientText.includes("કલ")
  ) {
    extracted.duration = "1 day (ગઈકાલથી)";
  } else if (
    textLower.includes("since morning") ||
    patientText.includes("સવારથી") ||
    patientText.includes("सुबह से")
  ) {
    extracted.duration = "Since morning (સવારથી)";
  }

  // 4. Onset Extraction (Gradual vs Sudden)
  if (
    textLower.includes("gradual") ||
    textLower.includes("slowly") ||
    patientText.includes("ધીમે ધીમે") ||
    patientText.includes("ધીમે-ધીમે") ||
    patientText.includes("ધીરે ધીરે") ||
    patientText.includes("धीरे-धीरे")
  ) {
    extracted.onset = "Gradual (ધીમે ધીમે)";
  } else if (
    textLower.includes("sudden") ||
    patientText.includes("અચાનક") ||
    patientText.includes("એકાએક") ||
    patientText.includes("अचानक")
  ) {
    extracted.onset = "Sudden (અચાનક)";
  }

  // 5. Severity Extraction
  const numMatch = patientText.match(/\b([1-9]|10)\b/);
  if (numMatch && (textLower.includes("scale") || textLower.includes("/10") || patientText.trim().length <= 5 || textLower.includes("score"))) {
    extracted.severity = `${numMatch[1]} / 10`;
  } else if (
    textLower.includes("severe") ||
    textLower.includes("very high") ||
    textLower.includes("unbearable") ||
    patientText.includes("તીવ્ર") ||
    patientText.includes("ખૂબ વધારે") ||
    patientText.includes("बहुत तेज")
  ) {
    extracted.severity = "Severe (ખૂબ વધારે)";
  } else if (
    textLower.includes("moderate") ||
    patientText.includes("મધ્યમ") ||
    patientText.includes("मध्यम")
  ) {
    extracted.severity = "Moderate (મધ્યમ)";
  } else if (
    textLower.includes("mild") ||
    textLower.includes("little") ||
    patientText.includes("હળવો") ||
    patientText.includes("થોડું") ||
    patientText.includes("हल्का") ||
    patientText.includes("थोड़ा")
  ) {
    extracted.severity = "Mild (હળવો)";
  }

  // 6. Associated Symptoms (Stiffness, Swelling, Vomiting, Chills, Sweating)
  if (
    textLower.includes("stiff") ||
    patientText.includes("કઠિનતા") ||
    patientText.includes("કડકાઈ") ||
    patientText.includes("અકડાઈ") ||
    patientText.includes("કડક") ||
    patientText.includes("जकड़न") ||
    patientText.includes("अकड़न")
  ) {
    if (!extracted.negated_symptoms.includes("Stiffness")) {
      extracted.associated_symptoms.push("Stiffness / Rigidity (કઠિનતા / અકડાઈ જવું)");
    }
  }
  if (
    textLower.includes("swell") ||
    patientText.includes("સોજો") ||
    patientText.includes("સુજન") ||
    patientText.includes("सूजन")
  ) {
    extracted.associated_symptoms.push("Swelling / Edema (સોજો)");
  }
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
    extracted.associated_symptoms.push("Chills (ધ્રુજારી)");
  }
  if (
    textLower.includes("sweat") ||
    patientText.includes("પરસેવો") ||
    patientText.includes("पसीना")
  ) {
    extracted.associated_symptoms.push("Diaphoresis (પરસેવો)");
  }

  // 7. Past Medical History & Chronic conditions
  if (
    textLower.includes("diabetes") ||
    textLower.includes("sugar") ||
    patientText.includes("ડાયાબિટીસ") ||
    patientText.includes("સુગર") ||
    patientText.includes("डायबिटीज")
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
    textLower.includes("arthritis") ||
    patientText.includes("સંધિવા") ||
    patientText.includes("વા") ||
    patientText.includes("गठिया")
  ) {
    extracted.past_medical_history.push("Arthritis / Joint Disease (સંધિવા)");
  }

  // 8. Medications
  const medMatches = patientText.match(
    /\b(metformin|paracetamol|crocin|aspirin|amlodipine|telmisartan|pantoprazole|thyronorm|inhaler)\b/gi
  );
  if (medMatches) {
    extracted.medications = Array.from(new Set(medMatches.map((m) => m.trim())));
  }

  return extracted;
}

/**
 * Update Clinical State with newly extracted entities & corrections
 */
export function updateClinicalState(currentState, extracted) {
  const updated = { ...currentState };

  // 1. Handle Negations & Corrections
  if (extracted.negated_symptoms && extracted.negated_symptoms.length > 0) {
    extracted.negated_symptoms.forEach((neg) => {
      updated.symptoms = (updated.symptoms || []).filter((s) => !s.toLowerCase().includes(neg.toLowerCase()));
      updated.chief_complaints = (updated.chief_complaints || []).filter((c) => !c.toLowerCase().includes(neg.toLowerCase()));
      updated.associated_symptoms = (updated.associated_symptoms || []).filter((a) => !a.toLowerCase().includes(neg.toLowerCase()));
    });
  }

  // 2. Update Chief Complaints
  if (extracted.chief_complaint) {
    if (!updated.chief_complaints.includes(extracted.chief_complaint)) {
      updated.chief_complaints = [extracted.chief_complaint, ...updated.chief_complaints];
    }
  }

  // 3. Update Location
  if (extracted.location) {
    if (!updated.location.includes(extracted.location)) {
      updated.location = [...updated.location, extracted.location];
    }
  }

  // 4. Update Symptoms
  if (extracted.symptoms && extracted.symptoms.length > 0) {
    const existing = new Set(updated.symptoms || []);
    extracted.symptoms.forEach((s) => existing.add(s));
    updated.symptoms = Array.from(existing);
  }

  // 5. Update Duration
  if (extracted.duration) {
    if (!updated.duration.includes(extracted.duration)) {
      updated.duration = [...updated.duration, extracted.duration];
    }
  }

  // 6. Update Onset
  if (extracted.onset) {
    if (!updated.onset.includes(extracted.onset)) {
      updated.onset = [...updated.onset, extracted.onset];
    }
  }

  // 7. Update Severity
  if (extracted.severity) {
    if (!updated.severity.includes(extracted.severity)) {
      updated.severity = [...updated.severity, extracted.severity];
    }
  }

  // 8. Update Associated Symptoms
  if (extracted.associated_symptoms && extracted.associated_symptoms.length > 0) {
    const existing = new Set(updated.associated_symptoms || []);
    extracted.associated_symptoms.forEach((s) => existing.add(s));
    updated.associated_symptoms = Array.from(existing);
  }

  // 9. Update Past Medical History
  if (extracted.past_medical_history && extracted.past_medical_history.length > 0) {
    const existing = new Set(updated.past_medical_history || []);
    extracted.past_medical_history.forEach((pmh) => existing.add(pmh));
    updated.past_medical_history = Array.from(existing);
  }

  // 10. Update Medications
  if (extracted.medications && extracted.medications.length > 0) {
    const existing = new Set(updated.medications || []);
    extracted.medications.forEach((med) => existing.add(med));
    updated.medications = Array.from(existing);
  }

  // Re-calculate Missing Information
  const missing = [];
  if (!updated.chief_complaints || updated.chief_complaints.length === 0) missing.push('chief_complaint');
  if (!updated.duration || updated.duration.length === 0) missing.push('onset_duration');
  if (!updated.severity || updated.severity.length === 0) missing.push('severity');
  if (!updated.onset || updated.onset.length === 0) missing.push('onset');
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
  const hasOnsetOrAssoc = (clinicalState.onset && clinicalState.onset.length > 0) ||
                          (clinicalState.associated_symptoms && clinicalState.associated_symptoms.length > 0);

  // If 4 core domains are answered OR patient has completed 4-5 focused turns
  if ((hasChief && hasDuration && hasSeverity && hasOnsetOrAssoc) || turnCount >= 5) {
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
      'gu-IN': ['સાંધા અને ઘૂંટણમાં દુખાવો', 'તાવ અને શરદી', 'પેટમાં દુખાવો', 'માથું દુખે છે', 'છાતીમાં દુખાવો'],
      'hi-IN': ['जोड़ों और घुटनों में दर्द', 'बुखार और सर्दी', 'पेट में दर्द', 'सिर दर्द', 'सीने में दर्द'],
      'en-IN': ['Joint & Knee Pain', 'Fever & Cold', 'Stomach Pain', 'Headache', 'Chest Discomfort']
    };
    return {
      topic: 'chief_complaint',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 2. Missing Duration
  if (!clinicalState.duration || clinicalState.duration.length === 0) {
    const questions = {
      'gu-IN': 'આ દુખાવો કે તકલીફ તમને કેટલા સમયથી છે?',
      'hi-IN': 'यह दर्द या परेशानी आपको कितने समय से है?',
      'en-IN': 'How long have you been having this pain or discomfort?'
    };
    const chips = {
      'gu-IN': ['છેલ્લા ૨ વર્ષથી', '૨-૩ મહિનાથી', '૨-૩ દિવસથી', 'આજ સવારથી'],
      'hi-IN': ['पिछले 2 साल से', '2-3 महीने से', '2-3 दिन से', 'आज सुबह से'],
      'en-IN': ['Since 2 years', 'For 2-3 months', 'Since 2-3 days', 'Since this morning']
    };
    return {
      topic: 'onset_duration',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 3. Missing Severity (1-10 Scale)
  if (!clinicalState.severity || clinicalState.severity.length === 0) {
    const questions = {
      'gu-IN': '૧ થી ૧૦ ના સ્કેલ પર આ દુખાવો કેટલો તીવ્ર છે?',
      'hi-IN': '1 से 10 के पैमाने पर यह दर्द कितना तेज या गंभीर है?',
      'en-IN': 'On a scale of 1 to 10, how severe is the pain?'
    };
    const chips = {
      'gu-IN': ['૫ (મધ્યમ)', '૩ (હળવો)', '૮ (ખૂબ વધારે)', '૧૦ (અસહ્ય)'],
      'hi-IN': ['5 (मध्यम)', '3 (हल्का)', '8 (काफी तेज)', '10 (असहनीय)'],
      'en-IN': ['5 (Moderate)', '3 (Mild)', '8 (Severe)', '10 (Unbearable)']
    };
    return {
      topic: 'severity',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 4. Missing Onset (Sudden vs Gradual)
  if (!clinicalState.onset || clinicalState.onset.length === 0) {
    const questions = {
      'gu-IN': 'દુખાવો અચાનક શરૂ થયો હતો કે ધીમે-ધીમે વધ્યો છે?',
      'hi-IN': 'दर्द अचानक शुरू हुआ था या धीरे-धीरे बढ़ा है?',
      'en-IN': 'Did the pain start suddenly, or did it develop gradually?'
    };
    const chips = {
      'gu-IN': ['ધીમે ધીમે', 'અચાનક શરૂ થયો', 'વધતો-ઓછો થાય છે'],
      'hi-IN': ['धीरे-धीरे', 'अचानक शुरू हुआ', 'कम-ज्यादा होता रहता है'],
      'en-IN': ['Gradually', 'Suddenly started', 'Comes and goes']
    };
    return {
      topic: 'onset',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 5. Missing Associated Symptoms
  if (!clinicalState.associated_symptoms || clinicalState.associated_symptoms.length === 0) {
    if (chief.includes('joint') || chief.includes('knee') || chief.includes('સાંધા') || chief.includes('ઘૂંટણ')) {
      const questions = {
        'gu-IN': 'શું તમને સાંધામાં કઠિનતા (અકડાઈ જવું), સોજો કે ચાલવામાં મુશ્કેલી અનુભવાય છે?',
        'hi-IN': 'क्या आपको जोड़ों में अकड़न (जकड़न), सूजन या चलने में कठिनाई महसूस होती है?',
        'en-IN': 'Do you experience joint stiffness, swelling, or difficulty while walking?'
      };
      const chips = {
        'gu-IN': ['કઠિનતા (અકડાઈ જવું)', 'ઘૂંટણમાં સોજો છે', 'ચાલતી વખતે અવાજ આવે છે', 'ના, અન્ય કોઈ તકલીફ નથી'],
        'hi-IN': ['अकड़न / जकड़न', 'घुटनों में सूजन है', 'चलने में तकलीफ', 'नहीं, कोई अन्य लक्षण नहीं'],
        'en-IN': ['Stiffness in joints', 'Swelling present', 'Difficulty walking', 'No other symptoms']
      };
      return { topic: 'associated_symptoms', question: questions[langKey] || questions['en-IN'], chips: chips[langKey] || chips['en-IN'] };
    }

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
        'gu-IN': 'શું તાવ સાથે ધ્રુજારી, ખાંસી કે ગળામાં દુખાવો થાય છે?',
        'hi-IN': 'क्या बुखार के साथ ठंड/कंपकंपी, खांसी या गले में दर्द हो रहा है?',
        'en-IN': 'Are you experiencing chills, cough, or sore throat along with the fever?'
      };
      const chips = {
        'gu-IN': ['ધ્રુજારી સાથે તાવ', 'ખાંસી અને ગળામાં દુખાવો', 'આખા શરીરમાં કળતર', 'ના, ફક્ત તાવ'],
        'hi-IN': ['कंपकंपी के साथ बुखार', 'खांसी और गले में दर्द', 'बदन में दर्द', 'नहीं, सिर्फ बुखार'],
        'en-IN': ['Fever with chills', 'Cough & throat pain', 'Body aches', 'No other symptoms']
      };
      return { topic: 'associated_symptoms', question: questions[langKey] || questions['en-IN'], chips: chips[langKey] || chips['en-IN'] };
    }
  }

  // 6. Missing Past Medical History & Medications
  if (!clinicalState.past_medical_history || clinicalState.past_medical_history.length === 0) {
    const questions = {
      'gu-IN': 'શું તમને પહેલાથી ડાયાબિટીસ, બીપી કે સંધિવા જેવી કોઈ જૂની બીમારી છે?',
      'hi-IN': 'क्या आपको पहले से डायबिटीज, बीपी या गठिया जैसी कोई पुरानी बीमारी है?',
      'en-IN': 'Do you have any past medical history like Diabetes, BP, or Arthritis?'
    };
    const chips = {
      'gu-IN': ['સંધિવા (વા) છે', 'ડાયાબિટીસ છે', 'બ્લડ પ્રેશર (BP) છે', 'ના, કોઈ જૂની બીમારી નથી'],
      'hi-IN': ['गठिया (आर्थराइटिस) है', 'डायबिटीज है', 'हाई बीपी है', 'नहीं, कोई बीमारी नहीं'],
      'en-IN': ['Arthritis / Joint condition', 'Diabetes', 'Hypertension (BP)', 'None / Healthy']
    };
    return {
      topic: 'past_medical_history',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 7. AYUSH Specific Inquiry (if in AYUSH OPD Mode)
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

  // 8. Completed History
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
 * Generate Direct Empathetic Response to Patient Question or Guidance Request
 */
export function generatePatientGuidanceResponse({
  intent,
  patientText,
  clinicalState,
  language = 'gu-IN',
}) {
  const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
  const chief = (clinicalState.chief_complaints?.[0] || clinicalState.symptoms?.[0] || 'તકલીફ').replace(/\(.*?\)/g, '').trim();
  const dur = (clinicalState.duration?.[0] || '').replace(/\(.*?\)/g, '').trim();

  // If patient asks "Should I see a doctor?" or asks for doctor consultation
  if (intent === 'PATIENT_QUESTION' || intent === 'REQUEST_FOR_MEDICAL_GUIDANCE') {
    if (langKey === 'gu-IN') {
      const durText = dur ? `${dur}થી ચાલતા ` : '';
      return `હા, તમારા ${durText}${chief} માટે ડૉક્ટરની રૂબરૂ સલાહ લેવી ખૂબ જ યોગ્ય રહેશે. હું તમારી જરૂરી માહિતી તૈયાર કરી રહી છું જેથી ડૉક્ટર તમને યોગ્ય સલાહ આપી શકે.`;
    }
    if (langKey === 'hi-IN') {
      const durText = dur ? `${dur} से चल रहे ` : '';
      return `हाँ, आपके ${durText}${chief} के लिए डॉक्टर से परामर्श लेना बिल्कुल सही रहेगा। मैं आपकी जरूरी जानकारी तैयार कर रही हूँ ताकि डॉक्टर आपको सही सलाह दे सकें।`;
    }
    const durText = dur ? `lasting ${dur} ` : '';
    return `Yes, consulting a doctor for your ${chief} ${durText}is definitely the right step. I am organizing your clinical details so the doctor can evaluate you properly.`;
  }

  return '';
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

  // STEP 1: Detect Patient Intent
  const intent = detectPatientIntent(trimmed, clinicalState);

  // STEP 2: Red Flag Detection (Deterministic First Line)
  const redFlag = detectRedFlags(trimmed);
  if (redFlag && redFlag.detected) {
    const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const warningMsg = redFlag.patient_instruction[langKey] || redFlag.patient_instruction['en-IN'];

    // TODO: Future: Send real-time alert to doctor/staff station and MongoDB
    const doctorAlert = {
      alert_id: `alert-${Date.now()}`,
      session_id: clinicalState.session_id || 'current-session',
      priority: 'HIGH',
      status: 'PENDING_REVIEW',
      category: redFlag.category,
      reason: redFlag.reason,
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      assistant_message: warningMsg,
      intent: 'EMERGENCY_INFORMATION',
      next_question: '',
      quick_chips: [],
      clinical_state_update: {
        ...clinicalState,
        session_status: 'URGENT_REVIEW_REQUIRED',
        red_flags: [...(clinicalState.red_flags || []), redFlag],
        doctor_review_required: true,
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

  // STEP 3: Extract Entities & Update Clinical State
  const extracted = extractClinicalInformation(trimmed, clinicalState);
  const updatedState = updateClinicalState(clinicalState, extracted);
  updatedState.patient_intent = intent;

  // STEP 4: Check if patient requested stop or history is already complete
  const isComplete = isHistoryComplete(updatedState, turnCount) || intent === 'STOP_REQUEST';

  // STEP 5: Handle Direct Patient Questions / Guidance Requests
  let directGuidanceAnswer = '';
  if (intent === 'PATIENT_QUESTION' || intent === 'REQUEST_FOR_MEDICAL_GUIDANCE') {
    directGuidanceAnswer = generatePatientGuidanceResponse({
      intent,
      patientText: trimmed,
      clinicalState: updatedState,
      language,
    });
  }

  // If history is complete or patient specifically requested doctor after providing duration/severity
  if (isComplete || (intent === 'REQUEST_FOR_MEDICAL_GUIDANCE' && updatedState.duration.length > 0 && updatedState.severity.length > 0)) {
    const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const completeMsgs = {
      'gu-IN': 'તમારો સંપૂર્ણ તબીબી ઈતિહાસ સફળતાપૂર્વક નોંધી લેવામાં આવ્યો છે. અમે તેને ડૉક્ટરની સમીક્ષા માટે તૈયાર કર્યો છે.',
      'hi-IN': 'आपका संपूर्ण मेडिकल इतिहास सफलतापूर्वक दर्ज कर लिया गया है। हमने इसे डॉक्टर की समीक्षा के लिए तैयार कर दिया है।',
      'en-IN': 'Your medical history has been successfully recorded. We have prepared it for the doctor\'s review.'
    };

    const finalMsg = directGuidanceAnswer
      ? `${directGuidanceAnswer} ${completeMsgs[langKey] || completeMsgs['en-IN']}`
      : completeMsgs[langKey] || completeMsgs['en-IN'];

    return {
      success: true,
      assistant_message: finalMsg,
      intent,
      next_question: '',
      quick_chips: [],
      clinical_state_update: {
        ...updatedState,
        session_status: 'READY_FOR_SUMMARY',
        history_complete: true,
        doctor_review_required: true,
      },
      red_flag: { detected: false, priority: 'LOW', reason: '' },
      doctor_review_required: true,
      history_complete: true,
      session_status: 'READY_FOR_SUMMARY',
    };
  }

  // STEP 6: Call Backend Groq AI or Local Adaptive Engine for Next Step
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
        if (data.extracted_entities) {
          if (data.extracted_entities.chief_complaint && !updatedState.chief_complaints.includes(data.extracted_entities.chief_complaint)) {
            updatedState.chief_complaints.push(data.extracted_entities.chief_complaint);
          }
          if (data.extracted_entities.duration && !updatedState.duration.includes(data.extracted_entities.duration)) {
            updatedState.duration.push(data.extracted_entities.duration);
          }
          if (data.extracted_entities.severity && !updatedState.severity.includes(data.extracted_entities.severity)) {
            updatedState.severity.push(data.extracted_entities.severity);
          }
          if (data.extracted_entities.onset && !updatedState.onset.includes(data.extracted_entities.onset)) {
            updatedState.onset.push(data.extracted_entities.onset);
          }
          if (data.extracted_entities.associated_symptoms && Array.isArray(data.extracted_entities.associated_symptoms)) {
            data.extracted_entities.associated_symptoms.forEach(s => {
              if (!updatedState.associated_symptoms.includes(s)) updatedState.associated_symptoms.push(s);
            });
          }
        }
      }
    }
  } catch (apiErr) {
    console.warn('[Backend Intake API Offline/Error, using local Clinical Engine]:', apiErr.message);
  }

  // Local Adaptive Engine Fallback
  if (!aiResponse) {
    const nextSelection = selectNextAdaptiveQuestion(updatedState, language, opdMode);
    
    // If patient asked a question, combine guidance answer with the next clinical question smoothly
    let composedMessage = nextSelection.question;
    if (directGuidanceAnswer) {
      composedMessage = `${directGuidanceAnswer} ${nextSelection.question}`;
    }

    aiResponse = {
      assistant_message: composedMessage,
      next_question: nextSelection.question,
      quick_chips: nextSelection.chips,
      red_flag: { detected: false, priority: 'LOW', reason: '' },
      history_complete: false,
      doctor_review_required: false,
      session_status: 'IN_PROGRESS',
    };
  } else if (directGuidanceAnswer && !aiResponse.assistant_message.includes('ડૉક્ટર') && !aiResponse.assistant_message.includes('doctor')) {
    aiResponse.assistant_message = `${directGuidanceAnswer} ${aiResponse.assistant_message}`;
  }

  return {
    success: true,
    assistant_message: aiResponse.assistant_message,
    intent,
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
