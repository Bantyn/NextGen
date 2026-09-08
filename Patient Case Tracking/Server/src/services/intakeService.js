import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { infermedicaService } from './infermedicaService.js';
import { caseMessageRepository } from '../repositories/caseMessageRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';

dotenv.config();

// Load clinical knowledge base data for server-side deterministic fallback
let ckbDatabase = [];
try {
  const ckbPath = path.resolve('src/data/clinical_knowledge_base.json');
  if (fs.existsSync(ckbPath)) {
    ckbDatabase = JSON.parse(fs.readFileSync(ckbPath, 'utf8'));
  }
} catch (err) {
  logger.warn('[IntakeService] Could not load clinical_knowledge_base.json: ' + err.message);
}

/**
 * Clinical Conversation Engine & Intake Service
 * Orchestrates multi-turn clinical history taking, state management, adaptive questioning,
 * intent analysis, contextual red-flag triage, and reference assessment.
 */
export class IntakeService {
  /**
   * Initialize or normalize the 20-field structured clinical state
   */
  normalizeClinicalState(raw = {}) {
    return {
      chief_complaint: raw.chief_complaint || (raw.chief_complaints?.[0]) || '',
      symptoms: Array.isArray(raw.symptoms) ? [...raw.symptoms] : (raw.chief_complaints || []),
      body_site: raw.body_site || (Array.isArray(raw.location) ? raw.location[0] : raw.location) || '',
      onset: raw.onset || (Array.isArray(raw.onset) ? raw.onset[0] : '') || '',
      duration: raw.duration || (Array.isArray(raw.duration) ? raw.duration[0] : '') || '',
      severity: raw.severity || (Array.isArray(raw.severity) ? raw.severity[0] : null),
      course: raw.course || '',
      associated_symptoms: Array.isArray(raw.associated_symptoms) ? [...raw.associated_symptoms] : [],
      negative_findings: Array.isArray(raw.negative_findings) ? [...raw.negative_findings] : (raw.negated_symptoms || []),
      relevant_history: Array.isArray(raw.relevant_history) ? [...raw.relevant_history] : (raw.past_medical_history || []),
      medications: Array.isArray(raw.medications) ? [...raw.medications] : [],
      allergies: Array.isArray(raw.allergies) ? [...raw.allergies] : [],
      family_history: Array.isArray(raw.family_history) ? [...raw.family_history] : [],
      lifestyle: raw.lifestyle && typeof raw.lifestyle === 'object' ? { ...raw.lifestyle } : {},
      red_flags: Array.isArray(raw.red_flags) ? [...raw.red_flags] : [],
      risk_level: raw.risk_level || 'unknown',
      patient_intent: raw.patient_intent || 'medical-history response',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.85,
      missing_high_priority_information: Array.isArray(raw.missing_high_priority_information) ? [...raw.missing_high_priority_information] : [],
      next_question: raw.next_question || '',
      answered_dimensions: Array.isArray(raw.answered_dimensions) ? [...raw.answered_dimensions] : (raw.answered_questions || []),
    };
  }

  /**
   * Intent Classifier: Detect patient queries, advice requests, distress, or history answers
   */
  detectPatientIntent(text = '') {
    const t = text.toLowerCase().trim();

    // 1. Doctor consult / Advice questions
    if (
      t.includes('see a doctor') ||
      t.includes('consult a doctor') ||
      t.includes('need to see a doctor') ||
      t.includes('should i see a doctor') ||
      t.includes('is this serious') ||
      t.includes('is it dangerous') ||
      t.includes('do i need doctor') ||
      text.includes('ડૉક્ટરને બતાવવું') ||
      text.includes('ડોક્ટરને મળવું') ||
      text.includes('શું મારે ડૉક્ટરને') ||
      text.includes('डॉक्टर को दिखाना') ||
      text.includes('क्या डॉक्टर को')
    ) {
      return 'doctor-consult question';
    }

    // 2. Medicine Information questions
    if (
      t.includes('can i take') ||
      t.includes('what is the dose') ||
      t.includes('what is paracetamol') ||
      t.includes('which medicine') ||
      t.includes('medicine for') ||
      text.includes('દવા લઈ શકું') ||
      text.includes('કઈ દવા લેવી') ||
      text.includes('दवा ले सकता') ||
      text.includes('कौन सी दवा')
    ) {
      return 'medicine information question';
    }

    // 3. Emergency concerns
    if (
      t.includes('am i dying') ||
      t.includes('heart attack') ||
      t.includes('emergency') ||
      text.includes('ઇમરજન્સી') ||
      text.includes('હાર્ટ અટેક') ||
      text.includes('इमरजेंसी')
    ) {
      return 'emergency concern';
    }

    // 4. Repeat / Rephrase
    if (
      t.includes('repeat') ||
      t.includes('what did you say') ||
      t.includes('pardon') ||
      text.includes('ફરીથી કહો') ||
      text.includes('દોબારા બોલો')
    ) {
      return 'repeat/rephrase';
    }

    // 5. Language Change
    if (
      t.includes('speak in english') ||
      t.includes('speak in hindi') ||
      t.includes('speak in gujarati') ||
      t.includes('change language') ||
      text.includes('ગુજરાતીમાં બોલો') ||
      text.includes('हिंदी में बोलो')
    ) {
      return 'language change';
    }

    // 6. General Help
    if (t.includes('how does this kiosk work') || t.includes('help me') || text.includes('મદદ કરો') || text.includes('मदद चाहिए')) {
      return 'general help';
    }

    // Default: Medical history response
    return 'medical-history response';
  }

