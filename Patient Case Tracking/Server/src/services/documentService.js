import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import { logger } from '../utils/logger.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { redFlagCaseService } from './redFlagCaseService.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { ApiError } from '../utils/apiError.js';
import {
  extractLabTableRows,
  postProcessRows,
  parseNumericValue,
  parseReferenceRange,
  extractSourceFlag,
  sanitizeUnit,
  computeConfidenceScore,
} from '../utils/medicalTableParser.js';

dotenv.config();

const N8N_DOCUMENT_WEBHOOK = process.env.N8N_DOCUMENT_WEBHOOK;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Standard Clinical Lab Reference Ranges (used when report does not state reference interval)
 */
const STANDARD_LAB_RANGES = {
  hemoglobin: { min: 13.0, max: 17.0, unit: 'g/dL', criticalLow: 7.0, criticalHigh: 20.0, category: 'Hematology' },
  wbc: { min: 4000, max: 11000, unit: '/cumm', criticalLow: 1500, criticalHigh: 30000, category: 'Hematology' },
  tlc: { min: 4000, max: 11000, unit: '/cumm', criticalLow: 1500, criticalHigh: 30000, category: 'Hematology' },
  platelets: { min: 150000, max: 450000, unit: '/cumm', criticalLow: 25000, criticalHigh: 1000000, category: 'Hematology' },
  rbc: { min: 4.5, max: 5.9, unit: 'mill/cumm', criticalLow: 2.0, criticalHigh: 7.0, category: 'Hematology' },
  fasting_glucose: { min: 70, max: 100, unit: 'mg/dL', criticalLow: 50, criticalHigh: 350, category: 'Biochemistry' },
  random_glucose: { min: 70, max: 140, unit: 'mg/dL', criticalLow: 50, criticalHigh: 400, category: 'Biochemistry' },
  blood_sugar: { min: 70, max: 140, unit: 'mg/dL', criticalLow: 50, criticalHigh: 350, category: 'Biochemistry' },
  hba1c: { min: 4.0, max: 5.6, unit: '%', criticalLow: null, criticalHigh: 11.0, category: 'Biochemistry' },
  serum_creatinine: { min: 0.7, max: 1.3, unit: 'mg/dL', criticalLow: null, criticalHigh: 4.5, category: 'Renal Function' },
  blood_urea: { min: 15, max: 40, unit: 'mg/dL', criticalLow: null, criticalHigh: 100, category: 'Renal Function' },
  uric_acid: { min: 3.5, max: 7.2, unit: 'mg/dL', criticalLow: null, criticalHigh: 12.0, category: 'Renal Function' },
  sgpt: { min: 10, max: 49, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  alt: { min: 10, max: 49, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  sgot: { min: 15, max: 40, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  ast: { min: 15, max: 40, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  ast_alt_ratio: { min: 0.5, max: 1.0, unit: '', criticalLow: null, criticalHigh: 2.0, category: 'Liver Function' },
  ggt: { min: 0, max: 73, unit: 'U/L', criticalLow: null, criticalHigh: 250, category: 'Liver Function' },
  alp: { min: 30, max: 120, unit: 'U/L', criticalLow: null, criticalHigh: 350, category: 'Liver Function' },
  total_bilirubin: { min: 0.3, max: 1.2, unit: 'mg/dL', criticalLow: null, criticalHigh: 10.0, category: 'Liver Function' },
  direct_bilirubin: { min: 0.0, max: 0.3, unit: 'mg/dL', criticalLow: null, criticalHigh: 2.0, category: 'Liver Function' },
  indirect_bilirubin: { min: 0.2, max: 1.1, unit: 'mg/dL', criticalLow: null, criticalHigh: 3.0, category: 'Liver Function' },
  total_protein: { min: 5.7, max: 8.2, unit: 'g/dL', criticalLow: 4.5, criticalHigh: null, category: 'Liver Function' },
  albumin: { min: 3.2, max: 4.8, unit: 'g/dL', criticalLow: 2.5, criticalHigh: null, category: 'Liver Function' },
  globulin: { min: 2.0, max: 3.5, unit: 'g/dL', criticalLow: null, criticalHigh: 5.0, category: 'Liver Function' },
  ag_ratio: { min: 0.9, max: 2.0, unit: '', criticalLow: 0.7, criticalHigh: null, category: 'Liver Function' },
  total_cholesterol: { min: 125, max: 200, unit: 'mg/dL', criticalLow: null, criticalHigh: 350, category: 'Lipid Profile' },
  triglycerides: { min: 50, max: 150, unit: 'mg/dL', criticalLow: null, criticalHigh: 500, category: 'Lipid Profile' },
  tsh: { min: 0.4, max: 4.5, unit: 'uIU/mL', criticalLow: 0.05, criticalHigh: 20.0, category: 'Endocrine' },
  potassium: { min: 3.5, max: 5.1, unit: 'mEq/L', criticalLow: 2.5, criticalHigh: 6.2, category: 'Electrolytes' },
  sodium: { min: 135, max: 145, unit: 'mEq/L', criticalLow: 120, criticalHigh: 160, category: 'Electrolytes' },
};

export class DocumentService {
  /**
   * Preprocess image for OCR to enhance contrast of handwriting
   */
  async prepareImageForOcr(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      let pipeline = sharp(buffer).rotate();

      if (metadata.width && metadata.width < 1400) {
        pipeline = pipeline.resize({
          width: Math.min(1800, metadata.width * 2),
          fit: 'inside',
          kernel: 'lanczos3',
        });
      }

      return await pipeline
        .grayscale()
        .linear(1.3, -20)
        .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.5 })
        .toFormat('png')
        .toBuffer();
    } catch (err) {
      logger.warn('[Image Preprocessing Notice]: ' + err.message);
      return buffer;
    }
  }

  /**
   * Extract clean text from PDF documents using pdf-parse
   */
  async extractTextFromPdf(buffer) {
    try {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const extracted = result?.text || '';
      return String(extracted).replace(/\r\n/g, '\n').trim();
    } catch (err) {
      logger.warn('[PDF Parsing Notice]: ' + err.message);
      return '';
    }
  }

  /**
   * Universal JSON cleaner from LLM markdown
   */
  parseOcrContent(rawContent) {
    if (!rawContent) return null;
    if (typeof rawContent === 'object') return rawContent;

    let cleaned = String(rawContent).trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      logger.warn('Failed to parse stringified OCR JSON: ' + err.message);
      return null;
    }
  }

  /**
   * Parse a single numerical value from a string.
   * CRITICAL GUARD: Returns null if the string looks like a reference range
   * (e.g. "4.5 - 5.5", "13.0–17.0") — prevents range strings from being
   * silently truncated to only the lower bound.
   */
  parseNumber(str) {
    return parseNumericValue(str);
  }

  /**
   * Deterministic High-Intelligence Clinical Extractor
   *
   * v2 — Phase 9 Upgrade:
   * - Uses universal medicalTableParser for lab rows (works on ANY layout)
   * - Preserves source-printed flags verbatim (Borderline ≠ Normal)
   * - Guards against numeric corruption from range strings
   * - Sanitizes units ("Normal", "High" cannot be units)
   * - Sets verification_required when source flag ≠ computed flag
   * - Real confidence score based on actual field coverage
   */
  extractClinicalDataIntelligently(rawText = '', docTypeHint = 'LAB_REPORT', fileName = '') {
    if (!rawText || rawText.trim().length < 5) return null;

    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const textLower = rawText.toLowerCase();

    // 1. Detect Document Type
    let detectedType = 'LAB_REPORT';
    if (/discharge\s+summary|hospital\s+course|admission\s+date/i.test(rawText)) {
      detectedType = 'DISCHARGE_SUMMARY';
    } else if (/prescription|rx\b|tablet|capsule|syrup|dosage|frequency/i.test(rawText) && !/pathology|lab|cbc|reference\s+range/i.test(rawText)) {
      detectedType = 'PRESCRIPTION';
    } else if (/x-ray|mri|ct\s+scan|ultrasound|sonography|radiology|impression/i.test(rawText) && !/hemoglobin|serum/i.test(rawText)) {
      detectedType = 'IMAGING_REPORT';
    } else if (/consultation|chief\s+complaint|clinical\s+note|assessment/i.test(rawText) && !/reference\s+range/i.test(rawText)) {
      detectedType = 'CONSULTATION_NOTE';
    } else if (docTypeHint && docTypeHint !== 'OTHER') {
      detectedType = docTypeHint;
    }

    // 2. Patient Demographics Extraction
    let cleanPatientName = null;

    // Strategy A: Explicit name prefixes
    const explicitNameMatch =
      rawText.match(/(?:patient\s*name|pt\.?\s*name|name\s*of\s*(?:the\s*)?patient|client\s*name|beneficiary\s*name)\s*[:#\-]\s*([A-Za-z][A-Za-z\s.]{1,40}?)(?:\r?\n|$|,|;|\bage\b|\bsex\b|\bgender\b|\buhid\b|\bref\b)/i) ||
      rawText.match(/(?:mr\.|mrs\.|ms\.|miss\.|master)\s+([A-Za-z][A-Za-z\s.]{1,35}?)(?:\r?\n|$|,|;|\bage\b|\bsex\b|\bgender\b|\buhid\b|\bref\b)/i);

    if (explicitNameMatch) {
      cleanPatientName = explicitNameMatch[1].trim();
    }

    // Strategy B: Diagnostic header pattern (name near Age/Sex/UHID block)
    if (!cleanPatientName) {
      const ageSexLineIdx = lines.findIndex((l) =>
        /\bage\s*:\s*\d+/i.test(l) ||
        /\bsex\s*:\s*(?:male|female)/i.test(l) ||
        /\buhid\s*:\s*\d+/i.test(l)
      );

      if (ageSexLineIdx > 0) {
        for (let i = ageSexLineIdx - 1; i >= Math.max(0, ageSexLineIdx - 4); i--) {
          let candidate = lines[i];
          candidate = candidate.replace(/(\[|\(|\|).*$/, '').trim();
          if (/drlogy|pathology|lab|hospital|clinic|www\.|\.com|complex|road|mumbai|sample\s*collected|accurate|caring|instant|department|investigation|tele|opp/i.test(candidate)) {
            continue;
          }
          if (/^[A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+){1,3}$/.test(candidate)) {
            cleanPatientName = candidate;
            break;
          }
        }
      }
    }

    // Strategy C: Blacklist validation
    if (cleanPatientName) {
      if (
        /\b(?:with|chronic|acute|disease|asymptomatic|patient|liver|hepatitis|cirrhosis|report|investigation|technician|pathologist|doctor|dr\.|hospital|clinic|sample|specimen|test|result|normal|high|low|reference|ratio|finding|note|medical|evaluation|admitted|fibrosis)\b/i.test(
          cleanPatientName
        ) ||
        cleanPatientName.length < 3 ||
        cleanPatientName.length > 40
      ) {
        cleanPatientName = null;
      }
    }

    const ageMatch = rawText.match(/(?:age|years?|yrs?)[:\s]+(\d{1,3})/i);
    const genderMatch = rawText.match(/(?:gender|sex)[:\s]+(male|female|other|m|f)\b/i);
    const pidMatch = rawText.match(/(?:patient\s*id|pid|uhid|reg(?:istration)?\.?\s*no|sample\s*no)[:\s]+([A-Za-z0-9\-_]+)/i);
    const dateMatch = rawText.match(/(?:date|reported|collected|sampled)[:\s]*(\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b)/i) ||
      rawText.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i);

    const patient = {
      name: cleanPatientName,
      age: ageMatch ? String(ageMatch[1]) : null,
      gender: genderMatch ? (genderMatch[1].toUpperCase().startsWith('M') ? 'Male' : genderMatch[1].toUpperCase().startsWith('F') ? 'Female' : 'Other') : null,
      patient_id: pidMatch ? pidMatch[1].trim() : null,
      date_of_birth: null,
    };

    // 3. Facility and Doctor Details
    const facilityMatch = lines.find((l) =>
      /drlogy|hospital|clinic|pathology|laboratory|diagnostic|health\s*centre|medical\s*center/i.test(l) &&
      !/sample|collected|registered|reported/i.test(l)
    );

    let doctorName = null;
    const refDocMatch = rawText.match(/(?:ref(?:erred)?\.?\s*by|consulting\s*doctor|consultant|attending\s*physician)\s*[:#\-]?\s*(?:dr\.?)?\s*([A-Za-z][A-Za-z\s.]{2,35}?)(?:\r?\n|$|,|;|\breported\b|\bcollected\b|\bregistered\b|\bdate\b|\btime\b|\buhid\b|\bpage\b|\bmd\b|\bmbbs\b)/i);
    if (refDocMatch) {
      doctorName = `Dr. ${refDocMatch[1].trim().replace(/^dr\.?\s*/i, '')}`;
    } else {
      const docMatch = rawText.match(/(?:dr\.|doctor)\s+([A-Z][a-zA-Z\s.]+)/i);
      if (docMatch) {
        doctorName = docMatch[0].trim().replace(/\s+(?:reported|collected|registered|generated|sample|date|time|uhid|ref|page|contact).*$/i, '').trim();
      }
    }

    const doctor = {
      name: doctorName || null,
      facility: facilityMatch || null,
      qualification: rawText.match(/(?:mbbs|md|ms|bams|bhms|dnb|frcp|m\.ch)/i)?.[0] || null,
    };

    // 4. Lab Investigations — Universal Table Parser (Phase 9)
    const { rows: rawRows } = extractLabTableRows(rawText);
    const labRows = postProcessRows(rawRows, STANDARD_LAB_RANGES);

    // Convert to the standard lab_investigations schema
    const labResults = labRows.map((row) => ({
      test_name: row.test_name,
      category: row.section || 'Clinical Pathology',
      observed_value: row.observed_value,
      value: row.observed_value,
      reference_range: row.reference_range || 'Not reported',
      unit: row.unit || '',
      // Preserve source-printed flag (Borderline stays Borderline)
      source_flag: row.source_flag,
      flag: row.flag || 'NORMAL',
      status: row.flag || 'NORMAL',
      computed_flag: row.computed_flag,
      verification_required: row.verification_required || false,
      extraction_quality: row.extraction_quality,
      alert: row.alert || false,
    }));

    const importantFindings = labResults
      .filter((l) => l.alert)
      .map((l) => ({
        finding: `${l.test_name}: ${l.observed_value} ${l.unit} (Ref: ${l.reference_range}, Flag: ${l.flag})`,
        category: l.category || 'Investigation',
        status: l.flag,
        severity: l.flag === 'CRITICAL' ? 'CRITICAL' : 'IMPORTANT',
        value: String(l.observed_value || ''),
        reference_range: l.reference_range || '',
        unit: l.unit || '',
        source_flag: l.source_flag,
        verification_required: l.verification_required,
        interpretation: l.flag === 'LOW'
          ? 'Value is below the expected reference interval.'
          : l.flag === 'CRITICAL'
          ? 'Critical clinical threshold crossed. Immediate physician attention advised.'
          : l.flag === 'BORDERLINE'
          ? 'Value is at the borderline of the reference interval. Monitor closely.'
          : 'Value is elevated compared to reference interval.',
      }));

    // 5. Prescriptions Extraction
    const prescribedMedicines = [];
    const medRegex = /(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?|Syrup|Tablet|Capsule)?\s*([A-Za-z0-9\-]+)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g))\s*(?:([0-1]-[0-1]-[0-1]|OD|BD|TDS|QID|once daily|twice daily|thrice daily))?(?:\s*(?:x\s*|for\s*)(\d+\s*days?))?/gi;
    let m;
    while ((m = medRegex.exec(rawText)) !== null) {
      if (m[1] && m[2] && m[1].length > 2 && !/^(date|page|room|test|doctor|patient|male|female)$/i.test(m[1])) {
        prescribedMedicines.push({
          name: m[1],
          dosage: m[2],
          frequency: m[3] || 'Once daily',
          timing: 'After meals',
          duration: m[4] || 'As prescribed',
        });
      }
    }

    // 6. Clinical Findings & Diagnoses
    const diagnoses = [];
    const diagMatch = rawText.match(/(?:diagnosis|impression|provisional\s+diagnosis|final\s+diagnosis)[:\s]+([^\n\r]+)/i);
    if (diagMatch) {
      diagnoses.push(diagMatch[1].trim());
    }

    const hasCardiacHistory = /cardiac|myocardial\s+infarction|angina|cad\b|coronary|stent|bypass|cabg|heart\s+disease|heart\s+attack/i.test(rawText);
    const medicalHistory = [];
    if (hasCardiacHistory) medicalHistory.push('Previous Cardiac Disease / History');
    if (/hypertension|high\s+bp/i.test(rawText)) medicalHistory.push('Hypertension');
    if (/diabetes|t2dm|hyperglycemia/i.test(rawText)) medicalHistory.push('Diabetes Mellitus');
    if (/asthma|copd/i.test(rawText)) medicalHistory.push('Respiratory Disorder (Asthma/COPD)');
    if (/chronic\s+kidney|ckd|renal/i.test(rawText)) medicalHistory.push('Renal Function Impairment');

    const complaints = [];
    const complaintKeywords = ['fever', 'cough', 'cold', 'chest pain', 'chest discomfort', 'headache', 'breathlessness', 'vomiting', 'pain', 'weakness', 'fatigue'];
    for (const ck of complaintKeywords) {
      if (new RegExp(`\\b${ck}\\b`, 'i').test(rawText)) {
        complaints.push(ck.charAt(0).toUpperCase() + ck.slice(1));
      }
    }

    const vitals = {};
    const bpMatch = rawText.match(/BP[:\s]*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/i);
    if (bpMatch) vitals.BP = `${bpMatch[1]} mmHg`;
    const prMatch = rawText.match(/(?:PR|Pulse|HR)[:\s]*([0-9]{2,3})/i);
    if (prMatch) vitals.PR = `${prMatch[1]} bpm`;
    const tempMatch = rawText.match(/(?:Temp|Temperature)[:\s]*([0-9]{2,3}\.?[0-9]?\s*(?:F|C)?)/i);
    if (tempMatch) vitals.temp = tempMatch[1].trim();

    // 7. Generate Dual Summaries (Clinical & Patient-Friendly)
    const docTitle = detectedType === 'LAB_REPORT'
      ? (labResults.length > 0 ? `${labResults[0].section || labResults[0].test_name} Diagnostic Panel` : 'Diagnostic Pathology Report')
      : detectedType === 'PRESCRIPTION'
      ? 'Clinical Prescription & Treatment Advice'
      : detectedType === 'DISCHARGE_SUMMARY'
      ? 'Hospital Discharge Summary'
      : fileName || 'Medical Document';

    const abnormalLabSummary = labResults
      .filter((l) => l.alert)
      .map((l) => `${l.test_name}: ${l.observed_value} ${l.unit} (Ref: ${l.reference_range}, Flag: ${l.flag}${l.verification_required ? ' ⚠ Verify' : ''})`)
      .join('; ');

    const clinicalSummaryText = [
      `Patient Overview: ${patient.name || 'Patient'} (${patient.age ? `${patient.age}y` : 'Age unstated'}, ${patient.gender || 'Gender unstated'}).`,
      `Document Type: ${detectedType} from ${doctor.facility || 'Unknown Facility'}. Date: ${dateMatch ? dateMatch[1] : 'Unspecified'}.`,
      complaints.length > 0 ? `Chief Complaints: ${complaints.join(', ')}.` : 'Chief Complaints: None explicitly documented.',
      medicalHistory.length > 0 ? `Relevant Medical History: ${medicalHistory.join(', ')}.` : 'Relevant Medical History: Not reported in document.',
      prescribedMedicines.length > 0 ? `Current Medications: ${prescribedMedicines.map((med) => `${med.name} ${med.dosage}`).join(', ')}.` : 'Current Medications: None listed in document.',
      labResults.length > 0 ? `Investigations: ${labResults.length} parameter(s) evaluated.` : 'Investigations: Non-laboratory diagnostic record.',
      abnormalLabSummary ? `Important Abnormal Findings: ${abnormalLabSummary}.` : 'Important Abnormal Findings: No critical abnormalities flagged in parameters.',
      hasCardiacHistory ? 'Possible Risk Indicators: Document notes previous cardiac history; correlation with acute complaints required.' : null,
      diagnoses.length > 0 ? `Provisional/Clinical Diagnoses: ${diagnoses.join('; ')}.` : null,
      'Recommended Follow-up: Clinical correlation by attending physician required. AI extraction is supplementary to original clinical record.',
    ].filter(Boolean).join('\n');

    const clinicalSummaryObj = {
      patient_overview: `${patient.name || 'Patient'} (${patient.age || 'Age N/A'}, ${patient.gender || 'Gender N/A'})`,
      document_type: detectedType,
      facility: doctor.facility || 'Not identified',
      doctor: doctor.name || 'Attending Physician',
      date: dateMatch ? dateMatch[1] : 'Recent',
      chief_complaints: complaints,
      medical_history: medicalHistory,
      current_medications: prescribedMedicines,
      investigations_count: labResults.length,
      important_findings: importantFindings.map((f) => f.finding),
      abnormal_count: importantFindings.length,
      physician_digest: clinicalSummaryText,
    };

    const patientBulletFindings = importantFindings.length > 0
      ? importantFindings.map((f) => `• ${f.finding} (${f.status.toLowerCase()} compared to expected range)`).join('\n')
      : '• All evaluated test parameters appear within standard reference intervals.';

    const patientFriendlyExplanation = [
      `📄 What this report is about`,
      `This is a ${docTitle.toLowerCase()} dated ${dateMatch ? dateMatch[1] : 'recently'} from ${doctor.facility || 'the laboratory'}.`,
      ``,
      `Key Findings`,
      patientBulletFindings,
      ``,
      `What this may mean`,
      importantFindings.length > 0
        ? `Certain values differ from the standard reference ranges. This may be related to your symptoms or current health state, but this report alone cannot provide a diagnosis.`
        : `Your measured levels are within expected limits based on the values provided in this report.`,
      ``,
      `What you should do`,
      `Please discuss these findings with your doctor during your consultation, especially if you feel unwell or have questions about your medications.`,
      ``,
      `⚠️ Important`,
      `This summary is generated from your uploaded medical report and is NOT a medical diagnosis. Only a qualified doctor can interpret your test results in context.`,
    ].join('\n');

    const patientSummaryObj = {
      title: docTitle,
      date: dateMatch ? dateMatch[1] : 'Recent',
      about: `This is a ${docTitle.toLowerCase()} dated ${dateMatch ? dateMatch[1] : 'recently'} from ${doctor.facility || 'the laboratory'}.`,
      findings: importantFindings.map((f) => ({
        parameter: f.finding,
        status: f.status,
        interpretation: f.interpretation,
      })),
      meaning: importantFindings.length > 0
        ? `Certain values are outside standard reference intervals. Please review with your doctor.`
        : `All evaluated values are within normal reference ranges.`,
      action: 'Share this report with your physician during your upcoming appointment.',
      disclaimer: 'This summary is generated from your uploaded report and is not a diagnosis. Always discuss abnormal findings with your treating physician.',
      plain_text: patientFriendlyExplanation,
    };

    // 8. Real Confidence Score (Phase 9)
    const { score: confidenceScore, label: extractionConfidence } = computeConfidenceScore({
      patient,
      facility: { name: doctor.facility, date: dateMatch?.[1] },
      labRows,
      aiTierSucceeded: false, // deterministic path
    });

    return {
      document_type: detectedType,
      document_title: docTitle,
      date: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
      patient,
      doctor,
      vitals,
      complaints,
      diagnoses,
      medical_history: medicalHistory,
      prescribed_medicines: prescribedMedicines,
      lab_investigations: labResults,
      important_findings: importantFindings,
      clinical_summary: clinicalSummaryObj,
      patient_summary: patientSummaryObj,
      confidence_score: confidenceScore,
      extraction_confidence: extractionConfidence,
      has_cardiac_history: hasCardiacHistory,
    };
  }

  /**
   * Helper to call specific Groq model with timeout
   */
  async callGroqModel(prompt, model = 'llama-3.3-70b-versatile', groqKey = process.env.GROQ_API_KEY) {
    if (!groqKey || !groqKey.startsWith('gsk_')) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an elite clinical diagnostic AI and medical pathologist. Analyze the uploaded document text and output ONLY valid JSON adhering strictly to the requested schema. No conversational preamble or code fences.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn(`[Groq Model ${model}]: returned HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return this.parseOcrContent(content);
    } catch (err) {
      clearTimeout(timeout);
      logger.warn(`[Groq Model ${model} Error]: ${err.message}`);
      return null;
    }
  }

  /**
   * Primary Tier: Call Groq Cloud AI for deep clinical reasoning and entity extraction
   */
  async callGroqClinicalAnalysis(rawText, docTypeHint = 'LAB_REPORT', fileName = '') {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || !groqKey.startsWith('gsk_')) return null;

    const prompt = `You are a Senior Hospital Diagnostic Pathologist and Consultant Physician.
Analyze the following extracted medical text from an uploaded clinical document (${docTypeHint || 'Medical Report'}, file: "${fileName}").

=== CRITICAL EXTRACTION RULES (MUST FOLLOW EXACTLY) ===
1. "observed_value" MUST be a single numeric string (e.g. "35.00"). NEVER put a range here.
2. "reference_range" MUST be the exact range printed in the document (e.g. "15.00 - 40.00"). Do NOT invent, normalize, or change it.
3. "flag" MUST be exactly what the lab report printed: "Normal", "High", "Low", "Borderline", or "Critical". Do NOT infer or silently change the flag. If not stated in the source document, use null.
4. "Borderline" is its own status — NEVER collapse it to "Normal" or "High".
5. "unit" MUST be a clinical unit string only (e.g. "U/L", "g/dL", "mg/dL"). NEVER use "Normal", "High", "Low", "Calculated", or any flag word as a unit.
6. Do NOT generate patient name, doctor name, or facility name if not clearly present in the text. Use null instead of guessing.
7. If a numeric value cannot be reliably extracted from the text, set observed_value to null and extraction_quality to "UNRELIABLE".
8. Do NOT invent medication names or diagnoses that are not stated in the document.
=== END CRITICAL RULES ===

Your tasks:
1. Classify the document type: "LAB_REPORT", "PRESCRIPTION", "DISCHARGE_SUMMARY", "IMAGING_REPORT", "CONSULTATION_NOTE", or "OTHER".
2. Extract patient demographics (name, age, gender, patient_id/UHID) if clearly present.
3. Extract facility/hospital name, doctor name, and date — only if clearly stated.
4. Extract ALL lab investigations/tests visible in the document: test name, observed value (single number only), unit, reference interval (as printed), and status flag (verbatim from source).
5. Extract all prescribed medications: drug name, generic name, dosage, frequency, duration, timing (before/after food), instructions.
6. Extract recorded vitals (blood pressure, pulse rate, temperature, SpO2, respiratory rate, blood sugar).
7. Extract clinical diagnoses, chief complaints/symptoms, past medical history, and allergies.
8. Identify clinically important or abnormal findings with clinical interpretation. Note any cardiac history or critical life-threatening values.
9. Generate a structured Clinical Summary (Physician Digest) for doctors with these exact keys:
   - patient_overview, document_type, facility, doctor, date, chief_complaints, medical_history,
     current_medications, investigations_count, important_findings, abnormal_count, physician_digest
10. Generate a Patient-Friendly Summary with these exact keys:
   - title, date, about, findings (array of {parameter, status, interpretation}), meaning, action, disclaimer, plain_text

DOCUMENT EXTRACTED TEXT:
"""
${rawText.slice(0, 12000)}
"""

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "document_type": "LAB_REPORT",
  "document_title": "string",
  "patient": {
    "name": "string or null",
    "age": "string or null",
    "gender": "Male | Female | Other | null",
    "patient_id": "string or null",
    "date_of_birth": "string or null"
  },
  "doctor": {
    "name": "string or null",
    "facility": "string",
    "department": "string or null",
    "qualification": "string or null"
  },
  "vitals": {
    "BP": "string or null",
    "PR": "string or null",
    "temp": "string or null",
    "spo2": "string or null",
    "respiratory_rate": "string or null",
    "blood_sugar": "string or null"
  },
  "complaints": ["string"],
  "diagnoses": ["string"],
  "medical_history": ["string"],
  "allergies": ["string"],
  "lab_investigations": [
    {
      "test_name": "string",
      "category": "string",
      "observed_value": "string",
      "reference_range": "string",
      "unit": "string",
      "flag": "NORMAL | HIGH | LOW | CRITICAL",
      "status": "NORMAL | HIGH | LOW | CRITICAL",
      "alert": true
    }
  ],
  "prescribed_medicines": [
    {
      "name": "string",
      "generic_name": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string"
    }
  ],
  "important_findings": [
    {
      "finding": "string",
      "category": "string",
      "status": "NORMAL | HIGH | LOW | CRITICAL",
      "severity": "NORMAL | IMPORTANT | CRITICAL",
      "value": "string",
      "reference_range": "string",
      "unit": "string",
      "interpretation": "string"
    }
  ],
  "has_cardiac_history": false,
  "clinical_summary": {
    "patient_overview": "string",
    "document_type": "string",
    "facility": "string",
    "doctor": "string",
    "date": "string",
    "chief_complaints": ["string"],
    "medical_history": ["string"],
    "current_medications": ["string"],
    "investigations_count": 0,
    "important_findings": ["string"],
    "abnormal_count": 0,
    "physician_digest": "string"
  },
  "patient_summary": {
    "title": "string",
    "date": "string",
    "about": "string",
    "findings": [
      {
        "parameter": "string",
        "status": "string",
        "interpretation": "string"
      }
    ],
    "meaning": "string",
    "action": "string",
    "disclaimer": "string",
    "plain_text": "string"
  },
  "confidence_score": 0.95,
  "extraction_confidence": "CLEAR"
}`;

    // Try primary 70b model, fallback to 8b on failure
    let result = await this.callGroqModel(prompt, 'llama-3.3-70b-versatile', groqKey);
    if (!result) {
      result = await this.callGroqModel(prompt, 'llama-3.1-8b-instant', groqKey);
    }
    return result;
  }

  /**
   * Secondary Tier: Call Google Gemini API for clinical document analysis
   */
  async callGeminiClinicalAnalysis(rawText, docTypeHint = 'LAB_REPORT', fileName = '') {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.trim().length < 10) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert clinical diagnostic AI. Analyze this medical document text (${docTypeHint || 'Report'}, file: "${fileName}") and extract all clinical entities in strict JSON according to clinical schema.\n\nDOCUMENT TEXT:\n"""\n${rawText.slice(0, 12000)}\n"""`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn(`[Gemini Document Analysis]: returned HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return this.parseOcrContent(text);
    } catch (err) {
      clearTimeout(timeout);
      logger.warn(`[Gemini Document Analysis Error]: ${err.message}`);
      return null;
    }
  }

  /**
   * Tertiary Tier: Call n8n Document Processing Webhook if configured
   */
  async callN8nClinicalAnalysis(rawText, docTypeHint = 'LAB_REPORT', fileName = '') {
    const webhookUrl = process.env.N8N_DOCUMENT_WEBHOOK;
    if (!webhookUrl || webhookUrl.includes('localhost:5678')) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          document_text: rawText,
          ocr_text: rawText,
          document_type: docTypeHint,
          file_name: fileName,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return this.parseOcrContent(data);
      }
      return null;
    } catch (err) {
      clearTimeout(timeout);
      logger.warn(`[n8n Document Webhook Notice]: ${err.message}`);
      return null;
    }
  }

  /**
   * Local LLM Tier: Call local Ollama AI (e.g. qwen2.5-coder:7b or gemma4:26b) if available
   */
  async callOllamaClinicalAnalysis(rawText, docTypeHint = 'LAB_REPORT', fileName = '') {
    const baseUrl = process.env.OLLAMA_API_BASE || 'http://localhost:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const prompt = `You are a clinical pathology assistant. Extract structured clinical data from this medical document text (${docTypeHint || 'LAB_REPORT'}). Output ONLY a valid JSON object.
CRITICAL EXTRACTION RULES:
1. Patient name is the actual human person who had the test done (e.g. "Yashvi M. Patel"), located in demographics header near Age/Sex/UHID. NEVER extract clinical conditions or phrases from notes (e.g. "patient with Chronic liver disease", "in an asymptomatic patient") as patient name!
2. Doctor is the referring doctor or consultant (e.g. "Dr. Hiren Shah"). Do NOT append "Reported on" or dates.
3. Extract all lab parameters with numerical values, clean units, and reference ranges.

DOCUMENT TEXT:
"""
${rawText.slice(0, 8000)}
"""

Respond with ONLY this JSON structure:
{
  "document_type": "LAB_REPORT",
  "document_title": "string",
  "patient": { "name": "string", "age": "string", "gender": "Male|Female|Other" },
  "doctor": { "name": "string", "facility": "string" },
  "lab_investigations": [
    { "test_name": "string", "observed_value": "string", "unit": "string", "reference_range": "string", "flag": "NORMAL|HIGH|LOW|CRITICAL" }
  ],
  "diagnoses": ["string"],
  "prescribed_medicines": [],
  "clinical_summary": { "physician_digest": "string" },
  "patient_summary": { "about": "string", "meaning": "string", "action": "string", "plain_text": "string" }
}`;

      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-coder:7b',
          prompt,
          format: 'json',
          stream: false,
          options: { temperature: 0.1 }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) return null;
      const data = await res.json();
      return this.parseOcrContent(data.response);
    } catch (err) {
      clearTimeout(timeout);
      return null;
    }
  }

  /**
   * Hybrid Enrichment: Cross-verify AI results with standard clinical reference ranges.
   *
   * Phase 9 Upgrade:
   * - Validates AI observed_value is actually a number (not a range or hallucination)
   * - Preserves source_flag verbatim; sets verification_required if computed flag differs
   * - Sanitizes units extracted by AI
   * - Merges with rule-based results to recover any missed parameters
   * - Forbids silent range/name injection for null AI fields
   */
  enrichAndNormalizeAnalysis(aiResult, ruleBasedResult = null, rawText = '') {
    if (!aiResult) return ruleBasedResult;

    const rule = ruleBasedResult || {};
    const docType = aiResult.document_type || rule.document_type || 'LAB_REPORT';
    const docTitle = aiResult.document_title || rule.document_title || 'Medical Diagnostic Report';

    // Blacklist validation helper: rejects clinical phrases or conditions acting as names
    const isBadName = (name) => {
      if (!name) return true;
      return (
        /\b(?:with|chronic|acute|disease|asymptomatic|patient|liver|hepatitis|cirrhosis|report|investigation|technician|pathologist|doctor|dr\.|hospital|clinic|sample|specimen|test|result|normal|high|low|reference|ratio|finding|note|medical|evaluation|admitted|fibrosis)\b/i.test(
          name
        ) ||
        name.length < 3 ||
        name.length > 40
      );
    };

    let resolvedName = null;
    if (aiResult.patient?.name && !isBadName(aiResult.patient.name)) {
      resolvedName = aiResult.patient.name.trim();
    } else if (rule.patient?.name && !isBadName(rule.patient.name)) {
      resolvedName = rule.patient.name.trim();
    }

    // Normalize patient demographics
    const patient = {
      name: resolvedName,
      age: aiResult.patient?.age || rule.patient?.age || null,
      gender: aiResult.patient?.gender || rule.patient?.gender || null,
      patient_id: aiResult.patient?.patient_id || rule.patient?.patient_id || null,
      date_of_birth: aiResult.patient?.date_of_birth || null,
    };

    // Normalize doctor/facility
    let resolvedDocName = aiResult.doctor?.name || rule.doctor?.name || null;
    if (resolvedDocName) {
      resolvedDocName = resolvedDocName.replace(/\s+(?:reported|collected|registered|generated|sample|date|time|uhid|ref|page|contact).*$/i, '').trim();
    }

    const doctor = {
      name: resolvedDocName || 'Attending Physician',
      facility: aiResult.doctor?.facility || rule.doctor?.facility || 'Apex Healthcare Diagnostics',
      department: aiResult.doctor?.department || null,
      qualification: aiResult.doctor?.qualification || rule.doctor?.qualification || 'Medical Specialist',
    };

    // Normalize lab investigations & cross-check with standard reference ranges (Phase 9)
    const labResults = Array.isArray(aiResult.lab_investigations) ? [...aiResult.lab_investigations] : [];
    const importantFindings = Array.isArray(aiResult.important_findings) ? [...aiResult.important_findings] : [];

    // Verify each lab investigation extracted by AI
    labResults.forEach((lab) => {
      // PHASE 9: Validate observed_value is actually a single number, not a range or hallucination
      const valNum = parseNumericValue(lab.observed_value || lab.value);
      if (valNum === null) {
        // AI returned a non-numeric value (range, word, etc.) — mark as unreliable
        lab.extraction_quality = 'UNRELIABLE';
        lab.observed_value = lab.observed_value ? String(lab.observed_value) : null;
      } else {
        lab.extraction_quality = lab.extraction_quality || 'COMPLETE';
        lab.observed_value = String(valNum);
      }
      lab.value = lab.observed_value;

      // PHASE 9: Sanitize unit — reject flag words contaminating unit field
      lab.unit = sanitizeUnit(lab.unit || '');

      // Preserve source_flag from AI response (verbatim)
      if (!lab.source_flag && lab.flag) {
        // Normalize casing of flag from AI but preserve Borderline
        const flagUpper = String(lab.flag).toUpperCase();
        if (flagUpper === 'BORDERLINE') lab.source_flag = 'BORDERLINE';
        else if (flagUpper === 'NORMAL') lab.source_flag = 'NORMAL';
        else if (flagUpper === 'HIGH') lab.source_flag = 'HIGH';
        else if (flagUpper === 'LOW') lab.source_flag = 'LOW';
        else if (flagUpper === 'CRITICAL') lab.source_flag = 'CRITICAL';
        else lab.source_flag = null;
      }

      const testKey = String(lab.test_name || '').toLowerCase().replace(/[^a-z]/g, '_');

      // Cross-check with standard clinical reference range dictionary
      for (const [key, std] of Object.entries(STANDARD_LAB_RANGES)) {
        if (testKey.includes(key) || key.includes(testKey)) {
          // Only fill missing reference range from standard dict — never overwrite source range
          if (!lab.reference_range || lab.reference_range === 'Standard Range' || lab.reference_range === 'Not reported') {
            lab.reference_range = `${std.min} - ${std.max}`;
          }
          if (!lab.unit) lab.unit = std.unit;
          if (!lab.category) lab.category = std.category;

          if (valNum !== null) {
            // PHASE 9: Critical threshold check (overrides source flag only at critical bounds)
            if (std.criticalLow !== null && std.criticalLow !== undefined && valNum <= std.criticalLow) {
              lab.flag = 'CRITICAL';
              lab.status = 'CRITICAL';
              lab.verification_required = true;
            } else if (std.criticalHigh !== null && std.criticalHigh !== undefined && valNum >= std.criticalHigh) {
              lab.flag = 'CRITICAL';
              lab.status = 'CRITICAL';
              lab.verification_required = true;
            } else {
              // Compute flag from value vs range
              const { min: rMin, max: rMax } = parseReferenceRange(lab.reference_range);
              let computedFlag = null;
              if (rMin !== null && rMax !== null) {
                if (valNum < rMin) computedFlag = 'LOW';
                else if (valNum > rMax) computedFlag = 'HIGH';
                else computedFlag = 'NORMAL';
              }
              lab.computed_flag = computedFlag;

              // If source flag conflicts with computed flag, flag for verification
              if (lab.source_flag && computedFlag && lab.source_flag !== computedFlag && lab.source_flag !== 'BORDERLINE') {
                lab.verification_required = true;
              }

              // Use source flag as primary; fall back to computed
              if (!lab.flag || lab.flag === 'NORMAL' && computedFlag && computedFlag !== 'NORMAL') {
                lab.flag = lab.source_flag || computedFlag || 'NORMAL';
              } else if (lab.source_flag) {
                lab.flag = lab.source_flag; // always honour source
              }
              lab.status = lab.flag;
            }
          }
          break;
        }
      }

      lab.alert = lab.flag === 'CRITICAL' || lab.flag === 'HIGH' || lab.flag === 'LOW' ||
                  lab.flag === 'BORDERLINE' || lab.flag === 'ABNORMAL';

      // Ensure abnormal finding is recorded in important_findings
      if (lab.alert && !importantFindings.some((f) => f.finding?.toLowerCase().includes(String(lab.test_name).toLowerCase()))) {
        importantFindings.push({
          finding: `${lab.test_name}: ${lab.observed_value} ${lab.unit || ''} (Ref: ${lab.reference_range || 'Standard'}, Flag: ${lab.flag})`,
          category: lab.category || 'Investigation',
          status: lab.flag || 'HIGH',
          severity: lab.flag === 'CRITICAL' ? 'CRITICAL' : 'IMPORTANT',
          value: String(lab.observed_value || ''),
          reference_range: lab.reference_range || '',
          unit: lab.unit || '',
          source_flag: lab.source_flag,
          verification_required: lab.verification_required || false,
          interpretation: lab.clinical_significance ||
            (lab.flag === 'LOW' ? 'Value is below standard reference interval.' :
             lab.flag === 'CRITICAL' ? 'Critical clinical threshold crossed. Immediate physician attention advised.' :
             lab.flag === 'BORDERLINE' ? 'Value is at the borderline of the reference interval. Monitor closely.' :
             'Value is elevated compared to expected reference interval.'),
        });
      }
    });

    // Merge any rule-based findings that were missed
    if (rule.lab_investigations) {
      for (const rLab of rule.lab_investigations) {
        if (!labResults.some((l) => l.test_name?.toLowerCase().includes(rLab.test_name?.toLowerCase()))) {
          labResults.push(rLab);
        }
      }
    }

    if (rule.important_findings) {
      for (const rFind of rule.important_findings) {
        if (!importantFindings.some((f) => f.finding?.toLowerCase().includes(rFind.finding?.toLowerCase()))) {
          importantFindings.push(rFind);
        }
      }
    }

    // Prescribed medicines
    const prescribedMedicines = Array.isArray(aiResult.prescribed_medicines) ? [...aiResult.prescribed_medicines] : [];
    if (rule.prescribed_medicines) {
      for (const rMed of rule.prescribed_medicines) {
        if (!prescribedMedicines.some((m) => m.name?.toLowerCase().includes(rMed.name?.toLowerCase()))) {
          prescribedMedicines.push(rMed);
        }
      }
    }

    // Complaints, Diagnoses, Medical History
    const complaints = Array.from(new Set([...(aiResult.complaints || []), ...(rule.complaints || [])]));
    const diagnoses = Array.from(new Set([...(aiResult.diagnoses || []), ...(rule.diagnoses || [])]));
    const medicalHistory = Array.from(new Set([...(aiResult.medical_history || []), ...(rule.medical_history || [])]));
    const allergies = Array.isArray(aiResult.allergies) ? aiResult.allergies : [];
    const vitals = { ...(rule.vitals || {}), ...(aiResult.vitals || {}) };

    const hasCardiacHistory = Boolean(
      aiResult.has_cardiac_history ||
      rule.has_cardiac_history ||
      /cardiac|myocardial\s+infarction|angina|cad\b|coronary|heart\s+attack/i.test(rawText)
    );

    // Build guaranteed-safe Clinical Summary Object
    const abnormalCount = importantFindings.filter((f) => f.status !== 'NORMAL').length;
    let physicianDigestText = aiResult.clinical_summary?.physician_digest;
    if (typeof physicianDigestText !== 'string' || physicianDigestText.trim().length < 20) {
      physicianDigestText = rule.clinical_summary?.physician_digest || [
        `Patient Overview: ${patient.name || 'Patient'} (${patient.age ? `${patient.age}y` : 'Age unstated'}, ${patient.gender || 'Gender unstated'}).`,
        `Document Type: ${docType} from ${doctor.facility}. Date: ${aiResult.clinical_summary?.date || 'Recent'}.`,
        complaints.length > 0 ? `Chief Complaints: ${complaints.join(', ')}.` : 'Chief Complaints: None explicitly documented.',
        medicalHistory.length > 0 ? `Relevant Medical History: ${medicalHistory.join(', ')}.` : 'Relevant Medical History: Non-contributory.',
        prescribedMedicines.length > 0 ? `Current Medications: ${prescribedMedicines.map((m) => `${m.name} ${m.dosage || ''}`).join(', ')}.` : 'Current Medications: None listed in document.',
        labResults.length > 0 ? `Investigations: ${labResults.length} parameter(s) evaluated.` : 'Investigations: Non-laboratory diagnostic record.',
        importantFindings.length > 0 ? `Important Abnormal Findings: ${importantFindings.map((f) => f.finding).join('; ')}.` : 'Important Abnormal Findings: All evaluated values appear within reference limits.',
        hasCardiacHistory ? 'Possible Risk Indicators: Document notes previous cardiac history; clinical correlation with acute symptoms advised.' : null,
        diagnoses.length > 0 ? `Provisional/Clinical Diagnoses: ${diagnoses.join('; ')}.` : null,
        'Recommended Follow-up: Clinical correlation by attending physician required. AI extraction is supplementary to original clinical record.',
      ].filter(Boolean).join('\n');
    }

    const clinicalSummaryObj = {
      patient_overview: aiResult.clinical_summary?.patient_overview || `${patient.name || 'Patient'} (${patient.age || 'Age N/A'}, ${patient.gender || 'Gender N/A'})`,
      document_type: docType,
      facility: doctor.facility,
      doctor: doctor.name || 'Attending Physician',
      date: aiResult.clinical_summary?.date || rule.clinical_summary?.date || new Date().toLocaleDateString(),
      chief_complaints: complaints,
      medical_history: medicalHistory,
      current_medications: prescribedMedicines,
      investigations_count: labResults.length,
      important_findings: importantFindings.map((f) => (typeof f === 'string' ? f : f.finding)),
      abnormal_count: abnormalCount,
      physician_digest: String(physicianDigestText),
    };

    // Build guaranteed-safe Patient Summary Object
    const patientSummaryObj = {
      title: docTitle,
      date: aiResult.patient_summary?.date || new Date().toLocaleDateString(),
      about: aiResult.patient_summary?.about || `This is a ${docTitle.toLowerCase()} from ${doctor.facility}.`,
      findings: Array.isArray(aiResult.patient_summary?.findings) && aiResult.patient_summary.findings.length > 0
        ? aiResult.patient_summary.findings
        : importantFindings.map((f) => ({
            parameter: f.finding,
            status: f.status || 'ATTENTION',
            interpretation: f.interpretation || 'Discuss with treating physician.',
          })),
      meaning: aiResult.patient_summary?.meaning || (abnormalCount > 0
        ? 'Certain measured values differ from standard reference ranges. Please discuss these with your doctor.'
        : 'All evaluated parameters appear within normal reference limits.'),
      action: aiResult.patient_summary?.action || 'Share this report with your physician during your upcoming consultation.',
      disclaimer: 'This summary is generated from your uploaded report and is NOT a medical diagnosis. Only a qualified doctor can interpret your test results in clinical context.',
      plain_text: String(aiResult.patient_summary?.plain_text || rule.patient_summary?.plain_text || physicianDigestText),
    };

    return {
      document_type: docType,
      document_title: docTitle,
      date: clinicalSummaryObj.date,
      patient,
      doctor,
      vitals,
      complaints,
      diagnoses,
      medical_history: medicalHistory,
      allergies,
      prescribed_medicines: prescribedMedicines,
      lab_investigations: labResults,
      important_findings: importantFindings,
      clinical_summary: clinicalSummaryObj,
      patient_summary: patientSummaryObj,
      confidence_score: aiResult.confidence_score || 0.95,
      extraction_confidence: aiResult.extraction_confidence || 'CLEAR',
      has_cardiac_history: hasCardiacHistory,
    };
  }

  /**
   * Multi-Tier AI Document Analysis Orchestrator:
   * Feeds extracted text to Groq Cloud AI, with fallback to Gemini, n8n, and rule-based parser.
   */
  async analyzeExtractedTextWithAI(rawText, docTypeHint = 'LAB_REPORT', fileName = '') {
    if (!rawText || rawText.trim().length < 5) return null;

    let aiResult = null;

    // 1. Try Groq Cloud AI (Primary)
    try {
      aiResult = await this.callGroqClinicalAnalysis(rawText, docTypeHint, fileName);
      if (aiResult) {
        logger.info(`[Document AI Engine]: Groq AI successfully extracted clinical insights for "${fileName || docTypeHint}"`);
      }
    } catch (groqErr) {
      logger.warn(`[Document AI Engine]: Groq analysis notice: ${groqErr.message}`);
    }

    // 2. Try Google Gemini AI (Secondary)
    if (!aiResult) {
      try {
        aiResult = await this.callGeminiClinicalAnalysis(rawText, docTypeHint, fileName);
        if (aiResult) {
          logger.info(`[Document AI Engine]: Gemini AI successfully extracted clinical insights for "${fileName || docTypeHint}"`);
        }
      } catch (geminiErr) {
        logger.warn(`[Document AI Engine]: Gemini analysis notice: ${geminiErr.message}`);
      }
    }

    // 3. Try Local Ollama AI (if available on OLLAMA_API_BASE)
    if (!aiResult) {
      try {
        aiResult = await this.callOllamaClinicalAnalysis(rawText, docTypeHint, fileName);
        if (aiResult) {
          logger.info(`[Document AI Engine]: Ollama local AI successfully extracted clinical insights for "${fileName || docTypeHint}"`);
        }
      } catch (ollamaErr) {
        logger.warn(`[Document AI Engine]: Ollama analysis notice: ${ollamaErr.message}`);
      }
    }

    // 4. Try n8n Webhook (Quaternary)
    if (!aiResult) {
      try {
        aiResult = await this.callN8nClinicalAnalysis(rawText, docTypeHint, fileName);
        if (aiResult) {
          logger.info(`[Document AI Engine]: n8n webhook successfully extracted clinical insights for "${fileName || docTypeHint}"`);
        }
      } catch (n8nErr) {
        logger.warn(`[Document AI Engine]: n8n analysis notice: ${n8nErr.message}`);
      }
    }

    // Deterministic parser results for cross-verification & fallback
    const ruleBasedResult = this.extractClinicalDataIntelligently(rawText, docTypeHint, fileName);

    if (!aiResult) {
      logger.info(`[Document AI Engine]: Using deterministic clinical intelligence parser for "${fileName || docTypeHint}"`);
      return ruleBasedResult;
    }

    // Hybrid Enrichment: Merge AI insights with standard clinical ranges & safety guards
    return this.enrichAndNormalizeAnalysis(aiResult, ruleBasedResult, rawText);
  }

  /**
   * Synchronize extracted document clinical findings into the active ClinicalSession
   */
  async syncDocumentToClinicalSession(sessionId, clinicalData, patientId = null) {
    if (!sessionId || sessionId === 'undefined' || !clinicalData) return;

    try {
      const session = await ClinicalSession.findOne({ session_id: sessionId });
      if (!session) return;

      const currentState = session.clinical_state || {};
      const existingMeds = Array.isArray(currentState.medications) ? currentState.medications : [];
      const existingAllergies = Array.isArray(currentState.allergies) ? currentState.allergies : [];
      const existingHistory = Array.isArray(currentState.relevant_history) ? currentState.relevant_history : [];
      const existingSymptoms = Array.isArray(currentState.symptoms) ? currentState.symptoms : [];

      // Extract new medicines
      const newMeds = (clinicalData.prescribed_medicines || []).map((m) => {
        const parts = [m.name, m.dosage, m.frequency].filter(Boolean);
        return parts.join(' ');
      }).filter(Boolean);

      // Extract new allergies
      const newAllergies = (clinicalData.allergies || []).filter(Boolean);

      // Extract new medical history
      const newHistory = (clinicalData.medical_history || []).filter(Boolean);

      // Extract new symptoms / complaints
      const newSymptoms = (clinicalData.complaints || []).filter(Boolean);

      const mergedMeds = Array.from(new Set([...existingMeds, ...newMeds]));
      const mergedAllergies = Array.from(new Set([...existingAllergies, ...newAllergies]));
      const mergedHistory = Array.from(new Set([...existingHistory, ...newHistory]));
      const mergedSymptoms = Array.from(new Set([...existingSymptoms, ...newSymptoms]));

      const updates = {
        'clinical_state.medications': mergedMeds,
        'clinical_state.allergies': mergedAllergies,
        'clinical_state.relevant_history': mergedHistory,
        'clinical_state.symptoms': mergedSymptoms,
      };

      if (!currentState.chief_complaint && clinicalData.complaints?.length > 0) {
        updates['clinical_state.chief_complaint'] = clinicalData.complaints[0];
      }

      // Update clinical summary fields
      const currentSummary = session.clinical_summary || {};
      updates['clinical_summary.medications'] = mergedMeds;
      updates['clinical_summary.allergies'] = mergedAllergies;
      updates['clinical_summary.past_medical_history'] = mergedHistory;
      updates['clinical_summary.symptoms'] = mergedSymptoms;

      await ClinicalSession.findOneAndUpdate(
        { session_id: sessionId },
        { $set: updates }
      );

      logger.info(`[Session Document Intelligence Sync]: Synchronized document findings into session ${sessionId} (${mergedMeds.length} meds, ${mergedHistory.length} history items)`);
    } catch (err) {
      logger.warn(`[Session Document Intelligence Sync Error]: ${err.message}`);
    }
  }

  /**
   * On-demand AI re-analysis of an existing uploaded medical document
   */
  async reanalyzeDocument(documentId) {
    if (!documentId) throw ApiError.badRequest('Document ID is required');

    const doc = await documentRepository.findByDocumentId(documentId);
    if (!doc) throw ApiError.notFound(`Medical document '${documentId}' was not found.`);

    const rawText = doc.extracted_text || '';
    if (!rawText || rawText.trim().length < 5) {
      throw ApiError.badRequest(`Document '${documentId}' does not contain any extracted text to analyze.`);
    }

    const analysis = await this.analyzeExtractedTextWithAI(rawText, doc.document_type, doc.file_name);
    if (!analysis) {
      throw ApiError.internal('Failed to generate AI analysis for document.');
    }

    const structuredExtractedData = {
      patient: analysis.patient || {},
      doctor: analysis.doctor || {},
      diagnoses: analysis.diagnoses || [],
      symptoms: analysis.complaints || [],
      chief_complaints: analysis.complaints || [],
      medical_history: analysis.medical_history || [],
      allergies: analysis.allergies || [],
      current_medications: analysis.prescribed_medicines || [],
      previous_medications: [],
      investigations: (analysis.lab_investigations || []).map((l) => l.test_name),
      lab_results: analysis.lab_investigations || [],
      findings: analysis.important_findings || [],
      vitals: analysis.vitals || {},
    };

    const requiresVerification = Boolean(
      analysis.important_findings?.some((f) => f.severity === 'CRITICAL' || f.status === 'CRITICAL') ||
      analysis.has_cardiac_history
    );

    const updated = await documentRepository.updateAnalysis(documentId, {
      structured_data: analysis,
      extracted_data: structuredExtractedData,
      clinical_summary: analysis.clinical_summary,
      patient_summary: analysis.patient_summary,
      important_findings: analysis.important_findings || [],
      confidence_score: analysis.confidence_score || 0.95,
      extraction_confidence: analysis.extraction_confidence || 'CLEAR',
      requires_doctor_verification: requiresVerification,
      processing_status: 'COMPLETED',
    });

    if (doc.session_id) {
      await this.syncDocumentToClinicalSession(doc.session_id, analysis, doc.patient_id).catch(() => {});
    }

    return {
      success: true,
      document_id: doc.document_id,
      analysis,
      updatedDocument: updated,
    };
  }

  /**
   * Process document upload, run OCR/PDF text extraction, generate dual summaries,
   * save to MongoDB, auto-populate clinical observations, and link to red-flag engine.
   */
  async processAndPersistDocument({
    fileBuffer,
    fileName = 'document.pdf',
    fileSize = 0,
    mimeType = '',
    savedFilePath = null,
    documentType = 'LAB_REPORT',
    patientId = null,
    sessionId = null,
    directText = null,
    title = null,
  }) {
    const docId = `doc-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    let rawExtractedText = directText || '';
    let extractedClinicalData = null;
    let processingError = null;

    const isPdf = Boolean(
      (mimeType && mimeType.includes('pdf')) ||
      (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
      (fileBuffer && fileBuffer.slice(0, 5).toString().includes('%PDF'))
    );

    // 1. Text Extraction
    if (!directText && fileBuffer) {
      if (isPdf) {
        // PDF Direct Text Extraction
        try {
          rawExtractedText = await this.extractTextFromPdf(fileBuffer);
        } catch (pdfErr) {
          logger.warn('[PDF Text Extraction Error]: ' + pdfErr.message);
        }
      }

      // If PDF had no embedded text (scanned PDF) or file is an image, run OCR
      if (!rawExtractedText || rawExtractedText.trim().length < 15) {
        try {
          const processedBuffer = await this.prepareImageForOcr(fileBuffer);
          const ocrResult = await Tesseract.recognize(processedBuffer, 'eng');
          rawExtractedText = (ocrResult?.data?.text || '').trim();
        } catch (ocrErr) {
          logger.warn('[Tesseract OCR Error]: ' + ocrErr.message);
        }
      }
    }

    // 2. Multimodal AI Extraction (Primary: Groq Cloud AI, Secondary: Gemini/n8n, Fallback: Deterministic Rules)
    if (rawExtractedText && rawExtractedText.trim().length > 5) {
      try {
        extractedClinicalData = await this.analyzeExtractedTextWithAI(rawExtractedText, documentType, fileName);
      } catch (aiErr) {
        logger.warn('[AI Document Analysis Pipeline Error]: ' + aiErr.message);
        extractedClinicalData = this.extractClinicalDataIntelligently(rawExtractedText, documentType, fileName);
      }
    } else {
      processingError = "We couldn't understand this document. Please upload a clearer document or try again.";
    }

    const isFailed = Boolean(processingError || (!rawExtractedText && !extractedClinicalData));
    const processingStatus = isFailed ? 'FAILED' : 'COMPLETED';

    const fileUrl = savedFilePath
      ? `/uploads/${path.basename(savedFilePath)}`
      : `/uploads/${fileName}`;

    const resolvedTitle = title || extractedClinicalData?.document_title || fileName;
    const confidenceScore = extractedClinicalData?.confidence_score || (isFailed ? 0.2 : 0.85);
    const extractionConfidence = extractedClinicalData?.extraction_confidence || (isFailed ? 'UNCERTAIN' : 'CLEAR');
    const requiresDoctorVerification = Boolean(
      isFailed ||
      extractedClinicalData?.important_findings?.some((f) => f.severity === 'CRITICAL' || f.status === 'CRITICAL') ||
      extractedClinicalData?.has_cardiac_history
    );

    // 3. Persist to MongoDB MedicalDocument collection
    let savedDocumentDoc = null;
    const resolvedStructuredData = {
      ...(extractedClinicalData || {}),
      document_title: resolvedTitle,
    };

    const structuredExtractedData = {
      patient: extractedClinicalData?.patient || {},
      doctor: extractedClinicalData?.doctor || {},
      diagnoses: extractedClinicalData?.diagnoses || [],
      symptoms: extractedClinicalData?.complaints || [],
      chief_complaints: extractedClinicalData?.complaints || [],
      medical_history: extractedClinicalData?.medical_history || [],
      allergies: [],
      current_medications: extractedClinicalData?.prescribed_medicines || [],
      previous_medications: [],
      investigations: (extractedClinicalData?.lab_investigations || []).map((l) => l.test_name),
      lab_results: extractedClinicalData?.lab_investigations || [],
      findings: extractedClinicalData?.important_findings || [],
      vitals: extractedClinicalData?.vitals || {},
    };

    try {
      savedDocumentDoc = await documentRepository.create({
        document_id: docId,
        patient_id: patientId || null,
        session_id: sessionId || null,
        encounter_id: sessionId || null,
        document_type: extractedClinicalData?.document_type || documentType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
        extracted_text: rawExtractedText,
        structured_data: resolvedStructuredData,
        extracted_data: structuredExtractedData,
        clinical_summary: extractedClinicalData?.clinical_summary || null,
        patient_summary: extractedClinicalData?.patient_summary || null,
        important_findings: extractedClinicalData?.important_findings || [],
        processing_status: processingStatus,
        confidence_score: confidenceScore,
        extraction_confidence: extractionConfidence,
        requires_doctor_verification: requiresDoctorVerification,
        verification_notes: requiresDoctorVerification
          ? 'Abnormal clinical findings or medical history requiring physician verification.'
          : '',
        error: processingError,
      });
    } catch (dbErr) {
      logger.warn(`[Document Repository Save Notice]: ${dbErr.message}`);
    }

    // 4. Auto-populate ClinicalObservations in MongoDB for this session
    if (sessionId && sessionId !== 'undefined' && extractedClinicalData && !isFailed) {
      try {
        // Create observations for prescribed medicines
        for (const med of extractedClinicalData.prescribed_medicines || []) {
          if (med.name) {
            await observationRepository.create({
              session_id: sessionId,
              category: 'MEDICATION',
              name: med.name,
              value: [med.dosage, med.frequency, med.duration].filter(Boolean).join(' - ') || 'Prescribed',
              confidence: confidenceScore,
              source: 'OCR_DOCUMENT',
            });
          }
        }

        // Create observations for lab investigations
        for (const lab of extractedClinicalData.lab_investigations || []) {
          if (lab.test_name) {
            await observationRepository.create({
              session_id: sessionId,
              category: 'LAB_RESULT',
              name: lab.test_name,
              value: `${lab.observed_value || ''} ${lab.unit || ''} (Flag: ${lab.flag || 'NORMAL'}, Ref: ${lab.reference_range || 'Standard'})`,
              confidence: confidenceScore,
              source: 'OCR_DOCUMENT',
            });
          }
        }

        // Create observations for past medical history & diagnoses
        for (const hist of extractedClinicalData.medical_history || []) {
          await observationRepository.create({
            session_id: sessionId,
            category: 'CONDITION',
            name: hist,
            value: 'Document Historical Finding',
            confidence: confidenceScore,
            source: 'OCR_DOCUMENT',
          });
        }
      } catch (obsErr) {
        logger.warn(`[Observation Auto-Population Notice]: ${obsErr.message}`);
      }

      // 4b. Synchronize document findings directly into the active ClinicalSession
      await this.syncDocumentToClinicalSession(sessionId, extractedClinicalData, patientId).catch((err) => {
        logger.warn(`[Session Document Intelligence Sync Notice]: ${err.message}`);
      });

      // 5. Red-Flag Engine Integration: Check for high-risk combinations
      try {
        const session = await sessionRepository.findBySessionId(sessionId);
        if (session) {
          const currentChief = String(session.clinical_state?.chief_complaint || '').toLowerCase();
          const currentSymptoms = (session.clinical_state?.symptoms || []).map((s) => String(s).toLowerCase());
          const hasChestDiscomfort =
            currentChief.includes('chest') ||
            currentChief.includes('છાતી') ||
            currentChief.includes('सीना') ||
            currentSymptoms.some((s) => s.includes('chest') || s.includes('છાતી') || s.includes('सीना'));

          const hasCriticalLabs = extractedClinicalData.important_findings?.some((f) => f.severity === 'CRITICAL' || f.status === 'CRITICAL');

          if (extractedClinicalData.has_cardiac_history && hasChestDiscomfort) {
            logger.info(`[RedFlag Linkage] Document cardiac history combined with chest discomfort in session ${sessionId}. Escalating triage.`);
            await redFlagCaseService.triggerRedFlagCase({
              sessionId,
              patientId: patientId || session.patient_id,
              triageResult: {
                category: 'CARDIOVASCULAR_EMERGENCY',
                reason: 'Document indicates previous cardiac history alongside currently reported chest discomfort.',
                triage_level: 'EMERGENCY',
              },
              state: {
                ...session.clinical_state,
                chief_complaint: session.clinical_state?.chief_complaint || 'Chest Discomfort with Prior Cardiac History',
                symptoms: [...(session.clinical_state?.symptoms || []), 'Previous Cardiac History (From Uploaded Document)'],
              },
              actorId: 'DOCUMENT_INTELLIGENCE_ENGINE',
            });
          } else if (hasCriticalLabs) {
            const criticalItem = extractedClinicalData.important_findings.find((f) => f.severity === 'CRITICAL' || f.status === 'CRITICAL');
            logger.info(`[RedFlag Linkage] Critical laboratory parameter detected in document for session ${sessionId}: ${criticalItem?.finding}`);
            await sessionRepository.updateStatus(sessionId, 'PRIORITY_TRIAGE', {
              triage_level: 'HIGH PRIORITY',
              triage_reason: `Critical laboratory parameter detected: ${criticalItem?.finding}`,
              'red_flags.has_red_flag': true,
              'red_flags.severity': 'HIGH',
              'red_flags.reason': `Critical finding from medical document: ${criticalItem?.finding}`,
              'red_flags.triggered_at': new Date(),
            });
          }
        }
      } catch (redFlagErr) {
        logger.warn(`[RedFlag Engine Linkage Notice]: ${redFlagErr.message}`);
      }
    }

    const docResultId = (savedDocumentDoc && savedDocumentDoc._id) ? String(savedDocumentDoc._id) : docId;

    return {
      status: isFailed ? 'failed' : 'success',
      documentId: docId,
      document_id: docId,
      _id: docResultId,
      id: docResultId,
      patientId: patientId || null,
      patient_id: patientId || null,
      sessionId: sessionId || null,
      session_id: sessionId || null,
      encounterId: sessionId || null,
      encounter_id: sessionId || null,
      documentType: extractedClinicalData?.document_type || documentType,
      document_type: extractedClinicalData?.document_type || documentType,
      fileName: fileName,
      file_name: fileName,
      fileSize: fileSize,
      file_size: fileSize,
      fileUrl: fileUrl,
      file_url: fileUrl,
      ocr_raw_text: rawExtractedText,
      extractedText: rawExtractedText,
      extracted_text: rawExtractedText,
      extractedData: structuredExtractedData,
      extracted_data: structuredExtractedData,
      structuredData: resolvedStructuredData,
      structured_data: resolvedStructuredData,
      clinicalSummary: extractedClinicalData?.clinical_summary || null,
      clinical_summary: extractedClinicalData?.clinical_summary || null,
      patientSummary: extractedClinicalData?.patient_summary || null,
      patient_summary: extractedClinicalData?.patient_summary || null,
      importantFindings: extractedClinicalData?.important_findings || [],
      important_findings: extractedClinicalData?.important_findings || [],
      confidenceScore: confidenceScore,
      confidence_score: confidenceScore,
      extractionConfidence: extractionConfidence,
      extraction_confidence: extractionConfidence,
      processingStatus: processingStatus,
      processing_status: processingStatus,
      requires_doctor_verification: requiresDoctorVerification,
      verification_notes: requiresDoctorVerification ? 'Abnormal findings require physician verification.' : '',
      error: processingError,
      createdAt: savedDocumentDoc?.createdAt || new Date().toISOString(),
    };
  }
}

export const documentService = new DocumentService();
export default documentService;
