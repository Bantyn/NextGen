import { PatientConsent } from '../models/PatientConsent.js';
import { CONSENT_STATUS } from '../constants/patientStatus.js';

/**
 * Consent Repository — Data Access Layer for Patient Consents
 */
export class ConsentRepository {
  async create(consentData) {
    const consent = new PatientConsent(consentData);
    return consent.save();
  }

  async findByPatientId(patientId) {
    return PatientConsent.find({ patient_id: patientId.toUpperCase() }).sort({ createdAt: -1 });
  }

  async findBySessionId(sessionId) {
    return PatientConsent.find({ session_id: sessionId }).sort({ createdAt: -1 });
  }

  async findActiveConsent(patientId, consentType) {
    return PatientConsent.findOne({
      patient_id: patientId.toUpperCase(),
      consent_type: consentType,
      status: CONSENT_STATUS.GRANTED,
    }).sort({ createdAt: -1 });
  }

  async revoke(patientId, consentType) {
    return PatientConsent.updateMany(
      {
        patient_id: patientId.toUpperCase(),
        consent_type: consentType,
        status: CONSENT_STATUS.GRANTED,
      },
      {
        status: CONSENT_STATUS.REVOKED,
        revoked_at: new Date(),
      }
    );
  }
}

export const consentRepository = new ConsentRepository();
export default consentRepository;