  /**
   * Deterministic Intent Responder: Directly address patient intent before proceeding
   */
  generateIntentDirectAnswer(intent, state, langKey = 'en-IN') {
    const complaint = state.chief_complaint || state.body_site || 'symptom';

    if (intent === 'doctor-consult question') {
      const answers = {
        'en-IN': `Yes, discussing your ${complaint} with a doctor is appropriate so they can perform a thorough physical evaluation. I will record a few more details so the doctor has your complete history ready.`,
        'hi-IN': `हाँ, आपके ${complaint} के लिए डॉक्टर से परामर्श लेना बिल्कुल उचित है ताकि वे आवश्यक जांच कर सकें। मैं कुछ और जरूरी विवरण नोट कर रहा हूँ ताकि डॉक्टर के पास आपकी पूरी जानकारी तैयार रहे।`,
        'gu-IN': `હા, તમારા ${complaint} માટે ડૉક્ટર સાથે પરામર્શ કરવો યોગ્ય છે જેથી તેઓ જરૂરી તપાસ કરી શકે. હું તમારી વિગતો નોંધી રહ્યો છું જેથી ડૉક્ટર માટે તમારો સંપૂર્ણ ઈતિહાસ તૈયાર રહે.`,
      };
      return answers[langKey] || answers['en-IN'];
    }

    if (intent === 'medicine information question') {
      const answers = {
        'en-IN': 'Medication choices and dosages must be confirmed directly by the doctor based on your diagnosis. I will note your symptoms so the physician can prescribe the safest treatment.',
        'hi-IN': 'दवा और खुराक की सही सलाह डॉक्टर द्वारा आपकी जांच के बाद ही दी जा सकती है। मैं आपके लक्षण दर्ज कर रहा हूँ ताकि डॉक्टर सुरक्षित उपचार लिख सकें।',
        'gu-IN': 'દવા અને તેના ડોઝની સલાહ ડૉક્ટર દ્વારા તપાસ પછી જ આપી શકાય છે. હું તમારા લક્ષણો નોંધી રહ્યો છું જેથી ડૉક્ટર યોગ્ય સારવાર સૂચવી શકે.',
      };
      return answers[langKey] || answers['en-IN'];
    }

    if (intent === 'general help') {
      const answers = {
        'en-IN': 'I am your MediKiosk clinical intake assistant. Please answer questions about your health concerns, and I will prepare a structured summary for your doctor.',
        'hi-IN': 'मैं आपका मेडीकियोस्क सहायक हूँ। कृपया अपनी स्वास्थ्य समस्या के बारे में बताएं, और मैं डॉक्टर के लिए आपकी मेडिकल रिपोर्ट तैयार करूँगा।',
        'gu-IN': 'હું તમારો મેડિકિયોસ્ક ક્લિનિકલ સહાયક છું. કૃપા કરીને તમારી તકલીફ વિશે જણાવો, હું ડૉક્ટર માટે તમારી વિગતો તૈયાર કરીશ.',
      };
      return answers[langKey] || answers['en-IN'];
    }

    return null;
  }

