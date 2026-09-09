import { consentRepository } from '../repositories/consentRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { CONSENT_STATUS, CONSENT_TYPE } from '../constants/patientStatus.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Consent Service — Pure Domain Logic for Digital Personal Data Protection (DPDP) Compliance
 */
export class ConsentService {
  async grantConsent({ patient_id, session_id, consent_type = CONSENT_TYPE.AI_CASE_TAKING, status = CONSENT_STATUS.GRANTED }) {
    // Verify patient
    const patient = await patientRepository.findByPatientId(patient_id);
    if (!patient) {
      throw ApiError.notFound(`Patient '${patient_id}' does not exist.`, 'PATIENT_NOT_FOUND');
    }

    // If session_id provided, verify session
    if (session_id) {
      const session = await sessionRepository.findBySessionId(session_id);
      if (!session) {
        throw ApiError.notFound(`Clinical session '${session_id}' does not exist.`, 'SESSION_NOT_FOUND');
      }
    }

    const consent = await consentRepository.create({
      patient_id: patient_id.toUpperCase(),
      session_id,
      consent_type,
      status,
      granted_at: new Date(),
    });

    return consent;
  }

  async getPatientConsents(patientId) {
    const consents = await consentRepository.findByPatientId(patientId);
    return consents;
  }

  async revokeConsent(patientId, consentType) {
    return consentRepository.revoke(patientId, consentType);
  }
}

export const consentService = new ConsentService();
export default consentService;
