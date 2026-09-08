import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  AssistantMedicine,
  AssistantSymptomGuidance,
  AssistantFAQ,
  AssistantWebsiteHelp,
  AssistantContact,
} from '../models/AssistantKnowledge.js';
import { openfdaService } from './openfdaService.js';
import { logger } from '../utils/logger.js';

// Load static fallback knowledge base
let staticKnowledge = null;
try {
  const jsonPath = path.resolve('src/data/assistant_knowledge.json');
  if (fs.existsSync(jsonPath)) {
    staticKnowledge = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (err) {
  console.warn('[AssistantService] Could not load static fallback assistant knowledge:', err.message);
}

/**
 * Detect medicine-related intent and extract candidate medicine entity
 * @param {string} userQuery
 * @returns {{ isMedicineQuery: boolean, intent: string, medicineName: string }}
 */
export function detectMedicineIntentAndExtract(userQuery) {
  if (!userQuery || typeof userQuery !== 'string') {
    return { isMedicineQuery: false, intent: 'GENERAL_HELP', medicineName: '' };
  }

  const clean = userQuery.trim();
  const lower = clean.toLowerCase();

  // Known local medicines, brand names, and drug terminology for fast-path identification
  const knownDrugKeywords = [
    'paracetamol', 'dolo', 'crocin', 'calpol', 'pacimol', 'pyrigesic', 'metacin',
    'azithromycin', 'azithral', 'azee', 'zithromax', 'azimax',
    'cetirizine', 'cetzine', 'zyrtec', 'alerid', 'okacet', 'incid-l',
    'pantoprazole', 'pan 40', 'pantocid', 'protonix', 'pantodac',
    'ibuprofen', 'brufen', 'advil', 'motrin', 'combiflam',
    'ors', 'electral',
    'aspirin', 'amoxicillin', 'augmentin', 'metformin', 'atorvastatin', 'omeprazole',
    'acrivastine', 'semprex', 'benadryl', 'montelukast', 'levocetirizine',
    'medicine', 'medicines', 'tablet', 'tablets', 'capsule', 'capsules', 'syrup', 'injection',
    'ointment', 'drops', 'dose', 'dosage', 'drug', 'drugs', 'rx',
    'દવા', 'ગોલી', 'दवा', 'गोली'
  ];

  const hasKnownDrug = knownDrugKeywords.some((k) => lower.includes(k));

  // Phrasing patterns indicating medicine queries
  const medicineQueryPatterns = [
    /^(?:what\s+is\s+the\s+)?(?:use|uses|indication|indications)\s+(?:of|for)\s+(.+)$/i,
    /^how\s+is\s+(.+)\s+used\??$/i,
    /^(.+)\s+(?:uses|use|indication|indications)$/i,
    /^(?:what\s+are\s+the\s+)?side\s+effects\s+(?:of|for)\s+(.+)$/i,
    /^(?:what\s+are\s+the\s+)?adverse\s+(?:effects|reactions)\s+(?:of|for)\s+(.+)$/i,
    /^(.+)\s+side\s+effects$/i,
    /^(?:what\s+is\s+the\s+)?(?:dose|dosage)\s+(?:of|for)\s+(.+)$/i,
    /^how\s+much\s+(.+)\s+(?:should\s+i|to)\s+take\??$/i,
    /^(.+)\s+(?:dosage|dose)$/i,
    /^is\s+(.+)\s+safe\??$/i,
    /^can\s+i\s+take\s+(.+?)(?:\s+with\s+.+)?\??$/i,
    /^(?:what\s+are\s+the\s+)?(?:warnings|precautions|contraindications)\s+(?:of|for)\s+(.+)$/i,
    /^(.+)\s+(?:warnings|precautions|contraindications)$/i,
    /^what\s+is\s+(.+)\??$/i,
    /^tell\s+me\s+about\s+(.+)$/i,
    /^(?:details|information|info)\s+(?:about|on|for)\s+(.+)$/i,
    /^(.+)\s+(?:details|information|info|medicine|tablet|capsule|syrup|ointment|drops|drug)$/i,
    /^(?:medicine|tablet|capsule|syrup|drug)\s+(.+)$/i,
  ];

  let extractedName = '';
  let patternMatched = false;

  for (const pattern of medicineQueryPatterns) {
    const match = clean.replace(/[\?\.\!\,]+$/, '').trim().match(pattern);
    if (match && match[1]) {
      let candidate = match[1].trim();
      candidate = candidate
        .replace(/\b(?:tablet|tablets|capsule|capsules|syrup|medicine|medicines|drug|drugs)\b/gi, '')
        .trim();
      candidate = candidate.replace(/^(?:the|a|an)\s+/i, '').trim();
      if (candidate.length >= 2) {
        extractedName = candidate;
        patternMatched = true;
        break;
      }
    }
  }

  // If no pattern matched, but query has a known drug keyword or is a single short entity
  if (!extractedName) {
    if (hasKnownDrug) {
      // Find the matched drug keyword or strip words
      for (const k of knownDrugKeywords) {
        if (k.length > 3 && lower.includes(k)) {
          extractedName = k;
          break;
        }
      }
      if (!extractedName) {
        extractedName = clean.replace(/[\?\.\!\,]+$/, '').trim();
      }
    } else {
      // Check if it looks like a drug query (1-3 words, e.g. "Acrivastine")
      const words = lower.split(/\s+/).filter(Boolean);
      const isNavigational = lower.includes('register') || lower.includes('checkin') || lower.includes('queue') ||
        lower.includes('doctor') || lower.includes('help') || lower.includes('contact') || lower.includes('faq') ||
        lower.includes('hello') || lower.includes('hi') || lower.includes('namaste');

      const isSymptomOrClinical =
        lower.includes('headache') ||
        lower.includes('head hurts') ||
        lower.includes('chest') ||
        lower.includes('fever') ||
        lower.includes('cough') ||
        lower.includes('cold') ||
        lower.includes('pain') ||
        lower.includes('rash') ||
        lower.includes('allergy') ||
        lower.includes('vomit') ||
        lower.includes('dizzy') ||
        lower.includes('dizziness') ||
        lower.includes('tooth') ||
        lower.includes('since') ||
        lower.includes('yesterday') ||
        lower.includes('morning') ||
        lower.includes('today') ||
        lower.includes('tomorrow') ||
        lower.includes('tell me') ||
        lower.includes('i have') ||
        lower.includes('i feel');

      if (!isNavigational && !isSymptomOrClinical && words.length <= 3 && clean.length >= 3) {
        extractedName = clean.replace(/[\?\.\!\,]+$/, '').trim();
      }
    }
  }

  // Capitalize extracted medicine entity cleanly
  if (extractedName) {
    extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
  }

  const isMedicine = Boolean(patternMatched || hasKnownDrug || (extractedName && extractedName.length >= 3));
  if (!isMedicine) {
    return { isMedicineQuery: false, intent: 'GENERAL_HELP', medicineName: '' };
  }

  // Detect specific sub-intent
  let intent = 'MEDICINE_GENERAL';
  if (
    lower.includes('with my other') ||
    lower.includes('interact') ||
    lower.includes('interaction') ||
    lower.includes('along with') ||
    lower.includes('take together') ||
    lower.includes('સાથે લઈ શકાય') ||
    lower.includes('साथ ले सकते')
  ) {
    intent = 'MEDICINE_INTERACTION';
  } else if (
    lower.includes('side effect') ||
    lower.includes('side-effect') ||
    lower.includes('adverse') ||
    lower.includes('reaction') ||
    lower.includes('allergy') ||
    lower.includes('આડઅસર') ||
    lower.includes('साइड इफेक्ट') ||
    lower.includes('नुकसान')
  ) {
    intent = 'MEDICINE_SIDE_EFFECTS';
  } else if (
    lower.includes('dosage') ||
    lower.includes('dose') ||
    lower.includes('how much') ||
    lower.includes('how many times') ||
    lower.includes('mg') ||
    lower.includes('ml') ||
    lower.includes('ખુરાક') ||
    lower.includes('ડોઝ') ||
    lower.includes('खुराक')
  ) {
    intent = 'MEDICINE_DOSAGE';
  } else if (
    lower.includes('safe') ||
    lower.includes('safety') ||
    lower.includes('can i take') ||
    lower.includes('harmful') ||
    lower.includes('danger') ||
    lower.includes('સુરક્ષિત') ||
    lower.includes('सुरक्षित')
  ) {
    intent = 'MEDICINE_SAFETY';
  } else if (
    lower.includes('warning') ||
    lower.includes('precaution') ||
    lower.includes('contraindication') ||
    lower.includes('ચેતવણી') ||
    lower.includes('સાવધાની') ||
    lower.includes('सावधानी')
  ) {
    intent = 'MEDICINE_WARNING';
  } else if (
    lower.includes('use of') ||
    lower.includes('uses of') ||
    lower.includes('uses') ||
    lower.includes('used for') ||
    lower.includes('how is') ||
    lower.includes('indication') ||
    lower.includes('ઉપયોગ') ||
    lower.includes('उपयोग') ||
    lower.includes('किस काम')
  ) {
    intent = 'MEDICINE_USE';
  } else if (
    lower.includes('what is') ||
    lower.includes('tell me about') ||
    lower.includes('about') ||
    lower.includes('info') ||
    lower.includes('details')
  ) {
    intent = 'MEDICINE_INFORMATION';
  }

  return {
    isMedicineQuery: true,
    intent,
    medicineName: extractedName || clean,
  };
}

/**
 * PRIMARY MEDICINE RETRIEVAL PIPELINE
 * 1. LOCAL MEDICINE KNOWLEDGE BASE (Primary)
 * 2. openFDA API FALLBACK (Secondary)
 * 3. Safe fallback response when neither has information
 */
export async function queryMedicineKnowledge(options = {}) {
  const {
    query = '',
    medicineName = '',
    intent = 'MEDICINE_INFORMATION',
  } = typeof options === 'string' ? { query: options, medicineName: options } : options;

  const cleanQuery = (query || '').trim();
  const targetMedicine = (medicineName || cleanQuery).trim();

  // Structured Logging
  console.log(`[MedicineQuery]\nquery="${cleanQuery}"`);
  console.log(`[MedicineIntent]\nintent="${intent}"`);
  console.log(`[MedicineExtraction]\nmedicine="${targetMedicine}"`);

  // =========================================================================
  // STEP 1: Search Local Medicine Knowledge Base First
  // =========================================================================
  const localMatch = await findLocalMedicine(targetMedicine);

  if (localMatch && isSufficientLocalRecord(localMatch)) {
    console.log(`[LocalLookup]\nfound=true`);
    console.log(`[MedicineSource]\nsource="local"`);

    const normalizedLocal = normalizeLocalMedicine(localMatch);
    return {
      found: true,
      source: 'local',
      source_label: 'MediKiosk medicine database',
      source_confidence: 'high',
      intent,
      medicine_name: normalizedLocal.medicine_name,
      data: normalizedLocal,
    };
  }

  console.log(`[LocalLookup]\nfound=false`);

  // =========================================================================
  // STEP 2: Fallback to official openFDA Drug Labeling API
  // =========================================================================
  console.log(`[OpenFDA]\nsearched=true`);

  try {
    const fdaData = await openfdaService.getDrugInformation(targetMedicine);

    if (fdaData && isSufficientFDARecord(fdaData)) {
      console.log(`[OpenFDAResult]\nfound=true`);
      console.log(`[MedicineSource]\nsource="openfda"`);

      return {
        found: true,
        source: 'openfda',
        source_label: 'FDA / openFDA drug labeling',
        source_confidence: 'high',
        intent,
        medicine_name: fdaData.medicine_name || targetMedicine,
        data: fdaData,
      };
    }
  } catch (fdaErr) {
    logger.warn(`[AssistantService] openFDA fallback error for "${targetMedicine}": ${fdaErr.message}`);
  }

  console.log(`[OpenFDAResult]\nfound=false`);
  console.log(`[MedicineSource]\nsource="none"`);

  // =========================================================================
  // STEP 3: Safe "Information Unavailable" Fallback
  // =========================================================================
  return {
    found: false,
    source: 'none',
    source_label: 'Unavailable',
    source_confidence: 'low',
    intent,
    medicine_name: targetMedicine,
    message: `I couldn't retrieve verified medicine information for "${targetMedicine}" from our local medicine database or official FDA drug labeling. Please consult a qualified doctor or pharmacist for clinical guidance.`,
    data: null,
  };
}

/**
 * Helper to locate medicine in MongoDB or static JSON seed
 */
async function findLocalMedicine(searchName) {
  if (!searchName) return null;
  const clean = searchName.trim().toLowerCase();
  const words = clean.split(/[\s,?.!]+/).filter((w) => w.length > 2);

  // 1. Try MongoDB if connected
  if (mongoose.connection?.readyState === 1) {
    try {
      const conditions = [
        { medicine_id: clean.toUpperCase() },
        { name: { $regex: clean, $options: 'i' } },
        { generic_name: { $regex: clean, $options: 'i' } },
        { brand_names: { $regex: clean, $options: 'i' } },
      ];
      for (const w of words) {
        conditions.push({ name: { $regex: `\\b${w}\\b`, $options: 'i' } });
        conditions.push({ generic_name: { $regex: `\\b${w}\\b`, $options: 'i' } });
        conditions.push({ brand_names: { $regex: `\\b${w}\\b`, $options: 'i' } });
      }

      const doc = await AssistantMedicine.findOne({ $or: conditions }).lean();
      if (doc) return doc;
    } catch (e) {
      // Database connection or query fallback
    }
  }

  // 2. Try Static Knowledge Base
  if (staticKnowledge?.medicines) {
    const found = staticKnowledge.medicines.find((m) => {
      const nameL = (m.name || '').toLowerCase();
      const genL = (m.generic_name || '').toLowerCase();
      const brandsL = (m.brand_names || []).map((b) => b.toLowerCase());

      if (clean === nameL || clean === genL || brandsL.includes(clean)) return true;
      if (clean.includes(nameL) || clean.includes(genL) || brandsL.some((b) => clean.includes(b))) return true;
      if (nameL.includes(clean) || genL.includes(clean)) return true;
      if (words.some((w) => nameL === w || genL.includes(w) || brandsL.includes(w))) return true;
      return false;
    });
    if (found) return found;
  }

  return null;
}

/**
 * Verify if a local record has sufficient information
 */
function isSufficientLocalRecord(record) {
  if (!record) return false;
  return Boolean(record.name && (record.purpose || record.generic_name));
}

/**
 * Verify if an openFDA record has useful medicine details
 */
function isSufficientFDARecord(record) {
  if (!record) return false;
  const hasIndications = Array.isArray(record.indications_and_usage) && record.indications_and_usage.length > 0;
  const hasPurpose = Array.isArray(record.purpose) && record.purpose.length > 0;
  const hasWarnings = Array.isArray(record.warnings) && record.warnings.length > 0;
  const hasAdverse = Array.isArray(record.adverse_reactions) && record.adverse_reactions.length > 0;
  const hasDesc = Array.isArray(record.active_ingredients) && record.active_ingredients.length > 0;

  return hasIndications || hasPurpose || hasWarnings || hasAdverse || hasDesc;
}

/**
 * Normalize local medicine record into standard schema matching openFDA normalizer
 */
function normalizeLocalMedicine(local) {
  const cleanArr = (val) => {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.map((s) => String(s).trim()).filter(Boolean);
  };

  return {
    medicine_name: local.name,
    generic_name: cleanArr(local.generic_name),
    brand_name: cleanArr(local.brand_names),
    active_ingredients: cleanArr(local.generic_name),
    category: local.category || 'General Medicine',
    purpose: cleanArr(local.purpose),
    indications_and_usage: cleanArr(local.purpose),
    dosage_and_administration: cleanArr(local.general_usage_info),
    warnings: cleanArr(local.precautions_and_warnings),
    contraindications: cleanArr(local.contraindications),
    precautions: cleanArr(local.precautions_and_warnings),
    adverse_reactions: cleanArr(local.common_side_effects),
    drug_interactions: [],
    pregnancy: [],
    pediatric_use: [],
    geriatric_use: [],
    patient_information: cleanArr(local.general_usage_info),
    storage: cleanArr(local.storage_instructions),
    manufacturer: [],
    route: ['Oral'],
    dosage_form: cleanArr(local.dosage_forms),
    requires_prescription: Boolean(local.requires_prescription),
    source: 'local',
    source_label: 'MediKiosk medicine database',
    source_confidence: 'high',
    source_timestamp: new Date().toISOString(),
    disclaimer: 'This reference information is sourced from the verified MediKiosk medicine knowledge base for educational purposes and does not replace medical advice from your physician.',
  };
}

/**
 * Controlled Read-Only Tool: Search Medicines by Name or Brand
 */
export async function searchMedicine(query) {
  if (!query || typeof query !== 'string') return [];
  const cleanQuery = query.trim().toLowerCase();

  // Try local first
  const localDocs = await findLocalMedicine(cleanQuery);
  if (localDocs) return [localDocs];

  // Try openFDA fallback
  try {
    const fdaData = await openfdaService.getDrugInformation(cleanQuery);
    if (fdaData) return [fdaData];
  } catch (e) {}

  return [];
}

/**
 * Controlled Read-Only Tool: Get Complete Medicine Info
 */
export async function getMedicineInfo(medicineIdOrName) {
  if (!medicineIdOrName) return null;
  const result = await queryMedicineKnowledge({
    query: String(medicineIdOrName),
    medicineName: String(medicineIdOrName),
  });
  return result.found ? result.data : null;
}

/**
 * Controlled Read-Only Tool: Get Nominal Symptom Guidance
 */
export async function getSymptomGuidance(symptomKeyOrQuery) {
  if (!symptomKeyOrQuery) return null;
  const q = String(symptomKeyOrQuery).trim().toLowerCase();

  try {
    const doc = await AssistantSymptomGuidance.findOne({
      $or: [
        { symptom_key: q },
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    }).lean();

    if (doc) return doc;
  } catch (dbErr) {}

  if (staticKnowledge?.symptom_guidance) {
    return (
      staticKnowledge.symptom_guidance.find((s) => {
        const keyL = s.symptom_key.toLowerCase();
        const titleL = s.title.toLowerCase();
        const words = keyL.split('_');

        if (q.includes(keyL) || q.includes(titleL) || titleL.includes(q)) return true;
        if (words.some((w) => w.length > 3 && q.includes(w))) return true;

        if ((q.includes('cold') || q.includes('cough') || q.includes('खांसी') || q.includes('ખાંસી') || q.includes('સળેખમ')) && keyL.includes('cold')) return true;
        if ((q.includes('headache') || q.includes('head') || q.includes('सिरदर्द') || q.includes('માથાનો')) && keyL.includes('headache')) return true;
        if ((q.includes('acidity') || q.includes('heartburn') || q.includes('gas') || q.includes('एसिडिटी') || q.includes('ગેસ')) && keyL.includes('acidity')) return true;
        if ((q.includes('fever') || q.includes('pyrexia') || q.includes('temperature') || q.includes('बुखार') || q.includes('તાવ')) && keyL.includes('fever')) return true;
        if ((q.includes('diarrhea') || q.includes('vomit') || q.includes('loose motion') || q.includes('दस्त') || q.includes('ઝાડા') || q.includes('ઉલ્ટી')) && (keyL.includes('diarrhea') || keyL.includes('vomit'))) return true;
        if ((q.includes('joint') || q.includes('muscle') || q.includes('arthritis') || q.includes('back pain') || q.includes('घुटने') || q.includes('जोड़ों') || q.includes('સાંધા')) && keyL.includes('joint')) return true;

        return false;
      }) || null
    );
  }

  return null;
}

/**
 * Controlled Read-Only Tool: Get Website & Feature Navigation Help
 */
export async function getWebsiteHelp(topic, userRole = 'PATIENT') {
  const items = staticKnowledge?.website_help || [];
  if (!topic) return items;

  const q = String(topic).trim().toLowerCase();

  try {
    const doc = await AssistantWebsiteHelp.findOne({
      $or: [
        { topic: q },
        { topic: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
      ],
    }).lean();

    if (doc) {
      if (doc.route.startsWith('/doctor') && userRole.toUpperCase() === 'PATIENT') {
        return {
          ...doc,
          summary: 'The Doctor OPD Consultation portal is reserved for licensed hospital physicians to review patient summaries.',
        };
      }
      return doc;
    }
  } catch (dbErr) {}

  if (items.length > 0) {
    if (q.includes('intake') || q.includes('session') || q.includes('start') || q.includes('history') || q.includes('તપાસ') || q.includes('शुरू')) {
      const intakeMatch = items.find((w) => w.topic === 'clinical_intake' || w.topic === 'patient_checkin');
      if (intakeMatch) return intakeMatch;
    }

    if (q.includes('register') || q.includes('checkin') || q.includes('check-in') || q.includes('નોંધણી')) {
      const regMatch = items.find((w) => w.topic === 'patient_checkin');
      if (regMatch) return regMatch;
    }

    if (q.includes('document') || q.includes('ocr') || q.includes('prescription') || q.includes('upload') || q.includes('રિપોર્ટ')) {
      const docMatch = items.find((w) => w.topic === 'document_upload');
      if (docMatch) return docMatch;
    }

    if (q.includes('doctor') || q.includes('opd') || q.includes('physician') || q.includes('ડૉક્ટર')) {
      const docMatch = items.find((w) => w.topic === 'doctor_portal');
      if (docMatch) return docMatch;
    }

    if (q.includes('track') || q.includes('queue') || q.includes('token') || q.includes('ટોકન') || q.includes('નંબર')) {
      const trackMatch = items.find((w) => w.topic === 'patient_tracking');
      if (trackMatch) return trackMatch;
    }

    const match = items.find(
      (w) =>
        w.topic.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.summary.toLowerCase().includes(q)
    );
    if (match) return match;
  }

  return items[0] || null;
}

/**
 * Controlled Read-Only Tool: Get FAQs
 */
export async function getFAQ(categoryOrQuery) {
  if (!categoryOrQuery) return staticKnowledge?.faqs || [];
  const q = String(categoryOrQuery).trim().toLowerCase();

  try {
    const docs = await AssistantFAQ.find({
      $or: [
        { category: { $regex: q, $options: 'i' } },
        { question: { $regex: q, $options: 'i' } },
        { answer: { $regex: q, $options: 'i' } },
      ],
    }).limit(3).lean();

    if (docs && docs.length > 0) return docs;
  } catch (dbErr) {}

  if (staticKnowledge?.faqs) {
    const matches = staticKnowledge.faqs.filter(
      (f) =>
        f.category.toLowerCase().includes(q) ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches.slice(0, 3) : staticKnowledge.faqs.slice(0, 3);
  }

  return [];
}

/**
 * Controlled Read-Only Tool: Get Hospital Contacts
 */
export async function getContactInfo(department = '') {
  const q = String(department).trim().toLowerCase();

  try {
    if (q) {
      const doc = await AssistantContact.findOne({
        department: { $regex: q, $options: 'i' },
      }).lean();
      if (doc) return [doc];
    }
    const docs = await AssistantContact.find({}).lean();
    if (docs && docs.length > 0) return docs;
  } catch (dbErr) {}

  if (staticKnowledge?.contacts) {
    if (q) {
      const filtered = staticKnowledge.contacts.filter((c) =>
        c.department.toLowerCase().includes(q)
      );
      if (filtered.length > 0) return filtered;
    }
    return staticKnowledge.contacts;
  }

  return [];
}

export default {
  detectMedicineIntentAndExtract,
  queryMedicineKnowledge,
  searchMedicine,
  getMedicineInfo,
  getSymptomGuidance,
  getWebsiteHelp,
  getFAQ,
  getContactInfo,
};
