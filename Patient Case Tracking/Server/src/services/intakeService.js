import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { infermedicaService } from './infermedicaService.js';
import { caseMessageRepository } from '../repositories/caseMessageRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';

dotenv.config();

// Load clinical knowledge base data for server-side clinical reasoning & question bank
let ckbDatabase = [];
try {
  const ckbPath = path.resolve('src/data/clinical_knowledge_base.json');
  if (fs.existsSync(ckbPath)) {
    ckbDatabase = JSON.parse(fs.readFileSync(ckbPath, 'utf8'));
  }
} catch (err) {
  logger.warn('[IntakeService] Could not load clinical_knowledge_base.json: ' + err.message);
}

// In-memory idempotency cache for duplicate request suppression (10 minute TTL)
const idempotencyCache = new Map();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

function cleanupIdempotencyCache() {
  const now = Date.now();
  for (const [key, val] of idempotencyCache.entries()) {
    if (now - val.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}
setInterval(cleanupIdempotencyCache, 60000).unref();

/**
 * Clinical Conversation Engine & Intake Service
 * Orchestrates multi-turn adaptive clinical intake, dynamic question generation,
 * stateful turn idempotency, contextual red-flag triage, and question deduplication.
 */
export class IntakeService {
  /**
   * Initialize or normalize the structured clinical state object
   */
  normalizeClinicalState(raw = {}) {
    const unwrapStr = (val) => {
      if (Array.isArray(val)) {
        return val.length > 0 && typeof val[0] === 'string' && val[0].trim().length > 0 ? val[0].trim() : null;
      }
      return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
    };

    const chief =
      unwrapStr(raw.chief_complaint) ||
      (Array.isArray(raw.chief_complaints) && raw.chief_complaints[0]
        ? String(raw.chief_complaints[0]).trim()
        : null);

    const answered = new Set(
      Array.isArray(raw.answered_dimensions)
        ? raw.answered_dimensions
        : Array.isArray(raw.answered_questions)
        ? raw.answered_questions
        : []
    );

    const duration = unwrapStr(raw.duration);
    const severity = unwrapStr(raw.severity);
    const onset = unwrapStr(raw.onset);
    const bodySite =
      unwrapStr(raw.body_site) ||
      (Array.isArray(raw.location) && raw.location[0] ? String(raw.location[0]).trim() : unwrapStr(raw.location));

    if (duration) answered.add('duration');
    if (severity) answered.add('severity');
    if (onset) answered.add('onset');
    if (bodySite) answered.add('location');

    return {
      session_id: raw.session_id || '',
      patient_id: raw.patient_id || '',
      chief_complaint: chief || '',
      symptoms: Array.isArray(raw.symptoms) ? [...raw.symptoms] : chief ? [chief] : [],
      body_site: bodySite || '',
      onset: onset || null,
      duration: duration || null,
      severity: severity || null,
      course: unwrapStr(raw.course) || '',
      associated_symptoms: Array.isArray(raw.associated_symptoms) ? [...raw.associated_symptoms] : [],
      negative_findings: Array.isArray(raw.negative_findings)
        ? [...raw.negative_findings]
        : Array.isArray(raw.negated_symptoms)
        ? [...raw.negated_symptoms]
        : [],
      relevant_history: Array.isArray(raw.relevant_history)
        ? [...raw.relevant_history]
        : Array.isArray(raw.past_medical_history)
        ? [...raw.past_medical_history]
        : [],
      medications: Array.isArray(raw.medications) ? [...raw.medications] : [],
      allergies: Array.isArray(raw.allergies) ? [...raw.allergies] : [],
      family_history: Array.isArray(raw.family_history) ? [...raw.family_history] : [],
      lifestyle: raw.lifestyle && typeof raw.lifestyle === 'object' ? { ...raw.lifestyle } : {},
      red_flags: Array.isArray(raw.red_flags) ? [...raw.red_flags] : [],
      risk_level: raw.risk_level || 'unknown',
      patient_intent: raw.patient_intent || 'medical-history response',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.9,
      missing_high_priority_information: Array.isArray(raw.missing_high_priority_information)
        ? [...raw.missing_high_priority_information]
        : [],
      current_question: raw.current_question && typeof raw.current_question === 'object' ? { ...raw.current_question } : null,
      asked_questions: Array.isArray(raw.asked_questions) ? [...raw.asked_questions] : [],
      next_question: raw.next_question || '',
      answered_dimensions: Array.from(answered),
      turn_count: typeof raw.turn_count === 'number' ? raw.turn_count : 0,
      session_version: typeof raw.session_version === 'number' ? raw.session_version : 1,
    };
  }

  /**
   * Find matching complaint entry in Clinical Knowledge Base
   */
  findCkbEntry(complaintText = '') {
    if (!complaintText) return null;
    const lower = String(complaintText).toLowerCase().trim();

    for (const entry of ckbDatabase) {
      if (
        entry.complaint.toLowerCase() === lower ||
        lower.includes(entry.complaint.toLowerCase()) ||
        entry.complaint.toLowerCase().includes(lower)
      ) {
        return entry;
      }
      if (entry.synonyms && Array.isArray(entry.synonyms)) {
        for (const syn of entry.synonyms) {
          const synLower = syn.toLowerCase();
          if (lower.includes(synLower) || synLower.includes(lower)) {
            return entry;
          }
        }
      }
    }
    return null;
  }

  /**
   * Intent Classifier: Detect patient queries, advice requests, medicine questions, distress, or history answers
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
      t.includes('what should i do') ||
      t.includes('what to do') ||
      text.includes('ડૉક્ટરને બતાવવું') ||
      text.includes('ડોક્ટરને મળવું') ||
      text.includes('શું મારે ડૉક્ટરને') ||
      text.includes('ડૉક્ટરની સલાહ') ||
      text.includes('હવે હું સુ કરું') ||
      text.includes('હવે હું શું કરું') ||
      text.includes('હું સુ કરું') ||
      text.includes('હું શું કરું') ||
      text.includes('હવે શું કરવું') ||
      text.includes('શું કરવું જોઈએ') ||
      text.includes('હું શું કરી શકું') ||
      text.includes('મેં ક્યાં કરું') ||
      text.includes('अब मैं क्या करूँ') ||
      text.includes('क्या करना चाहिए') ||
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
      text.includes('દવા વિશે') ||
      text.includes('દવા લઈ શકું') ||
      text.includes('કઈ દવા લેવી') ||
      text.includes('દવા પૂછવું') ||
      text.includes('दवा ले सकता') ||
      text.includes('दवा के बारे में') ||
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

    return 'medical-history response';
  }

  /**
   * Generates empathetic direct answer when patient asks a question or advice
   */
  generateIntentDirectAnswer(intent, state, langKey = 'en-IN') {
    const complaint = state.chief_complaint || state.symptoms[0] || 'your symptoms';
    const complaintLower = String(complaint).toLowerCase();
    const isDiarrhea =
      complaintLower.includes('diarrhea') ||
      complaintLower.includes('stool') ||
      complaintLower.includes('ઝાડા') ||
      complaintLower.includes('ટોઈલતે') ||
      complaintLower.includes('ટોયલેટ') ||
      complaintLower.includes('મોશન') ||
      complaintLower.includes('દસ્ત') ||
      (state.symptoms || []).some((s) => {
        const sl = String(s).toLowerCase();
        return sl.includes('diarrhea') || sl.includes('stool') || sl.includes('ઝાડા') || sl.includes('ટોઈલતે') || sl.includes('મોશન') || sl.includes('દસ્ત');
      });

    if (intent === 'doctor-consult question') {
      if (isDiarrhea) {
        const diarrheaAdvice = {
          'en-IN': 'In watery diarrhea, maintaining hydration is vital to prevent dehydration—please drink plenty of fluids such as ORS, coconut water, or clean boiled water, and consult a physician promptly. I will organize your clinical summary for the doctor.',
          'hi-IN': 'पानी जैसे पतले दस्त में शरीर में पानी और नमक की कमी (डिहाइड्रेशन) न हो, इसके लिए ORS का घोल, नारियल पानी, नींबू पानी या भरपूर तरल पदार्थ थोड़ी-थोड़ी देर में लेते रहें और तुरंत डॉक्टर से परामर्श लें। मैं डॉक्टर के लिए आपकी मेडिकल रिपोर्ट तैयार कर रहा हूँ।',
          'gu-IN': 'પાણી જેવા ઝાડામાં શરીરમાં ડિહાઇડ્રેશન (પાણી અને ક્ષારની ઘટ) ન થાય તે માટે ORSનું પાણી, નાળિયેર પાણી, લીંબુ શરબત અથવા પુષ્કળ પ્રવાહી થોડા થોડા સમયે પીતા રહેવું ખૂબ જરૂરી છે અને ડૉક્ટરની સલાહ લેવી જોઈએ. હું ડૉક્ટર માટે તમારી વિગતો નોંધી રહ્યો છું.',
        };
        return diarrheaAdvice[langKey] || diarrheaAdvice['en-IN'];
      }

      const answers = {
        'en-IN': `Yes, discussing ${complaint} with a physician is recommended so they can perform a proper physical evaluation. I will ask a few quick questions so the doctor has your organized clinical history ready.`,
        'hi-IN': `हाँ, आपके ${complaint} के लिए डॉक्टर से परामर्श लेना बिल्कुल उचित है ताकि वे आवश्यक जांच कर सकें। मैं कुछ और जरूरी विवरण नोट कर रहा हूँ ताकि डॉक्टर के पास आपकी पूरी जानकारी तैयार रहे।`,
        'gu-IN': `હા, તમારા ${complaint} માટે ડૉક્ટર સાથે પરામર્શ કરવો યોગ્ય છે જેથી તેઓ જરૂરી તપાસ કરી શકે. હું તમારી વિગતો નોંધી રહ્યો છું જેથી ડૉક્ટર માટે તમારો સંપૂર્ણ ઈતિહાસ તૈયાર રહે.`,
      };
      return answers[langKey] || answers['en-IN'];
    }

    if (intent === 'medicine information question') {
      const answers = {
        'en-IN': 'Medication choices and exact dosages must be confirmed directly by the doctor after your examination. I will note down all your symptoms so the physician can prescribe the safest treatment.',
        'hi-IN': 'दवा और खुराक की सही सलाह डॉक्टर द्वारा आपकी जांच के बाद ही दी जा सकती है। मैं आपके लक्षण दर्ज कर रहा हूँ ताकि डॉक्टर सुरक्षित उपचार लिख सकें।',
        'gu-IN': 'દવા અને તેના ડોઝની સલાહ ડૉક્ટર દ્વારા તપાસ પછી જ આપી શકાય છે. હું તમારા લક્ષણો નોંધી રહ્યો છું જેથી ડૉક્ટર યોગ્ય સારવાર સૂચવી શકે.',
      };
      return answers[langKey] || answers['en-IN'];
    }

    if (intent === 'general help') {
      const answers = {
        'en-IN': 'I am your MediKiosk clinical intake assistant. Please share your symptoms and I will prepare a structured summary for your doctor.',
        'hi-IN': 'मैं आपका मेडीकियोस्क सहायक हूँ। कृपया अपनी स्वास्थ्य समस्या के बारे में बताएं, और मैं डॉक्टर के लिए आपकी मेडिकल रिपोर्ट तैयार करूँगा।',
        'gu-IN': 'હું તમારો મેડિકિયોસ્ક ક્લિનિકલ સહાયક છું. કૃપા કરીને તમારી તકલીફ વિશે જણાવો, હું ડૉક્ટર માટે તમારી વિગતો તૈયાર કરીશ.',
      };
      return answers[langKey] || answers['en-IN'];
    }

    return null;
  }

  /**
   * Contextual Red-Flag Triage Engine
   */
  evaluateRedFlagAndTriage(text = '', state = {}) {
    const textLower = (text || '').toLowerCase().trim();
    const complaints = (state.symptoms || [])
      .concat(state.chief_complaint ? [state.chief_complaint] : [])
      .map((s) => String(s).toLowerCase());

    const mentionsChest =
      textLower.includes('chest') ||
      textLower.includes('heart attack') ||
      text.includes('છાતી') ||
      text.includes('સીના') ||
      text.includes('सीना') ||
      complaints.some((c) => c.includes('chest') || c.includes('છાતી') || c.includes('सीना'));

    const mentionsCough =
      textLower.includes('cough') ||
      textLower.includes('phlegm') ||
      textLower.includes('sputum') ||
      text.includes('ખાંસી') ||
      text.includes('ઉધરસ') ||
      text.includes('કફ') ||
      text.includes('खांसी') ||
      complaints.some((c) => c.includes('cough') || c.includes('ખાંસી') || c.includes('खांसी'));

    const hasSevereBreathing =
      textLower.includes('cannot breathe') ||
      textLower.includes("can't breathe") ||
      textLower.includes('gasping') ||
      textLower.includes('choking') ||
      textLower.includes('stridor') ||
      textLower.includes('severe difficulty breathing') ||
      textLower.includes('severe breathlessness') ||
      text.includes('શ્વાસ નથી લઈ શકાતો') ||
      text.includes('દમ ઘૂંટાય') ||
      text.includes('सांस नहीं आ रही') ||
      text.includes('दम घुट रहा है');

    const hasBreathingDifficulty =
      hasSevereBreathing ||
      textLower.includes('breathless') ||
      textLower.includes('difficulty breathing') ||
      textLower.includes('shortness of breath') ||
      textLower.includes('trouble breathing') ||
      textLower.includes('wheezing') ||
      text.includes('શ્વાસ લેવામાં તકલીફ') ||
      text.includes('શ્વાસ ચડે') ||
      text.includes('દમ ચડે') ||
      text.includes('સાંસ ફૂલતી') ||
      text.includes('सांस लेने में दिक्कत') ||
      text.includes('सांस फूलना');

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
      text.includes('पसीना') ||
      text.includes('बाएं हाथ') ||
      text.includes('चक्कर');

    const hasExtremeSeverity =
      textLower.includes('9/10') ||
      textLower.includes('10/10') ||
      textLower.includes('unbearable') ||
      text.includes('અસહ્ય');

    const hasHemoptysis =
      textLower.includes('coughing blood') ||
      textLower.includes('blood in sputum') ||
      textLower.includes('blood in phlegm') ||
      textLower.includes('hemoptysis') ||
      text.includes('ખાંસીમાં લોહી') ||
      text.includes('ખાંસી સાથે લોહી') ||
      text.includes('ઉધરસમાં લોહી') ||
      text.includes('કફમાં લોહી') ||
      text.includes('સાથે લોહી આવે') ||
      text.includes('खांसी में खून') ||
      text.includes('बलगम में खून') ||
      (text.includes('લોહી') && mentionsCough) ||
      (text.includes('खून') && mentionsCough);

    const hasActiveSevereBleeding =
      hasHemoptysis ||
      textLower.includes('vomiting blood') ||
      textLower.includes('large blood') ||
      textLower.includes('black stool') ||
      text.includes('ઉલ્ટીમાં લોહી') ||
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

    // 1. EMERGENCY
    if (
      (mentionsChest &&
        (hasSevereBreathing || hasSweatingRadiationOrFaint || hasExtremeSeverity || textLower.includes('heart attack'))) ||
      hasActiveSevereBleeding ||
      hasAcuteStrokeSigns ||
      hasLossOfConsciousness
    ) {
      let reason = 'Acute cardiovascular distress, hemoptysis/bleeding, stroke signs, or loss of consciousness.';
      let category = 'CARDIOVASCULAR_EMERGENCY';
      if (hasHemoptysis) {
        category = 'HEMOPTYSIS_ALERT';
        reason = 'Coughing up blood (hemoptysis) requires immediate urgent clinical evaluation.';
      } else if (hasActiveSevereBleeding) {
        category = 'SEVERE_HEMORRHAGE';
      } else if (hasAcuteStrokeSigns) {
        category = 'NEUROLOGICAL_EMERGENCY';
      } else if (hasLossOfConsciousness) {
        category = 'LOSS_OF_CONSCIOUSNESS';
      }

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

    // 2. HIGH PRIORITY / URGENT
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

    // 3. MODERATE
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

    if (mentionsCough && hasBreathingDifficulty) {
      return {
        detected: false,
        priority: 'MODERATE',
        triage_level: 'MODERATE',
        category: 'RESPIRATORY_RISK_ASSESSMENT',
        reason: 'Cough accompanied by breathing difficulty. Prioritizing respiratory safety assessment.',
        patient_instruction: null,
      };
    }

    // 4. LOW / ROUTINE
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
    const t = (text || '').toLowerCase();
    const extracted = {
      chief_complaint: null,
      symptoms: [],
      body_site: null,
      duration: null,
      severity: null,
      onset: null,
      associated_symptoms: [],
      negative_findings: [],
      lifestyle: {},
    };

    // Body Sites
    if (t.includes('right knee') || text.includes('જમણા ઢીંચણ') || text.includes('દાણા ઢીંચણ') || text.includes('दाएं घुटने')) extracted.body_site = 'Right Knee';
    else if (t.includes('left knee') || text.includes('ડાબા ઢીંચણ') || text.includes('બાવા ઢીંચણ') || text.includes('बाएं घुटने')) extracted.body_site = 'Left Knee';
    else if (t.includes('knee') || text.includes('ઢીંચણ') || text.includes('ઘૂંટણ') || text.includes('ગોઠણ') || text.includes('घुटने')) extracted.body_site = 'Knee';
    else if (t.includes('chest') || text.includes('છાતી') || text.includes('સીના') || text.includes('सीना')) extracted.body_site = 'Chest';
    else if (t.includes('head') || text.includes('માથું') || text.includes('માથા') || text.includes('सिर')) extracted.body_site = 'Head';
    else if (t.includes('back') || text.includes('પીઠ') || text.includes('કમર') || text.includes('कमर') || text.includes('पीठ')) extracted.body_site = 'Back';
    else if (
      t.includes('stomach') ||
      t.includes('abdomen') ||
      t.includes('belly') ||
      t.includes('diarrhea') ||
      t.includes('stool') ||
      text.includes('પેટ') ||
      text.includes('પાણી જેવી') ||
      text.includes('ટોઈલતે') ||
      text.includes('ટોયલેટ') ||
      text.includes('ઝાડા') ||
      text.includes('લૂઝ મોશન') ||
      text.includes('पेट') ||
      text.includes('दस्त')
    ) extracted.body_site = 'Abdomen / Gastrointestinal';

    // Symptoms / Complaints
    if (t.includes('pain') || text.includes('દુખાવો') || text.includes('દુખે') || text.includes('દર્દ') || text.includes('दर्द')) {
      const part = extracted.body_site ? `${extracted.body_site} Pain` : 'Pain';
      extracted.symptoms.push(part);
      if (!currentState.chief_complaint) extracted.chief_complaint = part;
    }

    // Acute Diarrhea / Loose Motions / Watery Stools
    if (
      t.includes('diarrhea') ||
      t.includes('loose motion') ||
      t.includes('loose stool') ||
      t.includes('watery stool') ||
      t.includes('watery diarrhea') ||
      t.includes('motions') ||
      text.includes('પાણી જેવી') ||
      text.includes('પાણી જેવું') ||
      text.includes('પાણી જેવા') ||
      text.includes('ટોઈલતે') ||
      text.includes('ટોયલેટ') ||
      text.includes('ઝાડા') ||
      text.includes('લૂઝ મોશન') ||
      text.includes('પાતળા ઝાડા') ||
      text.includes('ઉલટી-ઝાડા') ||
      text.includes('ઝાડા-ઉલટી') ||
      text.includes('દસ્ત') ||
      text.includes('पतले दस्त') ||
      text.includes('पानी जैसे दस्त')
    ) {
      extracted.symptoms.push('Acute Diarrhea / Loose Motions');
      if (!currentState.chief_complaint) extracted.chief_complaint = 'Acute Diarrhea / Loose Motions';
      if (!extracted.body_site) extracted.body_site = 'Abdomen / Gastrointestinal';
    }

    // Vomiting & Nausea
    if (
      t.includes('vomit') ||
      t.includes('nausea') ||
      text.includes('ઉલટી') ||
      text.includes('ઉલ્ટી') ||
      text.includes('ઉબકા') ||
      text.includes('વોમિટિંગ') ||
      text.includes('उल्टी') ||
      text.includes('जी मिचलाना')
    ) {
      extracted.symptoms.push('Vomiting / Nausea');
      if (!currentState.chief_complaint && !extracted.chief_complaint) extracted.chief_complaint = 'Vomiting / Nausea';
    }

    if (t.includes('headache') || text.includes('માથું દુખે') || text.includes('માથાનો દુખાવો') || text.includes('सिर दर्द')) {
      extracted.symptoms.push('Headache');
      if (!currentState.chief_complaint) extracted.chief_complaint = 'Headache';
    }

    if (t.includes('fever') || text.includes('તાવ') || text.includes('બુખાર') || text.includes('बुखार')) {
      extracted.symptoms.push('Fever');
      if (!currentState.chief_complaint) extracted.chief_complaint = 'Fever';
    }

    if (
      t.includes('cough') ||
      t.includes('cold') ||
      text.includes('ખાંસી') ||
      text.includes('ઉધરસ') ||
      text.includes('શરદી') ||
      text.includes('खांसी')
    ) {
      extracted.symptoms.push('Cough');
      if (!currentState.chief_complaint) extracted.chief_complaint = 'Cough';
    }

    // Phlegm / Sputum
    if (
      t.includes('phlegm') ||
      t.includes('sputum') ||
      t.includes('mucus') ||
      text.includes('કફ') ||
      text.includes('બળગમ') ||
      text.includes('बलगम')
    ) {
      if (text.includes('સફેદ') || t.includes('white')) {
        extracted.associated_symptoms.push('White phlegm (સફેદ કફ)');
      } else if (text.includes('પીળો') || t.includes('yellow')) {
        extracted.associated_symptoms.push('Yellow phlegm (પીળો કફ)');
      } else if (text.includes('લીલો') || t.includes('green')) {
        extracted.associated_symptoms.push('Green phlegm (લીલો કફ)');
      } else {
        extracted.associated_symptoms.push('Phlegm / Sputum (કફ)');
      }
    }

    // Hemoptysis
    if (
      t.includes('blood in sputum') ||
      t.includes('coughing blood') ||
      text.includes('ખાંસીમાં લોહી') ||
      text.includes('ખાંસી સાથે લોહી') ||
      text.includes('કફમાં લોહી') ||
      text.includes('સાથે લોહી') ||
      (text.includes('લોહી') && (text.includes('ખાંસી') || text.includes('કફ') || text.includes('ઉધરસ'))) ||
      (text.includes('खून') && (t.includes('cough') || text.includes('खांसी') || text.includes('बलगम')))
    ) {
      extracted.associated_symptoms.push('Hemoptysis (ખાંસીમાં લોહી)');
    }

    // Breathlessness
    if (
      t.includes('breathless') ||
      t.includes('difficulty breathing') ||
      t.includes('shortness of breath') ||
      t.includes('wheezing') ||
      text.includes('શ્વાસ લેવામાં તકલીફ') ||
      text.includes('શ્વાસ ચડે') ||
      text.includes('દમ ચડે') ||
      text.includes('સાંસ ફૂલના') ||
      text.includes('सांस लेने में दिक्कत')
    ) {
      extracted.associated_symptoms.push('Difficulty breathing');
    }

    if (t.includes('swelling') || text.includes('સોજો') || text.includes('सूजन')) {
      extracted.associated_symptoms.push('Swelling');
    }
    if (t.includes('stiff') || text.includes('અકડાઈ') || text.includes('કડક') || text.includes('जकड़न')) {
      extracted.associated_symptoms.push('Stiffness');
    }
    if (t.includes('walking') || text.includes('ચાલવા') || text.includes('चलने')) {
      extracted.associated_symptoms.push('Difficulty walking');
    }

    // Tobacco / Smoking
    if (
      t.includes('smoke') ||
      t.includes('smoking') ||
      t.includes('cigarette') ||
      t.includes('bidi') ||
      text.includes('બીડી') ||
      text.includes('સિગારેટ') ||
      text.includes('તમાકુ') ||
      text.includes('गुटखा') ||
      text.includes('सिगरेट')
    ) {
      extracted.lifestyle.smoking = 'Tobacco / Smoking reported';
    }

    // Explicit Negations in patient utterance
    if (
      t.includes('no fever') ||
      t.includes("don't have fever") ||
      text.includes('તાવ નથી') ||
      text.includes('બુખાર નહીં') ||
      text.includes('बुखार नहीं')
    ) {
      extracted.negative_findings.push('Fever');
    }
    if (
      t.includes('no swelling') ||
      text.includes('સોજો નથી') ||
      text.includes('સૂજન નહીં') ||
      text.includes('सूजन नहीं')
    ) {
      extracted.negative_findings.push('Swelling');
    }
    if (
      t.includes('no breathing difficulty') ||
      t.includes('breathing normal') ||
      text.includes('શ્વાસ લેવામાં તકલીફ નથી') ||
      text.includes('શ્વાસમાં તકલીફ નથી') ||
      text.includes('શ્વાસ સામાન્ય છે') ||
      text.includes('સાંસ સામાન્ય છે') ||
      text.includes('सांस सामान्य है')
    ) {
      extracted.negative_findings.push('Difficulty breathing');
    }
    if (
      t.includes('no blood') ||
      text.includes('લોહી નથી') ||
      text.includes('બિલકુલ લોહી નથી') ||
      text.includes('खून नहीं')
    ) {
      extracted.negative_findings.push('Hemoptysis');
      extracted.negative_findings.push('Blood in stool');
    }

    // Episodes / Frequency
    const freqMatch = text.match(/(\d+)\s*(?:વાર|વખત|बार|times|episodes)/i);
    if (freqMatch) {
      extracted.associated_symptoms.push(`${freqMatch[1]} episodes`);
    }

    // Stool Blood Red Flag check
    if (
      (text.includes('ટોઈલતે') || text.includes('ઝાડા') || text.includes('દસ્ત') || t.includes('stool')) &&
      (text.includes('લોહી') || text.includes('खून') || t.includes('blood')) &&
      !text.includes('લોહી નથી') &&
      !text.includes('खून नहीं') &&
      !t.includes('no blood')
    ) {
      extracted.associated_symptoms.push('Blood in stool (Hematochezia)');
    }

    // Duration extraction
    const durationMatch = text.match(
      /(\d+\s*(?:years?|yrs?|months?|weeks?|days?|hours?)|\d+\s*(?:વર્ષ|મહિના|અઠવાડિયા|દિવસ|દહાડા)|\d+\s*(?:साल|महीने|हफ्ते|दिन))/i
    );
    if (durationMatch) {
      extracted.duration = durationMatch[1].trim();
    } else if (
      t.includes('since morning') ||
      text.includes('સવારથી') ||
      text.includes('આજ સવારથી') ||
      text.includes('આજે સવારે') ||
      text.includes('આજ સવારે') ||
      text.includes('सुबह से')
    ) {
      extracted.duration = 'Since morning';
    }

    // Severity extraction
    const sevNumMatch = text.match(/([1-9]|10)\s*\/\s*10/);
    if (sevNumMatch) {
      extracted.severity = `${sevNumMatch[1]}/10`;
    } else if (t.includes('severe') || t.includes('unbearable') || text.includes('તીવ્ર') || text.includes('ગંભીર') || text.includes('गंभीर')) {
      extracted.severity = 'Severe';
    } else if (t.includes('moderate') || text.includes('મધ્યમ') || text.includes('मध्यम')) {
      extracted.severity = 'Moderate';
    } else if (t.includes('mild') || text.includes('હળવો') || text.includes('હળવું') || text.includes('हल्का')) {
      extracted.severity = 'Mild';
    }

    // Onset
    if (t.includes('sudden') || text.includes('અચાનક') || text.includes('અચાનક શરૂ') || text.includes('अचानक')) {
      extracted.onset = 'Sudden';
    } else if (t.includes('gradual') || t.includes('slowly') || text.includes('ધીમે ધીમે') || text.includes('ધીમે-ધીમે') || text.includes('धीरे-धीरे')) {
      extracted.onset = 'Gradual';
    }

    return extracted;
  }

  /**
   * Interprets negative patient answers (e.g. "ના", "નથી", "No") in the context of the question currently being asked
   */
  processContextualAnswer(state, patientText) {
    const t = (patientText || '').toLowerCase().trim();
    const isNegative =
      t === 'no' ||
      t === 'none' ||
      t === 'nothing' ||
      t.startsWith('no,') ||
      t.startsWith('no ') ||
      patientText === 'ના' ||
      patientText.startsWith('ના,') ||
      patientText.startsWith('ના ') ||
      patientText.includes('કોઈ અન્ય લક્ષણ નથી') ||
      patientText.includes('કોઈ જૂની બીમારી નથી') ||
      patientText.includes('કોઈ બીમારી નથી') ||
      patientText.includes('નથી') ||
      patientText.includes('નહીં') ||
      patientText.includes('કોઈ નથી');

    const currQ = state.current_question;
    if (!currQ) return;

    if (isNegative) {
      const topic = currQ.topic || '';

      if (topic === 'fallback_general' || topic === 'other_symptoms' || topic === 'past_history') {
        state.relevant_history.push('No other symptoms or chronic diseases reported');
        if (!state.answered_dimensions.includes('past_history')) state.answered_dimensions.push('past_history');
        if (!state.answered_dimensions.includes('other_symptoms')) state.answered_dimensions.push('other_symptoms');
        if (!state.answered_dimensions.includes('fallback_general')) state.answered_dimensions.push('fallback_general');
      } else if (topic === 'fever' || topic === 'fever_associated') {
        if (!state.negative_findings.includes('Fever')) state.negative_findings.push('Fever');
        if (!state.answered_dimensions.includes('fever')) state.answered_dimensions.push('fever');
      } else if (topic === 'breathlessness' || topic === 'dyspnea_severity') {
        if (!state.negative_findings.includes('Difficulty breathing')) state.negative_findings.push('Difficulty breathing');
        if (!state.answered_dimensions.includes('breathlessness')) state.answered_dimensions.push('breathlessness');
        if (!state.answered_dimensions.includes('dyspnea_severity')) state.answered_dimensions.push('dyspnea_severity');
      } else if (topic === 'chest_radiation_breath') {
        if (!state.negative_findings.includes('Radiation')) state.negative_findings.push('Radiation');
        if (!state.negative_findings.includes('Difficulty breathing')) state.negative_findings.push('Difficulty breathing');
        if (!state.answered_dimensions.includes('chest_radiation_breath')) state.answered_dimensions.push('chest_radiation_breath');
      } else if (topic === 'chronic_risk_factors') {
        if (!state.negative_findings.includes('Tobacco/Smoking')) state.negative_findings.push('Tobacco/Smoking');
        if (!state.negative_findings.includes('Weight loss / Night sweats')) state.negative_findings.push('Weight loss / Night sweats');
        if (!state.answered_dimensions.includes('chronic_risk_factors')) state.answered_dimensions.push('chronic_risk_factors');
      } else if (topic === 'swelling_stiffness' || topic === 'associated_symptoms') {
        if (!state.negative_findings.includes('Swelling')) state.negative_findings.push('Swelling');
        if (!state.negative_findings.includes('Stiffness')) state.negative_findings.push('Stiffness');
        if (!state.answered_dimensions.includes('associated_symptoms')) state.answered_dimensions.push('associated_symptoms');
      }

      // Mark question as answered
      currQ.status = 'ANSWERED';
      state.asked_questions.push({ ...currQ, answered_at: new Date().toISOString() });
      state.current_question = null;
    } else {
      // Affirmative or informative answer -> mark answered
      currQ.status = 'ANSWERED';
      state.asked_questions.push({ ...currQ, answered_at: new Date().toISOString() });
      state.current_question = null;
    }
  }

  /**
   * Merge extracted entities into the persistent clinical state
   */
  updateClinicalState(state, extracted, patientIntent) {
    if (extracted.chief_complaint && !state.chief_complaint) {
      state.chief_complaint = extracted.chief_complaint;
    }
    if (extracted.body_site && !state.body_site) {
      state.body_site = extracted.body_site;
      if (!state.answered_dimensions.includes('location')) state.answered_dimensions.push('location');
    }
    if (extracted.duration && !state.duration) {
      state.duration = extracted.duration;
      if (!state.answered_dimensions.includes('duration')) state.answered_dimensions.push('duration');
    }
    if (extracted.severity && !state.severity) {
      state.severity = extracted.severity;
      if (!state.answered_dimensions.includes('severity')) state.answered_dimensions.push('severity');
    }
    if (extracted.onset && !state.onset) {
      state.onset = extracted.onset;
      if (!state.answered_dimensions.includes('onset')) state.answered_dimensions.push('onset');
    }

    (extracted.symptoms || []).forEach((s) => {
      if (!state.symptoms.includes(s)) state.symptoms.push(s);
    });

    if (!state.chief_complaint && state.symptoms.length > 0) {
      state.chief_complaint = state.symptoms[0];
    }

    (extracted.associated_symptoms || []).forEach((s) => {
      if (!state.associated_symptoms.includes(s)) state.associated_symptoms.push(s);
      if (s.toLowerCase().includes('phlegm') || s.toLowerCase().includes('કફ')) {
        if (!state.answered_dimensions.includes('sputum_type')) state.answered_dimensions.push('sputum_type');
        if (s.toLowerCase().includes('white') || s.toLowerCase().includes('yellow') || s.toLowerCase().includes('green')) {
          if (!state.answered_dimensions.includes('sputum_color')) state.answered_dimensions.push('sputum_color');
        }
      }
      if (s.toLowerCase().includes('breathing')) {
        if (!state.answered_dimensions.includes('breathlessness')) state.answered_dimensions.push('breathlessness');
      }
    });

    (extracted.negative_findings || []).forEach((n) => {
      if (!state.negative_findings.includes(n)) state.negative_findings.push(n);
      state.symptoms = state.symptoms.filter((sym) => !sym.toLowerCase().includes(n.toLowerCase()));
      state.associated_symptoms = state.associated_symptoms.filter((sym) => !sym.toLowerCase().includes(n.toLowerCase()));
      if (n.toLowerCase().includes('fever')) {
        if (!state.answered_dimensions.includes('fever')) state.answered_dimensions.push('fever');
      }
      if (n.toLowerCase().includes('breathing')) {
        if (!state.answered_dimensions.includes('breathlessness')) state.answered_dimensions.push('breathlessness');
      }
    });

    if (extracted.lifestyle && extracted.lifestyle.smoking) {
      state.lifestyle = { ...state.lifestyle, smoking: extracted.lifestyle.smoking };
      if (!state.answered_dimensions.includes('smoking')) state.answered_dimensions.push('smoking');
    }

    state.patient_intent = patientIntent;

    const missing = [];
    if (!state.chief_complaint && state.symptoms.length === 0) missing.push('chief_complaint');
    if (!state.duration) missing.push('duration');
    if (!state.severity) missing.push('severity');
    if (!state.onset) missing.push('onset');
    if (state.associated_symptoms.length === 0 && !state.answered_dimensions.includes('associated_symptoms')) {
      missing.push('associated_symptoms');
    }

    state.missing_high_priority_information = missing;
    return state;
  }

  /**
   * Evaluates if the collected history meets clinical sufficiency for Doctor Review
   */
  isCaseClinicallySufficient(state) {
    const hasComplaint = Boolean(state.chief_complaint || state.symptoms.length > 0);
    const hasDuration = Boolean(state.duration);
    if (!hasComplaint || !hasDuration) return false;

    const answeredCount = (state.answered_dimensions || []).length;
    const hasAssocOrNegatives = state.associated_symptoms.length > 0 || state.negative_findings.length > 0;
    const hasKeyChars = Boolean(state.severity || state.onset || state.answered_dimensions.includes('sputum_type'));

    return Boolean(hasComplaint && hasDuration && (answeredCount >= 3 || (hasAssocOrNegatives && hasKeyChars)));
  }

  /**
   * Question Deduplication Validator:
   * Ensures that candidate questions are NOT already asked or semantically equivalent
   */
  isQuestionAlreadyAsked(candidateText, state) {
    if (!candidateText) return false;
    const norm = (str) => str.replace(/[?.,!]/g, '').trim().toLowerCase();
    const candNorm = norm(candidateText);

    if (state.current_question && norm(state.current_question.text) === candNorm) {
      return true;
    }

    for (const asked of state.asked_questions || []) {
      if (norm(asked.text) === candNorm) {
        return true;
      }
    }

    return false;
  }

  /**
   * Adaptive Question Generator
   */
  selectNextAdaptiveQuestion(state, langKey = 'en-IN', opdMode = 'GENERAL') {
    const complaintLower = (state.chief_complaint || state.symptoms[0] || '').toLowerCase();
    const isCough =
      complaintLower.includes('cough') ||
      complaintLower.includes('cold') ||
      complaintLower.includes('ખાંસી') ||
      complaintLower.includes('ઉધરસ') ||
      complaintLower.includes('કફ');

    const isChest =
      complaintLower.includes('chest') ||
      complaintLower.includes('છાતી') ||
      complaintLower.includes('સીના') ||
      complaintLower.includes('सीना');

    const isKneeOrJoint =
      complaintLower.includes('knee') ||
      complaintLower.includes('joint') ||
      complaintLower.includes('ઢીંચણ') ||
      complaintLower.includes('ઘૂંટણ') ||
      complaintLower.includes('સાંધા');

    const isFever =
      complaintLower.includes('fever') ||
      complaintLower.includes('તાવ') ||
      complaintLower.includes('બુખાર');

    // 0. Initial greeting if complaint is missing
    if (!state.chief_complaint && state.symptoms.length === 0) {
      const q = {
        'en-IN': 'Hello! I am your AI Clinical Assistant. What symptoms or health discomfort are you experiencing today?',
        'hi-IN': 'नमस्ते! मैं आपकी AI क्लिनिकल सहायक हूँ। आपको आज क्या परेशानी हो रही है?',
        'gu-IN': 'નમસ્તે! હું તમારી AI ક્લિનિકલ સહાયક છું. તમને આજે કઈ તકલીફ થઈ રહી છે?',
      };
      const chips = {
        'en-IN': ['I have chest pain', 'I have cough and cold', 'Joint & knee pain', 'Fever and chills'],
        'hi-IN': ['सीने में दर्द हो रहा है', 'खांसी और कफ है', 'जोड़ों और घुटनों में दर्द', 'बुखार है'],
        'gu-IN': ['છાતીમાં દુખાવો થાય છે', 'ખાંસી અને કફ છે', 'સાંધા અને ઘૂંટણમાં દુખાવો', 'તાવ અને ધ્રુજારી આવે છે'],
      };
      return {
        id: 'q_greeting',
        topic: 'chief_complaint',
        question: q[langKey] || q['en-IN'],
        quick_chips: chips[langKey] || chips['en-IN'],
        is_complete: false,
      };
    }

    // =========================================================================
    // PATHWAY A: COUGH & RESPIRATORY
    // =========================================================================
    if (isCough) {
      // 1. DYSPEA PRIORITY: If breathlessness is already reported, prioritize respiratory safety FIRST!
      const hasBreathlessness = state.associated_symptoms.some((s) => s.toLowerCase().includes('breathing'));
      const breathingNegated = state.negative_findings.some((n) => n.toLowerCase().includes('breathing'));

      if (hasBreathlessness && !state.answered_dimensions.includes('dyspnea_severity')) {
        state.answered_dimensions.push('dyspnea_severity');
        const q = {
          'en-IN': 'Do you hear any wheezing (whistling sounds) when breathing, or do you feel breathless even while resting?',
          'hi-IN': 'क्या सांस लेते समय सीटी जैसी आवाज आती है, या बैठे-बैठे भी सांस फूलती है?',
          'gu-IN': 'શું શ્વાસ લેતી વખતે સીટી જેવો અવાજ આવે છે, કે આરામ કરતી વખતે પણ શ્વાસ ચડે છે?',
        };
        const chips = {
          'en-IN': ['Wheezing sound in chest', 'Breathless when walking', 'Breathless even at rest', 'Mild tightness'],
          'hi-IN': ['सीटी जैसी आवाज आती है', 'चलने पर सांस फूलती है', 'बैठे-बैठे भी सांस फूलना', 'हल्की जकड़न'],
          'gu-IN': ['સીટી જેવો અવાજ આવે છે', 'ચાલતી વખતે શ્વાસ ચડે છે', 'બેઠા-બેઠા પણ શ્વાસ ચડે છે', 'હળવી જકડન'],
        };
        return {
          id: 'q_cough_dyspnea',
          topic: 'dyspnea_severity',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 2. Duration (if not yet provided)
      if (!state.duration && !state.answered_dimensions.includes('duration')) {
        state.answered_dimensions.push('duration');
        const q = {
          'en-IN': 'How long have you had this cough? Is it recent (few days) or ongoing for weeks?',
          'hi-IN': 'यह खांसी आपको कितने समय से है? क्या यह कुछ दिनों से है या कई हफ्तों से?',
          'gu-IN': 'આ ખાંસી તમને કેટલા સમયથી છે?',
        };
        const chips = {
          'en-IN': ['2-3 days', '5 days', 'More than 2 weeks', '3 months or more'],
          'hi-IN': ['2-3 दिन से', 'लगभग 5 दिन से', '2 हफ्ते से अधिक', '3 महीने या ज्यादा'],
          'gu-IN': ['૨-૩ દિવસથી', '૫ દિવસથી', '૨ અઠવાડિયાથી વધુ', '૩ મહિનાથી'],
        };
        return {
          id: 'q_cough_duration',
          topic: 'duration',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      const durStr = (state.duration || '').toLowerCase();
      const isChronic =
        durStr.includes('month') ||
        durStr.includes('મહિના') ||
        durStr.includes('महीने') ||
        durStr.includes('year') ||
        durStr.includes('વર્ષ') ||
        durStr.includes('साल') ||
        durStr.includes('3 week') ||
        durStr.includes('૩ અઠવાડિયા');

      // 3. CHRONIC COUGH PATHWAY
      if (isChronic && !state.answered_dimensions.includes('chronic_risk_factors')) {
        state.answered_dimensions.push('chronic_risk_factors');
        const q = {
          'en-IN': 'Since this cough has lasted for a long duration, do you smoke/use tobacco, or have you noticed weight loss or night sweats?',
          'hi-IN': 'चूंकि खांसी लंबे समय से है, क्या आप बीड़ी/सिगरेट पीते हैं, या वजन घटने/रात में पसीना आने की समस्या है?',
          'gu-IN': 'આટલા લાંબા સમયની ખાંસી હોવાથી, શું તમે બીડી, સિગારેટ કે તમાકુનું સેવન કરો છો, અથવા વજન ઘટવું કે રાત્રે પરસેવો વળવાની તકલીફ છે?',
        };
        const chips = {
          'en-IN': ['Smoke bidi / cigarette', 'Weight loss / night sweats', 'History of asthma / allergies', 'None of these'],
          'hi-IN': ['बीड़ी/सिगरेट पीते हैं', 'वजन कम हुआ / रात में पसीना', 'अस्थमा या एलर्जी है', 'इनमें से कोई नहीं'],
          'gu-IN': ['તમાકુ / બીડી પીવાની ટેવ છે', 'વજન ઘટી ગયું છે / પરસેવો', 'એલર્જી કે અસ્થમા છે', 'ના, એવું કોઈ લક્ષણ નથી'],
        };
        return {
          id: 'q_cough_chronic_risk',
          topic: 'chronic_risk_factors',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 4. SPUTUM CHARACTER
      const hasPhlegm = state.associated_symptoms.some((s) => s.toLowerCase().includes('phlegm') || s.toLowerCase().includes('કફ'));
      const colorKnown = state.associated_symptoms.some((s) =>
        s.toLowerCase().includes('white') || s.toLowerCase().includes('yellow') || s.toLowerCase().includes('green')
      );
      if (hasPhlegm && !colorKnown && !state.answered_dimensions.includes('sputum_color')) {
        state.answered_dimensions.push('sputum_color');
        const q = {
          'en-IN': 'What color is the phlegm? Is it clear/white, thick yellow, green, or rusty?',
          'hi-IN': 'बलगम का रंग कैसा है? क्या यह सफेद, पीला, हरा या किसी अन्य रंग का है?',
          'gu-IN': 'કફનો રંગ કેવો છે? સફેદ, પીળો કે લીલો?',
        };
        const chips = {
          'en-IN': ['White / clear mucus', 'Yellow phlegm', 'Greenish thick phlegm', 'Rust-colored'],
          'hi-IN': ['सफेद पतला कफ', 'पीला गाढ़ा बलगम', 'हरा बलगમ', 'कत्थई/जंग जैसा'],
          'gu-IN': ['સફેદ કફ', 'પીળો કફ', 'લીલો ઘટ્ટ કફ', 'લાલાશ પડતો કફ'],
        };
        return {
          id: 'q_cough_sputum_color',
          topic: 'sputum_color',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 5. ASSOCIATED FEVER & CHEST PAIN
      const feverNegated = state.negative_findings.some((n) => n.toLowerCase().includes('fever'));
      if (!state.answered_dimensions.includes('fever') && !feverNegated) {
        state.answered_dimensions.push('fever');
        const q = {
          'en-IN': 'Do you also have a fever, chills, or pain in your chest when coughing?',
          'hi-IN': 'क्या आपको खांसी के साथ बुखार, कंपकंपी या खांसते समय सीने में दर्द भी है?',
          'gu-IN': 'તમને તાવ પણ આવે છે, કે ખાંસતી વખતે છાતીમાં દુખાવો થાય છે?',
        };
        const chips = {
          'en-IN': ['High fever present', 'Chest hurts when coughing', 'Mild shivering', 'No fever or chest pain'],
          'hi-IN': ['तेज बुखार है', 'खांसने पर सीने में दर्द', 'हल्की ठंड', 'कोई बुखार या दर्द नहीं'],
          'gu-IN': ['તાવ આવે છે', 'ખાંસતી વખતે છાતી દુખે છે', 'ઠંડી લાગે છે', 'ના, તાવ કે દુખાવો નથી'],
        };
        return {
          id: 'q_cough_fever',
          topic: 'fever',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 6. GENERAL BREATHING CHECK
      if (!state.answered_dimensions.includes('breathlessness') && !breathingNegated) {
        state.answered_dimensions.push('breathlessness');
        const q = {
          'en-IN': 'Do you have any difficulty breathing, or does your chest feel tight?',
          'hi-IN': 'क्या आपको सांस लेने में कोई तकलीफ या सीने में भारीपन महसूस हो रहा है?',
          'gu-IN': 'શું તમને શ્વાસ લેવામાં કોઈ તકલીફ કે છાતીમાં ભાર લાગે છે?',
        };
        const chips = {
          'en-IN': ['Shortness of breath present', 'Chest feels heavy', 'Normal breathing'],
          'hi-IN': ['सांस लेने में दिक्कत है', 'सीने में भारीपन', 'सांस सामान्य है'],
          'gu-IN': ['શ્વાસ લેવામાં તકલીફ છે', 'છાતીમાં ભાર લાગે છે', 'ના, શ્વાસ સામાન્ય છે'],
        };
        return {
          id: 'q_cough_breathless_general',
          topic: 'breathlessness',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 7. MEDICAL HISTORY / ALLERGIES
      if (!state.answered_dimensions.includes('past_history') && state.relevant_history.length === 0) {
        state.answered_dimensions.push('past_history');
        const q = {
          'en-IN': 'Do you have any history of asthma, dust allergies, or chronic illnesses like Diabetes or BP?',
          'hi-IN': 'क्या आपको पहले से अस्थमा, धूल से एलर्जी या बीपी/डायबिटीज जैसी कोई बीमारी है?',
          'gu-IN': 'શું તમને પહેલાંથી અસ્થમા, ધૂળની એલર્જી કે ડાયાબિટીસ/બીપી જેવી કોઈ જૂની બીમારી છે?',
        };
        const chips = {
          'en-IN': ['History of Asthma', 'Dust / Pollen allergy', 'Diabetes / Hypertension', 'None / Healthy'],
          'hi-IN': ['अस्थमा की शिकायत है', 'धूल/एलर्जी है', 'डायबिटीज / बीपी है', 'कोई बीमारी नहीं'],
          'gu-IN': ['અસ્થમાની તકલીફ છે', 'ધૂળની એલર્જી છે', 'ડાયાબિટીસ / બીપી છે', 'ના, કોઈ જૂની બીમારી નથી'],
        };
        return {
          id: 'q_cough_past_history',
          topic: 'past_history',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }
    }

    // =========================================================================
    // PATHWAY B: CHEST PAIN TARGETED ASSESSMENT
    // =========================================================================
    if (isChest) {
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
          id: 'q_chest_character',
          topic: 'chest_character',
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
          id: 'q_chest_radiation_breath',
          topic: 'chest_radiation_breath',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }
    }

    // =========================================================================
    // PATHWAY C: KNEE / JOINT PAIN
    // =========================================================================
    if (isKneeOrJoint) {
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
          id: 'q_joint_onset',
          topic: 'onset',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

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
          id: 'q_joint_duration',
          topic: 'duration',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

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
          id: 'q_joint_severity',
          topic: 'severity',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      if (state.associated_symptoms.length === 0 && !state.answered_dimensions.includes('associated_symptoms')) {
        state.answered_dimensions.push('associated_symptoms');
        const q = {
          'en-IN': 'Do you have any associated symptoms like swelling, morning stiffness, or difficulty in movement?',
          'hi-IN': 'क्या आपको सूजन, सुबह जकड़न या चलने-फिरने में कोई अन्य परेशानी भी है?',
          'gu-IN': 'શું તમને સોજો, સવારે જકડાઈ જવું કે હલનચલનમાં કોઈ અન્ય તકલીફ પણ છે?',
        };
        const chips = {
          'en-IN': ['Swelling present', 'Morning stiffness', 'Difficulty moving', 'No other symptoms'],
          'hi-IN': ['सूजन है', 'सुबह जकड़न होती है', 'चलने में परेशानी', 'कोई अन्य लक्षण नहीं'],
          'gu-IN': ['સોજો છે', 'સવારે જકડાઈ જાય છે', 'ચાલવામાં તકલીફ', 'કોઈ અન્ય લક્ષણ નથી'],
        };
        return {
          id: 'q_joint_assoc',
          topic: 'associated_symptoms',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }
    }

    // =========================================================================
    // PATHWAY D: FEVER
    // =========================================================================
    if (isFever) {
      if (!state.duration && !state.answered_dimensions.includes('duration')) {
        state.answered_dimensions.push('duration');
        const q = {
          'en-IN': 'How many days have you had this fever, and does it stay continuous or come and go?',
          'hi-IN': 'यह बुखार कितने दिनों से आ रहा है, और क्या यह लगातार बना रहता है या उतर-चढ़कर आता है?',
          'gu-IN': 'આ તાવ કેટલા દિવસથી આવે છે, અને શું તે સતત રહે છે કે વધતો-ઊતરતો રહે છે?',
        };
        const chips = {
          'en-IN': ['Started today', '2-3 days', 'More than a week'],
          'hi-IN': ['आज से शुरू हुआ', '2-3 दिन से', 'एक हफ्ते से अधिक'],
          'gu-IN': ['આજથી શરૂ થયો', '૨-૩ દિવસથી', '૧ અઠવાડિયાથી વધુ'],
        };
        return {
          id: 'q_fever_duration',
          topic: 'duration',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }
    }

    // =========================================================================
    // PATHWAY E: ACUTE DIARRHEA & LOOSE MOTIONS
    // =========================================================================
    const isDiarrhea =
      (state.chief_complaint &&
        (state.chief_complaint.toLowerCase().includes('diarrhea') ||
          state.chief_complaint.toLowerCase().includes('stool') ||
          state.chief_complaint.includes('ઝાડા') ||
          state.chief_complaint.includes('ટોઈલતે') ||
          state.chief_complaint.includes('ટોયલેટ') ||
          state.chief_complaint.includes('મોશન') ||
          state.chief_complaint.includes('દસ્ત'))) ||
      state.symptoms.some((s) => {
        const sl = String(s).toLowerCase();
        return (
          sl.includes('diarrhea') ||
          sl.includes('stool') ||
          sl.includes('ઝાડા') ||
          sl.includes('ટોઈલતે') ||
          sl.includes('ટોયલેટ') ||
          sl.includes('મોશન') ||
          sl.includes('દસ્ત')
        );
      });

    if (isDiarrhea) {
      // 1. Frequency / number of episodes
      if (!state.answered_dimensions.includes('frequency')) {
        state.answered_dimensions.push('frequency');
        const q = {
          'en-IN': 'How many episodes or times have you had loose or watery motions today?',
          'hi-IN': 'आज आपको कितनी बार पानी जैसे पतले दस्त या लूज मोशन हुए हैं?',
          'gu-IN': 'આજે તમને કેટલી વાર પાણી જેવી ટોઈલતે કે ઝાડા થયા છે?',
        };
        const chips = {
          'en-IN': ['1 to 2 times', '3 to 5 times', 'More than 5 times', 'Frequent watery motions'],
          'hi-IN': ['1 से 2 बार', '3 से 5 बार', '5 से अधिक बार', 'लगातार पानी जैसे दस्त'],
          'gu-IN': ['૧ થી ૨ વાર', '૩ થી ૫ વાર', '૫ થી વધુ વાર', 'વારંવાર પાણી જેવી ટોઈલતે'],
        };
        return {
          id: 'q_diarrhea_frequency',
          topic: 'frequency',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 2. Hydration status / dizziness / dry mouth
      if (!state.answered_dimensions.includes('hydration_status')) {
        state.answered_dimensions.push('hydration_status');
        const q = {
          'en-IN': 'Are you experiencing extreme thirst, dizziness, dry mouth, or reduced urine output?',
          'hi-IN': 'क्या आपको बहुत ज्यादा प्यास लग रही है, चक्कर आ रहे हैं, मुंह सूख रहा है या पेशाब कम आ रहा है?',
          'gu-IN': 'શું તમને ખૂબ વધારે તરસ લાગે છે, ચક્કર આવે છે, મોં સુકાય છે કે પેશાબ ઓછો થયો છે?',
        };
        const chips = {
          'en-IN': ['Extreme thirst & dizziness', 'Dry mouth only', 'Feeling weak', 'Hydration is normal'],
          'hi-IN': ['बहुत प्यास और चक्कर', 'सिर्फ मुंह सूख रहा है', 'कमजोरी लग रही है', 'डिहाइड्रेशन के कोई लक्षण नहीं'],
          'gu-IN': ['ખૂબ તરસ અને ચક્કર છે', 'માત્ર મોં સુકાય છે', 'નબળાઈ લાગે છે', 'ના, હાઈડ્રેશન સામાન્ય છે'],
        };
        return {
          id: 'q_diarrhea_hydration',
          topic: 'hydration_status',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 3. Stool Blood Check
      const bloodNegated = state.negative_findings.some((n) => n.toLowerCase().includes('blood'));
      if (!state.answered_dimensions.includes('blood_in_stool') && !bloodNegated) {
        state.answered_dimensions.push('blood_in_stool');
        const q = {
          'en-IN': 'Have you noticed any blood, dark black color, or mucus in the stools?',
          'hi-IN': 'क्या दस्त में खून, कालापन या आंव (म्यूकस) आ रहा है?',
          'gu-IN': 'શું ટોઈલતે કે ઝાડામાં લોહી, કાળો રંગ કે ચીકાશ (આમ) જોવા મળ્યું છે?',
        };
        const chips = {
          'en-IN': ['No blood or mucus', 'Blood is present', 'Mucus only', 'Dark black stools'],
          'hi-IN': ['कोई खून नहीं', 'हाँ, खून आ रहा है', 'सिर्फ आंव है', 'काला मल'],
          'gu-IN': ['ના, લોહી કે ચીકાશ નથી', 'હા, લોહી દેખાયું છે', 'માત્ર ચીકાશ છે', 'કાળા રંગની ટોઈલતે'],
        };
        return {
          id: 'q_diarrhea_blood',
          topic: 'blood_in_stool',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }

      // 4. Associated Vomiting / Abdominal Cramps
      if (!state.answered_dimensions.includes('associated_symptoms')) {
        state.answered_dimensions.push('associated_symptoms');
        const q = {
          'en-IN': 'Do you also have severe abdominal cramping, vomiting, or high fever?',
          'hi-IN': 'क्या पेट में मरोड़, उल्टी या तेज बुखार भी है?',
          'gu-IN': 'સાથે પેટમાં ચૂક કે દુખાવો, ઉલટી અથવા તાવ પણ છે?',
        };
        const chips = {
          'en-IN': ['Abdominal cramps present', 'Vomiting present', 'Fever present', 'No other symptoms'],
          'hi-IN': ['पेट में मरोड़ है', 'उल्टी है', 'बुखार है', 'कोई अन्य लक्षण नहीं'],
          'gu-IN': ['પેટમાં ચૂક આવે છે', 'ઉલટી થાય છે', 'તાવ છે', 'ના, માત્ર ઝાડા છે'],
        };
        return {
          id: 'q_diarrhea_associated',
          topic: 'associated_symptoms',
          question: q[langKey] || q['en-IN'],
          quick_chips: chips[langKey] || chips['en-IN'],
          is_complete: false,
        };
      }
    }

    // Check clinical sufficiency before ending
    if (this.isCaseClinicallySufficient(state)) {
      const completedMsg = {
        'en-IN': 'Thank you. Your clinical history has been successfully structured and sent to the physician for review.',
        'hi-IN': 'धन्यवाद। आपकी मेडिकल हिस्ट्री सफलतापूर्वक तैयार कर ली गई है और डॉक्टर की समीक्षा के लिए भेज दी गई है।',
        'gu-IN': 'આભાર. તમારો તબીબી ઈતિહાસ સફળતાપૂર્વક તૈયાર કરી લેવામાં આવ્યો છે અને ડૉક્ટરની સમીક્ષા માટે મોકલી આપ્યો છે.',
      };

      return {
        id: 'q_completed',
        topic: 'completed',
        question: completedMsg[langKey] || completedMsg['en-IN'],
        quick_chips: [],
        is_complete: true,
      };
    }

    // Safe contextual fallback question (avoid repeating if already asked!)
    const fallbackQ = {
      'en-IN': 'Are there any other symptoms or past health conditions you would like the doctor to know about?',
      'hi-IN': 'क्या कोई अन्य लक्षण या पुरानी बीमारी है जिसके बारे में आप डॉक्टर को बताना चाहते हैं?',
      'gu-IN': 'શું તમને આ ઉપરાંત કોઈ અન્ય તકલીફ કે જૂની બીમારી છે જેના વિશે તમે ડૉક્ટરને જણાવવા માંગો છો?',
    };
    const fallbackChips = {
      'en-IN': ['No other symptoms', 'Have Diabetes / BP', 'Feeling weak'],
      'hi-IN': ['कोई अन्य लक्षण नहीं', 'डायबिटीज / बीपी है', 'कमजोरी लग रही है'],
      'gu-IN': ['ના, કોઈ અન્ય લક્ષણ નથી', 'ડાયાબિટીસ / બીપી છે', 'નબળાઈ લાગે છે'],
    };

    const candidateFallback = fallbackQ[langKey] || fallbackQ['en-IN'];

    // If fallback was already asked, finalize case to prevent infinite loops!
    if (this.isQuestionAlreadyAsked(candidateFallback, state)) {
      const completedMsg = {
        'en-IN': 'Thank you. Your clinical history has been successfully structured and sent to the physician for review.',
        'hi-IN': 'धन्यवाद। आपकी मेडिकल हिस्ट्री सफलतापूर्वक तैयार कर ली गई है और डॉक्टर की समीक्षा के लिए भेज दी गई है।',
        'gu-IN': 'આભાર. તમારો તબીબી ઈતિહાસ સફળતાપૂર્વક તૈયાર કરી લેવામાં આવ્યો છે અને ડૉક્ટરની સમીક્ષા માટે મોકલી આપ્યો છે.',
      };
      return {
        id: 'q_completed_fallback',
        topic: 'completed',
        question: completedMsg[langKey] || completedMsg['en-IN'],
        quick_chips: [],
        is_complete: true,
      };
    }

    return {
      id: 'q_fallback_general',
      topic: 'fallback_general',
      question: candidateFallback,
      quick_chips: fallbackChips[langKey] || fallbackChips['en-IN'],
      is_complete: false,
    };
  }

  /**
   * Live AI / n8n Workflow Reasoning Engine
   * Dynamically thinks using n8n workflow or LLM for complex colloquial complaints
   */
  async thinkWithLiveAI({
    patientText,
    state,
    language = 'English',
    conversationHistory = [],
    opdMode = 'GENERAL',
  }) {
    // 1. Try n8n Intake Webhook (Active Workflow Orchestration)
    const n8nWebhook = process.env.N8N_INTAKE_WEBHOOK || process.env.N8N_WORKFLOW_URL;
    if (n8nWebhook && !n8nWebhook.includes('localhost:5678')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_message: patientText,
            message: patientText,
            language,
            opd_mode: opdMode,
            clinical_state: state,
            conversation_history: (conversationHistory || []).slice(-5),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const n8nData = await res.json();
          logger.info('[IntakeService n8n Webhook Success]: Received active workflow response');
          return {
            source: 'n8n_flow',
            chief_complaint: n8nData.chief_complaint || null,
            symptoms: Array.isArray(n8nData.symptoms) ? n8nData.symptoms : [],
            duration: n8nData.duration || null,
            advice: n8nData.advice || n8nData.guidance || null,
            next_question: n8nData.next_question || n8nData.question || null,
            quick_chips: Array.isArray(n8nData.quick_chips) ? n8nData.quick_chips : [],
            is_complete: Boolean(n8nData.is_complete || n8nData.history_complete),
          };
        }
      } catch (err) {
        logger.warn(`[IntakeService n8n Webhook Notice]: ${err.message}`);
      }
    }

    // 2. Try Direct Groq Multi-Model Reasoning if API key is provided
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const groqPrompt = `You are a clinical intake assistant for a clinic kiosk.
Patient input (${language}): "${patientText}"
Current symptoms: ${JSON.stringify(state.symptoms || [])}
Chief complaint: "${state.chief_complaint || 'None'}"

Extract clinical entities in JSON:
{
  "chief_complaint": "English medical term or null",
  "symptoms": ["list of recognized symptoms"],
  "duration": "duration if mentioned or null",
  "advice": "Empathetic medical advice or first-aid if patient asked 'what should I do / હવે હું સુ કરું' or null",
  "next_question": "Single next adaptive question in ${language} or null"
}`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: groqPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (groqRes.ok) {
          const gData = await groqRes.json();
          const parsed = JSON.parse(gData.choices?.[0]?.message?.content || '{}');
          return {
            source: 'groq_ai',
            chief_complaint: parsed.chief_complaint || null,
            symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
            duration: parsed.duration || null,
            advice: parsed.advice || null,
            next_question: parsed.next_question || null,
            quick_chips: [],
            is_complete: false,
          };
        }
      } catch (err) {
        logger.warn(`[IntakeService Groq Notice]: ${err.message}`);
      }
    }

    return null;
  }

  /**
   * Main Turn Processor: Orchestrates the complete stateful clinical reasoning loop
   */
  async processIntakeTurn({
    session_id,
    patient_id,
    patient_answer = '',
    message = '',
    message_id = null,
    turn_id = null,
    language = 'English',
    opd_mode = 'GENERAL',
    current_clinical_state = {},
    conversation_history = [],
  }) {
    const patientText = (patient_answer || message || '').trim();
    if (!patientText) {
      throw new Error('Patient input text is required.');
    }

    // 1. IDEMPOTENCY CHECK: Suppress duplicate network requests or double-clicks
    const idempotencyKey = message_id || (session_id && turn_id ? `${session_id}_${turn_id}` : null);
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      logger.info(`[IntakeService Idempotency Hit]: Returning stored response for key ${idempotencyKey}`);
      return idempotencyCache.get(idempotencyKey).data;
    }

    const langKey = language.toLowerCase().startsWith('gu')
      ? 'gu-IN'
      : language.toLowerCase().startsWith('hi')
      ? 'hi-IN'
      : 'en-IN';

    // 2. Initialize and normalize persistent clinical state
    let state = this.normalizeClinicalState(current_clinical_state);
    state.turn_count = (state.turn_count || 0) + 1;
    state.session_version = (state.session_version || 1) + 1;

    // 3. Classify Patient Intent
    const patientIntent = this.detectPatientIntent(patientText);

    // 4. Process Contextual Answers (matching negative/affirmative answers to current_question)
    this.processContextualAnswer(state, patientText);

    // 5. Extract Clinical Facts / Entities
    const extracted = this.extractEntitiesFromText(patientText, state);
    state = this.updateClinicalState(state, extracted, patientIntent);

    // 5b. Live AI / n8n Workflow Enhancement (Thinks dynamically using n8n or LLM)
    let liveAiResult = null;
    try {
      liveAiResult = await this.thinkWithLiveAI({
        patientText,
        state,
        language,
        conversationHistory: conversation_history,
        opdMode: opd_mode,
      });

      if (liveAiResult) {
        if (liveAiResult.chief_complaint && !state.chief_complaint) {
          state.chief_complaint = liveAiResult.chief_complaint;
        }
        if (Array.isArray(liveAiResult.symptoms)) {
          for (const s of liveAiResult.symptoms) {
            if (!state.symptoms.includes(s)) state.symptoms.push(s);
          }
        }
        if (liveAiResult.duration && !state.duration) {
          state.duration = liveAiResult.duration;
          state.answered_dimensions.push('duration');
        }
      }
    } catch (aiErr) {
      logger.warn(`[IntakeService Live AI Error]: ${aiErr.message}`);
    }

    // 6. Contextual Red Flag & Triage Check
    const triageResult = this.evaluateRedFlagAndTriage(patientText, state);
    state.risk_level = triageResult.triage_level;

    // Immediate emergency escalation
    if (triageResult.detected && triageResult.triage_level === 'EMERGENCY') {
      const emergencyWarning = triageResult.patient_instruction[langKey] || triageResult.patient_instruction['en-IN'];
      state.risk_level = 'EMERGENCY';
      state.red_flags.push(triageResult.category);

      if (session_id && !session_id.startsWith('session-') && !session_id.startsWith('demo-') && !session_id.startsWith('test-') && !session_id.startsWith('test_')) {
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

      const emergencyResponse = {
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
          location: state.body_site,
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

      if (idempotencyKey) {
        idempotencyCache.set(idempotencyKey, { timestamp: Date.now(), data: emergencyResponse });
      }
      return emergencyResponse;
    }

    // 7. Query Infermedica reference when symptoms are present
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

    // 8. Address Patient Intent First (if patient asked a question or advice)
    const directAnswer = (liveAiResult && liveAiResult.advice)
      ? liveAiResult.advice
      : this.generateIntentDirectAnswer(patientIntent, state, langKey);

    // 9. Select Single Next Adaptive Question (with Question Deduplication)
    const nextQuestionResult = this.selectNextAdaptiveQuestion(state, langKey, opd_mode);

    // Set new current_question if not completed
    if (!nextQuestionResult.is_complete) {
      state.current_question = {
        id: nextQuestionResult.id || `q_${Date.now()}`,
        topic: nextQuestionResult.topic || 'general',
        text: nextQuestionResult.question,
        status: 'ASKED',
        asked_at: new Date().toISOString(),
      };
      state.next_question = nextQuestionResult.question;
    } else {
      state.current_question = null;
      state.next_question = '';
    }

    let finalAssistantMessage = '';
    if (directAnswer) {
      finalAssistantMessage = nextQuestionResult.is_complete
        ? directAnswer
        : `${directAnswer} ${nextQuestionResult.question}`;
    } else {
      finalAssistantMessage = nextQuestionResult.question;
    }

    // 10. Determine Session Status
    let sessionStatus = 'IN_PROGRESS';
    if (triageResult.priority === 'HIGH') {
      sessionStatus = 'PRIORITY_TRIAGE';
    } else if (nextQuestionResult.is_complete) {
      sessionStatus = 'READY_FOR_SUMMARY';
    }

    // 11. Persist Turn to CaseMessage, Observations, and ClinicalSession
    if (session_id && !session_id.startsWith('session-') && !session_id.startsWith('demo-') && !session_id.startsWith('test-') && !session_id.startsWith('test_')) {
      try {
        await caseMessageRepository.create({
          session_id,
          sender: 'PATIENT',
          message: patientText,
          message_type: 'TEXT',
        });

        await caseMessageRepository.create({
          session_id,
          sender: 'AI',
          message: finalAssistantMessage,
          message_type: 'TEXT',
          metadata: { intent: patientIntent, triage_level: triageResult.triage_level },
        });

        if (extracted.chief_complaint || extracted.symptoms.length > 0) {
          const symptomName = extracted.chief_complaint || extracted.symptoms[0];
          await observationRepository.create({
            session_id,
            category: 'SYMPTOM',
            name: symptomName,
            value: [extracted.onset, extracted.severity, extracted.duration].filter(Boolean).join(', ') || 'Reported',
            confidence: 0.92,
            source: 'PATIENT_REPORTED',
          });
        }

        await sessionRepository.updateStatus(
          session_id,
          nextQuestionResult.is_complete ? 'READY_FOR_DOCTOR' : sessionStatus,
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

    const responsePayload = {
      success: true,
      message_id: message_id || `msg_res_${Date.now()}`,
      turn_id: turn_id || `turn_${state.turn_count}`,
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
      doctor_review_required: nextQuestionResult.is_complete || triageResult.detected,
      session_status: sessionStatus,
    };

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { timestamp: Date.now(), data: responsePayload });
    }

    return responsePayload;
  }
}

export const intakeService = new IntakeService();
export default intakeService;
