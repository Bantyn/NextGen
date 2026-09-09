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

  async findBySessionId(sessionId) {
    return MedicalDocument.find({ session_id: sessionId }).sort({ createdAt: -1 });
  }

  async findByPatientId(patientId) {
    return MedicalDocument.find({ patient_id: patientId.toUpperCase() }).sort({ createdAt: -1 });
  }

  async updateExtraction(id, { extracted_text, structured_data, processing_status }) {
    const updates = {};
    if (extracted_text !== undefined) updates.extracted_text = extracted_text;
    if (structured_data !== undefined) updates.structured_data = structured_data;
    if (processing_status !== undefined) updates.processing_status = processing_status;

    return MedicalDocument.findByIdAndUpdate(id, { $set: updates }, { new: true });
  }
}

export const documentRepository = new DocumentRepository();
export default documentRepository;
