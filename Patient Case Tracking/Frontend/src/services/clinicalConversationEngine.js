import { CLINICAL_DISEASE_FRAMEWORKS } from '../constants/clinicalFrameworks.js';
import {
  getClinicalKnowledge,
  selectNextQuestionFromKnowledgeBase,
} from '../data/clinicalKnowledgeBase.js';

/**
 * Initial empty clinical state object with contextual risk tracking
 */
export const INITIAL_CLINICAL_STATE = {
  session_id: '',
  language: 'gu-IN',
  mode: 'general',
  session_status: 'IN_PROGRESS', // 'IN_PROGRESS' | 'URGENT_REVIEW_REQUIRED' | 'READY_FOR_SUMMARY'
  risk_state: 'LOW_RISK_CONTEXT', // 'LOW_RISK_CONTEXT' | 'ASSESSING' | 'POSSIBLE_RED_FLAG' | 'URGENT_REVIEW_REQUIRED'

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
 * Contextual Emergency Red-Flag Evaluator
 */
export function evaluateContextualRedFlags(patientText, clinicalState = {}) {
  if (!patientText) return null;
  const textLower = patientText.toLowerCase().trim();

  const hasChestPain =
    textLower.includes('chest') ||
    textLower.includes('heart attack') ||
    patientText.includes('છાતી') ||
    patientText.includes('सीना') ||
    patientText.includes('સીના') ||
    clinicalState.chief_complaints?.some((c) => String(c).toLowerCase().includes('chest') || String(c).includes('છાતી'));

  const hasSevereBreathingDifficulty =
    textLower.includes('cannot breathe') ||
    textLower.includes("can't breathe") ||
    textLower.includes('gasping') ||
    textLower.includes('choking') ||
    textLower.includes('stridor') ||
    textLower.includes('severe difficulty breathing') ||
    textLower.includes('severe breathlessness') ||
    patientText.includes('શ્વાસ નથી લઈ શકાતો') ||
    patientText.includes('શ્વાસ લેવામાં ખૂબ તકલીફ') ||
    patientText.includes('દમ ઘૂંટાવો') ||
    patientText.includes('સાંસ નહીં આ રહી') ||
    patientText.includes('सांस नहीं आ रही') ||
    patientText.includes('दम घुट रहा है');

  const hasSweatingOrRadiationOrFaint =
    textLower.includes('sweat') ||
    textLower.includes('radiat') ||
    textLower.includes('left arm') ||
    textLower.includes('faint') ||
    textLower.includes('dizzy') ||
    textLower.includes('crushing') ||
    patientText.includes('પરસેવો') ||
    patientText.includes('ડાબા હાથ') ||
    patientText.includes('ચક્કર') ||
    patientText.includes('પસીના') ||
    patientText.includes('बाएं हाथ') ||
    patientText.includes('चक्कर');

  const hasHighSeverity =
    textLower.includes('9/10') ||
    textLower.includes('10/10') ||
    textLower.includes('unbearable') ||
    textLower.includes('severe chest pain') ||
    patientText.includes('અસહ્ય') ||
    patientText.includes('ખૂબ તીવ્ર છાતી');

  // 1. Cardiovascular Emergency
  if (hasChestPain && (hasSevereBreathingDifficulty || hasSweatingOrRadiationOrFaint || hasHighSeverity || textLower.includes('heart attack'))) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'CARDIOVASCULAR_EMERGENCY',
      reason: 'Chest pain combined with acute breathlessness, diaphoresis, radiation, or severe distress.',
      patient_instruction: {
        'en-IN': 'Some of the symptoms you described (chest discomfort with breathing difficulty/sweating) may require immediate medical attention. Please speak with a doctor or emergency staff right now.',
        'hi-IN': 'सीने में दर्द के साथ सांस लेने में कठिनाई या पसीना आना तुरंत डॉक्टरी जांच की मांग करता है। कृपया तुरंत डॉक्टर या मेडिकल स्टाफ से संपर्क करें।',
        'gu-IN': 'છાતીમાં દુખાવા સાથે શ્વાસ લેવામાં તકલીફ અથવા પરસેવો થવાના લક્ષણો તાત્કાલિક તબીબી તપાસ માંગી લે છે. કૃપા કરીને અત્યારે જ ડૉક્ટર અથવા તબીબી સ્ટાફનો સંપર્ક કરો.'
      }
    };
  }

  // 2. Acute Respiratory Distress
  if (hasSevereBreathingDifficulty) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'RESPIRATORY_DISTRESS',
      reason: 'Acute severe respiratory distress or inability to breathe.',
      patient_instruction: {
        'en-IN': 'Severe difficulty in breathing requires immediate medical care. Please inform our clinical staff or emergency physician now.',
        'hi-IN': 'सांस लेने में गंभीर कठिनाई के लिए तुरंत डॉक्टरी मदद चाहिए। कृपया तुरंत मेडिकल स्टाफ से संपर्क करें।',
        'gu-IN': 'શ્વાસ લેવામાં ગંભીર તકલીફ માટે તાત્કાલિક તબીબી સહાય જરૂરી છે. કૃપા કરીને તરત જ મેડિકલ સ્ટાફને જણાવો.'
      }
    };
  }

  // 3. Acute Stroke / Neurological Emergency
  if (
    textLower.includes('sudden weakness') ||
    textLower.includes('facial droop') ||
    textLower.includes('slurred speech') ||
    textLower.includes('cannot speak') ||
    textLower.includes('one side paralyzed') ||
    patientText.includes('અચાનક એક બાજુ નબળાઈ') ||
    patientText.includes('મોઢું વાંકું') ||
    patientText.includes('બોલવામાં તકલીફ') ||
    patientText.includes('અચાનક લકવો') ||
    patientText.includes('अचानक लकवा') ||
    patientText.includes('मुंह टेढ़ा')
  ) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'NEUROLOGICAL_EMERGENCY',
      reason: 'Potential acute stroke or focal neurological deficit.',
      patient_instruction: {
        'en-IN': 'Sudden weakness or speech difficulty requires immediate medical evaluation for stroke. Please notify medical staff immediately.',
        'hi-IN': 'अचानक कमजोरी या बोलने में कठिनाई स्ट्रोक का संकेत हो सकती है। कृपया तुरंत डॉक्टर या स्टाफ से संपर्क करें।',
        'gu-IN': 'અચાનક નબળાઈ અથવા બોલવામાં તકલીફ લકવાનો સંકેત હોઈ શકે છે. કૃપા કરીને તાત્કાલિક સ્ટાફને સંપર્ક કરો.'
      }
    };
  }

  // 4. Acute Severe Hemorrhage
  if (
    textLower.includes('vomiting blood') ||
    textLower.includes('coughing blood') ||
    textLower.includes('large blood') ||
    textLower.includes('black stool') ||
    textLower.includes('uncontrolled bleeding') ||
    patientText.includes('ઉલ્ટીમાં લોહી') ||
    patientText.includes('ખાંસીમાં લોહી') ||
    patientText.includes('કાળા ઝાડા') ||
    patientText.includes('ઉલ્ટી મેં ખૂન') ||
    patientText.includes('उल्टी में खून') ||
    patientText.includes('खांसी में खून')
  ) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'SEVERE_BLEEDING',
      reason: 'Active severe gastrointestinal or respiratory hemorrhage.',
      patient_instruction: {
        'en-IN': 'Active bleeding or coughing/vomiting blood requires immediate medical review. Please consult medical staff now.',
        'hi-IN': 'उल्टी या खांसी में खून आना गंभीर हो सकता है। कृपया तुरंत डॉक्टर या मेडिकल स्टाफ को दिखाएं।',
        'gu-IN': 'ઉલ્ટી કે ખાંસીમાં લોહી આવવું ગંભીર સ્થિતિ હોઈ શકે છે. કૃપા કરીને તરત જ ડૉક્ટરનો સંપર્ક કરો.'
      }
    };
  }

  // 5. Syncope / Seizure
  if (
    textLower.includes('passed out') ||
    textLower.includes('loss of consciousness') ||
    textLower.includes('blackout') ||
    textLower.includes('seizure') ||
    textLower.includes('fits') ||
    patientText.includes('બેહોશ થઈ જવું') ||
    patientText.includes('ખેંચ આવવી') ||
    patientText.includes('बेहोश हो जाना') ||
    patientText.includes('दौरा पड़ना')
  ) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'LOSS_OF_CONSCIOUSNESS',
      reason: 'Syncope, seizure, or altered level of consciousness.',
      patient_instruction: {
        'en-IN': 'Loss of consciousness or seizures require urgent medical assessment. Please alert the attending doctor immediately.',
        'hi-IN': 'बेहोशी या दौरा पड़ने के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत डॉक्टर को सूचित करें।',
        'gu-IN': 'બેહોશી અથવા ખેંચ આવવાના લક્ષણો માટે તાત્કાલિક ડૉક્ટરની તપાસ જરૂરી છે. કૃપા કરીને તરત જ સ્ટાફને જણાવો.'
      }
    };
  }

  // Concerning symptoms under active assessment
  if (hasChestPain) {
    return {
      detected: false,
      priority: 'MEDIUM',
      risk_state: 'ASSESSING',
      category: 'CHEST_PAIN_ASSESSMENT',
      reason: 'Chest discomfort reported without explicit emergency criteria. Gathering onset, duration, severity, and associated symptoms.',
    };
  }

  return {
    detected: false,
    priority: 'LOW',
    risk_state: 'LOW_RISK_CONTEXT',
    category: 'GENERAL',
    reason: 'Standard non-urgent clinical presentation.',
  };
}

