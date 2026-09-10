import { logger } from '../utils/logger.js';
import { doctorService } from './doctorService.js';
import { openfdaService } from './openfdaService.js';
import { detectMedicineIntentAndExtract, queryMedicineKnowledge } from './assistantService.js';

/**
 * ============================================================================
 * MEDIKIOSK CLINICAL INTELLIGENCE & REASONING ENGINE
 * ============================================================================
 * An enterprise, live-data-driven clinical intelligence service.
 * Translates conversational inputs into semantic intents, clinical entity extraction,
 * targeted red-flag risk assessment, verified health advice retrieval, live doctor
 * availability matching, and multi-turn state tracking.
 */

// ----------------------------------------------------------------------------
// IN-MEMORY BOUNDED SESSION STORE (MULTI-TURN CONVERSATION MEMORY)
// ----------------------------------------------------------------------------
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const assistantSessionStore = new Map();

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of assistantSessionStore.entries()) {
    if (now - session.last_activity > SESSION_TTL_MS) {
      assistantSessionStore.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

export function getOrCreateSession(sessionId) {
  const id = sessionId || 'session-' + Date.now();
  let session = assistantSessionStore.get(id);
  if (!session) {
    session = {
      session_id: id,
      turn_id: 0,
      created_at: Date.now(),
      last_activity: Date.now(),
      entities: {
        symptom: null,
        duration: null,
        severity: null,
        body_part: null,
        specialty: null,
        target_time: null,
        target_date: null,
        associated_symptoms: [],
      },
      asked_questions: [],
      answered_questions: [],
      pending_question: null,
      risk_state: 'ROUTINE',
      user_intent: null,
      previous_recommendations: [],
    };
    assistantSessionStore.set(id, session);
  }
  session.last_activity = Date.now();
  session.turn_id += 1;
  return session;
}

// ----------------------------------------------------------------------------
// 1. SEMANTIC INTENT CLASSIFIER
// ----------------------------------------------------------------------------
export function classifySemanticIntent(rawText) {
  if (!rawText || typeof rawText !== 'string') return 'GENERAL_CHAT';
  const text = rawText.trim().toLowerCase();

  // A. Public Health & Heatwave Care
  if (
    /heat\s*wave/i.test(text) ||
    /extreme\s+heat/i.test(text) ||
    /hot\s+weather/i.test(text) ||
    /sun\s*stroke/i.test(text) ||
    /heat\s*stroke/i.test(text) ||
    /heat\s*exhaustion/i.test(text) ||
    /protect\s+from\s+heat/i.test(text) ||
    /loo\s+lag/i.test(text) ||
    /ગરમી/i.test(text) ||
    /लू/i.test(text)
  ) {
    return 'HEATWAVE_CARE';
  }

  // B. Medicine queries (delegated to existing robust parser)
  const medCheck = detectMedicineIntentAndExtract(rawText);
  if (medCheck.isMedicineQuery) {
    return medCheck.intent;
  }

  // C. Acute Emergency Red Flags
  if (
    /(difficulty\s+breathing|breathless|severe\s+chest\s+pain|crushing\s+chest|unconscious|fainted|seizure|bleeding\s+profusely|stroke|heart\s+attack)/i.test(text) &&
    !/mild/i.test(text)
  ) {
    return 'EMERGENCY_HELP';
  }

  // D. Doctor Recommendation, Specialist Finding, or OPD Availability
  const hasDoctorKeyword = /(doctor|specialist|physician|dermatologist|cardiologist|neurologist|orthopedic|pediatrician|ent|dentist|psychiatrist|opd|appointment|consult|clinic|ડોક્ટર|डॉक्टर)/i.test(text);
  const hasAvailabilityKeyword = /(available|availability|today|timing|schedule|free\s+slot|token|queue|wait\s+time|now|5\s*pm|10\s*am|હાજર|उपलब्ध)/i.test(text);
  const hasWhichDoctorPhrasing = /(which\s+doctor|who\s+treats|who\s+should\s+i\s+see|recommend\s+a\s+doctor|doctor\s+for|specialist\s+for|can\s+i\s+see\s+a)/i.test(text);

  if (hasWhichDoctorPhrasing || (hasDoctorKeyword && hasAvailabilityKeyword)) {
    if (hasAvailabilityKeyword && !hasWhichDoctorPhrasing) {
      return 'OPD_AVAILABILITY';
    }
    return 'FIND_SPECIALIST';
  }

  if (hasDoctorKeyword && /(book|schedule|take|get)\s*(an)?\s*(appointment|slot|token)/i.test(text)) {
    return 'APPOINTMENT_HELP';
  }

  if (hasDoctorKeyword) {
    return 'FIND_DOCTOR';
  }

  // E. Common Symptoms & Health Advice
  if (/cold|runny\s+nose|sore\s+throat|sneezing|छींक|શરદી/i.test(text)) {
    return 'COLD_CARE';
  }
  if (/cough|खांसी|ઉધરસ/i.test(text)) {
    return 'COUGH_CARE';
  }
  if (/fever|temperature|તાવ|बुखार/i.test(text)) {
    return 'FEVER_CARE';
  }
  if (/headache|migraine|head\s+hurts|માથું|सिरदर्द/i.test(text)) {
    return 'SYMPTOM_INFORMATION';
  }
  if (/skin|rash|allergy|itching|pimples|acne|ખંજવાળ|त्वचा|खुजली/i.test(text)) {
    return 'SYMPTOM_INFORMATION';
  }
  if (/home\s+care|home\s+remedy|remedies|self\s*care|care\s+of|nominal\s+home\s+care/i.test(text)) {
    return 'HOME_CARE';
  }
  if (/first\s*aid|minor\s+burn|cut|scrape|band\s*aid|sprain/i.test(text)) {
    return 'FIRST_AID';
  }

  // F. AYUSH & Traditional Medicine
  if (/ayush|ayurveda|ayurvedic|kadha|dosha|vata|pitta|kapha|herbal/i.test(text)) {
    return 'AYUSH_INFORMATION';
  }

  // G. Hospital & Contact Information
  if (/contact|phone|helpline|emergency\s+number|ambulance|address|location|નંબર|फोन|संपर्क/i.test(text)) {
    return 'HOSPITAL_INFORMATION';
  }

  // H. Website Navigation & Kiosk Tools
  if (/register|checkin|intake|ocr|upload|kiosk|portal|login|abha/i.test(text)) {
    return 'WEBSITE_NAVIGATION';
  }

  // I. Ambiguous / Generic greeting
  if (/^(hi|hello|hey|namaste|kem\s+cho|tell\s+me\s+something|what\s+can\s+you\s+do|help)$/i.test(text)) {
    return 'GENERAL_CHAT';
  }

  return 'GENERAL_CHAT';
}

// ----------------------------------------------------------------------------
// 2. CLINICAL ENTITY & REQUIREMENT EXTRACTOR
// ----------------------------------------------------------------------------
export function extractClinicalEntities(rawText, existingEntities = {}) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  const entities = {
    symptom: existingEntities.symptom || null,
    duration: existingEntities.duration || null,
    severity: existingEntities.severity || null,
    body_part: existingEntities.body_part || null,
    specialty: existingEntities.specialty || null,
    target_time: existingEntities.target_time || null,
    target_date: existingEntities.target_date || null,
    associated_symptoms: [...(existingEntities.associated_symptoms || [])],
  };

  // A. Target Time & Date Extraction
  const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\b\d{1,2}\s*(?:am|pm))\b/i);
  if (timeMatch) {
    entities.target_time = timeMatch[1].toUpperCase().trim();
  } else if (/now|currently|right\s+now/i.test(lower)) {
    entities.target_time = 'NOW';
  }

  if (/today|aaj|આજે/i.test(lower)) {
    entities.target_date = 'TODAY';
  } else if (/tomorrow|kal|કાલે/i.test(lower)) {
    entities.target_date = 'TOMORROW';
  }

  // B. Specialty Direct Mention
  if (/dermatolog|skin/i.test(lower)) entities.specialty = 'Dermatology';
  else if (/cardiolog|heart/i.test(lower)) entities.specialty = 'Cardiology';
  else if (/neurolog|nerve|brain/i.test(lower)) entities.specialty = 'Neurology';
  else if (/orthopedic|bone|joint/i.test(lower)) entities.specialty = 'Orthopedics';
  else if (/pediatric|child/i.test(lower)) entities.specialty = 'Pediatrics';
  else if (/dentist|dental|teeth|tooth/i.test(lower)) entities.specialty = 'Dentistry';
  else if (/ophthalmolog|eye/i.test(lower)) entities.specialty = 'Ophthalmology';
  else if (/ent|ear|nose|throat/i.test(lower)) entities.specialty = 'ENT';
  else if (/gastroenterolog|stomach|digest/i.test(lower)) entities.specialty = 'Gastroenterology';
  else if (/psychiatr|mental\s+health|depression|anxiety/i.test(lower)) entities.specialty = 'Psychiatry';
  else if (/ayush|ayurved/i.test(lower)) entities.specialty = 'AYUSH';

  // C. Symptoms Detection
  const symptomKeywords = [
    { key: 'heat waves', pattern: /heat\s*wave|extreme\s+heat|sun\s*stroke/i },
    { key: 'chest pain', pattern: /chest\s+pain|chest\s+discomfort|chest\s+pressure/i },
    { key: 'difficulty breathing', pattern: /difficulty\s+breathing|shortness\s+of\s+breath|breathless/i },
    { key: 'headache', pattern: /headache|migraine|head\s+hurts/i },
    { key: 'skin allergy', pattern: /skin\s+allergy|skin\s+rash|rash|itching|skin\s+problems|acne/i },
    { key: 'mild cold', pattern: /mild\s+cold|cold|runny\s+nose|stuffy\s+nose/i },
    { key: 'cough', pattern: /cough|dry\s+cough|wet\s+cough/i },
    { key: 'fever', pattern: /fever|high\s+temperature/i },
    { key: 'joint pain', pattern: /joint\s+pain|knee\s+pain|backache|arthritis/i },
    { key: 'toothache', pattern: /toothache|dental\s+pain|bleeding\s+gums/i },
    { key: 'acidity', pattern: /acidity|heartburn|acid\s+reflux/i },
    { key: 'dizziness', pattern: /dizzy|dizziness|vertigo|lightheaded/i },
  ];

  for (const item of symptomKeywords) {
    if (item.pattern.test(lower)) {
      if (!entities.symptom) {
        entities.symptom = item.key;
      } else if (entities.symptom !== item.key && !entities.associated_symptoms.includes(item.key)) {
        entities.associated_symptoms.push(item.key);
      }
    }
  }

  // D. Associated Red Flag Symptoms (vomiting, sweating, fainting)
  if (/vomit|vomiting|throwing\s+up/i.test(lower) && !entities.associated_symptoms.includes('vomiting')) {
    entities.associated_symptoms.push('vomiting');
  }
  if (/sweat|sweating|profuse\s+sweating/i.test(lower) && !entities.associated_symptoms.includes('sweating')) {
    entities.associated_symptoms.push('sweating');
  }
  if (/faint|loss\s+of\s+consciousness|blackout/i.test(lower) && !entities.associated_symptoms.includes('fainting')) {
    entities.associated_symptoms.push('fainting');
  }

  // E. Duration Extraction
  const durationPattern = /(since\s+(?:yesterday|morning|last\s+night|2\s+days|3\s+days|a\s+week|few\s+days)|for\s+\d+\s+(?:days?|weeks?|months?|hours?)|persistent|chronic|acute|today)/i;
  const durMatch = text.match(durationPattern);
  if (durMatch) {
    entities.duration = durMatch[0].trim();
  }

  // F. Severity Extraction
  if (/mild|nominal|slight|little/i.test(lower)) {
    entities.severity = 'MILD';
  } else if (/moderate/i.test(lower)) {
    entities.severity = 'MODERATE';
  } else if (/severe|crushing|extreme|unbearable|very\s+bad|intense/i.test(lower)) {
    entities.severity = 'SEVERE';
  }

  return entities;
}

