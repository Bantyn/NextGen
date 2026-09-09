import { ClinicalSession } from '../models/ClinicalSession.js';

/**
 * Session Repository — Data Access Layer for Clinical Sessions
 */
export class SessionRepository {
  async create(sessionData) {
    const session = new ClinicalSession(sessionData);
    return session.save();
  }

  async findBySessionId(sessionId) {
    return ClinicalSession.findOne({ session_id: sessionId });
  }

  async findById(id) {
    return ClinicalSession.findById(id);
  }

  async updateStatus(sessionId, status, extraFields = {}) {
    const updateData = { status, ...extraFields };
    if (status === 'COMPLETED' || status === 'CONSULTATION_COMPLETE') {
      updateData.completed_at = new Date();
    }

    return ClinicalSession.findOneAndUpdate(
      { session_id: sessionId },
      { $set: updateData },
      { new: true }
    );
  }

  async updateClinicalSummary(sessionId, summary) {
    return ClinicalSession.findOneAndUpdate(
      { session_id: sessionId },
      { $set: { clinical_summary: summary } },
      { new: true }
    );
  }

  async findActiveSessions({ skip = 0, limit = 50 } = {}) {
    // Active sessions are anything not COMPLETED or CONSULTATION_COMPLETE
    const activeFilter = {
      status: { $nin: ['COMPLETED', 'CONSULTATION_COMPLETE'] },
    };

    const [sessions, total] = await Promise.all([
      ClinicalSession.find(activeFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ClinicalSession.countDocuments(activeFilter),
    ]);

    return { sessions, total };
  }

  async findByPatientId(patientId) {
    return ClinicalSession.find({ patient_id: patientId.toUpperCase() }).sort({ createdAt: -1 });
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