/**
 * Classify Patient Intent
 */
export function detectPatientIntent(patientText, clinicalState = {}) {
  const textLower = patientText.toLowerCase().trim();

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

  if (!clinicalState.chief_complaints || clinicalState.chief_complaints.length === 0) {
    return 'INITIAL_COMPLAINT';
  }

  return 'SYMPTOM_INFORMATION';
}

/**
 * Extract Clinical Entities from patient text
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

  // 2. Chief Complaints, Location & Multiple Symptoms Extraction
  if (
    textLower.includes("chest") ||
    patientText.includes("છાતી") ||
    patientText.includes("સીને") ||
    patientText.includes("सीने")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Chest Pain (છાતીમાં દુખાવો)";
    extracted.symptoms.push("Chest Pain");
    extracted.location = "Chest (છાતી)";
  }

  if (
    textLower.includes("knee") ||
    patientText.includes("ઘૂંટણ") ||
    patientText.includes("ગોઠણ") ||
    patientText.includes("घुटने")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Knee Pain (ઘૂંટણનો દુખાવો)";
    extracted.symptoms.push("Knee Pain");
    extracted.location = "Knee (ઘૂંટણ)";
  }

  if (
    textLower.includes("joint") ||
    patientText.includes("સાંધા") ||
    patientText.includes("જોડો") ||
    patientText.includes("जोड़ों")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Joint Pain (સાંધાનો દુખાવો)";
    extracted.symptoms.push("Joint Pain");
    if (!extracted.location) extracted.location = "Joints (સાંધા)";
  }

  if (
    textLower.includes("fever") ||
    textLower.includes("temperature") ||
    patientText.includes("તાવ") ||
    patientText.includes("બુખાર") ||
    patientText.includes("बुखार")
  ) {
    if (!extracted.negated_symptoms.includes("Fever")) {
      if (!extracted.chief_complaint) extracted.chief_complaint = "Fever (તાવ / बुखार)";
      extracted.symptoms.push("Fever");
    }
  }

  if (
    textLower.includes("stomach") ||
    textLower.includes("belly") ||
    textLower.includes("abdominal") ||
    patientText.includes("પેટ") ||
    patientText.includes("ઝાડા") ||
    patientText.includes("पेट")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Abdominal Pain (પેટમાં દુખાવો)";
    extracted.symptoms.push("Abdominal Pain");
    extracted.location = "Abdomen (પેટ)";
  }

  if (
    textLower.includes("headache") ||
    textLower.includes("head pain") ||
    patientText.includes("માથું") ||
    patientText.includes("માથાનો") ||
    patientText.includes("सिर दर्द") ||
    patientText.includes("सर दर्द")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Headache (માથાનો દુખાવો)";
    extracted.symptoms.push("Headache");
    if (!extracted.location) extracted.location = "Head (માથું)";
  }

  if (
    textLower.includes("cough") ||
    textLower.includes("cold") ||
    patientText.includes("ઉધરસ") ||
    patientText.includes("ખાંસી") ||
    patientText.includes("શરદી") ||
    patientText.includes("कफ") ||
    patientText.includes("खांसी")
  ) {
    if (!extracted.negated_symptoms.includes("Cough")) {
      if (!extracted.chief_complaint) extracted.chief_complaint = "Cough and Cold (શરદી અને ખાંસી)";
      extracted.symptoms.push("Cough / Cold");
    }
  }

  if (
    textLower.includes("body ache") ||
    textLower.includes("body pain") ||
    patientText.includes("શરીરમાં દુખાવો") ||
    patientText.includes("બદન દર્દ") ||
    patientText.includes("बदन दर्द")
  ) {
    extracted.symptoms.push("Body Ache (શરીરમાં દુખાવો)");
  }

  if (
    textLower.includes("back") ||
    patientText.includes("કમર") ||
    patientText.includes("પીઠ") ||
    patientText.includes("कमर") ||
    patientText.includes("पीठ")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Back Pain (કમરનો દુખાવો)";
    extracted.symptoms.push("Back Pain");
    extracted.location = "Back / Spine (કમર)";
  }

  if (
    textLower.includes("vomit") ||
    patientText.includes("ઉલ્ટી") ||
    patientText.includes("उल्टी")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Vomiting (ઉલ્ટી)";
    extracted.symptoms.push("Vomiting");
  }

  if (
    textLower.includes("dizzy") ||
    textLower.includes("vertigo") ||
    patientText.includes("ચક્કર") ||
    patientText.includes("चक्कर")
  ) {
    if (!extracted.chief_complaint) extracted.chief_complaint = "Dizziness (ચક્કર)";
    extracted.symptoms.push("Dizziness");
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
  } else if (textLower.includes("today") || patientText.includes("આજે") || patientText.includes("आज")) {
    extracted.duration = "Today (આજથી)";
  } else if (textLower.includes("yesterday") || patientText.includes("ગઈકાલ") || patientText.includes("કલ")) {
    extracted.duration = "1 day (ગઈકાલથી)";
  } else if (textLower.includes("since morning") || patientText.includes("સવારથી") || patientText.includes("सुबह से")) {
    extracted.duration = "Since morning (સવારથી)";
  }

  // 4. Onset Extraction
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

  // 6. Associated Symptoms
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
      extracted.associated_symptoms.push("Stiffness (કઠિનતા)");
    }
  }
  if (
    textLower.includes("breathless") ||
    textLower.includes("difficulty breathing") ||
    textLower.includes("shortness of breath") ||
    patientText.includes("શ્વાસ ચડે")
  ) {
    extracted.associated_symptoms.push("Shortness of breath (શ્વાસ ચડવો)");
  }
  if (
    textLower.includes("sweat") ||
    patientText.includes("પરસેવો") ||
    patientText.includes("पसीना")
  ) {
    extracted.associated_symptoms.push("Sweating (પરસેવો)");
  }
  if (
    textLower.includes("dizzy") ||
    textLower.includes("faint") ||
    patientText.includes("ચક્કર")
  ) {
    extracted.associated_symptoms.push("Dizziness / Faintness (ચક્કર)");
  }

  return extracted;
}

/**
 * Update Clinical State with newly extracted entities & corrections
 */
