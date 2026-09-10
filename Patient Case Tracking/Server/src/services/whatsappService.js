import { patientRepository } from '../repositories/patientRepository.js';
import { consentRepository } from '../repositories/consentRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { recordRepository } from '../repositories/recordRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { logger } from '../utils/logger.js';

/**
 * WhatsApp Integration Service — Core Business Logic Layer
 * Strictly adheres to DPDP Act 2023 consent boundaries and clinical confidentiality.
 */
export class WhatsAppService {
  /**
   * 1. Authenticate patient by phone number and check active session & consent
   */
  async checkPatientSessionAndConsent({ phone, chatId, pushName }) {
    if (!phone && !chatId) {
      return {
        authenticated: false,
        patient: null,
        session: null,
        has_consent: false,
        message: 'Phone number or Chat ID is required for authentication.',
      };
    }

    // Clean phone number from chatId (e.g. 919876543210@c.us -> 919876543210)
    const rawNumber = phone || (chatId ? chatId.split('@')[0] : '');
    const patient = await patientRepository.findByPhone(rawNumber);

    if (!patient) {
      logger.info(`[WhatsApp Auth]: No registered patient found for phone ${rawNumber}`);
      return {
        authenticated: false,
        patient: null,
        session: null,
        has_consent: false,
        message: 'Patient profile not found for this number. Please register at the hospital kiosk or reception.',
      };
    }

    // Check DPDP Consent for AI Case Taking / WhatsApp Assistance
    const activeConsent = await consentRepository.findActiveConsent(
      patient.patient_id,
      'AI_CASE_TAKING'
    );

    // Retrieve active or most recent session
    const patientSessions = await sessionRepository.findByPatientId(patient.patient_id);
    const activeSession = patientSessions.find(
      (s) => s.status !== 'COMPLETED' && s.status !== 'CONSULTATION_COMPLETE'
    ) || patientSessions[0] || null;

    logger.info(`[WhatsApp Auth]: Authenticated patient ${patient.patient_id} (${patient.first_name}) | Consent: ${Boolean(activeConsent)}`);

    return {
      authenticated: true,
      patient: {
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        gender: patient.gender,
        date_of_birth: patient.date_of_birth,
      },
      session: activeSession
        ? {
            session_id: activeSession.session_id,
            status: activeSession.status,
            language: activeSession.language,
            triage_level: activeSession.triage_level,
          }
        : null,
      has_consent: Boolean(activeConsent),
      consent_status: activeConsent ? activeConsent.status : 'NOT_GRANTED',
      message: activeConsent
        ? 'Patient authenticated with valid clinical consent.'
        : 'Patient identified, but active AI processing consent is required under DPDP Act.',
    };
  }

  /**
   * 2. Retrieve authorized, sanitized medical records strictly gated by patient consent
   */
  async getAuthorizedPatientRecords({ patientId, phone, sessionId }) {
    let patient = null;
    if (patientId) {
      patient = await patientRepository.findByPatientId(patientId);
    } else if (phone) {
      patient = await patientRepository.findByPhone(phone);
    }

    if (!patient) {
      return {
        authorized: false,
        reason: 'PATIENT_NOT_FOUND',
        message: 'Hu tamaru medical record access kari shaktu nathi, because patient profile verify nathi thai.',
        records: null,
      };
    }

    // DPDP Act 2023 Consent Gate
    const activeConsent = await consentRepository.findActiveConsent(
      patient.patient_id,
      'AI_CASE_TAKING'
    );

    if (!activeConsent) {
      logger.warn(`[WhatsApp Security]: Blocked record access for ${patient.patient_id} — Consent missing or revoked.`);
      return {
        authorized: false,
        reason: 'CONSENT_REQUIRED',
        message: 'Hu tamaru medical record access kari shaktu nathi atyare, because proper verification/authorization required che.',
        records: null,
      };
    }

    // Retrieve authorized medical data
    const { records: clinicalRecords } = await recordRepository.findByPatientId(
      patient.patient_id,
      { limit: 3 }
    );

    const latestRecord = clinicalRecords[0] || null;

    // Retrieve recent clinical observations if session exists
    let observations = [];
    if (sessionId || latestRecord?.session_id) {
      const targetSessionId = sessionId || latestRecord.session_id;
      observations = await observationRepository.findBySessionId(targetSessionId);
    }

    // Retrieve recent document summaries
    const recentDocs = await documentRepository.findByPatientId(patient.patient_id);

    // Group observations into clean categories
    const observationsSummary = {
      symptoms: observations.filter((o) => o.category === 'SYMPTOM').map((o) => ({ name: o.name, value: o.value, unit: o.unit })),
      medications: observations.filter((o) => o.category === 'MEDICATION').map((o) => ({ name: o.name, value: o.value })),
      allergies: observations.filter((o) => o.category === 'ALLERGY').map((o) => o.name),
      lab_results: observations.filter((o) => o.category === 'LAB_RESULT').map((o) => ({ test: o.name, value: o.value, unit: o.unit })),
      conditions: observations.filter((o) => o.category === 'CONDITION').map((o) => o.name),
    };

    // Filter document summaries without exposing private URLs or internal IDs
    const documentsSummary = recentDocs.slice(0, 3).map((d) => ({
      document_type: d.document_type,
      uploaded_at: d.createdAt,
      extracted_summary: d.extracted_text ? d.extracted_text.slice(0, 200) : '',
    }));

    // Build sanitized clinical digest
    const sanitizedRecord = latestRecord
      ? {
          record_id: latestRecord.record_id,
          chief_complaint: latestRecord.chief_complaint,
          review_status: latestRecord.review_status,
          reviewed_at: latestRecord.reviewed_at,
          doctor_notes: latestRecord.doctor_notes || '',
          prescriptions: (latestRecord.physician_prescription || []).map((p) => ({
            medicine_name: p.medicine_name,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions,
          })),
          lab_investigations: latestRecord.lab_investigations || [],
          triage: latestRecord.triage || { level: 'ROUTINE' },
        }
      : null;

    return {
      authorized: true,
      patient: {
        patient_id: patient.patient_id,
        name: `${patient.first_name} ${patient.last_name}`.trim(),
        gender: patient.gender,
      },
      records: {
        latest_record: sanitizedRecord,
        observations: observationsSummary,
        recent_documents: documentsSummary,
      },
    };
  }

  /**
   * 3. Log Emergency / Priority Triage Alert from WhatsApp
   */
  async logEmergencyTriageAlert({ patientId, sessionId, reason, category, phone }) {
    logger.warn(`[WhatsApp Emergency Triage]: Alert triggered for patient ${patientId || phone}. Reason: ${reason}`);

    if (sessionId) {
      await sessionRepository.updateStatus(sessionId, 'PRIORITY_TRIAGE', {
        triage_level: 'EMERGENCY',
        triage_reason: reason || 'Urgent distress detected via WhatsApp chat.',
        'red_flags.has_red_flag': true,
        'red_flags.severity': 'CRITICAL',
        'red_flags.reason': reason || 'WhatsApp emergency triage trigger',
        'red_flags.triggered_at': new Date(),
      });
    }

    return {
      alert_logged: true,
      timestamp: new Date().toISOString(),
      triage_level: 'EMERGENCY',
      helplines: {
        ambulance: '108',
        emergency: '102',
        hospital_desk: '079-26578900',
      },
    };
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
