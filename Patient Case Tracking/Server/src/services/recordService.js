import crypto from 'crypto';
import { recordRepository } from '../repositories/recordRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { RECORD_REVIEW_STATUS, SESSION_STATUS } from '../constants/patientStatus.js';

/**
 * Record Service — Pure Domain Logic for SOAP Clinical Records & Physician Review
 */
export class RecordService {
  generateRecordId() {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `REC-${randomHex}`;
  }

  async generateDraftRecord({ patient_id, session_id }) {
    if (!patient_id || !session_id) {
      throw ApiError.badRequest('patient_id and session_id are required.', 'MISSING_FIELDS');
    }

    const [patient, session] = await Promise.all([
      patientRepository.findByPatientId(patient_id),
      sessionRepository.findBySessionId(session_id),
    ]);

    if (!patient) {
      throw ApiError.notFound(`Patient '${patient_id}' not found.`, 'PATIENT_NOT_FOUND');
    }
    if (!session) {
      throw ApiError.notFound(`Session '${session_id}' not found.`, 'SESSION_NOT_FOUND');
    }

    // Check if a record already exists for this session
    const existingRecord = await recordRepository.findBySessionId(session_id);
    if (existingRecord) {
      return existingRecord;
    }

    // Pull structured observations for this session
    const observations = await observationRepository.findBySessionId(session_id);

    const symptoms = observations.filter((o) => o.category === 'SYMPTOM').map((o) => `${o.name} (${o.value || ''})`);
    const medications = observations.filter((o) => o.category === 'MEDICATION').map((o) => `${o.name} (${o.value || ''})`);
    const allergies = observations.filter((o) => o.category === 'ALLERGY').map((o) => o.name);

    // Build structured history from session steps and observations
    const hpiAnswers = (session.answered_steps || []).map((step) => `${step.topic}: ${step.patient_answer}`).join('\n');

    const record_id = this.generateRecordId();

    const draftRecord = await recordRepository.create({
      record_id,
      patient_id: patient_id.toUpperCase(),
      session_id,
      chief_complaint: session.chief_complaint_category || session.clinical_summary?.chief_complaint || 'General Consultation',
      structured_history: {
        history_of_present_illness: hpiAnswers || session.clinical_summary?.history_of_present_illness || '',
        past_medical_history: session.clinical_summary?.past_medical_history || [],
        medications: medications.length ? medications : session.clinical_summary?.medications || [],
        allergies: allergies.length ? allergies : session.clinical_summary?.allergies || [],
        family_history: [],
        lifestyle_ayush: session.ayush_profile || {},
      },
      ai_summary: {
        red_flags: session.red_flags || { has_red_flag: false },
        observations_count: observations.length,
        consultation_type: session.consultation_type,
        intake_completed_at: new Date(),
      },
      doctor_notes: '',
      review_status: RECORD_REVIEW_STATUS.PENDING,
    });

    // Advance session status to DOCTOR_REVIEW
    await sessionRepository.updateStatus(session_id, SESSION_STATUS.DOCTOR_REVIEW);

    return draftRecord;
  }

  async getRecordById(recordId) {
    let record = await recordRepository.findByRecordId(recordId);
    if (!record && recordId.match(/^[0-9a-fA-F]{24}$/)) {
      record = await recordRepository.findById(recordId);
    }

    if (!record) {
      throw ApiError.notFound(`Clinical record '${recordId}' was not found.`, 'RECORD_NOT_FOUND');
    }

    return record;
  }

  async reviewRecord(recordId, { review_status, doctor_notes = '', physician_prescription = [], reviewed_by }) {
    if (!review_status || !Object.values(RECORD_REVIEW_STATUS).includes(review_status)) {
      throw ApiError.badRequest(
        `Invalid review_status. Allowed: [${Object.values(RECORD_REVIEW_STATUS).join(', ')}]`,
        'INVALID_REVIEW_STATUS'
      );
    }

    const record = await this.getRecordById(recordId);

    const updatedRecord = await recordRepository.updateReview(record.record_id, {
      review_status,
      doctor_notes,
      physician_prescription,
      reviewed_by,
      reviewed_at: new Date(),
    });

    // If approved or rejected, transition session to COMPLETED
    if (review_status === RECORD_REVIEW_STATUS.APPROVED) {
      await sessionRepository.updateStatus(record.session_id, SESSION_STATUS.CONSULTATION_COMPLETE);
      await patientRepository.updateStatus(record.patient_id, 'CONSULTATION_COMPLETE');
    }

    await auditRepository.create({
      user_id: reviewed_by?.toString() || 'SYSTEM',
      action: `RECORD_${review_status}`,
      resource: 'ClinicalRecord',
      resource_id: record.record_id,
      details: { review_status, doctor_notes_length: doctor_notes.length },
    });

    return updatedRecord;
  }

  async getPatientRecordHistory(patientId, { review_status, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const { records, total } = await recordRepository.findByPatientId(patientId, {
      reviewStatus: review_status,
      skip,
      limit: limitNum,
    });

    const meta = buildPaginationMeta(pageNum, limitNum, total);
    return { records, meta };
  }
}

export const recordService = new RecordService();
export default recordService;