  /**
   * Contextual Red-Flag Triage Engine
   * Categorizes into 4 Triage Levels: LOW / ROUTINE, MODERATE, HIGH PRIORITY, EMERGENCY
   * Crucial rule: Bare symptom (e.g. "I have chest pain") is NOT an automatic emergency!
   */
  evaluateRedFlagAndTriage(text = '', state = {}) {
    const textLower = (text || '').toLowerCase().trim();
    const complaints = (state.symptoms || []).concat(state.chief_complaint ? [state.chief_complaint] : []).map((s) => String(s).toLowerCase());

    const mentionsChest =
      textLower.includes('chest') ||
      textLower.includes('heart attack') ||
      text.includes('છાતી') ||
      text.includes('सीना') ||
      complaints.some((c) => c.includes('chest') || c.includes('છાતી') || c.includes('सीना'));

    const hasSevereBreathing =
      textLower.includes('cannot breathe') ||
      textLower.includes("can't breathe") ||
      textLower.includes('gasping') ||
      textLower.includes('choking') ||
      textLower.includes('stridor') ||
      textLower.includes('severe difficulty breathing') ||
      textLower.includes('severe breathlessness') ||
      text.includes('શ્વાસ નથી લઈ શકાતો') ||
      text.includes('સાંસ નહીં આ રહી') ||
      text.includes('सांस नहीं आ रही') ||
      text.includes('दम घुट रहा है');

    const hasSweatingRadiationOrFaint =
      textLower.includes('sweat') ||
      textLower.includes('radiat') ||
      textLower.includes('left arm') ||
      textLower.includes('jaw') ||
      textLower.includes('faint') ||
      textLower.includes('dizzy') ||
      textLower.includes('crushing') ||
      text.includes('પરસેવો') ||
      text.includes('ડાબા હાથ') ||
      text.includes('ચક્કર') ||
      text.includes('પસીના') ||
      text.includes('बाएं हाथ') ||
      text.includes('चक्कर');

    const hasExtremeSeverity =
      textLower.includes('9/10') ||
      textLower.includes('10/10') ||
      textLower.includes('unbearable') ||
      text.includes('અસહ્ય');

    const hasActiveSevereBleeding =
      textLower.includes('vomiting blood') ||
      textLower.includes('coughing blood') ||
      textLower.includes('large blood') ||
      textLower.includes('black stool') ||
      text.includes('ઉલ્ટીમાં લોહી') ||
      text.includes('ખાંસીમાં લોહી') ||
      text.includes('उल्टी में खून');

    const hasAcuteStrokeSigns =
      textLower.includes('facial droop') ||
      textLower.includes('slurred speech') ||
      textLower.includes('cannot speak') ||
      textLower.includes('one side paralyzed') ||
      text.includes('મોઢું વાંકું') ||
      text.includes('બોલવામાં તકલીફ') ||
      text.includes('અચાનક લકવો');

    const hasLossOfConsciousness =
      textLower.includes('passed out') ||
      textLower.includes('loss of consciousness') ||
      textLower.includes('blackout') ||
      textLower.includes('seizure') ||
      text.includes('બેહોશ') ||
      text.includes('ખેંચ આવવી');

    // 1. EMERGENCY (Immediate Triage Escalation)
    if (
      (mentionsChest && (hasSevereBreathing || hasSweatingRadiationOrFaint || hasExtremeSeverity || textLower.includes('heart attack'))) ||
      hasActiveSevereBleeding ||
      hasAcuteStrokeSigns ||
      hasLossOfConsciousness
    ) {
      let reason = 'Acute cardiovascular distress, active bleeding, stroke signs, or loss of consciousness.';
      let category = 'CARDIOVASCULAR_EMERGENCY';
      if (hasActiveSevereBleeding) category = 'SEVERE_HEMORRHAGE';
      else if (hasAcuteStrokeSigns) category = 'NEUROLOGICAL_EMERGENCY';
      else if (hasLossOfConsciousness) category = 'LOSS_OF_CONSCIOUSNESS';

      return {
        detected: true,
        priority: 'HIGH',
        triage_level: 'EMERGENCY',
        category,
        reason,
        patient_instruction: {
          'en-IN': 'These symptoms require immediate emergency medical care. Please inform our clinical staff or emergency physician right now.',
          'hi-IN': 'इन लक्षणों के लिए तत्काल आपातकालीन चिकित्सकीय सहायता की आवश्यकता है। कृपया तुरंत मेडिकल स्टाफ या आपातकालीन डॉक्टर से संपर्क करें।',
          'gu-IN': 'આ લક્ષણો માટે તાત્કાલિક ઇમરજન્સી તબીબી સહાયની જરૂર છે. કૃપા કરીને અત્યારે જ તબીબી સ્ટાફ અથવા ઇમરજન્સી ડૉક્ટરનો સંપર્ક કરો.',
        },
      };
    }

    // 2. HIGH PRIORITY (Urgent attention needed, but short intake allowed if not in immediate shock)
    if (hasSevereBreathing || hasExtremeSeverity) {
      return {
        detected: true,
        priority: 'HIGH',
        triage_level: 'HIGH PRIORITY',
        category: 'RESPIRATORY_OR_ACUTE_DISTRESS',
        reason: 'Severe acute distress or significant breathing difficulty reported.',
        patient_instruction: {
          'en-IN': 'Your symptoms indicate significant acute discomfort. We are prioritizing your case for urgent physician review.',
          'hi-IN': 'आपके लक्षण गंभीर परेशानी दर्शाते हैं। हम आपके केस को डॉक्टर की प्राथमिकता समीक्षा के लिए तैयार कर रहे हैं।',
          'gu-IN': 'તમારા લક્ષણો ગંભીર તકલીફ દર્શાવે છે. અમે તમારા કેસને ડૉક્ટરની તાત્કાલિક સમીક્ષા માટે અગ્રતા આપી રહ્યા છીએ.',
        },
      };
    }

    // 3. MODERATE (Chest pain alone without emergency flags, persistent pain > 1 week, moderate distress)
    if (mentionsChest) {
      return {
        detected: false,
        priority: 'MODERATE',
        triage_level: 'MODERATE',
        category: 'CHEST_PAIN_TARGETED_ASSESSMENT',
        reason: 'Chest pain reported without immediate emergency accompaniments. Targeted risk assessment initiated.',
        patient_instruction: null,
      };
    }

    // 4. LOW / ROUTINE (Knee pain, general joint pain, chronic symptoms, mild cold)
    return {
      detected: false,
      priority: 'LOW',
      triage_level: 'LOW',
      category: 'ROUTINE_OUTPATIENT',
      reason: 'Routine outpatient presentation.',
      patient_instruction: null,
    };
  }

