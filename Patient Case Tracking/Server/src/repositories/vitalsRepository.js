import { VitalsRecord } from '../models/VitalsRecord.js';

export class VitalsRepository {
  async create(vitalsData) {
    const record = new VitalsRecord(vitalsData);
    return record.save();
  }

  async findLatestByPatientId(patientId) {
    if (!patientId) return null;
    return VitalsRecord.findOne({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    }).sort({ recorded_at: -1 });
  }

  async findHistoryByPatientId(patientId, limit = 20) {
    if (!patientId) return [];
    return VitalsRecord.find({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    })
      .sort({ recorded_at: -1 })
      .limit(limit);
  }
}

export const vitalsRepository = new VitalsRepository();
export default vitalsRepository;
