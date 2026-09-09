import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

const N8N_DOCUMENT_WEBHOOK = process.env.N8N_DOCUMENT_WEBHOOK;

/**
 * Advanced Preprocessing for Handwritten Doctor Prescriptions:
 * - Upscales low-res images to preserve thin pen strokes
 * - Auto-orients image based on EXIF
 * - Normalizes lighting & removes paper shadows
 * - Sharpens cursive handwriting ink
 */
async function prepareImageForOcr(buffer) {
    try {
        const metadata = await sharp(buffer).metadata();
        let pipeline = sharp(buffer).rotate();

        // If image is small or low-res (e.g. < 1400px width), upscale for higher OCR accuracy
        if (metadata.width && metadata.width < 1400) {
            pipeline = pipeline.resize({
                width: Math.min(1800, metadata.width * 2),
                fit: 'inside',
                kernel: 'lanczos3',
            });
        }

        return await pipeline
            .grayscale()
            .linear(1.3, -20) // Boost handwriting ink contrast
            .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.5 }) // Sharpen cursive strokes
            .toFormat('png')
            .toBuffer();
    } catch (err) {
        console.warn('[Image Preprocessing Notice]:', err.message);
        return buffer;
    }
}

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

/**
 * Direct Multimodal Vision Engine for Handwritten Prescriptions & Lab Reports (Gemini Vision API)
 */
async function callGeminiVision(fileBuffer, mimeType = 'image/jpeg') {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.includes('<GEMINI_API_KEY>')) {
        return null;
    }

    try {
        const base64Data = fileBuffer.toString('base64');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

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

        if (!res.ok) {
            console.warn('[Gemini Vision HTTP Error]:', res.status);
            return null;
        }

        const data = await res.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('[Gemini Vision Extraction Successful]');
        return parseOcrContent(rawJsonText);
    } catch (err) {
        console.warn('[Gemini Vision Call Exception]:', err.message);
        return null;
    }
}

/**
 * Universal Parser for stringified or markdown-wrapped JSON
 */
function parseOcrContent(rawContent) {
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
        console.warn('Failed to JSON.parse stringified OCR output:', err.message);
        return null;
    }
}

/**
 * Groq AI Universal Medical Document Digitization & Clinical Entity Parser
 */
async function callGroqDirectly(documentText) {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey.includes('<GROQ_API_KEY>')) {
        return null;
    }

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
                model: 'groq/compound-mini',
                messages: [
                    {
                        role: 'system',
                        content: SIH_CLINICAL_SYSTEM_PROMPT,
                    },
                    {
                        role: 'user',
                        content: `Medical Document Raw Extracted OCR Content:\n"""\n${documentText}\n"""\n\nDigitize, structure, and synthesize this medical record into universal clinical JSON.`,
                    },
                ],
                temperature: 0.1,
                max_tokens: 1500,
            }),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.warn(`[Direct Groq Call HTTP Error ${res.status}]:`, errText);
            return null;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        console.log('[Direct Groq AI Raw Output]:', content);
        return parseOcrContent(content);
    } catch (err) {
        console.warn('[Direct Groq Call Exception]:', err.message);
        return null;
    }
}

/**
 * Smart heuristic clinical parser for raw OCR text when LLM is unavailable or 401
 */