  /**
   * Rule-based entity extractor from patient input text
   */
  extractEntitiesFromText(text = '', currentState = {}) {
    const t = text.toLowerCase();
    const extracted = {
      chief_complaint: null,
      symptoms: [],
      body_site: null,
      duration: null,
      severity: null,
      onset: null,
      associated_symptoms: [],
      negative_findings: [],
    };

    // Body Sites
    if (t.includes('right knee') || text.includes('જમણા ઢીંચણ') || text.includes('दाएं घुटने')) extracted.body_site = 'Right Knee';
    else if (t.includes('left knee') || text.includes('ડાબા ઢીંચણ') || text.includes('बाएं घुटने')) extracted.body_site = 'Left Knee';
    else if (t.includes('knee') || text.includes('ઢીંચણ') || text.includes('ઘૂંટણ') || text.includes('घुटने')) extracted.body_site = 'Knee';
    else if (t.includes('chest') || text.includes('છાતી') || text.includes('सीना')) extracted.body_site = 'Chest';
    else if (t.includes('head') || text.includes('માથું') || text.includes('सिर')) extracted.body_site = 'Head';
    else if (t.includes('back') || text.includes('પીઠ') || text.includes('કમર') || text.includes('कमर')) extracted.body_site = 'Back';
    else if (t.includes('stomach') || t.includes('abdomen') || text.includes('પેટ') || text.includes('पेट')) extracted.body_site = 'Abdomen';

    // Symptoms / Complaints
    if (t.includes('pain') || text.includes('દુખાવો') || text.includes('દર્દ') || text.includes('दर्द')) {
      const part = extracted.body_site ? `${extracted.body_site} Pain` : 'Pain';
      extracted.symptoms.push(part);
      if (!currentState.chief_complaint) extracted.chief_complaint = part;
    }
    if (t.includes('fever') || text.includes('તાવ') || text.includes('बुखार')) extracted.symptoms.push('Fever');
    if (t.includes('cough') || text.includes('ખાંસી') || text.includes('ઉધરસ') || text.includes('खांसी')) extracted.symptoms.push('Cough');
    if (t.includes('swelling') || text.includes('સોજો') || text.includes('सूजन')) extracted.associated_symptoms.push('Swelling');
    if (t.includes('stiff') || text.includes('અકડાઈ') || text.includes('કડક') || text.includes('जकड़न')) extracted.associated_symptoms.push('Stiffness');
    if (t.includes('walking') || text.includes('ચાલવા') || text.includes('चलने')) extracted.associated_symptoms.push('Difficulty walking');

    // Negations
    if (t.includes('no fever') || t.includes("don't have fever") || text.includes('તાવ નથી') || text.includes('बुखार नहीं')) {
      extracted.negative_findings.push('Fever');
    }
    if (t.includes('no swelling') || text.includes('સોજો નથી') || text.includes('सूजन नहीं')) {
      extracted.negative_findings.push('Swelling');
    }

    // Duration extraction: e.g. "2 years", "3 days", "1 week", "2 વર્ષ", "3 દિવસ"
    const durationMatch = text.match(/(\d+\s*(?:year|yr|month|mo|week|wk|day|hour|hr)s?|\d+\s*(?:વર્ષ|મહિના|અઠવાડિયા|દિવસ)|\d+\s*(?:साल|महीने|हफ्ते|दिन))/i);
    if (durationMatch) {
      extracted.duration = durationMatch[1];
    } else if (t.includes('since morning') || text.includes('સવારથી') || text.includes('सुबह से')) {
      extracted.duration = 'Since morning';
    }

    // Severity: e.g. "7/10", "mild", "severe", "moderate"
    const sevNumMatch = text.match(/([1-9]|10)\s*\/\s*10/);
    if (sevNumMatch) {
      extracted.severity = `${sevNumMatch[1]}/10`;
    } else if (t.includes('severe') || t.includes('unbearable') || text.includes('તીવ્ર') || text.includes('गंभीर')) {
      extracted.severity = 'Severe';
    } else if (t.includes('moderate') || text.includes('મધ્યમ') || text.includes('मध्यम')) {
      extracted.severity = 'Moderate';
    } else if (t.includes('mild') || text.includes('હળવો') || text.includes('हल्का')) {
      extracted.severity = 'Mild';
    }

    // Onset: sudden vs gradual
    if (t.includes('sudden') || text.includes('અચાનક') || text.includes('अचानक')) {
      extracted.onset = 'Sudden';
    } else if (t.includes('gradual') || t.includes('slowly') || text.includes('ધીમે ધીમે') || text.includes('धीरे-धीरे')) {
      extracted.onset = 'Gradual';
    }

    return extracted;
  }

