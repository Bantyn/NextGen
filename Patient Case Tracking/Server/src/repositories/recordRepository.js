import { ClinicalRecord } from '../models/ClinicalRecord.js';

/**
 * Record Repository — Data Access Layer for SOAP Records and Doctor Reviews
 */
export class RecordRepository {
  async create(recordData) {
    const record = new ClinicalRecord(recordData);
    return record.save();
  }

  async findByRecordId(recordId) {
    return ClinicalRecord.findOne({ record_id: recordId }).populate('reviewed_by', 'name email role');
  }

  async findById(id) {
    return ClinicalRecord.findById(id).populate('reviewed_by', 'name email role');
  }

  async findBySessionId(sessionId) {
    return ClinicalRecord.findOne({ session_id: sessionId }).populate('reviewed_by', 'name email role');
  }

  async findByPatientId(patientId, { reviewStatus, skip = 0, limit = 20 } = {}) {
    const filter = { patient_id: patientId.toUpperCase() };
    if (reviewStatus) {
      filter.review_status = reviewStatus;
    }

    const [records, total] = await Promise.all([
      ClinicalRecord.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviewed_by', 'name email role'),
      ClinicalRecord.countDocuments(filter),
    ]);

    return { records, total };
  }

  async updateReview(id, { review_status, doctor_notes, physician_prescription, reviewed_by, reviewed_at }) {
    const updateData = {
      review_status,
      doctor_notes,
      reviewed_by,
      reviewed_at: reviewed_at || new Date(),
    };

    if (physician_prescription) {
      updateData.physician_prescription = physician_prescription;
    }

    // Support update by MongoDB _id or record_id
    const filter = id.startsWith('REC-') ? { record_id: id } : { _id: id };

    return ClinicalRecord.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true }
    ).populate('reviewed_by', 'name email role');
  }
}

export const recordRepository = new RecordRepository();
export default recordRepository;
