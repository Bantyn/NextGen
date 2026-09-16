import fs from 'fs';
import path from 'path';
import { documentService } from '../services/documentService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { logger } from '../utils/logger.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Controller for Medical Document Uploads & Multi-Format Intelligence
 */
export const processDocumentUpload = async (req, res) => {
  try {
    let fileBuffer = null;
    let fileName = 'document.pdf';
    let mimeType = 'application/pdf';

    const normalizeDocType = (type) => {
      if (!type) return 'LAB_REPORT';
      const t = String(type).toUpperCase();
      if (t.includes('LAB') || t.includes('DIAGNOSTIC') || t.includes('REPORT') || t.includes('PATHOLOGY') || t.includes('BIOCHEM')) return 'LAB_REPORT';
      if (t.includes('PRESCRIPTION') || t.includes('MEDICINE') || t.includes('RX')) return 'PRESCRIPTION';
      if (t.includes('DISCHARGE') || t.includes('SUMMARY')) return 'DISCHARGE_SUMMARY';
      if (t.includes('IMAGING') || t.includes('XRAY') || t.includes('MRI') || t.includes('CT')) return 'IMAGING_REPORT';
      if (t.includes('CONSULTATION') || t.includes('NOTE')) return 'CONSULTATION_NOTE';
      return 'OTHER';
    };

    let docType = normalizeDocType(req.body.document_type);
    let title = req.body.title || req.body.test_name || null;
    let patientId = req.body.patient_id || req.body.patientId || null;
    let sessionId = req.body.session_id || req.body.sessionId || null;
    let savedFilePath = null;
    let fileSize = 0;
    let directText = null;

    if (req.file) {
      mimeType = req.file.mimetype || 'application/pdf';
      if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase()) && !req.file.originalname.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
        // Clean up invalid file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid file format. Supported formats: PDF, JPG, JPEG, PNG, WebP.',
        });
      }

      fileName = req.file.originalname;
      savedFilePath = req.file.path;
      fileSize = req.file.size;
      fileBuffer = fs.readFileSync(req.file.path);
    } else if (req.body.file_base64) {
      const pureBase64 = req.body.file_base64.replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(pureBase64, 'base64');
      fileName = req.body.file_name || req.body.fileName || 'uploaded_document.pdf';
      fileSize = fileBuffer.length;
      mimeType = req.body.mime_type || req.body.mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      const uploadDir = path.resolve('uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const uniqueName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(fileName) || '.pdf'}`;
      savedFilePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(savedFilePath, fileBuffer);
    } else if (req.body.document_text) {
      directText = String(req.body.document_text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
      fileName = req.body.file_name || 'direct_text_input.txt';
      mimeType = 'text/plain';
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'No medical document file, file_base64, or document_text provided for processing',
      });
    }

    const result = await documentService.processAndPersistDocument({
      fileBuffer,
      fileName,
      fileSize,
      mimeType,
      savedFilePath,
      documentType: docType,
      patientId,
      sessionId,
      directText,
      title,
    });

    return res.status(200).json({
      status: result.status,
      message: result.status === 'failed' ? result.error : 'Document processed successfully',
      data: result,
      ...result,
    });
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
    const patientId = req.params.patientId || req.query.patient_id || req.query.patientId;
    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'patientId is required' });
    }
    const docs = await documentRepository.findByPatientId(patientId);
    return res.status(200).json({ status: 'success', success: true, data: docs });
  } catch (error) {
    logger.error('[Get Documents By Patient Error]: ' + error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve patient medical documents',
      error: error.message,
    });
  }
};

/**
 * Retrieve a specific document by its ID
 */
export const getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ status: 'error', success: false, message: 'documentId is required' });
    }

    const doc = await documentRepository.findByDocumentId(documentId);
    if (!doc) {
      return res.status(404).json({ status: 'error', success: false, message: `Medical document '${documentId}' not found.` });
    }

    return res.status(200).json({ status: 'success', success: true, data: doc });
  } catch (error) {
    logger.error('[Get Document By ID Error]: ' + error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve document',
      error: error.message,
    });
  }
};

/**
 * Retrieve only summary & important findings for a document
 */
export const getDocumentSummary = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ status: 'error', success: false, message: 'documentId is required' });
    }

    const doc = await documentRepository.findByDocumentId(documentId);
    if (!doc) {
      return res.status(404).json({ status: 'error', success: false, message: `Medical document '${documentId}' not found.` });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      data: {
        document_id: doc.document_id || String(doc._id),
        documentId: doc.document_id || String(doc._id),
        file_name: doc.file_name,
        fileName: doc.file_name,
        document_type: doc.document_type,
        documentType: doc.document_type,
        clinical_summary: doc.clinical_summary,
        clinicalSummary: doc.clinical_summary,
        patient_summary: doc.patient_summary,
        patientSummary: doc.patient_summary,
        important_findings: doc.important_findings,
        importantFindings: doc.important_findings,
        processing_status: doc.processing_status,
        processingStatus: doc.processing_status,
        confidence_score: doc.confidence_score,
        confidenceScore: doc.confidence_score,
        extraction_confidence: doc.extraction_confidence,
        extractionConfidence: doc.extraction_confidence,
      },
    });
  } catch (error) {
    logger.error('[Get Document Summary Error]: ' + error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve document summary',
      error: error.message,
    });
  }
};

/**
 * Securely serve document file with path traversal validation
 */
export const serveDocumentFile = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await documentRepository.findByDocumentId(documentId);
    if (!doc || !doc.file_url) {
      return res.status(404).json({ status: 'error', message: 'Document file not found' });
    }

    const relativePath = doc.file_url.replace(/^\/uploads\//, '');
    const uploadDir = path.resolve('uploads');
    const fullPath = path.resolve(uploadDir, relativePath);

    // Path traversal check
    if (!fullPath.startsWith(uploadDir)) {
      return res.status(403).json({ status: 'error', message: 'Access denied: invalid file path' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ status: 'error', message: 'Physical file not found on disk' });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeMap[ext] || doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name || 'document' + ext)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (error) {
    logger.error('[Serve Document File Error]: ' + error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to serve document file' });
  }
};

/**
 * On-demand AI Re-analysis of an existing uploaded document
 */
export const reanalyzeDocumentWithAI = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ status: 'error', success: false, message: 'documentId is required' });
    }

    const result = await documentService.reanalyzeDocument(documentId);
    return res.status(200).json({
      status: 'success',
      success: true,
      message: 'Medical document successfully re-analyzed using clinical AI',
      data: result,
      ...result,
    });
  } catch (error) {
    logger.error('[Reanalyze Document Error]: ' + error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      success: false,
      message: error.message || 'Failed to re-analyze document with AI',
      error: error.message,
    });
  }
};

export default {
  processDocumentUpload,
  getDocumentsByPatient,
  getDocumentById,
  getDocumentSummary,
  serveDocumentFile,
  reanalyzeDocumentWithAI,
};