  /**
   * Merge extracted entities into the clinical state
   */
  updateClinicalState(state, extracted, patientIntent) {
    if (extracted.chief_complaint && !state.chief_complaint) {
      state.chief_complaint = extracted.chief_complaint;
    }
    if (extracted.body_site && !state.body_site) {
      state.body_site = extracted.body_site;
      state.answered_dimensions.push('location');
    }
    if (extracted.duration && !state.duration) {
      state.duration = extracted.duration;
      state.answered_dimensions.push('duration');
    }
    if (extracted.severity && !state.severity) {
      state.severity = extracted.severity;
      state.answered_dimensions.push('severity');
    }
    if (extracted.onset && !state.onset) {
      state.onset = extracted.onset;
      state.answered_dimensions.push('onset');
    }

    // Symptoms
    (extracted.symptoms || []).forEach((s) => {
      if (!state.symptoms.includes(s)) state.symptoms.push(s);
    });

    // Associated symptoms
    (extracted.associated_symptoms || []).forEach((s) => {
      if (!state.associated_symptoms.includes(s)) state.associated_symptoms.push(s);
    });

    // Negative findings
    (extracted.negative_findings || []).forEach((n) => {
      if (!state.negative_findings.includes(n)) state.negative_findings.push(n);
      // If symptom was previously in symptoms list, remove it
      state.symptoms = state.symptoms.filter((sym) => sym.toLowerCase() !== n.toLowerCase());
    });

    state.patient_intent = patientIntent;

    // Determine missing high-priority clinical dimensions
    const missing = [];
    if (!state.chief_complaint && state.symptoms.length === 0) missing.push('chief_complaint');
    if (!state.duration) missing.push('duration');
    if (!state.onset) missing.push('onset');
    if (!state.severity) missing.push('severity');
    if (state.associated_symptoms.length === 0 && !state.answered_dimensions.includes('associated_symptoms')) {
      missing.push('associated_symptoms');
    }

    state.missing_high_priority_information = missing;
    return state;
  }