export function updateClinicalState(currentState, extracted) {
  const updated = { ...currentState };

  // 1. Negations & Corrections
  if (extracted.negated_symptoms && extracted.negated_symptoms.length > 0) {
    extracted.negated_symptoms.forEach((neg) => {
      updated.symptoms = (updated.symptoms || []).filter((s) => !s.toLowerCase().includes(neg.toLowerCase()));
      updated.chief_complaints = (updated.chief_complaints || []).filter((c) => !c.toLowerCase().includes(neg.toLowerCase()));
      updated.associated_symptoms = (updated.associated_symptoms || []).filter((a) => !a.toLowerCase().includes(neg.toLowerCase()));
    });
  }

  // 2. Chief Complaints
  if (extracted.chief_complaint) {
    if (!updated.chief_complaints.includes(extracted.chief_complaint)) {
      updated.chief_complaints = [extracted.chief_complaint, ...updated.chief_complaints];
    }
  }

  // 3. Location
  if (extracted.location) {
    if (!updated.location.includes(extracted.location)) {
      updated.location = [...updated.location, extracted.location];
    }
  }

  // 4. Symptoms
  if (extracted.symptoms && extracted.symptoms.length > 0) {
    const existing = new Set(updated.symptoms || []);
    extracted.symptoms.forEach((s) => existing.add(s));
    updated.symptoms = Array.from(existing);
  }

  // 5. Duration
  if (extracted.duration) {
    if (!updated.duration.includes(extracted.duration)) {
      updated.duration = [...updated.duration, extracted.duration];
    }
  }

  // 6. Onset
  if (extracted.onset) {
    if (!updated.onset.includes(extracted.onset)) {
      updated.onset = [...updated.onset, extracted.onset];
    }
  }

  // 7. Severity
  if (extracted.severity) {
    if (!updated.severity.includes(extracted.severity)) {
      updated.severity = [...updated.severity, extracted.severity];
    }
  }

  // 8. Associated Symptoms
  if (extracted.associated_symptoms && extracted.associated_symptoms.length > 0) {
    const existing = new Set(updated.associated_symptoms || []);
    extracted.associated_symptoms.forEach((s) => existing.add(s));
    updated.associated_symptoms = Array.from(existing);
  }

  // Re-calculate Missing Information
  const missing = [];
  if (!updated.chief_complaints || updated.chief_complaints.length === 0) missing.push('chief_complaint');
  if (!updated.duration || updated.duration.length === 0) missing.push('onset_duration');
  if (!updated.severity || updated.severity.length === 0) missing.push('severity');
  if (!updated.associated_symptoms || updated.associated_symptoms.length === 0) missing.push('associated_symptoms');

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
  const hasAssoc = (clinicalState.associated_symptoms && clinicalState.associated_symptoms.length > 0) ||
                    (clinicalState.onset && clinicalState.onset.length > 0);

  if ((hasChief && hasDuration && hasSeverity && hasAssoc) || turnCount >= 5) {
    return true;
  }
  return false;
}

