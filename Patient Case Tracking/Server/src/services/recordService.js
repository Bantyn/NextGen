import crypto from 'crypto';
import { recordRepository } from '../repositories/recordRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { caseMessageRepository } from '../repositories/caseMessageRepository.js';
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

    // Pull structured observations, documents, and transcripts for this session
    const [observations, documents, messages] = await Promise.all([
      observationRepository.findBySessionId(session_id),
      documentRepository.findBySessionId(session_id),
      caseMessageRepository.findBySessionId(session_id),
    ]);

    const symptoms = observations
      .filter((o) => o.category === 'SYMPTOM')
      .map((o) => `${o.name} (${o.value || ''})`);

    const medications = observations
      .filter((o) => o.category === 'MEDICATION')
      .map((o) => `${o.name} (${o.value || ''})`);

    const allergies = observations
      .filter((o) => o.category === 'ALLERGY')
      .map((o) => o.name);

    // Extract lab investigations from documents
    const labInvestigations = [];
    const verificationRequired = [];

    (documents || []).forEach((doc) => {
      const data = doc.structured_data || {};
      if (data.lab_investigations && Array.isArray(data.lab_investigations)) {
        data.lab_investigations.forEach((lab) => {
          labInvestigations.push({
            test_name: lab.test_name || 'Lab Test',
            observed_value: String(lab.observed_value || ''),
            reference_range: String(lab.reference_range || ''),
            unit: String(lab.unit || ''),
            flag: lab.flag || 'NORMAL',
          });

          if (lab.flag === 'CRITICAL' || lab.flag === 'HIGH') {
            verificationRequired.push({
              item: `${lab.test_name}: ${lab.observed_value} ${lab.unit || ''} (${lab.flag})`,
              category: 'LAB_INVESTIGATION',
              reason: 'Abnormal/Critical laboratory value extracted from diagnostic report.',
              confidence: doc.confidence_score || 0.85,
            });
          }
        });
      }

      if (doc.requires_doctor_verification) {
        verificationRequired.push({
          item: `${doc.document_type} (${doc.file_name})`,
          category: 'MEDICAL_DOCUMENT',
          reason: 'Handwritten medical script or OCR scan requiring physician visual validation.',
          confidence: doc.confidence_score || 0.8,
        });
      }
    });

    // Build structured HPI from dialogue transcript, answered steps, and clinical state
    const transcriptSummary = (messages || [])
      .slice(-10)
      .map((m) => `${m.sender}: ${m.message}`)
      .join('\n');

    const stepSummary = (session.answered_steps || [])
      .map((step) => `${step.topic}: ${step.patient_answer}`)
      .join('\n');

    const clinicalState = session.clinical_state || {};
    const hpiText = [
      clinicalState.chief_complaint ? `Chief Complaint: ${clinicalState.chief_complaint}` : '',
      clinicalState.onset ? `Onset: ${clinicalState.onset}` : '',
      clinicalState.duration ? `Duration: ${clinicalState.duration}` : '',
      clinicalState.severity ? `Severity: ${clinicalState.severity}` : '',
      clinicalState.associated_symptoms?.length ? `Associated Symptoms: ${clinicalState.associated_symptoms.join(', ')}` : '',
      stepSummary || transcriptSummary || session.clinical_summary?.history_of_present_illness || 'Clinical history collected at kiosk.',
    ]
      .filter(Boolean)
      .join('\n');

    // Triage evaluation
    const triageLevel = session.triage_level || clinicalState.risk_level || 'LOW';
    const triageReason = session.triage_reason || session.red_flags?.reason || 'Routine outpatient pre-consultation.';

    if (session.red_flags?.has_red_flag) {
      verificationRequired.unshift({
        item: `Red Flag Alert: ${session.red_flags.reason || 'Critical symptom reported'}`,
        category: 'TRIAGE_ALERT',
        reason: 'Immediate clinical review required before patient departure.',
        confidence: 1.0,
      });
    }

    const record_id = this.generateRecordId();

    const draftRecord = await recordRepository.create({
      record_id,
      patient_id: patient_id.toUpperCase(),
      session_id,
      chief_complaint: clinicalState.chief_complaint || session.chief_complaint_category || session.clinical_summary?.chief_complaint || 'General Consultation',
      structured_history: {
        history_of_present_illness: hpiText,
        past_medical_history: clinicalState.relevant_history?.length ? clinicalState.relevant_history : session.clinical_summary?.past_medical_history || [],
        medications: medications.length ? medications : clinicalState.medications || session.clinical_summary?.medications || [],
        allergies: allergies.length ? allergies : clinicalState.allergies || session.clinical_summary?.allergies || [],
        family_history: clinicalState.family_history || [],
        lifestyle_ayush: session.ayush_profile || clinicalState.lifestyle || {},
      },
      triage: {
        level: triageLevel,
        category: session.chief_complaint_category || 'OUTPATIENT_ASSESSMENT',
        reason: triageReason,
      },
      doctor_verification_required: verificationRequired,
      lab_investigations: labInvestigations,
      ai_summary: {
        red_flags: session.red_flags || { has_red_flag: false },
        observations_count: observations.length,
        documents_count: documents.length,
        consultation_type: session.consultation_type,
        intake_completed_at: new Date(),
        executive_summary: `Patient presented with ${clinicalState.chief_complaint || session.chief_complaint_category || 'symptoms'}. Triage assigned: ${triageLevel}. ${verificationRequired.length} item(s) flagged for doctor verification.`,
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
