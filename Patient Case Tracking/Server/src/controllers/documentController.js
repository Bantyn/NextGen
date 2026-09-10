import fs from 'fs';
import path from 'path';
import { documentService } from '../services/documentService.js';
import { logger } from '../utils/logger.js';

/**
 * Thin Controller for Medical Document Uploads & OCR Processing
 * Delegates OCR processing, Vision analysis, MongoDB persistence, and observation creation to documentService.
 */
export const processDocumentUpload = async (req, res) => {
  try {
    let fileBuffer = null;
    let fileName = 'prescription_photo.jpg';
    let docType = req.body.document_type || 'PRESCRIPTION';
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

export default { processDocumentUpload };