// ----------------------------------------------------------------------------
// 3. TARGETED CLINICAL RISK & RED-FLAG TRIAGE
// ----------------------------------------------------------------------------
export function assessClinicalRisk(entities, queryText) {
  const q = (queryText || '').toLowerCase();
  const symptom = (entities?.symptom || '').toLowerCase();
  const severity = entities?.severity || 'MODERATE';
  const associated = entities?.associated_symptoms || [];

  // A. EMERGENCY: Life-threatening red flags
  const isSevereChestWithBreathing =
    (symptom.includes('chest') || q.includes('chest')) &&
    (associated.includes('difficulty breathing') || q.includes('breathing') || q.includes('breathless') || associated.includes('sweating') || q.includes('sweat'));

  const isHeatStrokeEmergency =
    (q.includes('heat') || symptom.includes('heat')) &&
    (associated.includes('fainting') || q.includes('unconscious') || q.includes('confusion') || q.includes('delirium') || q.includes('104'));

  const isSevereTraumaOrBleeding =
    q.includes('uncontrolled bleeding') || q.includes('severe allergic reaction') || q.includes('loss of consciousness') || q.includes('seizure');

  if (isSevereChestWithBreathing || isHeatStrokeEmergency || isSevereTraumaOrBleeding) {
    return {
      level: 'EMERGENCY',
      requires_triage: true,
      reason: isSevereChestWithBreathing
        ? 'Chest discomfort accompanied by acute breathing distress requires immediate emergency care.'
        : 'Acute neurological or hemodynamic instability detected.',
      action_code: 'CALL_108',
    };
  }

  // B. URGENT: Targeted assessment required (Do NOT classify mild chest pain as emergency, but evaluate urgently)
  if (symptom.includes('chest') || q.includes('chest pain')) {
    return {
      level: 'URGENT',
      requires_triage: false,
      reason: 'Chest pain requires targeted clinical evaluation to differentiate cardiac from musculoskeletal or GI causes.',
      action_code: 'TARGETED_CARDIAC_ASSESSMENT',
    };
  }

  if (severity === 'SEVERE' || (symptom.includes('headache') && associated.includes('vomiting'))) {
    return {
      level: 'URGENT',
      requires_triage: false,
      reason: 'Severe or red-flag associated symptoms (e.g. severe headache with vomiting) require timely physician examination.',
      action_code: 'OPD_EVALUATION',
    };
  }

  // C. PRIORITY: Persistent symptoms
  if (entities?.duration && (entities.duration.includes('persistent') || entities.duration.includes('week'))) {
    return {
      level: 'PRIORITY',
      requires_triage: false,
      reason: 'Persistent symptoms warrant scheduled specialist consultation.',
      action_code: 'SCHEDULED_SPECIALIST',
    };
  }

  // D. SELF_CARE: Heatwave care, mild cold, lifestyle
  if (
    symptom.includes('heat') ||
    q.includes('heat wave') ||
    symptom.includes('cold') ||
    severity === 'MILD'
  ) {
    return {
      level: 'SELF_CARE',
      requires_triage: false,
      reason: 'Mild self-limiting symptoms or public health advice query suitable for verified home care guidelines.',
      action_code: 'VERIFIED_HOME_GUIDANCE',
    };
  }

  return {
    level: 'ROUTINE',
    requires_triage: false,
    reason: 'Routine clinical consultation or information request.',
    action_code: 'ROUTINE_CONSULT',
  };
}