/**
 * Select the single next adaptive question based on prioritized missing clinical domains from CKB
 */
export function selectNextAdaptiveQuestion(clinicalState, language = 'gu-IN', opdMode = 'GENERAL') {
  const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';

  // 1. If Chief Complaint is missing, ask initial greeting question
  if (!clinicalState.chief_complaints || clinicalState.chief_complaints.length === 0) {
    const questions = {
      'gu-IN': 'નમસ્તે, તમને હાલમાં કઈ મુખ્ય તકલીફ થઈ રહી છે?',
      'hi-IN': 'नमस्ते, आपको इस समय मुख्य रूप से क्या परेशानी हो रही है?',
      'en-IN': 'Hello, what main symptom or health concern are you experiencing today?'
    };
    const chips = {
      'gu-IN': ['છાતીમાં દુખાવો થાય છે', 'સાંધા અને ઘૂંટણમાં દુખાવો', 'તાવ અને શરદી', 'પેટમાં દુખાવો', 'માથું દુખે છે'],
      'hi-IN': ['सीने में दर्द हो रहा है', 'जोड़ों और घुटनों में दर्द', 'बुखार और सर्दी', 'पेट में दर्द', 'सिर दर्द'],
      'en-IN': ['I have chest pain', 'Joint & Knee Pain', 'Fever & Cold', 'Stomach Pain', 'Headache']
    };
    return {
      topic: 'chief_complaint',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 2. Query Clinical Knowledge Base for candidate questions and missing dimensions
  const ckbResult = selectNextQuestionFromKnowledgeBase(clinicalState, language, opdMode);

  if (ckbResult && ckbResult.dimension !== 'completed') {
    return {
      topic: ckbResult.dimension,
      question: ckbResult.next_question,
      chips: ckbResult.quick_chips || [],
      priority: ckbResult.priority,
      reason: ckbResult.reason,
    };
  }

  // 3. Check Past Medical History if not collected
  if (!clinicalState.past_medical_history || clinicalState.past_medical_history.length === 0) {
    const questions = {
      'gu-IN': 'શું તમને પહેલાથી ડાયાબિટીસ, બીપી કે અન્ય કોઈ જૂની બીમારી છે?',
      'hi-IN': 'क्या आपको पहले से डायबिटीज, बीपी या कोई पुरानी बीमारी है?',
      'en-IN': 'Do you have any past medical history like Diabetes, BP, or other chronic conditions?'
    };
    const chips = {
      'gu-IN': ['બ્લડ પ્રેશર (BP) છે', 'ડાયાબિટીસ છે', 'ના, કોઈ જૂની બીમારી નથી'],
      'hi-IN': ['हाई बीपी है', 'डायबिटीज है', 'नहीं, कोई पुरानी बीमारी नहीं'],
      'en-IN': ['Hypertension (BP)', 'Diabetes', 'None / Healthy']
    };
    return {
      topic: 'past_medical_history',
      question: questions[langKey] || questions['en-IN'],
      chips: chips[langKey] || chips['en-IN'],
    };
  }

  // 4. Completed History
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

  // STEP 2: Extract Entities & Update Clinical State
  const extracted = extractClinicalInformation(trimmed, clinicalState);
  let updatedState = updateClinicalState(clinicalState, extracted);
  updatedState.patient_intent = intent;

  // STEP 3: Contextual Red-Flag Assessment
  const redFlagAssessment = evaluateContextualRedFlags(trimmed, updatedState);
  updatedState.risk_state = redFlagAssessment?.risk_state || 'LOW_RISK_CONTEXT';

  if (redFlagAssessment && redFlagAssessment.detected) {
    const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const warningMsg = redFlagAssessment.patient_instruction[langKey] || redFlagAssessment.patient_instruction['en-IN'];

    const doctorAlert = {
      alert_id: `alert-${Date.now()}`,
      session_id: clinicalState.session_id || 'current-session',
      priority: 'HIGH',
      status: 'PENDING_REVIEW',
      category: redFlagAssessment.category,
      reason: redFlagAssessment.reason,
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      assistant_message: warningMsg,
      intent: 'EMERGENCY_INFORMATION',
      next_question: '',
      quick_chips: [],
      clinical_state_update: {
        ...updatedState,
        session_status: 'URGENT_REVIEW_REQUIRED',
        risk_state: 'URGENT_REVIEW_REQUIRED',
        red_flags: [...(clinicalState.red_flags || []), redFlagAssessment],
        doctor_review_required: true,
      },
      red_flag: {
        detected: true,
        priority: 'HIGH',
        category: redFlagAssessment.category,
        reason: redFlagAssessment.reason,
      },
      doctor_alert: doctorAlert,
      doctor_review_required: true,
      history_complete: false,
      session_status: 'URGENT_REVIEW_REQUIRED',
    };
  }

  // STEP 4: Check if patient requested stop or history is complete
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

  // STEP 6: Call Backend Groq AI or Local CKB Adaptive Engine for Next Step
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
    console.warn('[Backend Intake API Offline/Error, using local CKB Engine]:', apiErr.message);
  }

  // Local CKB Adaptive Engine Fallback
  if (!aiResponse) {
    const nextSelection = selectNextAdaptiveQuestion(updatedState, language, opdMode);
    
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
