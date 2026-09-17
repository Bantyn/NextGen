import { MedicalDocument } from '../models/MedicalDocument.js';

/**
 * Document Repository — Data Access Layer for Uploaded Medical Documents & Scans
 */
export class DocumentRepository {
  async create(docData) {
    const document = new MedicalDocument(docData);
    return document.save();
  }

  async findById(id) {
    return MedicalDocument.findById(id);
  }

  async findByDocumentId(docId) {
    if (!docId) return null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(docId));
    const conditions = [{ document_id: docId }];
    if (isObjectId) conditions.push({ _id: docId });
    return MedicalDocument.findOne({ $or: conditions });
  }

  async findByHash(documentHash) {
    if (!documentHash) return null;
    return MedicalDocument.findOne({ document_hash: documentHash });
  }

  async findBySessionId(sessionId) {
    return MedicalDocument.find({ session_id: sessionId }).sort({ createdAt: -1 });
  }

  async findByPatientId(patientId) {
    if (!patientId) return [];
    return MedicalDocument.find({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    }).sort({ createdAt: -1 });
  }

  /**
   * Bulk fetch documents for multiple patient IDs (for cross-visit aggregation)
   */
  async findByPatientIds(patientIds = []) {
    if (!patientIds || patientIds.length === 0) return [];
    const allVariants = patientIds.flatMap((id) => [
      id,
      String(id).toUpperCase(),
      String(id).toLowerCase(),
    ]);
    return MedicalDocument.find({ patient_id: { $in: allVariants } }).sort({ createdAt: -1 });
  }

  /**
   * Bulk fetch documents for multiple session IDs
   */
  async findBySessionIds(sessionIds = []) {
    if (!sessionIds || sessionIds.length === 0) return [];
    return MedicalDocument.find({ session_id: { $in: sessionIds } }).sort({ createdAt: -1 });
  }


  async updateExtraction(id, { extracted_text, structured_data, processing_status }) {
    const updates = {};
    if (extracted_text !== undefined) updates.extracted_text = extracted_text;
    if (structured_data !== undefined) updates.structured_data = structured_data;
    if (processing_status !== undefined) updates.processing_status = processing_status;

    return MedicalDocument.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' });
  }

  async updateAnalysis(docId, analysisData = {}) {
    if (!docId) return null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(docId));
    const conditions = [{ document_id: docId }];
    if (isObjectId) conditions.push({ _id: docId });

    return MedicalDocument.findOneAndUpdate(
      { $or: conditions },
      { $set: analysisData },
      { returnDocument: 'after' }
    );
  }
}

export const documentRepository = new DocumentRepository();
export default documentRepository;