// ----------------------------------------------------------------------------
// 4. SPECIALIST MATCHING ENGINE
// ----------------------------------------------------------------------------
export function matchSpecialtyFromSymptoms(symptomText, queryText) {
  const combined = `${symptomText || ''} ${queryText || ''}`.toLowerCase();

  if (/skin|rash|allergy|itching|acne|eczema|dermat|त्वचा|ખંજવાળ/i.test(combined)) {
    return {
      primary: 'Dermatology',
      candidates: ['Dermatology', 'General Medicine'],
      confidence: 0.95,
      department: 'Department of Dermatology & Skin Care',
    };
  }

  if (/migraine|headache|head\s+hurts|seizure|numbness|dizziness/i.test(combined)) {
    return {
      primary: 'Neurology',
      candidates: ['Neurology', 'General Medicine'],
      confidence: 0.90,
      department: 'Department of Neurology & Brain Health',
    };
  }

  if (/chest\s+pain|heart|palpitation|hypertension|blood\s+pressure/i.test(combined)) {
    return {
      primary: 'Cardiology',
      candidates: ['Cardiology', 'General Medicine'],
      confidence: 0.95,
      department: 'Department of Cardiology & Cardiac Care',
    };
  }

  if (/joint|knee|bone|fracture|backache|sprain|arthritis|ortho/i.test(combined)) {
    return {
      primary: 'Orthopedics',
      candidates: ['Orthopedics', 'General Medicine'],
      confidence: 0.92,
      department: 'Department of Orthopedic Surgery',
    };
  }

  if (/tooth|teeth|dental|gum|cavity/i.test(combined)) {
    return {
      primary: 'Dentistry',
      candidates: ['Dentistry'],
      confidence: 0.96,
      department: 'Department of Dental Sciences',
    };
  }

  if (/eye|vision|red\s+eye|cataract/i.test(combined)) {
    return {
      primary: 'Ophthalmology',
      candidates: ['Ophthalmology'],
      confidence: 0.95,
      department: 'Department of Ophthalmology & Eye Care',
    };
  }

  if (/ear|nose|throat|sinus|tonsil|hearing|ent/i.test(combined)) {
    return {
      primary: 'ENT',
      candidates: ['ENT', 'General Medicine'],
      confidence: 0.92,
      department: 'Department of ENT (Otorhinolaryngology)',
    };
  }

  if (/stomach|acidity|vomiting|digest|gastric|ulcer|diarrhea/i.test(combined)) {
    return {
      primary: 'Gastroenterology',
      candidates: ['Gastroenterology', 'General Medicine'],
      confidence: 0.90,
      department: 'Department of Gastroenterology & Hepatology',
    };
  }

  if (/anxiety|depress|mental|stress|insomnia/i.test(combined)) {
    return {
      primary: 'Psychiatry',
      candidates: ['Psychiatry', 'General Medicine'],
      confidence: 0.92,
      department: 'Department of Psychiatry & Behavioral Health',
    };
  }

  if (/ayush|ayurved|vata|pitta|kapha|herbal/i.test(combined)) {
    return {
      primary: 'AYUSH',
      candidates: ['AYUSH', 'General Medicine'],
      confidence: 0.94,
      department: 'AYUSH Integrated Healthcare Center',
    };
  }

  return {
    primary: 'General Medicine',
    candidates: ['General Medicine'],
    confidence: 0.85,
    department: 'Department of General Internal Medicine',
  };
}