function extractClinicalDataHeuristic(rawText) {
    if (!rawText || rawText.trim().length < 5) return null;
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    const data = {
        clinic_name: '',
        doctor_names: [],
        date: '',
        patient_name: '',
        vitals: {},
        complaints: [],
        investigations_recommended: [],
        prescribed_medicines: [],
        doctor_advice: '',
    };

    // Find date (e.g. 19/10/2022, 2022-10-19, 19-Oct-2022)
    const dateMatch = rawText.match(/\b(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i);
    if (dateMatch) data.date = dateMatch[1];

    // Find Doctor names
    const drMatches = rawText.match(/Dr\.?\s+[A-Z][a-zA-Z\s.]+/g);
    if (drMatches) {
        data.doctor_names = drMatches.map((d) => d.trim());
    }

    // Find Clinic / Hospital Name
    const clinicMatch = lines.find((l) => /clinic|hospital|healthcare|centre|center|care|dental|institute/i.test(l));
    if (clinicMatch) {
        data.clinic_name = clinicMatch;
    } else if (lines.length > 0 && !lines[0].toLowerCase().startsWith('dr.')) {
        data.clinic_name = lines[0];
    }

    // Find Vitals (BP, Pulse, Temp, SpO2)
    const bpMatch = rawText.match(/BP[:\s]*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/i);
    if (bpMatch) data.vitals.BP = `${bpMatch[1]} mmHg`;

    const prMatch = rawText.match(/(?:PR|Pulse|HR)[:\s]*([0-9]{2,3})/i);
    if (prMatch) data.vitals.PR = `${prMatch[1]} bpm`;

    // Find Complaints (fever, pain, hypertension, etc.)
    const complaintKeywords = ['fever', 'cough', 'cold', 'headache', 'pain', 'vomiting', 'hypertension', 'hypothyroidism', 'diabetes', 'weakness'];
    for (const word of complaintKeywords) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(rawText)) {
            data.complaints.push(word.charAt(0).toUpperCase() + word.slice(1));
        }
    }

    // Find Medicines (Tab, Cap, Syp, Inj, or common dosages like mg/mcg/ml)
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

    return (data.clinic_name || data.doctor_names.length || data.prescribed_medicines.length || data.complaints.length) ? data : null;
}
export const processDocumentUpload = async (req, res) => {
    try {
        let fileBuffer = null;
        let fileName = 'prescription_photo.jpg';
        let docId = `doc-${Date.now()}`;
        let docType = req.body.document_type || 'PRESCRIPTION';

        // 1. Handle Multer file upload or Base64 payload
        let savedFilePath = null;
        let fileSize = 0;

        if (req.file) {
            fileName = req.file.originalname;
            savedFilePath = req.file.path;
            fileSize = req.file.size;
            fileBuffer = fs.readFileSync(req.file.path);
        } else if (req.body.file_base64) {
            const pureBase64 = req.body.file_base64.replace(/^data:.*?;base64,/, '');
            fileBuffer = Buffer.from(pureBase64, 'base64');
            fileName = req.body.file_name || 'uploaded_document.jpg';
            fileSize = fileBuffer.length;
            if (req.body.document_id) docId = req.body.document_id;

            // Save base64 upload to uploads directory as well
            const uploadDir = path.resolve('uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const uniqueName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(fileName) || '.jpg'}`;
            savedFilePath = path.join(uploadDir, uniqueName);
            fs.writeFileSync(savedFilePath, fileBuffer);
        } else if (req.body.document_text) {
            // Direct raw text input
            const cleanInput = String(req.body.document_text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
            const payload = {
                document_id: docId,
                document_type: docType,
                document_text: cleanInput,
                file_name: fileName,
                ocr_engine: 'direct_text',
            };

            const n8nResponse = await fetch(N8N_DOCUMENT_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch((err) => {
                console.warn('[n8n Webhook Connection Warning]:', err.message);
                return null;
            });

            let responseData = null;
            if (n8nResponse) {
                responseData = await n8nResponse.json().catch(() => ({}));
            }

            let extractedClinicalData = null;
            if (responseData?.ai_extracted_prescription) {
                extractedClinicalData = parseOcrContent(responseData.ai_extracted_prescription);
            } else if (responseData?.choices?.[0]?.message?.content) {
                extractedClinicalData = parseOcrContent(responseData.choices[0].message.content);
            } else if (responseData?.output) {
                extractedClinicalData = parseOcrContent(responseData.output);
            }

            if (!extractedClinicalData) {
                extractedClinicalData = await callGroqDirectly(cleanInput);
            }
            if (!extractedClinicalData) {
                extractedClinicalData = extractClinicalDataHeuristic(cleanInput);
            }

            return res.status(200).json({
                status: 'success',
                document_id: docId,
                file_name: fileName,
                ocr_engine: 'direct_text',
                ocr_raw_text: req.body.document_text,
                extracted_data: extractedClinicalData,
                raw_n8n_response: responseData,
            });
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'No image file or file_base64 provided for Tesseract OCR processing',
            });
        }

        // 2. Multimodal Vision Direct Analysis (if GEMINI_API_KEY configured)
        let visionExtractedData = null;
        if (fileBuffer && process.env.GEMINI_API_KEY) {
            console.log(`[Vision AI Engine] Analyzing handwritten image directly via Vision API...`);
            visionExtractedData = await callGeminiVision(fileBuffer, 'image/jpeg');
        }

        // 3. Perform High-Clarity Optical Character Recognition (OCR) via Sharp + Tesseract.js
        console.log(`[Tesseract.js OCR] Enhancing handwriting strokes and extracting characters for ${fileName} (${(fileSize / 1024).toFixed(1)} KB)...`);

        let processedBuffer = fileBuffer;
        try {
            processedBuffer = await prepareImageForOcr(fileBuffer);
        } catch (prepErr) {
            console.warn('[Image Prep Warning]:', prepErr.message);
        }

        let rawExtractedText = '';
        try {
            const ocrResult = await Tesseract.recognize(processedBuffer, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[Tesseract.js Progress]: ${Math.round(m.progress * 100)}%`);
                    }
                },
            });
            rawExtractedText = (ocrResult?.data?.text || '').trim();
        } catch (ocrErr) {
            console.error('[Tesseract OCR Recognize Catch]:', ocrErr.message);
            rawExtractedText = '';
        }

        console.log('[Tesseract.js OCR Extracted Raw Text]:\n', rawExtractedText || '[No readable text detected]');

        // Clean text and prepare safe payload
        const cleanDocumentText = rawExtractedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

        // 4. Dispatch extracted document_text to n8n Dynamic LLM Parser
        const payload = {
            document_id: docId,
            document_type: docType,
            document_text: cleanDocumentText || 'Prescription Image: No readable text detected by OCR. Please extract any medical observations.',
            file_name: fileName,
            ocr_engine: 'tesseract.js',
        };

        let responseData = null;
        try {
            const n8nResponse = await fetch(N8N_DOCUMENT_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            responseData = await n8nResponse.json().catch(() => ({}));
        } catch (n8nErr) {
            console.warn('[n8n Webhook Call Failed]:', n8nErr.message);
        }

        // 5. Parse structured extraction from Vision -> Groq AI -> n8n -> Heuristics
        let extractedClinicalData = visionExtractedData;

        if (!extractedClinicalData && responseData?.ai_extracted_prescription) {
            extractedClinicalData = parseOcrContent(responseData.ai_extracted_prescription);
        } else if (!extractedClinicalData && responseData?.choices?.[0]?.message?.content) {
            extractedClinicalData = parseOcrContent(responseData.choices[0].message.content);
        } else if (!extractedClinicalData && responseData?.output) {
            extractedClinicalData = parseOcrContent(responseData.output);
        }

        // Direct Groq AI Doctor Handwriting Reconstruction
        if (!extractedClinicalData && cleanDocumentText) {
            console.log('[MediKiosk Server] Reconstructing handwritten prescription with Groq AI...');
            extractedClinicalData = await callGroqDirectly(cleanDocumentText);
        }

        // Heuristic fallback if AI services are offline
        if (!extractedClinicalData && cleanDocumentText) {
            console.log('[MediKiosk Server] Running heuristic clinical entity extractor on OCR text...');
            extractedClinicalData = extractClinicalDataHeuristic(cleanDocumentText);
        }

        const fileUrl = savedFilePath ? `/uploads/${path.basename(savedFilePath)}` : null;

        return res.status(200).json({
            status: 'success',
            document_id: docId,
            file_name: fileName,
            file_size: fileSize,
            file_url: fileUrl,
            ocr_engine: 'tesseract.js',
            ocr_raw_text: rawExtractedText,
            extracted_data: extractedClinicalData,
            raw_n8n_response: responseData,
        });
    } catch (error) {
        console.error('[Document OCR Processing Error]:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process document OCR with Tesseract.js',
            error: error.message,
        });
    }
};
