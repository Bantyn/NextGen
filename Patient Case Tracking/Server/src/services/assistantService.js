import fs from 'fs';
import path from 'path';
import {
  AssistantMedicine,
  AssistantSymptomGuidance,
  AssistantFAQ,
  AssistantWebsiteHelp,
  AssistantContact,
} from '../models/AssistantKnowledge.js';

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
 * Controlled Read-Only Tool: Search Medicines by Name or Brand
 */
export async function searchMedicine(query) {
  if (!query || typeof query !== 'string') return [];
  const cleanQuery = query.trim().toLowerCase();
  const words = cleanQuery.split(/[\s,?.!]+/).filter((w) => w.length > 2);

  try {
    // 1. Try MongoDB query if connected
    const conditions = [
      { name: { $regex: cleanQuery, $options: 'i' } },
      { brand_names: { $regex: cleanQuery, $options: 'i' } },
      { generic_name: { $regex: cleanQuery, $options: 'i' } },
    ];
    for (const w of words) {
      conditions.push({ name: { $regex: w, $options: 'i' } });
      conditions.push({ brand_names: { $regex: w, $options: 'i' } });
      conditions.push({ generic_name: { $regex: w, $options: 'i' } });
    }

    const docs = await AssistantMedicine.find({ $or: conditions }).limit(5).lean();
    if (docs && docs.length > 0) return docs;
  } catch (dbErr) {}

  // 2. Fallback to static seed
  if (staticKnowledge?.medicines) {
    return staticKnowledge.medicines.filter((m) => {
      const nameL = m.name.toLowerCase();
      const genL = m.generic_name.toLowerCase();
      const brandsL = m.brand_names.map((b) => b.toLowerCase());

      // Direct sentence inclusion
      if (cleanQuery.includes(nameL) || cleanQuery.includes(genL)) return true;
      if (brandsL.some((b) => cleanQuery.includes(b))) return true;

      // Word matching
      return words.some((w) => nameL.includes(w) || genL.includes(w) || brandsL.some((b) => b.includes(w)));
    });
  }

  return [];
}

/**
 * Controlled Read-Only Tool: Get Complete Medicine Info
 */
export async function getMedicineInfo(medicineIdOrName) {
  if (!medicineIdOrName) return null;
  const cleanId = String(medicineIdOrName).trim().toLowerCase();

  try {
    const doc = await AssistantMedicine.findOne({
      $or: [
        { medicine_id: cleanId.toUpperCase() },
        { name: { $regex: cleanId, $options: 'i' } },
        { generic_name: { $regex: cleanId, $options: 'i' } },
      ],
    }).lean();

    if (doc) return doc;
  } catch (dbErr) {}

  if (staticKnowledge?.medicines) {
    return (
      staticKnowledge.medicines.find((m) => {
        const nameL = m.name.toLowerCase();
        const genL = m.generic_name.toLowerCase();
        return (
          m.medicine_id.toLowerCase() === cleanId ||
          cleanId.includes(nameL) ||
          cleanId.includes(genL) ||
          m.brand_names.some((b) => cleanId.includes(b.toLowerCase()))
        );
      }) || null
    );
  }

  return null;
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
  const words = q.split(/[\s,?.!]+/).filter((w) => w.length > 2);

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
    // Specific clinical intake or registration queries
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

    // Direct substring or word score matching
    const match = items.find(
      (w) =>
        w.topic.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.summary.toLowerCase().includes(q) ||
        words.some((wd) => w.title.toLowerCase().includes(wd) || w.topic.toLowerCase().includes(wd))
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
  searchMedicine,
  getMedicineInfo,
  getSymptomGuidance,
  getWebsiteHelp,
  getFAQ,
  getContactInfo,
};