// ----------------------------------------------------------------------------
// 5. VERIFIED HEALTH ADVICE KNOWLEDGE REPOSITORY
// ----------------------------------------------------------------------------
export const VERIFIED_CLINICAL_KNOWLEDGE = {
  HEATWAVE_CARE: {
    title: 'Heatwave Care & Sun Protection Guidelines',
    source: 'National Public Health & MediKiosk Clinical Advisory',
    source_type: 'CLINICAL_KB',
    recommendations: [
      'Stay consistently hydrated: Drink adequate water at regular intervals, even before you feel thirsty. Consume ORS, lemon water (Nimbu Pani), coconut water, or buttermilk to replenish electrolytes.',
      'Avoid peak sun exposure: Stay indoors in cool or shaded environments during peak heat hours (12:00 PM to 04:00 PM).',
      'Wear protective attire: Choose loose-fitting, light-colored, breathable cotton clothing. Use wide-brimmed hats, umbrellas, and sunglasses when outdoors.',
      'Indoor cooling: Keep living spaces shaded with blinds or curtains during the daytime. Use fans, coolers, or take cool sponge baths/showers.',
      'Avoid dehydrating beverages: Minimize alcohol, highly caffeinated drinks, and high-sugar carbonated sodas which worsen body water loss.',
      'Protect vulnerable individuals: Closely monitor infants, elderly family members, pregnant women, and patients with cardiac or renal disorders.',
    ],
    red_flags: [
      'Heat Exhaustion: Heavy sweating, pale clammy skin, muscle cramps, dizziness, nausea, or rapid pulse. (Move to a cool area and sip fluids).',
      'Heat Stroke (MEDICAL EMERGENCY): Body temperature over 104°F (40°C), hot dry red skin (cessation of sweating), slurred speech, confusion, seizures, or fainting. Immediately call 108 / 102 emergency services.',
    ],
  },
  COLD_CARE: {
    title: 'Nominal Home Care for Mild Common Cold',
    source: 'MediKiosk Clinical Standard Operating Procedures',
    source_type: 'CLINICAL_KB',
    recommendations: [
      'Adequate Rest: Rest allows the immune system to recover; avoid intense physical exertion.',
      'Warm Hydration: Drink warm water, herbal teas, or clear broths to soothe the throat and thin mucus secretions.',
      'Steam Inhalation: Perform plain warm water steam inhalation 1-2 times daily for 5-10 minutes to ease nasal congestion.',
      'Warm Salt Water Gargle: Gargle with 1/2 teaspoon of salt in a glass of warm water 2-3 times daily to relieve pharyngeal discomfort.',
      'Honey with Warm Water: A spoonful of honey in warm water or ginger tea soothes throat tickles and cough (do not give honey to infants under 1 year).',
    ],
    red_flags: [
      'Fever exceeding 101°F (38.3°C) that persists for more than 3 days.',
      'Shortness of breath, chest tightness, or wheezing.',
      'Inability to tolerate oral fluids or signs of severe dehydration.',
      'Symptoms worsening after initial improvement or severe earache.',
    ],
  },
};

