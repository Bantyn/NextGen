import crypto from 'crypto';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { SESSION_STATUS } from '../constants/patientStatus.js';
import { doctorService } from './doctorService.js';

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
    opd_type = 'GENERAL',
    opd_system = 'GENERAL_MEDICINE',
  }) {
    if (!patient_id) {
      throw ApiError.badRequest('patient_id is required to create a session.', 'PATIENT_ID_REQUIRED');
    }

    const patient = (patientRepository.findByPatientId ? await patientRepository.findByPatientId(patient_id) : null) || await patientRepository.findById(patient_id);
    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${patient_id}' not found.`, 'PATIENT_NOT_FOUND');
    }

    const sessionId = this.generateSessionId();

    const newSession = await sessionRepository.create({
      session_id: sessionId,
      patient_id,
      language,
      consultation_type,
      chief_complaint_category,
      opd_type,
      opd_system,
      status: SESSION_STATUS.STARTED,
    });

    return newSession;
  }

  async getSessionById(sessionId) {
    if (!sessionId) {
      throw ApiError.badRequest('sessionId parameter is required.', 'SESSION_ID_REQUIRED');
    }

    let session = await sessionRepository.findBySessionId(sessionId);
    if (!session) {
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

    // Auto-allot doctor from MongoDB User collection if not already assigned
    if (!session.assigned_doctor_id && !extraFields.assigned_doctor_id) {
      try {
        const symptoms = extraFields.clinical_state?.symptoms || session.clinical_state?.symptoms || [];
        const chiefComplaint = extraFields.clinical_state?.chief_complaint || session.clinical_state?.chief_complaint || session.chief_complaint_category || '';
        const opdType = session.opd_type || extraFields.opd_type || 'GENERAL';
        const opdSystem = session.opd_system || extraFields.opd_system || '';

        const allotted = await doctorService.allotDoctorForPatient({
          symptoms,
          chiefComplaint,
          opdType,
          opdSystem,
        });

        if (allotted) {
          extraFields.assigned_doctor_id = allotted.doctorId;
          extraFields.assigned_doctor_name = allotted.doctorName;
          extraFields.assigned_doctor_specialty = allotted.specialization;
          extraFields.assigned_doctor_room = allotted.room;
        }
      } catch (err) {
        // Safe fallback
      }
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