  /**
   * Adaptive Question Selector
   * Strictly enforces:
   * 1. Never ask information already provided.
   * 2. Targeted risk assessment for chest pain (pressure/breathing/radiation) rather than false emergency.
   * 3. Stop asking questions when core history is sufficient.
   */
  selectNextAdaptiveQuestion(state, langKey = 'en-IN', opdMode = 'GENERAL') {
    const isChestPain =
      (state.chief_complaint && state.chief_complaint.toLowerCase().includes('chest')) ||
      state.symptoms.some((s) => s.toLowerCase().includes('chest'));

    // Targeted questions specifically for Chest Pain evaluation
    if (isChestPain) {
      if (!state.answered_dimensions.includes('chest_character')) {
        state.answered_dimensions.push('chest_character');
        const q = {
          'en-IN': 'Is the chest pain a feeling of pressure, burning, tightness, or sharp pain?',
          'hi-IN': 'क्या सीने में दर्द दबाव, जलन, भारीपन या चुभन जैसा महसूस हो रहा है?',
          'gu-IN': 'શું છાતીમાં દુખાવો દબાણ, બળતરા, ભારેપણું કે ચસકો મારતો લાગે છે?',
        };
        const chips = {
          'en-IN': ['Pressure / Tightness', 'Burning sensation', 'Sharp pain', 'Mild ache'],
          'hi-IN': ['दबाव / भारीपन', 'जलन जैसा', 'तेज चुभन', 'हल्का दर्द'],
          'gu-IN': ['દબાણ / ભારેપણું', 'બળતરા જેવો', 'તીવ્ર ચસકો', 'હળવો દુખાવો'],
        };
        return {
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      if (!state.answered_dimensions.includes('chest_radiation_breath')) {
        state.answered_dimensions.push('chest_radiation_breath');
        const q = {
          'en-IN': 'Does the pain spread to your left arm, jaw, or shoulder, or are you having trouble breathing?',
          'hi-IN': 'क्या यह दर्द आपके बाएं हाथ, जबड़े या कंधे तक जा रहा है, या सांस लेने में परेशानी है?',
          'gu-IN': 'શું આ દુખાવો તમારા ડાબા હાથ, જડબા કે ખભા સુધી ફેલાય છે, કે શ્વાસ લેવામાં તકલીફ છે?',
        };
        const chips = {
          'en-IN': ['Spreads to left arm', 'Spreads to shoulder/jaw', 'Difficulty breathing', 'No spreading / Breathing normal'],
          'hi-IN': ['बाएं हाथ में जा रहा है', 'जबड़े/कंधे में', 'सांस में तकलीफ है', 'दर्द कहीं नहीं फैलता / सांस सामान्य'],
          'gu-IN': ['ડાબા હાથમાં ફેલાય છે', 'જડબા કે ખભામાં', 'શ્વાસમાં તકલીફ છે', 'ક્યાંય ફેલાતો નથી / શ્વાસ સામાન્ય'],
        };
        return {
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }
    }

    // Adaptive generic clinical questions (Skipping anything already known)
    // 1. Onset
    if (!state.onset && !state.answered_dimensions.includes('onset')) {
      state.answered_dimensions.push('onset');
      const q = {
        'en-IN': 'Did this discomfort begin suddenly or did it develop gradually over time?',
        'hi-IN': 'क्या यह परेशानी अचानक शुरू हुई या धीरे-धीरे बढ़ी?',
        'gu-IN': 'શું આ તકલીફ અચાનક શરૂ થઈ હતી કે ધીમે-ધીમે વધી?',
      };
      const chips = {
        'en-IN': ['Started suddenly', 'Developed gradually', 'After physical strain'],
        'hi-IN': ['अचानक शुरू हुई', 'धीरे-धीरे बढ़ी', 'शारीरिक मेहनत के बाद'],
        'gu-IN': ['અચાનક શરૂ થઈ', 'ધીમે-ધીમે વધી', 'વજન ઉપાડ્યા પછી'],
      };
      return {
        question: q[langKey] || q['en-IN'],
        quick_chips: chips[langKey] || chips['en-IN'],
        is_complete: false,
      };
    }

    // 2. Duration (Only if not already known!)
    if (!state.duration && !state.answered_dimensions.includes('duration')) {
      state.answered_dimensions.push('duration');
      const q = {
        'en-IN': 'How long have you been experiencing this symptom?',
        'hi-IN': 'आपको यह समस्या कितने समय से हो रही है?',
        'gu-IN': 'તમને આ તકલીફ કેટલા સમયથી થઈ રહી છે?',
      };
      const chips = {
        'en-IN': ['Since morning', '2-3 days', 'More than a week', 'Several months'],
        'hi-IN': ['आज सुबह से', '2-3 दिन से', 'एक हफ्ते से अधिक', 'कई महीनों से'],
        'gu-IN': ['આજ સવારથી', '૨-૩ દિવસથી', 'એક અઠવાડિયાથી વધુ', 'ઘણા મહિનાઓથી'],
      };
      return {
        question: q[langKey] || q['en-IN'],
        quick_chips: chips[langKey] || chips['en-IN'],
        is_complete: false,
      };
    }

    // 3. Severity
    if (!state.severity && !state.answered_dimensions.includes('severity')) {
      state.answered_dimensions.push('severity');
      const q = {
        'en-IN': 'On a scale of 1 to 10, how severe would you rate this discomfort right now?',
        'hi-IN': '1 से 10 के पैमाने पर, आप अभी इस दर्द या परेशानी को कितना बताएंगे?',
        'gu-IN': '૧ થી ૧૦ ના સ્કેલ પર, તમે અત્યારે આ દુખાવાને કેટલી તીવ્રતા આપશો?',
      };
      const chips = {
        'en-IN': ['Mild (2-3/10)', 'Moderate (5-6/10)', 'Severe (8-9/10)'],
        'hi-IN': ['हल्का (2-3/10)', 'मध्यम (5-6/10)', 'तीव्र (8-9/10)'],
        'gu-IN': ['હળવો (૨-૩/૧૦)', 'મધ્યમ (૫-૬/૧૦)', 'તીવ્ર (૮-૯/૧૦)'],
      };
      return {
        question: q[langKey] || q['en-IN'],
        quick_chips: chips[langKey] || chips['en-IN'],
        is_complete: false,
      };
    }

    // 4. Associated Symptoms
    if (state.associated_symptoms.length === 0 && !state.answered_dimensions.includes('associated_symptoms')) {
      state.answered_dimensions.push('associated_symptoms');
      const q = {
        'en-IN': 'Do you have any associated symptoms like swelling, fever, or difficulty in movement?',
        'hi-IN': 'क्या आपको सूजन, बुखार या चलने-फिरने में कोई अन्य परेशानी भी है?',
        'gu-IN': 'શું તમને સોજો, તાવ કે હલનચલનમાં કોઈ અન્ય તકલીફ પણ છે?',
      };
      const chips = {
        'en-IN': ['Swelling present', 'Morning stiffness', 'Difficulty moving', 'No other symptoms'],
        'hi-IN': ['सूजन है', 'सुबह जकड़न होती है', 'चलने में परेशानी', 'कोई अन्य लक्षण नहीं'],
        'gu-IN': ['સોજો છે', 'સવારે જકડાઈ જાય છે', 'ચાલવામાં તકલીફ', 'કોઈ અન્ય લક્ષણ નથી'],
      };
      return {
        question: q[langKey] || q['en-IN'],
        quick_chips: chips[langKey] || chips['en-IN'],
        is_complete: false,
      };
    }

    // Intake Complete: Sufficient clinical history captured
    const completedMsg = {
      'en-IN': 'Thank you. Your clinical history has been successfully structured and sent to the physician for review.',
      'hi-IN': 'धन्यवाद। आपकी मेडिकल हिस्ट्री सफलतापूर्वक तैयार कर ली गई है और डॉक्टर की समीक्षा के लिए भेज दी गई है।',
      'gu-IN': 'આભાર. તમારો તબીબી ઈતિહાસ સફળતાપૂર્વક તૈયાર કરી લેવામાં આવ્યો છે અને ડૉક્ટરની સમીક્ષા માટે મોકલી આપ્યો છે.',
    };

    return {
      question: completedMsg[langKey] || completedMsg['en-IN'],
      quick_chips: [],
      is_complete: true,
    };
  }

  /**
   * Main Turn Processor: Handles full patient input lifecycle
   */
  async processIntakeTurn({
    session_id,
    patient_id,
    patient_answer = '',
    message = '',
    language = 'English',
    opd_mode = 'GENERAL',
    current_clinical_state = {},
    conversation_history = [],
  }) {
    const patientText = (patient_answer || message || '').trim();
    if (!patientText) {
      throw new Error('Patient input text is required.');
    }

    const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';

    // 1. Initialize and normalize clinical state
    let state = this.normalizeClinicalState(current_clinical_state);

    // 2. Classify Patient Intent
    const patientIntent = this.detectPatientIntent(patientText);

    // 3. Contextual Red Flag & Triage Check
    const triageResult = this.evaluateRedFlagAndTriage(patientText, state);

    // If explicit emergency combination detected -> immediate escalation
    if (triageResult.detected && triageResult.triage_level === 'EMERGENCY') {
      const emergencyWarning = triageResult.patient_instruction[langKey] || triageResult.patient_instruction['en-IN'];
      state.risk_level = 'EMERGENCY';
      state.red_flags.push(triageResult.category);

      // Persist session state & alert if sessionId is valid
      if (session_id && !session_id.startsWith('session-')) {
        try {
          await sessionRepository.updateStatus(session_id, 'PRIORITY_TRIAGE', {
            triage_level: 'EMERGENCY',
            triage_reason: triageResult.reason,
            clinical_state: state,
            red_flags: {
              has_red_flag: true,
              severity: 'CRITICAL',
              reason: triageResult.reason,
              triggered_at: new Date(),
            },
          });
        } catch (dbErr) {
          logger.warn(`[Intake DB Persistence Notice]: ${dbErr.message}`);
        }
      }

      return {
        success: true,
        assistant_message: emergencyWarning,
        intent: 'emergency concern',
        risk_state: 'URGENT_REVIEW_REQUIRED',
        next_question: '',
        quick_chips: [],
        extracted_entities: {
          chief_complaint: state.chief_complaint,
          symptoms: state.symptoms,
          duration: state.duration,
          severity: state.severity,
          onset: state.onset,
          associated_symptoms: state.associated_symptoms,
          negated_symptoms: state.negative_findings,
        },
        clinical_state: state,
        red_flag: {
          detected: true,
          priority: 'HIGH',
          triage_level: 'EMERGENCY',
          category: triageResult.category,
          reason: triageResult.reason,
        },
        history_complete: false,
        doctor_review_required: true,
        session_status: 'URGENT_REVIEW_REQUIRED',
      };
    }

    // 4. Extract Entities from Patient Text
    const extracted = this.extractEntitiesFromText(patientText, state);
    state = this.updateClinicalState(state, extracted, patientIntent);
    state.risk_level = triageResult.triage_level;

    // 5. Query Infermedica for Clinical Assessment Reference when symptoms exist
    let infermedicaAssessment = null;
    if (state.symptoms.length > 0) {
      try {
        infermedicaAssessment = await infermedicaService.assessClinicalRisk({
          symptoms: state.symptoms,
          negative_findings: state.negative_findings,
        });
      } catch (e) {
        logger.warn(`[Infermedica reference ignored]: ${e.message}`);
      }
    }

    // 6. Address Patient Intent First (if patient asked a question or advice)
    const directAnswer = this.generateIntentDirectAnswer(patientIntent, state, langKey);

    // 7. Select Single Next Adaptive Question (skipping known data)
    const nextQuestionResult = this.selectNextAdaptiveQuestion(state, langKey, opd_mode);
    state.next_question = nextQuestionResult.is_complete ? '' : nextQuestionResult.question;

    let finalAssistantMessage = '';
    if (directAnswer) {
      finalAssistantMessage = nextQuestionResult.is_complete
        ? directAnswer
        : `${directAnswer} ${nextQuestionResult.question}`;
    } else {
      finalAssistantMessage = nextQuestionResult.question;
    }

    // 8. Persist Turn to CaseMessage, Observations, and ClinicalSession
    if (session_id && !session_id.startsWith('session-') && !session_id.startsWith('demo-')) {
      try {
        // Log patient turn
        await caseMessageRepository.create({
          session_id,
          sender: 'PATIENT',
          message: patientText,
          message_type: 'TEXT',
        });

        // Log AI assistant turn
        await caseMessageRepository.create({
          session_id,
          sender: 'AI',
          message: finalAssistantMessage,
          message_type: 'TEXT',
          metadata: { intent: patientIntent, triage_level: triageResult.triage_level },
        });

        // Store extracted observations
        if (extracted.chief_complaint || extracted.symptoms.length > 0) {
          const symptomName = extracted.chief_complaint || extracted.symptoms[0];
          await observationRepository.create({
            session_id,
            category: 'SYMPTOM',
            name: symptomName,
            value: [extracted.onset, extracted.severity, extracted.duration].filter(Boolean).join(', ') || 'Reported',
            confidence: 0.92,
            source: 'AI_DIALOGUE',
          });
        }

        // Update session state
        await sessionRepository.updateStatus(
          session_id,
          nextQuestionResult.is_complete ? 'READY_FOR_DOCTOR' : 'IN_PROGRESS',
          {
            clinical_state: state,
            triage_level: triageResult.triage_level,
            triage_reason: triageResult.reason,
          }
        );
      } catch (dbErr) {
        logger.warn(`[Intake DB Persistence Notice]: ${dbErr.message}`);
      }
    }

    const sessionStatus = nextQuestionResult.is_complete ? 'READY_FOR_SUMMARY' : 'IN_PROGRESS';

    return {
      success: true,
      assistant_message: finalAssistantMessage,
      intent: patientIntent,
      risk_state: triageResult.priority === 'HIGH' ? 'POSSIBLE_RED_FLAG' : 'ASSESSING',
      next_question: nextQuestionResult.question,
      quick_chips: nextQuestionResult.quick_chips,
      extracted_entities: {
        chief_complaint: state.chief_complaint,
        symptoms: state.symptoms,
        duration: state.duration,
        severity: state.severity,
        onset: state.onset,
        location: state.body_site,
        associated_symptoms: state.associated_symptoms,
        negated_symptoms: state.negative_findings,
      },
      clinical_state: state,
      red_flag: {
        detected: triageResult.detected,
        priority: triageResult.priority,
        triage_level: triageResult.triage_level,
        category: triageResult.category,
        reason: triageResult.reason,
      },
      infermedica_assessment: infermedicaAssessment,
      history_complete: nextQuestionResult.is_complete,
      doctor_review_required: false,
      session_status: sessionStatus,
    };
  }
}

export const intakeService = new IntakeService();
export default intakeService;
