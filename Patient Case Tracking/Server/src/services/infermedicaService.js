import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const INFERMEDICA_APP_ID = process.env.INFERMEDICA_APP_ID;
const INFERMEDICA_APP_KEY = process.env.INFERMEDICA_APP_KEY;
const INFERMEDICA_API_URL = process.env.INFERMEDICA_API_URL || 'https://api.infermedica.com/v3';
const REQUEST_TIMEOUT_MS = 3500;

/**
 * Infermedica Service — Clinical Reasoning & Triage Reference Integration
 * Provides secondary clinical risk evaluation. Gracefully degrades to local
 * clinical intelligence if offline or credentials not configured.
 */
export class InfermedicaService {
  isConfigured() {
    return Boolean(INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY && !INFERMEDICA_APP_ID.includes('<'));
  }

  /**
   * Normalize symptoms into Infermedica evidence format
   */
  mapSymptomsToEvidence(symptoms = [], negativeFindings = []) {
    const evidence = [];

    (symptoms || []).forEach((sym) => {
      const symClean = String(sym).toLowerCase().trim();
      if (!symClean) return;

      // Common mappings for demonstration & standard clinical concepts
      let id = 's_119'; // Default generic symptom id
      if (symClean.includes('headache')) id = 's_21';
      else if (symClean.includes('chest pain')) id = 's_50';
      else if (symClean.includes('fever')) id = 's_98';
      else if (symClean.includes('cough')) id = 's_102';
      else if (symClean.includes('knee') || symClean.includes('joint')) id = 's_581';
      else if (symClean.includes('breath') || symClean.includes('dyspnea')) id = 's_19';
      else if (symClean.includes('stomach') || symClean.includes('abdominal')) id = 's_13';

      evidence.push({
        id,
        choice_id: 'present',
        source: 'initial',
      });
    });

    (negativeFindings || []).forEach((neg) => {
      const negClean = String(neg).toLowerCase().trim();
      let id = 's_98';
      if (negClean.includes('fever')) id = 's_98';
      else if (negClean.includes('cough')) id = 's_102';
      else if (negClean.includes('vomit')) id = 's_305';

      evidence.push({
        id,
        choice_id: 'absent',
        source: 'initial',
      });
    });

    return evidence;
  }

  /**
   * Request clinical assessment from Infermedica
   */
  async assessClinicalRisk({
    sex = 'male',
    age = 35,
    symptoms = [],
    negative_findings = [],
  } = {}) {
    // 1. If not configured, immediately use safe internal fallback
    if (!this.isConfigured()) {
      return this.buildFallbackAssessment(symptoms, negative_findings, 'Infermedica credentials not configured; local clinical fallback used.');
    }

    const evidence = this.mapSymptomsToEvidence(symptoms, negative_findings);
    if (evidence.length === 0) {
      return this.buildFallbackAssessment(symptoms, negative_findings, 'Insufficient evidence for Infermedica assessment.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(`${INFERMEDICA_API_URL}/diagnosis`, {
        method: 'POST',
        headers: {
          'App-Id': INFERMEDICA_APP_ID,
          'App-Key': INFERMEDICA_APP_KEY,
          'Content-Type': 'application/json',
          'Model': 'infermedica-en',
        },
        body: JSON.stringify({
          sex: sex.toLowerCase().startsWith('f') ? 'female' : 'male',
          age: { value: Math.max(1, parseInt(age, 10) || 30) },
          evidence,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        logger.warn(`[Infermedica HTTP ${res.status}] Falling back to internal assessment.`);
        return this.buildFallbackAssessment(symptoms, negative_findings, `Infermedica returned status ${res.status}`);
      }

      const data = await res.json();
      return this.normalizeInfermedicaResponse(data);
    } catch (err) {
      logger.warn(`[Infermedica Service Warning]: ${err.message}. Gracefully continuing intake.`);
      return this.buildFallbackAssessment(symptoms, negative_findings, err.message);
    }
  }

  /**
   * Standardize external API output into project's internal assessment envelope
   */
  normalizeInfermedicaResponse(raw) {
    const conditions = (raw.conditions || []).slice(0, 4).map((c) => ({
      id: c.id,
      name: c.name,
      common_name: c.common_name || c.name,
      probability: Math.round((c.probability || 0) * 100) / 100,
      requires_doctor_confirmation: true,
    }));

    return {
      source: 'infermedica',
      assessment: {
        possible_conditions: conditions,
        additional_evidence: raw.should_stop ? [] : (raw.question?.items || []).slice(0, 3),
        triage: {
          level: raw.triage?.level || (conditions.some((c) => c.probability > 0.7) ? 'MODERATE' : 'ROUTINE'),
          reason: raw.triage?.reason || 'Evaluation based on patient-reported clinical symptoms.',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deterministic local fallback matching internal project format
   */
  buildFallbackAssessment(symptoms = [], negativeFindings = [], reasonNote = '') {
    const hasChest = (symptoms || []).some((s) => String(s).toLowerCase().includes('chest'));
    const hasBreath = (symptoms || []).some((s) => String(s).toLowerCase().includes('breath'));

    let triageLevel = 'LOW';
    let conditionName = 'Clinical Symptom Intake';

    if (hasChest && hasBreath) {
      triageLevel = 'HIGH';
      conditionName = 'Acute Cardiorespiratory Evaluation';
    } else if (hasChest) {
      triageLevel = 'MODERATE';
      conditionName = 'Chest Pain Etiology Investigation';
    } else if ((symptoms || []).length > 0) {
      conditionName = `${symptoms[0]} Assessment`;
    }

    return {
      source: 'local_clinical_knowledge_base',
      assessment: {
        possible_conditions: [
          {
            id: 'ckb_cond_primary',
            name: conditionName,
            common_name: conditionName,
            probability: 0.5,
            requires_doctor_confirmation: true,
          },
        ],
        additional_evidence: [],
        triage: {
          level: triageLevel,
          reason: reasonNote || 'Evaluated deterministically via local clinical knowledge base.',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const infermedicaService = new InfermedicaService();
export default infermedicaService;
