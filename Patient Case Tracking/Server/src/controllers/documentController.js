import fs from 'fs';
import path from 'path';
import { documentService } from '../services/documentService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { logger } from '../utils/logger.js';

/**
 * Thin Controller for Medical Document Uploads & OCR Processing
 * Delegates OCR processing, Vision analysis, MongoDB persistence, and observation creation to documentService.
 */
export const processDocumentUpload = async (req, res) => {
  try {
    let fileBuffer = null;
    let fileName = 'prescription_photo.jpg';
    const normalizeDocType = (type) => {
      if (!type) return 'LAB_REPORT';
      const t = String(type).toUpperCase();
      if (t.includes('LAB') || t.includes('DIAGNOSTIC') || t.includes('REPORT') || t.includes('PATHOLOGY')) return 'LAB_REPORT';
      if (t.includes('PRESCRIPTION') || t.includes('MEDICINE') || t.includes('RX')) return 'PRESCRIPTION';
      if (t.includes('DISCHARGE') || t.includes('SUMMARY')) return 'DISCHARGE_SUMMARY';
      return 'OTHER';
    };

    let docType = normalizeDocType(req.body.document_type);
    let title = req.body.title || req.body.test_name || null;
    let patientId = req.body.patient_id || null;
    let sessionId = req.body.session_id || null;
    let savedFilePath = null;
    let fileSize = 0;
    let directText = null;

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

      const uploadDir = path.resolve('uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const uniqueName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(fileName) || '.jpg'}`;
      savedFilePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(savedFilePath, fileBuffer);
    } else if (req.body.document_text) {
      directText = String(req.body.document_text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
      fileName = req.body.file_name || 'direct_text_input.txt';
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'No image file, file_base64, or document_text provided for processing',
      });
    }

    const result = await documentService.processAndPersistDocument({
      fileBuffer,
      fileName,
      fileSize,
      savedFilePath,
      documentType: docType,
      patientId,
      sessionId,
      directText,
      title,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('[Document OCR Processing Error]: ' + error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process document OCR and persistence',
      error: error.message,
    });
  }
};

/**
 * Retrieve all uploaded medical documents for a specific patient
 */
export const getDocumentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'patientId is required' });
    }
    const docs = await documentRepository.findByPatientId(patientId);
    return res.status(200).json({ status: 'success', data: docs });
  } catch (error) {
    logger.error('[Get Documents By Patient Error]: ' + error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve patient medical documents',
      error: error.message,
    });
  }
};

export default { processDocumentUpload, getDocumentsByPatient };