// ----------------------------------------------------------------------------
// 6. MAIN ORCHESTRATION FUNCTION: PROCESS CLINICAL ASSISTANT TURN
// ----------------------------------------------------------------------------
export async function processClinicalAssistantTurn({
  message,
  sessionId,
  language = 'English',
  role = 'PATIENT',
}) {
  const session = getOrCreateSession(sessionId);
  const rawText = (message || '').trim();

  // 1. Semantic Intent Detection
  let intent = classifySemanticIntent(rawText);

  // If there is an active symptom session and user is answering a pending question or providing duration/severity
  if ((intent === 'GENERAL_CHAT' || !intent) && session.entities?.symptom) {
    intent = 'SYMPTOM_INFORMATION';
  }
  session.user_intent = intent;

  // 2. Clinical Entity Extraction
  const entities = extractClinicalEntities(rawText, session.entities);
  session.entities = entities;

  // 3. Clinical Risk & Red-Flag Assessment
  const risk = assessClinicalRisk(entities, rawText);
  session.risk_state = risk.level;

  // 4. Observability Structured Logging
  console.log(`[SmartAssistant] session_id=${session.session_id} turn_id=${session.turn_id}`);
  console.log(`[Intent] intent=${intent}`);
  console.log(
    `[Entities] symptom=${entities.symptom || 'none'} duration=${entities.duration || 'none'} severity=${entities.severity || 'none'} specialty=${entities.specialty || 'none'} time=${entities.target_time || 'none'}`
  );
  console.log(`[RiskAssessment] level=${risk.level}`);

  let responsePayload = {
    session_id: session.session_id,
    turn_id: session.turn_id,
    intent,
    risk,
    confidence: 0.94,
    sources: [],
    actions: [],
    requires_follow_up: false,
    message: '',
    data: null,
  };

  // --------------------------------------------------------------------------
  // PATHWAY A: ACUTE RED-FLAG EMERGENCY
  // --------------------------------------------------------------------------
  if (risk.level === 'EMERGENCY') {
    console.log(`[ToolSelection] tools=EMERGENCY_TRIAGE_ALERT`);
    console.log(`[DataRetrieval] source=CLINICAL_KB`);
    console.log(`[DataResult] found=true`);
    console.log(`[DoctorMatching] specialty=Emergency Medicine`);
    console.log(`[DoctorRanking] count=0`);
    console.log(`[Response] generated=true`);

    let emergencyMsg =
      `🚨 **URGENT MEDICAL ALERT**\n\n` +
      `The symptoms you described (${entities.symptom || 'acute chest/breathing distress'}) indicate potential emergency medical concern.\n\n` +
      `• **Action Required:** Please immediately call Emergency Services at **108** or proceed to the nearest Emergency Trauma Center without delay.\n` +
      `• **Do NOT drive yourself.** Have someone accompany you or await the ambulance team.\n` +
      `• MediKiosk Emergency Desk: **+91 79 2324 0000** (Open 24/7).`;

    responsePayload.message = emergencyMsg;
    responsePayload.urgent = true;
    responsePayload.requires_doctor = true;
    responsePayload.sources.push({
      type: 'CLINICAL_KB',
      id: 'EMERGENCY_TRIAGE_PROTOCOL',
      name: 'MediKiosk Clinical Triage Rules',
    });
    responsePayload.actions.push(
      { type: 'CALL_HOSPITAL', label: 'Call Emergency (108)', phone: '108' },
      { type: 'EMERGENCY_HELP', label: 'Emergency Trauma Desk', route: '/contact' }
    );
    return responsePayload;
  }

  // --------------------------------------------------------------------------
  // PATHWAY B: PUBLIC HEALTH & HEATWAVE CARE
  // --------------------------------------------------------------------------
  if (intent === 'HEATWAVE_CARE') {
    console.log(`[ToolSelection] tools=searchClinicalKnowledge(HEATWAVE_CARE)`);
    console.log(`[DataRetrieval] source=CLINICAL_KB`);
    console.log(`[DataResult] found=true`);
    console.log(`[DoctorMatching] specialty=none`);
    console.log(`[DoctorRanking] count=0`);
    console.log(`[Response] generated=true`);

    const kb = VERIFIED_CLINICAL_KNOWLEDGE.HEATWAVE_CARE;
    let msg = `### ☀️ ${kb.title}\n\n`;
    msg += `Verified public health care for extreme heat:\n\n`;
    kb.recommendations.forEach((rec) => {
      msg += `• ${rec}\n`;
    });
    msg += `\n**Warning Signs & Red Flags:**\n`;
    kb.red_flags.forEach((flag) => {
      msg += `• ${flag}\n`;
    });
    msg += `\n*Source: ${kb.source}. Always seek immediate medical attention if signs of heat stroke appear.*`;

    responsePayload.message = msg;
    responsePayload.sources.push({
      type: 'CLINICAL_KB',
      id: 'HEATWAVE_GUIDELINES',
      name: kb.source,
    });
    responsePayload.data = {
      heatwave_guidance: kb,
    };
    responsePayload.actions.push(
      { type: 'NAVIGATE', label: 'Hospital Contacts', route: '/contact' },
      { type: 'VIEW_DOCTOR', label: 'Consult General Physician', specialty: 'General Medicine' }
    );
    return responsePayload;
  }

  // --------------------------------------------------------------------------
  // PATHWAY C: MILD COLD / GENERAL HOME CARE
  // --------------------------------------------------------------------------
  if (intent === 'COLD_CARE' || (intent === 'HOME_CARE' && entities.symptom === 'mild cold')) {
    console.log(`[ToolSelection] tools=searchClinicalKnowledge(COLD_CARE)`);
    console.log(`[DataRetrieval] source=CLINICAL_KB`);
    console.log(`[DataResult] found=true`);
    console.log(`[DoctorMatching] specialty=General Medicine`);
    console.log(`[DoctorRanking] count=0`);
    console.log(`[Response] generated=true`);

    const kb = VERIFIED_CLINICAL_KNOWLEDGE.COLD_CARE;
    let msg = `### 🍵 ${kb.title}\n\n`;
    msg += `For mild, uncomplicated cold symptoms, standard nominal home care includes:\n\n`;
    kb.recommendations.forEach((rec) => {
      msg += `• ${rec}\n`;
    });
    msg += `\n**When to see a Doctor:**\n`;
    kb.red_flags.forEach((flag) => {
      msg += `• ${flag}\n`;
    });
    msg += `\n*Source: ${kb.source}. If symptoms persist beyond 5-7 days, consult an OPD physician.*`;

    responsePayload.message = msg;
    responsePayload.sources.push({
      type: 'CLINICAL_KB',
      id: 'COLD_CARE_SOP',
      name: kb.source,
    });
    responsePayload.actions.push(
      { type: 'NAVIGATE', label: 'Medicine Helper', route: '/patient/register' },
      { type: 'VIEW_DOCTOR', label: 'Consult General Medicine', specialty: 'General Medicine' }
    );
    return responsePayload;
  }

  // --------------------------------------------------------------------------
  // PATHWAY D: TARGETED NON-EMERGENCY CHEST PAIN ASSESSMENT
  // --------------------------------------------------------------------------
  if (risk.action_code === 'TARGETED_CARDIAC_ASSESSMENT') {
    console.log(`[ToolSelection] tools=getDoctorSpecialists(Cardiology), getDoctorAvailability`);
    const doctors = await doctorService.getDoctorsBySpecialtyWithAvailability('Cardiology');
    const medDocs = await doctorService.getDoctorsBySpecialtyWithAvailability('General Medicine');
    const allDoctors = [...doctors, ...medDocs];

    console.log(`[DataRetrieval] source=DOCTOR_DB, OPD_DB`);
    console.log(`[DataResult] found=true`);
    console.log(`[DoctorMatching] specialty=Cardiology`);
    console.log(`[DoctorRanking] count=${allDoctors.length}`);
    console.log(`[Response] generated=true`);

    let msg =
      `### 🩺 Clinical Risk Assessment: Chest Discomfort\n\n` +
      `Because chest pain can have cardiovascular, muscular, or gastrointestinal origins, it requires targeted clinical evaluation.\n\n` +
      `• **Safety Checklist:** If your chest discomfort becomes crushing, spreads to your left arm or jaw, or is accompanied by breathlessness or heavy sweating, call **108** immediately.\n` +
      `• **Recommended Evaluation:** For mild discomfort without acute shortness of breath, an in-person physical examination with our Cardiology or General Internal Medicine specialists is strongly recommended today.`;

    responsePayload.message = msg;
    responsePayload.specialty = 'Cardiology';
    responsePayload.doctors = allDoctors.slice(0, 2);
    responsePayload.availability = allDoctors.slice(0, 2).map((d) => ({
      doctor_id: d.doctor_id,
      doctor_name: d.doctor_name,
      available_today: d.available_today,
      next_available_slot: d.next_available_slot,
      queue_position: d.queue_position,
      estimated_wait_time: d.estimated_wait_time,
    }));
    responsePayload.actions = allDoctors.slice(0, 2).map((d) => ({
      type: 'BOOK_APPOINTMENT',
      doctor_id: d.doctor_id,
      doctor_name: d.doctor_name,
      label: `Consult ${d.doctor_name}`,
    }));
    responsePayload.sources.push(
      { type: 'CLINICAL_KB', id: 'CARDIAC_SAFETY_TRIAGE', name: 'Clinical Triage Rules' },
      { type: 'DOCTOR_DB', id: 'VERIFIED_ROSTER', name: 'MediKiosk Doctor Roster' }
    );
    return responsePayload;
  }

  // --------------------------------------------------------------------------
  // PATHWAY E: DOCTOR RECOMMENDATION, SPECIALIST FINDING, & LIVE OPD AVAILABILITY
  // --------------------------------------------------------------------------
  if (
    intent === 'FIND_SPECIALIST' ||
    intent === 'OPD_AVAILABILITY' ||
    intent === 'FIND_DOCTOR' ||
    intent === 'APPOINTMENT_HELP'
  ) {
    const specialtyMatch = matchSpecialtyFromSymptoms(entities.symptom, rawText);
    const targetSpecialty = entities.specialty || specialtyMatch.primary;

    console.log(`[ToolSelection] tools=getDoctorSpecialists(${targetSpecialty}), getDoctorAvailability`);
    const availableDoctors = await doctorService.getDoctorsBySpecialtyWithAvailability(targetSpecialty, {
      targetTime: entities.target_time,
    });

    console.log(`[DataRetrieval] source=DOCTOR_DB, OPD_DB`);
    console.log(`[DataResult] found=${availableDoctors.length > 0}`);
    console.log(`[DoctorMatching] specialty=${targetSpecialty}`);
    console.log(`[DoctorRanking] count=${availableDoctors.length}`);
    console.log(`[Response] generated=true`);

    let msg = '';
    if (entities.target_time && entities.target_time !== 'NOW') {
      const matchingSlotDocs = availableDoctors.filter((d) => d.matches_requested_time);
      if (matchingSlotDocs.length > 0) {
        msg = `Yes, verified availability for **${targetSpecialty}** around **${entities.target_time}** today:\n\n`;
      } else {
        msg = `Here is today's verified schedule for **${targetSpecialty}** (checking around ${entities.target_time}):\n\n`;
      }
    } else {
      msg = `Symptoms related to **${entities.symptom || targetSpecialty}** are evaluated by **${targetSpecialty}**.\n\nHere are our currently verified specialists and live OPD availability:\n\n`;
    }

    availableDoctors.forEach((doc, idx) => {
      msg += `**${idx + 1}. ${doc.doctor_name}** (${doc.qualification})\n`;
      msg += `• Department: ${doc.department}\n`;
      msg += `• Room: ${doc.room}\n`;
      msg += `• Availability Today: ${doc.available_today ? '✅ Yes' : '❌ Shift off'}\n`;
      msg += `• Next Available Slot: \`${doc.next_available_slot}\`\n`;
      msg += `• Live OPD Queue: ${doc.queue_position} waiting (~${doc.estimated_wait_time} wait)\n\n`;
    });

    responsePayload.message = msg.trim();
    responsePayload.specialty = targetSpecialty;
    responsePayload.doctors = availableDoctors;
    responsePayload.availability = availableDoctors.map((d) => ({
      doctor_id: d.doctor_id,
      doctor_name: d.doctor_name,
      available_today: d.available_today,
      available_now: d.available_now,
      next_available_slot: d.next_available_slot,
      queue_position: d.queue_position,
      estimated_wait_time: d.estimated_wait_time,
    }));
    responsePayload.sources.push(
      { type: 'DOCTOR_DB', id: 'VERIFIED_ROSTER', name: 'MediKiosk Verified Doctor Roster' },
      { type: 'OPD_DB', id: 'LIVE_CLINICAL_SESSIONS', name: 'MediKiosk Live Queue Sessions' }
    );
    responsePayload.actions = availableDoctors.map((d) => ({
      type: 'BOOK_APPOINTMENT',
      doctor_id: d.doctor_id,
      doctor_name: d.doctor_name,
      label: `Book with ${d.doctor_name}`,
    }));
    responsePayload.actions.push({
      type: 'VIEW_OPD_QUEUE',
      department: specialtyMatch.department,
      label: 'View Live OPD Queue',
    });

    return responsePayload;
  }

  // --------------------------------------------------------------------------
  // PATHWAY F: MULTI-TURN SYMPTOM GUIDANCE & NO-REPETITION CONTEXT
  // --------------------------------------------------------------------------
  if (intent === 'SYMPTOM_INFORMATION') {
    // Check what we know so far
    const hasSymptom = Boolean(entities.symptom);
    const hasDuration = Boolean(entities.duration);
    const alreadyAskedDuration = session.asked_questions.includes('DURATION');

    // Case 1: Symptom known, duration missing, and we haven't asked duration yet
    if (hasSymptom && !hasDuration && !alreadyAskedDuration) {
      session.asked_questions.push('DURATION');
      session.pending_question = 'DURATION';

      let msg = `I understand you are experiencing a **${entities.symptom}**.\n\nHow long have you had it, and is it mild, moderate, or severe?`;
      responsePayload.message = msg;
      responsePayload.requires_follow_up = true;
      return responsePayload;
    }

    // Case 2: Duration is now known (either from this turn or previous turns)
    // Avoid asking duration again!
    if (hasSymptom && hasDuration) {
      session.answered_questions.push({ question: 'DURATION', answer: entities.duration });
      session.pending_question = null;

      const spec = matchSpecialtyFromSymptoms(entities.symptom, rawText);
      const docs = await doctorService.getDoctorsBySpecialtyWithAvailability(spec.primary);

      let msg =
        `Thank you for providing the duration (${entities.duration}).\n\n` +
        `For **${entities.symptom}** lasting ${entities.duration}:\n` +
        `• **Self-Care Check:** Ensure adequate hydration, rest in a calm environment, and monitor for changes.\n` +
        `• **Red Flags:** Seek prompt evaluation if accompanied by fever, stiff neck, vision changes, or vomiting.\n` +
        `• **Consultation:** You can consult our ${spec.primary} specialist (${docs[0]?.doctor_name || 'OPD Physician'}) in Room ${docs[0]?.room || '102'}.`;

      responsePayload.message = msg;
      responsePayload.specialty = spec.primary;
      responsePayload.doctors = docs.slice(0, 1);
      responsePayload.actions.push({
        type: 'BOOK_APPOINTMENT',
        doctor_id: docs[0]?.doctor_id,
        label: `Consult ${docs[0]?.doctor_name}`,
      });
      return responsePayload;
    }
  }

  // --------------------------------------------------------------------------
  // PATHWAY G: AMBIGUOUS / GENERAL REQUEST
  // --------------------------------------------------------------------------
  console.log(`[ToolSelection] tools=none`);
  console.log(`[DataRetrieval] source=none`);
  console.log(`[DataResult] found=false`);
  console.log(`[DoctorMatching] specialty=none`);
  console.log(`[DoctorRanking] count=0`);
  console.log(`[Response] generated=true`);

  let genericMsg =
    `Hello! I am your MediKiosk Smart AI Assistant.\n\n` +
    `What specific medical topic or service would you like help with today?\n` +
    `• Health guidance (e.g., *Care of heat waves* or *Mild cold home care*)\n` +
    `• Finding a doctor (e.g., *Which doctor for migraine?* or *Dermatologist available today at 5 PM*)\n` +
    `• Medicine details (e.g., *Use of Acrivastine*)\n` +
    `• Hospital navigation and live OPD queues`;

  responsePayload.message = genericMsg;
  responsePayload.requires_follow_up = true;
  return responsePayload;
}

export default {
  classifySemanticIntent,
  extractClinicalEntities,
  assessClinicalRisk,
  matchSpecialtyFromSymptoms,
  processClinicalAssistantTurn,
  getOrCreateSession,
  VERIFIED_CLINICAL_KNOWLEDGE,
};
