import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';

const N8N_DOCUMENT_WEBHOOK = 'https://bantytest.app.n8n.cloud/webhook/medikiosk-document-processing';

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
 * Controller: Extract real OCR text via Tesseract.js & dispatch document_text to n8n
 */
export const processDocumentUpload = async (req, res) => {
  try {
    let fileBuffer = null;
    let fileName = 'prescription_photo.jpg';
    let docId = `doc-${Date.now()}`;
    let docType = req.body.document_type || 'PRESCRIPTION';

    // 1. Handle Multer file upload or Base64 payload
    if (req.file) {
      fileName = req.file.originalname;
      fileBuffer = fs.readFileSync(req.file.path);
    } else if (req.body.file_base64) {
      const pureBase64 = req.body.file_base64.replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(pureBase64, 'base64');
      fileName = req.body.file_name || 'uploaded_document.jpg';
      if (req.body.document_id) docId = req.body.document_id;
    } else if (req.body.document_text) {
      // Direct raw text input
      const payload = {
        document_id: docId,
        document_type: docType,
        document_text: req.body.document_text,
        file_name: fileName,
        ocr_engine: 'direct_text',
      };

      const n8nResponse = await fetch(N8N_DOCUMENT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await n8nResponse.json().catch(() => ({}));
      let extractedClinicalData = null;
      if (responseData?.ai_extracted_prescription) {
        extractedClinicalData = parseOcrContent(responseData.ai_extracted_prescription);
      } else if (responseData?.choices?.[0]?.message?.content) {
        extractedClinicalData = parseOcrContent(responseData.choices[0].message.content);
      }

      return res.status(200).json({
        status: 'success',
        document_id: docId,
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

    // 2. Perform Real Optical Character Recognition (OCR) via Tesseract.js
    console.log(`[Tesseract.js OCR] Starting character extraction for ${fileName}...`);
    const ocrResult = await Tesseract.recognize(fileBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[Tesseract.js Progress]: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const rawExtractedText = (ocrResult?.data?.text || '').trim();
    console.log('[Tesseract.js OCR Extracted Raw Text]:\n', rawExtractedText || '[No readable text detected]');

    // If text was empty or very short, provide a fallback clinical text context
    const cleanDocumentText =
      rawExtractedText.length > 5
        ? rawExtractedText
        : 'Medical Prescription Document: Please extract clinic details, patient vitals, diagnosis, and prescribed medicines.';

    // 3. Dispatch extracted document_text to n8n Dynamic LLM Parser
    const payload = {
      document_id: docId,
      document_type: docType,
      document_text: cleanDocumentText,
      file_name: fileName,
      ocr_engine: 'tesseract.js',
    };

    console.log('[MediKiosk Server] Forwarding document_text to n8n Webhook:', N8N_DOCUMENT_WEBHOOK);

    const n8nResponse = await fetch(N8N_DOCUMENT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await n8nResponse.json().catch(() => ({}));
    console.log('[MediKiosk Server] n8n Webhook Response:', responseData);

    // 4. Parse Groq LLM structured extraction
    let extractedClinicalData = null;
    if (responseData?.ai_extracted_prescription) {
      extractedClinicalData = parseOcrContent(responseData.ai_extracted_prescription);
    } else if (responseData?.choices?.[0]?.message?.content) {
      extractedClinicalData = parseOcrContent(responseData.choices[0].message.content);
    } else if (responseData?.output) {
      extractedClinicalData = parseOcrContent(responseData.output);
    }

    return res.status(200).json({
      status: 'success',
      document_id: docId,
      file_name: fileName,
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
