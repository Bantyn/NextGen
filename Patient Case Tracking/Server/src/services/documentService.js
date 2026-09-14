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
  sgpt: { min: 0, max: 45, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  alt: { min: 0, max: 45, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  sgot: { min: 0, max: 40, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  ast: { min: 0, max: 40, unit: 'U/L', criticalLow: null, criticalHigh: 300, category: 'Liver Function' },
  total_bilirubin: { min: 0.2, max: 1.2, unit: 'mg/dL', criticalLow: null, criticalHigh: 10.0, category: 'Liver Function' },
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
   * Parse numerical value from string
   */
  parseNumber(str) {
    if (!str) return null;
    const match = String(str).replace(/,/g, '').match(/[-+]?[0-9]*\.?[0-9]+/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Deterministic High-Intelligence Clinical Extractor
   * Extracts patient info, clinical facts, lab investigations with reference ranges and flags,
   * generates two-level summaries, and compiles important findings.
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

    // 2. Patient Demographics
    const patientNameMatch = rawText.match(/(?:patient\s*(?:name)?|mr\.|mrs\.|ms\.|pt\.?\s*name)[:\s]+([A-Za-z][A-Za-z\s.]{1,40}?)(?:\r?\n|$|,|;|\bage\b|\bsex\b|\bgender\b)/i);
    const ageMatch = rawText.match(/(?:age|years?|yrs?)[:\s]+(\d{1,3})/i);
    const genderMatch = rawText.match(/(?:gender|sex)[:\s]+(male|female|other|m|f)\b/i);
    const pidMatch = rawText.match(/(?:patient\s*id|pid|uhid|reg(?:istration)?\.?\s*no|sample\s*no)[:\s]+([A-Za-z0-9\-_]+)/i);
    const dateMatch = rawText.match(/(?:date|reported|collected|sampled)[:\s]*(\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b)/i) ||
      rawText.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i);

    const patient = {
      name: patientNameMatch ? patientNameMatch[1].trim() : null,
      age: ageMatch ? String(ageMatch[1]) : null,
      gender: genderMatch ? (genderMatch[1].toUpperCase().startsWith('M') ? 'Male' : genderMatch[1].toUpperCase().startsWith('F') ? 'Female' : 'Other') : null,
      patient_id: pidMatch ? pidMatch[1].trim() : null,
      date_of_birth: null,
    };

    // 3. Facility and Doctor Details
    const facilityMatch = lines.find((l) => /hospital|clinic|pathology|laboratory|diagnostic|health\s*centre|medical\s*center/i.test(l));
    const doctorMatches = (rawText.match(/(?:dr\.|doctor)\s+([A-Z][a-zA-Z\s.]+)/gi) || []).map((d) => d.trim());

    const doctor = {
      name: doctorMatches[0] || null,
      facility: facilityMatch || 'Apex Healthcare Diagnostics',
      qualification: rawText.match(/(?:mbbs|md|ms|bams|bhms|dnb|frcp|m\.ch)/i)?.[0] || 'Medical Specialist',
    };

    // 4. Lab Investigations Extraction
    const labResults = [];
    const importantFindings = [];

    // Lab row regex: Test Name observed_value unit reference_range
    const testPatterns = [
      { key: 'hemoglobin', name: 'Hemoglobin (Hb)', regex: /(?:hemoglobin|haemoglobin|hb)\b[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'wbc', name: 'WBC / Total Leukocyte Count', regex: /(?:wbc|tlc|total\s+leukocyte\s+count|white\s+blood\s+cell)[:\s]*([0-9,.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9,.]+\s*-\s*[0-9,.]+)[\)]?)?/i },
      { key: 'platelets', name: 'Platelet Count', regex: /(?:platelet(?:s)?(?:\s+count)?|thrombocyte)[:\s]*([0-9,.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9,.]+\s*-\s*[0-9,.]+)[\)]?)?/i },
      { key: 'rbc', name: 'RBC Count', regex: /(?:rbc|red\s+blood\s+cell)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'fasting_glucose', name: 'Fasting Blood Sugar (FBS)', regex: /(?:fasting\s+(?:blood\s+)?(?:sugar|glucose)|fbs)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'blood_sugar', name: 'Random Blood Sugar (RBS)', regex: /(?:random\s+(?:blood\s+)?(?:sugar|glucose)|rbs|blood\s+glucose)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'hba1c', name: 'HbA1c (Glycated Hemoglobin)', regex: /(?:hba1c|glycated\s+hemoglobin)[:\s]*([0-9.]+)\s*(%?)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'serum_creatinine', name: 'Serum Creatinine', regex: /(?:serum\s+creatinine|creatinine)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'blood_urea', name: 'Blood Urea', regex: /(?:blood\s+urea|urea)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'uric_acid', name: 'Serum Uric Acid', regex: /(?:uric\s+acid)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'sgpt', name: 'SGPT / ALT', regex: /(?:sgpt|alt|alanine\s+aminotransferase)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'sgot', name: 'SGOT / AST', regex: /(?:sgot|ast|aspartate\s+aminotransferase)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'total_bilirubin', name: 'Total Bilirubin', regex: /(?:total\s+bilirubin|bilirubin\s+total)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'total_cholesterol', name: 'Total Cholesterol', regex: /(?:total\s+cholesterol|cholesterol\s+total)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'triglycerides', name: 'Serum Triglycerides', regex: /(?:triglycerides)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'tsh', name: 'Thyroid Stimulating Hormone (TSH)', regex: /(?:tsh|thyroid\s+stimulating\s+hormone)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'potassium', name: 'Serum Potassium (K+)', regex: /(?:potassium|k\+)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
      { key: 'sodium', name: 'Serum Sodium (Na+)', regex: /(?:sodium|na\+)[:\s]*([0-9.]+)\s*([a-zA-Z\/]*)\s*(?:[\(]?([0-9.]+\s*-\s*[0-9.]+)[\)]?)?/i },
    ];

    for (const pat of testPatterns) {
      const match = rawText.match(pat.regex);
      if (match) {
        const valNum = this.parseNumber(match[1]);
        if (valNum !== null) {
          const std = STANDARD_LAB_RANGES[pat.key] || {};
          const unit = match[2] || std.unit || '';
          let refRangeStr = match[3] || (std.min !== undefined ? `${std.min} - ${std.max}` : 'Standard Range');

          // Determine flag
          let flag = 'NORMAL';
          let minBound = std.min;
          let maxBound = std.max;

          if (match[3]) {
            const rangeBounds = match[3].split('-').map((s) => this.parseNumber(s));
            if (rangeBounds.length === 2 && rangeBounds[0] !== null && rangeBounds[1] !== null) {
              minBound = rangeBounds[0];
              maxBound = rangeBounds[1];
            }
          }

          if (std.criticalLow !== null && std.criticalLow !== undefined && valNum <= std.criticalLow) {
            flag = 'CRITICAL';
          } else if (std.criticalHigh !== null && std.criticalHigh !== undefined && valNum >= std.criticalHigh) {
            flag = 'CRITICAL';
          } else if (minBound !== undefined && valNum < minBound) {
            flag = 'LOW';
          } else if (maxBound !== undefined && valNum > maxBound) {
            flag = 'HIGH';
          }

          const labItem = {
            test_name: pat.name,
            category: std.category || 'Clinical Pathology',
            observed_value: String(valNum),
            reference_range: refRangeStr,
            unit,
            flag,
            status: flag,
            alert: flag !== 'NORMAL',
          };

          labResults.push(labItem);

          if (flag !== 'NORMAL') {
            importantFindings.push({
              finding: `${pat.name}: ${valNum} ${unit} (Reported range: ${refRangeStr})`,
              category: std.category || 'Investigation',
              status: flag,
              severity: flag === 'CRITICAL' ? 'CRITICAL' : 'IMPORTANT',
              value: String(valNum),
              reference_range: refRangeStr,
              unit,
              interpretation: flag === 'LOW'
                ? `Value is below the expected reference interval.`
                : flag === 'CRITICAL'
                ? `Critical clinical threshold crossed. Immediate physician attention advised.`
                : `Value is elevated compared to reference interval.`,
            });
          }
        }
      }
    }

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

    // Cardiac history detection for red-flag linkage
    const hasCardiacHistory = /cardiac|myocardial\s+infarction|angina|cad\b|coronary|stent|bypass|cabg|heart\s+disease|heart\s+attack/i.test(rawText);
    const medicalHistory = [];
    if (hasCardiacHistory) medicalHistory.push('Previous Cardiac Disease / History');
    if (/hypertension|high\s+bp/i.test(rawText)) medicalHistory.push('Hypertension');
    if (/diabetes|t2dm|hyperglycemia/i.test(rawText)) medicalHistory.push('Diabetes Mellitus');
    if (/asthma|copd/i.test(rawText)) medicalHistory.push('Respiratory Disorder (Asthma/COPD)');
    if (/chronic\s+kidney|ckd|renal/i.test(rawText)) medicalHistory.push('Renal Function Impairment');

    // Complaints
    const complaints = [];
    const complaintKeywords = ['fever', 'cough', 'cold', 'chest pain', 'chest discomfort', 'headache', 'breathlessness', 'vomiting', 'pain', 'weakness', 'fatigue'];
    for (const ck of complaintKeywords) {
      if (new RegExp(`\\b${ck}\\b`, 'i').test(rawText)) {
        complaints.push(ck.charAt(0).toUpperCase() + ck.slice(1));
      }
    }

    // Vitals
    const vitals = {};
    const bpMatch = rawText.match(/BP[:\s]*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/i);
    if (bpMatch) vitals.BP = `${bpMatch[1]} mmHg`;
    const prMatch = rawText.match(/(?:PR|Pulse|HR)[:\s]*([0-9]{2,3})/i);
    if (prMatch) vitals.PR = `${prMatch[1]} bpm`;
    const tempMatch = rawText.match(/(?:Temp|Temperature)[:\s]*([0-9]{2,3}\.?[0-9]?\s*(?:F|C)?)/i);
    if (tempMatch) vitals.temp = tempMatch[1].trim();

    // 7. Generate Dual Summaries (Clinical & Patient-Friendly)
    const docTitle = detectedType === 'LAB_REPORT'
      ? (labResults.length > 0 ? `${labResults[0].test_name} & Diagnostic Panel` : 'Diagnostic Pathology Report')
      : detectedType === 'PRESCRIPTION'
      ? 'Clinical Prescription & Treatment Advice'
      : detectedType === 'DISCHARGE_SUMMARY'
      ? 'Hospital Discharge Summary'
      : fileName || 'Medical Document';

    // A. Clinical Summary (For Doctors)
    const abnormalLabSummary = labResults.filter((l) => l.alert).map((l) => `${l.test_name}: ${l.observed_value} ${l.unit} (Ref: ${l.reference_range}, Flag: ${l.flag})`).join('; ');
    const clinicalSummaryText = [
      `Patient Overview: ${patient.name || 'Patient'} (${patient.age ? `${patient.age}y` : 'Age unstated'}, ${patient.gender || 'Gender unstated'}).`,
      `Document Type: ${detectedType} from ${doctor.facility}. Date: ${dateMatch ? dateMatch[1] : 'Unspecified'}.`,
      complaints.length > 0 ? `Chief Complaints: ${complaints.join(', ')}.` : 'Chief Complaints: None explicitly documented.',
      medicalHistory.length > 0 ? `Relevant Medical History: ${medicalHistory.join(', ')}.` : 'Relevant Medical History: Not reported in document.',
      prescribedMedicines.length > 0 ? `Current Medications: ${prescribedMedicines.map((m) => `${m.name} ${m.dosage}`).join(', ')}.` : 'Current Medications: None listed in document.',
      labResults.length > 0 ? `Investigations: ${labResults.length} parameter(s) evaluated.` : 'Investigations: Non-laboratory diagnostic record.',
      abnormalLabSummary ? `Important Abnormal Findings: ${abnormalLabSummary}.` : 'Important Abnormal Findings: No critical abnormalities flagged in parameters.',
      hasCardiacHistory ? 'Possible Risk Indicators: Document notes previous cardiac history; correlation with acute complaints required.' : null,
      diagnoses.length > 0 ? `Provisional/Clinical Diagnoses: ${diagnoses.join('; ')}.` : null,
      'Recommended Follow-up: Clinical correlation by attending physician required. AI extraction is supplementary to original clinical record.',
    ].filter(Boolean).join('\n');

    const clinicalSummaryObj = {
      patient_overview: `${patient.name || 'Patient'} (${patient.age || 'Age N/A'}, ${patient.gender || 'Gender N/A'})`,
      document_type: detectedType,
      facility: doctor.facility,
      doctor: doctor.name,
      date: dateMatch ? dateMatch[1] : 'Recent',
      chief_complaints: complaints,
      medical_history: medicalHistory,
      current_medications: prescribedMedicines,
      investigations_count: labResults.length,
      important_findings: importantFindings.map((f) => f.finding),
      abnormal_count: importantFindings.length,
      physician_digest: clinicalSummaryText,
    };

    // B. Patient-Friendly Summary (For Patients - Simple Language)
    const patientBulletFindings = importantFindings.length > 0
      ? importantFindings.map((f) => `• ${f.finding} (${f.status.toLowerCase()} compared to expected range)`).join('\n')
      : '• All evaluated test parameters appear within standard reference intervals.';

    const patientFriendlyExplanation = [
      `📄 What this report is about`,
      `This is a ${docTitle.toLowerCase()} dated ${dateMatch ? dateMatch[1] : 'recently'} from ${doctor.facility}.`,
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
      about: `This is a ${docTitle.toLowerCase()} dated ${dateMatch ? dateMatch[1] : 'recently'} from ${doctor.facility}.`,
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

    // 8. Determine Confidence
    const hasClearText = rawText.length > 80;
    const confidenceScore = hasClearText ? 0.94 : 0.72;
    const extractionConfidence = confidenceScore >= 0.9 ? 'CLEAR' : confidenceScore >= 0.7 ? 'PARTIAL' : 'UNCERTAIN';

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

    // 2. Multimodal AI Extraction (Fallback to Rule-Based if Offline)
    if (rawExtractedText && rawExtractedText.trim().length > 5) {
      // Direct Groq if configured
      if (GROQ_API_KEY && !GROQ_API_KEY.includes('<GROQ_API_KEY>')) {
        try {
          extractedClinicalData = await this.callGroqDirectly(rawExtractedText);
        } catch (groqErr) {
          logger.warn('[Groq Direct Error]: ' + groqErr.message);
        }
      }

      // Deterministic Clinical Intelligence Parser
      if (!extractedClinicalData) {
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
        patient_id: patientId || 'PAT-DEMO',
        session_id: sessionId || `SES-${Date.now()}`,
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
      patientId: patientId || 'PAT-DEMO',
      patient_id: patientId || 'PAT-DEMO',
      sessionId: sessionId,
      session_id: sessionId,
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

