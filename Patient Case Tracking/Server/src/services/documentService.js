import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';

dotenv.config();

const N8N_DOCUMENT_WEBHOOK = process.env.N8N_DOCUMENT_WEBHOOK;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SIH_CLINICAL_SYSTEM_PROMPT = `You are MediKiosk AI Universal Medical Document Digitization & Clinical Intelligence Engine for Smart India Hackathon (SIH).
Your goal is to digitize and structure any medical document: Pathology/Lab Reports (CBC, LFT, KFT, Lipid, Thyroid, Blood Sugar, Urinalysis), Doctor Prescriptions (Handwritten or Printed), Hospital Discharge Summaries, and Diagnostic Notes.

Analyze the medical document text or image and output strictly a valid JSON object matching this exact schema:
{
  "document_type": "LAB_REPORT" | "PRESCRIPTION" | "DISCHARGE_SUMMARY" | "CLINICAL_NOTE",
  "document_title": "e.g. Complete Blood Count (CBC) / Clinical Prescription / Discharge Summary",
  "organization_name": "Hospital, Clinic, or Pathology Lab Name",
  "facility_address": "Address or City if mentioned",
  "doctor_names": ["Doctor / Pathologist names"],
  "date": "YYYY-MM-DD or date string",
  "patient_details": {
    "name": "Patient Name",
    "age": 21,
    "gender": "Male / Female / Other",
    "patient_id": "PID / UHID / Sample No"
  },
  "vitals": {
    "BP": "120/80 mmHg",
    "PR": "80 bpm",
    "temp": "98.6 F",
    "spo2": "98%"
  },
  "clinical_summary": {
    "physician_digest": "Executive clinical summary for doctor with key abnormal findings",
    "patient_friendly_summary": "Simple, plain-language explanation for patient",
    "abnormal_findings_count": 2
  },
  "lab_investigations": [
    {
      "test_name": "Hemoglobin (Hb)",
      "category": "Hemoglobin / Blood Indices / LFT / Lipid",
      "observed_value": "12.5",
      "reference_range": "13.0 - 17.0",
      "unit": "g/dL",
      "flag": "LOW" | "HIGH" | "NORMAL" | "BORDERLINE" | "CRITICAL"
    }
  ],
  "pathologist_impression": "Interpretation or pathologist remarks",
  "complaints": ["Chief complaints or symptoms"],
  "diagnosis": ["Confirmed or provisional diagnoses"],
  "prescribed_medicines": [
    {
      "name": "Medicine name",
      "dosage": "500 mg",
      "frequency": "1-0-1",
      "timing": "After meals",
      "duration": "5 days"
    }
  ],
  "doctor_advice": "Doctor or discharge advice"
}

Important Rules:
1. For LAB REPORTS: Extract ALL test rows with accurate numerical/text observed values, reference ranges, units, and assign correct flag (LOW, HIGH, NORMAL, BORDERLINE, CRITICAL).
2. For PRESCRIPTIONS: Extract all drugs, dosages, frequencies, and durations accurately.
3. For DISCHARGE SUMMARIES: Synthesize hospital course, procedures, and discharge medications.
4. Output ONLY clean valid JSON without markdown code blocks, backticks, or extra text.`;

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
   * Multimodal Vision API call (Gemini Vision)
   */
  async callGeminiVision(fileBuffer, mimeType = 'image/jpeg') {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('<GEMINI_API_KEY>')) {
      return null;
    }

    try {
      const base64Data = fileBuffer.toString('base64');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SIH_CLINICAL_SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return this.parseOcrContent(rawJson);
    } catch (err) {
      logger.warn('[Gemini Vision Call Exception]: ' + err.message);
      return null;
    }
  }

  /**
   * Direct Groq LLM clinical parser on extracted text
   */
  async callGroqDirectly(documentText) {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('<GROQ_API_KEY>')) {
      return null;
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [
            { role: 'system', content: SIH_CLINICAL_SYSTEM_PROMPT },
            { role: 'user', content: `Medical Document Raw Extracted OCR Content:\n"""\n${documentText}\n"""\n\nDigitize, structure, and synthesize into clinical JSON.` },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      return this.parseOcrContent(content);
    } catch (err) {
      logger.warn('[Groq OCR Call Exception]: ' + err.message);
      return null;
    }
  }

  /**
   * Deterministic heuristic parser for text when offline
   */
  extractClinicalDataHeuristic(rawText) {
    if (!rawText || rawText.trim().length < 5) return null;
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    const data = {
      document_type: 'PRESCRIPTION',
      clinic_name: lines.find((l) => /clinic|hospital|care|centre|center|health/i.test(l)) || lines[0] || '',
      doctor_names: (rawText.match(/Dr\.?\s+[A-Z][a-zA-Z\s.]+/g) || []).map((d) => d.trim()),
      date: (rawText.match(/\b(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})\b/) || [])[1] || '',
      vitals: {},
      complaints: [],
      prescribed_medicines: [],
      doctor_advice: 'Consult physician for dosage confirmation.',
    };

    const bpMatch = rawText.match(/BP[:\s]*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/i);
    if (bpMatch) data.vitals.BP = `${bpMatch[1]} mmHg`;

    const prMatch = rawText.match(/(?:PR|Pulse|HR)[:\s]*([0-9]{2,3})/i);
    if (prMatch) data.vitals.PR = `${prMatch[1]} bpm`;

    const complaintKeywords = ['fever', 'cough', 'cold', 'headache', 'pain', 'vomiting', 'hypertension', 'diabetes', 'weakness'];
    for (const word of complaintKeywords) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(rawText)) {
        data.complaints.push(word.charAt(0).toUpperCase() + word.slice(1));
      }
    }

    const medRegex = /(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?|Syrup|Tablet)?\s*([A-Za-z0-9\-]+)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g))\s*(?:([0-1]-[0-1]-[0-1]|OD|BD|TDS|QID|once daily|twice daily))?(?:\s*[xX]\s*(\d+\s*days?))?/gi;
    let m;
    while ((m = medRegex.exec(rawText)) !== null) {
      if (m[1] && m[2] && m[1].length > 2) {
        data.prescribed_medicines.push({
          name: m[1],
          dosage: m[2],
          frequency: m[3] || 'Once daily',
          timing: 'After meals',
          duration: m[4] || 'As prescribed',
        });
      }
    }

    return data;
  }

  /**
   * Process document upload, run OCR/Vision, save to MongoDB, and create observations
   */
  async processAndPersistDocument({
    fileBuffer,
    fileName = 'document.jpg',
    fileSize = 0,
    savedFilePath = null,
    documentType = 'PRESCRIPTION',
    patientId = null,
    sessionId = null,
    directText = null,
  }) {
    const docId = `doc-${Date.now()}`;
    let rawExtractedText = directText || '';
    let extractedClinicalData = null;
    let responseData = null;

    // 1. If buffer provided and Gemini Vision is configured, attempt Vision extraction
    if (fileBuffer && !directText) {
      extractedClinicalData = await this.callGeminiVision(fileBuffer, 'image/jpeg');
    }

    // 2. Perform OCR with Sharp + Tesseract.js if text not yet extracted
    if (!extractedClinicalData && !directText && fileBuffer) {
      try {
        const processedBuffer = await this.prepareImageForOcr(fileBuffer);
        const ocrResult = await Tesseract.recognize(processedBuffer, 'eng');
        rawExtractedText = (ocrResult?.data?.text || '').trim();
      } catch (ocrErr) {
        logger.warn('[Tesseract OCR Error]: ' + ocrErr.message);
      }
    }

    // 3. If n8n webhook configured, attempt AI workflow
    if (N8N_DOCUMENT_WEBHOOK && !N8N_DOCUMENT_WEBHOOK.includes('localhost:5678')) {
      try {
        const n8nRes = await fetch(N8N_DOCUMENT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: docId,
            document_type: documentType,
            document_text: rawExtractedText || 'Prescription image uploaded',
            file_name: fileName,
            ocr_engine: 'tesseract.js',
          }),
        });
        if (n8nRes.ok) {
          responseData = await n8nRes.json().catch(() => ({}));
          if (responseData?.ai_extracted_prescription) {
            extractedClinicalData = this.parseOcrContent(responseData.ai_extracted_prescription);
          } else if (responseData?.choices?.[0]?.message?.content) {
            extractedClinicalData = this.parseOcrContent(responseData.choices[0].message.content);
          }
        }
      } catch (n8nErr) {
        logger.warn('[n8n Document Webhook Notice]: ' + n8nErr.message);
      }
    }

    // 4. Try Direct Groq if still null
    if (!extractedClinicalData && rawExtractedText) {
      extractedClinicalData = await this.callGroqDirectly(rawExtractedText);
    }

    // 5. Heuristic fallback
    if (!extractedClinicalData && rawExtractedText) {
      extractedClinicalData = this.extractClinicalDataHeuristic(rawExtractedText);
    }

    // Determine confidence and doctor verification flag
    const isHandwritten = Boolean(fileBuffer && !directText);
    const confidenceScore = isHandwritten ? 0.82 : 0.95;
    const requiresDoctorVerification = isHandwritten || Boolean(extractedClinicalData?.lab_investigations?.some((l) => l.flag === 'CRITICAL'));

    const fileUrl = savedFilePath ? `/uploads/${path.basename(savedFilePath)}` : `/uploads/${fileName}`;

    // 6. Persist to MongoDB MedicalDocument collection
    let savedDocumentDoc = null;
    try {
      savedDocumentDoc = await documentRepository.create({
        patient_id: patientId || 'PAT-DEMO',
        session_id: sessionId || `SES-${Date.now()}`,
        document_type: documentType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        extracted_text: rawExtractedText,
        structured_data: extractedClinicalData || {},
        processing_status: 'COMPLETED',
        confidence_score: confidenceScore,
        requires_doctor_verification: requiresDoctorVerification,
        verification_notes: requiresDoctorVerification ? 'Handwritten prescription or critical lab findings require physician verification.' : '',
      });
    } catch (dbErr) {
      logger.warn(`[Document Repository Save Notice]: ${dbErr.message}`);
    }

    // 7. Auto-populate ClinicalObservations in MongoDB for this session
    if (sessionId && sessionId !== 'undefined' && extractedClinicalData) {
      try {
        // Create observations for prescribed medicines
        const medicines = extractedClinicalData.prescribed_medicines || [];
        for (const med of medicines) {
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
        const labs = extractedClinicalData.lab_investigations || [];
        for (const lab of labs) {
          if (lab.test_name) {
            await observationRepository.create({
              session_id: sessionId,
              category: 'LAB_RESULT',
              name: lab.test_name,
              value: `${lab.observed_value || ''} ${lab.unit || ''} (Flag: ${lab.flag || 'NORMAL'})`,
              confidence: confidenceScore,
              source: 'OCR_DOCUMENT',
            });
          }
        }

        // Create observations for diagnoses / complaints
        const complaints = extractedClinicalData.complaints || extractedClinicalData.diagnosis || [];
        for (const comp of complaints) {
          if (typeof comp === 'string') {
            await observationRepository.create({
              session_id: sessionId,
              category: 'CONDITION',
              name: comp,
              value: 'Document Extracted',
              confidence: confidenceScore,
              source: 'OCR_DOCUMENT',
            });
          }
        }
      } catch (obsErr) {
        logger.warn(`[Observation Auto-Population Notice]: ${obsErr.message}`);
      }
    }

    return {
      status: 'success',
      document_id: (savedDocumentDoc && savedDocumentDoc._id) ? String(savedDocumentDoc._id) : docId,
      file_name: fileName,
      file_size: fileSize,
      file_url: fileUrl,
      ocr_engine: 'tesseract.js',
      ocr_raw_text: rawExtractedText,
      extracted_data: extractedClinicalData,
      raw_n8n_response: responseData,
      confidence_score: confidenceScore,
      requires_doctor_verification: requiresDoctorVerification,
    };
  }
}

export const documentService = new DocumentService();
export default documentService;
