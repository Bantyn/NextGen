import crypto from 'crypto';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { SESSION_STATUS } from '../constants/patientStatus.js';

/**
 * Session Service — Pure Domain Logic for Clinical Intake & Consultation Sessions
 */
export class SessionService {
  generateSessionId() {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `SES-${randomHex}`;
  }

  async initializeSession({
    patient_id,
    language = 'gu-IN',
    consultation_type = 'GENERAL',
    chief_complaint_category = null,
  }) {
    if (!patient_id) {
      throw ApiError.badRequest('patient_id is required to start a clinical session.', 'PATIENT_ID_REQUIRED');
    }

    // Verify patient exists
    const patient = await patientRepository.findByPatientId(patient_id);
    if (!patient) {
      throw ApiError.notFound(`Patient '${patient_id}' does not exist.`, 'PATIENT_NOT_FOUND');
    }

    const session_id = this.generateSessionId();

    const session = await sessionRepository.create({
      session_id,
      patient_id: patient_id.toUpperCase(),
      language,
      consultation_type,
      chief_complaint_category,
      status: SESSION_STATUS.STARTED,
      started_at: new Date(),
    });

    // Update patient status to IN_SESSION
    await patientRepository.updateStatus(patient_id, 'IN_SESSION');

    return session;
  }

  async getSessionById(sessionId) {
    let session = await sessionRepository.findBySessionId(sessionId);
    if (!session && sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      session = await sessionRepository.findById(sessionId);
    }

    if (!session) {
      throw ApiError.notFound(`Clinical session '${sessionId}' was not found.`, 'SESSION_NOT_FOUND');
    }

    return session;
  }

  async updateSessionStatus(sessionId, status, extraFields = {}) {
    const session = await sessionRepository.findBySessionId(sessionId);
    if (!session) {
      throw ApiError.notFound(`Clinical session '${sessionId}' was not found.`, 'SESSION_NOT_FOUND');
    }

    const updated = await sessionRepository.updateStatus(sessionId, status, extraFields);
    return updated;
  }

  async getActiveSessions({ page = 1, limit = 50 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const { sessions, total } = await sessionRepository.findActiveSessions({ skip, limit: limitNum });
    const meta = buildPaginationMeta(pageNum, limitNum, total);

    return { sessions, meta };
  }
}

export const sessionService = new SessionService();
export default sessionService;
