import crypto from 'crypto';
import { redFlagRepository } from '../repositories/redFlagRepository.js';
import { doctorNotificationRepository } from '../repositories/doctorNotificationRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { recordRepository } from '../repositories/recordRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { observationRepository } from '../repositories/observationRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { doctorService } from './doctorService.js';
import { RED_FLAG_STATUS } from '../models/RedFlagCase.js';
import { NOTIFICATION_STATUS } from '../models/DoctorNotification.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../constants/roles.js';

/**
 * Clinical Category to Medical Specialty Mapping Table
 * Configured clinical routing matrix — prevents hardcoding unsafe assumptions.
 */
const CLINICAL_SPECIALTY_ROUTING = Object.freeze({
  CARDIOVASCULAR_EMERGENCY: ['Cardiology', 'Emergency Medicine', 'General Medicine'],
  NEUROLOGICAL_EMERGENCY: ['Neurology', 'Emergency Medicine', 'General Medicine'],
  HEMOPTYSIS_ALERT: ['Pulmonology', 'Emergency Medicine', 'General Medicine'],
  RESPIRATORY_OR_ACUTE_DISTRESS: ['Pulmonology', 'Emergency Medicine', 'General Medicine'],
  SEVERE_HEMORRHAGE: ['Emergency Medicine', 'Gastroenterology', 'General Medicine'],
  LOSS_OF_CONSCIOUSNESS: ['Neurology', 'Cardiology', 'Emergency Medicine', 'General Medicine'],
  CHEST_PAIN_TARGETED_ASSESSMENT: ['Cardiology', 'General Medicine', 'Emergency Medicine'],
  DEFAULT_FALLBACK: ['Emergency Medicine', 'General Medicine'],
});

export class RedFlagCaseService {
  /**
   * Helper to generate unique Case ID: RFC-XXXXXXXX
   */
  generateCaseId() {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `RFC-${randomHex}`;
  }

  /**
   * Helper to generate unique Notification ID: NOTIF-XXXXXXXX
   */
  generateNotificationId() {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `NOTIF-${randomHex}`;
  }

  /**
   * Determine required specialties from verified clinical category
   */
  matchSpecialtiesForCategory(category = '') {
    const key = (category || '').trim().toUpperCase();
    return CLINICAL_SPECIALTY_ROUTING[key] || CLINICAL_SPECIALTY_ROUTING.DEFAULT_FALLBACK;
  }

  /**
   * Multi-Tier Doctor Eligibility & Availability Discovery
   * Tier 1: Matching required medical specialty AND currently available on duty.
   * Tier 2 (Fallback): If no specialist is available, all eligible available doctors.
   */
  async findEligibleDoctors(requiredSpecialties = []) {
    // 1. Fetch live doctors from database
    const dbDoctors = await userRepository.findDoctors({ is_active: true });
    // 2. Fetch directory roster from doctorService
    const directoryDoctors = doctorService.getAllDoctors();

    // Unified doctor pool
    const combinedDoctorsMap = new Map();

    // Populate directory doctors first
    for (const doc of directoryDoctors) {
      combinedDoctorsMap.set(doc.doctor_id, {
        doctor_id: doc.doctor_id,
        doctor_name: doc.doctor_name,
        specialty: doc.specialty,
        sub_specialty: doc.sub_specialty,
        on_duty: true,
        availability_status: 'AVAILABLE',
      });
    }

    // Overlay or add registered DB doctors
    for (const u of dbDoctors) {
      const docId = u.doctor_id || u._id.toString();
      combinedDoctorsMap.set(docId, {
        doctor_id: docId,
        doctor_name: u.name,
        specialty: u.specialty || 'General Medicine',
        sub_specialty: u.sub_specialty || '',
        on_duty: u.on_duty !== false,
        availability_status: u.availability_status || 'AVAILABLE',
        is_active: u.is_active !== false,
      });
    }

    const allCandidateDoctors = Array.from(combinedDoctorsMap.values());

    // Filter by live availability (must be active, on duty, and AVAILABLE)
    const availableDoctors = allCandidateDoctors.filter(
      (d) => d.is_active !== false && d.on_duty !== false && d.availability_status === 'AVAILABLE'
    );

    // Tier 1: Check relevant specialty match
    const cleanReqSpecialties = requiredSpecialties.map((s) => s.trim().toLowerCase());
    const tier1Specialists = availableDoctors.filter((doc) => {
      const docSpecialty = (doc.specialty || '').toLowerCase();
      const docSub = (doc.sub_specialty || '').toLowerCase();
      return cleanReqSpecialties.some((req) => {
        if (!req) return false;
        if (docSpecialty === req || docSub === req) return true;
        if (req.length >= 4 && (docSpecialty.includes(req) || docSub.includes(req))) return true;
        const regex = new RegExp(`(^|\\s|/|,)${req}($|\\s|/|,)`, 'i');
        return regex.test(docSpecialty) || regex.test(docSub);
      });
    });

    if (tier1Specialists.length > 0) {
      logger.info(
        `[Routing] specialties=${requiredSpecialties.join(',')} tier=TIER_1_SPECIALISTS eligible_doctors=${tier1Specialists.map((d) => d.doctor_id).join(',')}`
      );
      return {
        tier: 'TIER_1_SPECIALISTS',
        doctors: tier1Specialists,
      };
    }

    // Tier 2: Fallback to all eligible available doctors (General/Emergency Medicine)
    logger.warn(
      `[Routing] specialties=${requiredSpecialties.join(',')} tier=TIER_2_FALLBACK notice="No specialist available now, routing to all available eligible doctors"`
    );
    return {
      tier: 'TIER_2_FALLBACK',
      doctors: availableDoctors,
    };
  }

  /**
   * Create and broadcast red-flag emergency case to eligible doctors
   */
  async triggerRedFlagCase({
    sessionId,
    patientId,
    triageResult = {},
    state = {},
    actorId = 'SYSTEM',
  }) {
    // 1. Idempotency check: Check if an active red flag already exists for this session/patient
    const existingActive = await redFlagRepository.findActiveBySessionOrPatient(sessionId, patientId);
    if (existingActive) {
      logger.info(`[RedFlag] case_id=${existingActive.case_id} notice="Active red flag case already exists for session ${sessionId}, preserving active broadcast"`);
      return {
        case_id: existingActive.case_id,
        is_existing: true,
        case: existingActive,
      };
    }

    const caseId = this.generateCaseId();
    const category = triageResult.category || 'CARDIOVASCULAR_EMERGENCY';
    const reason = triageResult.reason || 'Genuine red flag condition detected during clinical assessment.';
    const symptoms = state.symptoms || (triageResult.category ? [triageResult.category] : ['Severe Distress']);
    const targetSpecialties = this.matchSpecialtiesForCategory(category);

    // 2. Discover eligible available doctors (Tier 1 vs Tier 2 fallback)
    const { tier, doctors: eligibleDoctors } = await this.findEligibleDoctors(targetSpecialties);
    const eligibleDoctorIds = eligibleDoctors.map((d) => d.doctor_id);

    // 3. Create RedFlagCase record
    const newCase = await redFlagRepository.create({
      case_id: caseId,
      patient_id: patientId || 'UNKNOWN_PATIENT',
      clinical_session_id: sessionId || 'UNKNOWN_SESSION',
      risk_level: 'RED_FLAG',
      priority: triageResult.triage_level === 'HIGH PRIORITY' ? 'HIGH_PRIORITY' : 'EMERGENCY',
      status: RED_FLAG_STATUS.BROADCASTING,
      trigger: {
        type: 'CLINICAL_ASSESSMENT_RED_FLAG',
        source: 'clinical_assessment',
        confidence: 1.0,
        category,
        reason,
      },
      symptoms,
      specialties: targetSpecialties,
      eligible_doctors: eligibleDoctorIds,
      notified_doctors: eligibleDoctorIds,
      assigned_doctor_id: null,
    });

    // 4. Create data-minimized notification records for all eligible doctors
    const previewData = {
      age: state.lifestyle?.age || state.age || 'Adult',
      gender: state.lifestyle?.gender || state.gender || 'Unknown',
      chief_complaint: state.chief_complaint || symptoms[0] || 'Emergency Symptoms',
      symptoms: symptoms.slice(0, 5),
      triage_reason: reason,
      risk_level: 'RED_FLAG',
      detected_at: new Date(),
    };

    const notifications = eligibleDoctorIds.map((docId) => ({
      notification_id: this.generateNotificationId(),
      case_id: caseId,
      doctor_id: docId,
      reason: 'RED_FLAG_EMERGENCY',
      priority: 'EMERGENCY',
      status: NOTIFICATION_STATUS.ACTIVE,
      preview_data: previewData,
      notified_at: new Date(),
    }));

    if (notifications.length > 0) {
      await doctorNotificationRepository.createNotifications(notifications);
    }

    // 5. Update ClinicalSession status if session exists
    if (sessionId) {
      await sessionRepository.updateStatus(sessionId, 'PRIORITY_TRIAGE', {
        triage_level: 'EMERGENCY',
        triage_reason: reason,
        'red_flags.has_red_flag': true,
        'red_flags.severity': 'CRITICAL',
        'red_flags.reason': reason,
        'red_flags.triggered_at': new Date(),
      }).catch((e) => logger.warn(`[Session Update Notice]: ${e.message}`));
    }

    // 6. Audit logs
    await auditRepository.create({
      user_id: actorId,
      action: 'RED_FLAG_CREATED',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: {
        category,
        priority: 'EMERGENCY',
        specialties: targetSpecialties,
        tier,
      },
    });

    await auditRepository.create({
      user_id: actorId,
      action: 'RED_FLAG_BROADCAST',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: {
        doctor_count: eligibleDoctorIds.length,
        eligible_doctors: eligibleDoctorIds,
        tier,
      },
    });

    logger.info(`[RedFlag] case_id=${caseId} risk_level=RED_FLAG category=${category}`);
    logger.info(`[Broadcast] case_id=${caseId} doctor_count=${eligibleDoctorIds.length} tier=${tier}`);

    return {
      case_id: caseId,
      is_existing: false,
      case: newCase,
      tier,
      notified_count: eligibleDoctorIds.length,
    };
  }

  /**
   * ATOMIC CLAIM / ACCEPT CASE:
   * Concurrency-safe atomic operation preventing multiple doctors from claiming the same case.
   */
  async acceptCase(caseId, doctorId, actorUser = {}) {
    if (!caseId || !doctorId) {
      throw ApiError.badRequest('Both case_id and doctor_id are required to claim a case.', 'MISSING_CLAIM_PARAMS');
    }

    logger.info(`[CaseClaim] case_id=${caseId} doctor_id=${doctorId} action=CLAIM_ATTEMPT`);

    // Execute atomic update at database layer
    const claimedCase = await redFlagRepository.claimCaseAtomically(caseId, doctorId);

    if (!claimedCase) {
      logger.warn(`[CaseClaimResult] case_id=${caseId} doctor_id=${doctorId} status=ALREADY_ASSIGNED`);
      return {
        status: 'CASE_ALREADY_ASSIGNED',
        success: false,
        message: 'This emergency case has already been claimed and handled by another physician.',
      };
    }

    logger.info(`[CaseClaimResult] case_id=${caseId} doctor_id=${doctorId} status=ASSIGNED claimed_at=${claimedCase.claimed_at}`);

    // Mark winner notification as ACCEPTED
    await doctorNotificationRepository.markAsAccepted(caseId, doctorId);

    // Withdraw active notifications for all other doctors (preserves history without stale alerts)
    const withdrawResult = await doctorNotificationRepository.withdrawActiveNotificationsForCase(caseId, doctorId);
    const withdrawnCount = withdrawResult?.modifiedCount || 0;

    logger.info(`[Withdraw] case_id=${caseId} doctor_count=${withdrawnCount} status=NOTIFICATIONS_WITHDRAWN`);

    // Update associated clinical session if present
    if (claimedCase.clinical_session_id) {
      await sessionRepository.updateStatus(claimedCase.clinical_session_id, 'DOCTOR_REVIEW', {
        assigned_doctor_id: doctorId,
      }).catch((e) => logger.warn(`[Session Status Sync Notice]: ${e.message}`));
    }

    // Audit logs
    await auditRepository.create({
      user_id: actorUser.id || doctorId,
      action: 'CASE_ACCEPTED',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: { doctor_id: doctorId, claimed_at: claimedCase.claimed_at },
    });

    await auditRepository.create({
      user_id: actorUser.id || doctorId,
      action: 'CASE_WITHDRAWN',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: { withdrawn_count: withdrawnCount, preserved_doctor: doctorId },
    });

    return {
      status: 'CASE_ASSIGNED',
      success: true,
      case: claimedCase,
      message: 'Emergency case assigned successfully.',
    };
  }

  /**
   * Doctor declines case alert
   */
  async declineCase(caseId, doctorId, reason) {
    const updated = await doctorNotificationRepository.markAsDeclined(caseId, doctorId, reason);
    await auditRepository.create({
      user_id: doctorId,
      action: 'DOCTOR_DECLINED',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: { doctor_id: doctorId, reason },
    });
    return { success: true, notification: updated };
  }

  /**
   * AUTHORIZED CLINICAL SNAPSHOT:
   * Returns full, authorized clinical context for the assigned doctor or supervisor/admin.
   * Gated strictly against unauthorized access.
   */
  async getAuthorizedCaseSnapshot(caseId, doctorId, userRole) {
    const targetCase = await redFlagRepository.findByCaseId(caseId);
    if (!targetCase) {
      throw ApiError.notFound(`Emergency case '${caseId}' was not found.`, 'CASE_NOT_FOUND');
    }

    // Authorization check: Only assigned doctor or ADMIN is permitted to retrieve full clinical details
    const isAssignedDoctor = targetCase.assigned_doctor_id && targetCase.assigned_doctor_id === doctorId;
    const isAdmin = userRole === ROLES.ADMIN;

    if (!isAssignedDoctor && !isAdmin) {
      throw ApiError.forbidden(
        'Forbidden: You are not authorized to access this patient record. Only the assigned physician or clinical supervisor may view full context.',
        'FORBIDDEN_CASE_ACCESS'
      );
    }

    // Fetch authorized patient records and clinical details in parallel
    const [patient, session, recordsResult, observations, documents] = await Promise.all([
      patientRepository.findByPatientId(targetCase.patient_id),
      sessionRepository.findBySessionId(targetCase.clinical_session_id),
      recordRepository.findByPatientId(targetCase.patient_id, { limit: 3 }),
      observationRepository.findBySessionId(targetCase.clinical_session_id),
      documentRepository.findBySessionId(targetCase.clinical_session_id),
    ]);

    const latestRecord = recordsResult?.records?.[0] || null;
    const clinicalState = session?.clinical_state || {};

    // Group observations into clean categories
    const observationsSummary = {
      symptoms: observations.filter((o) => o.category === 'SYMPTOM').map((o) => ({ name: o.name, value: o.value, unit: o.unit })),
      medications: observations.filter((o) => o.category === 'MEDICATION').map((o) => ({ name: o.name, value: o.value })),
      allergies: observations.filter((o) => o.category === 'ALLERGY').map((o) => o.name),
      lab_results: observations.filter((o) => o.category === 'LAB_RESULT').map((o) => ({ test: o.name, value: o.value, unit: o.unit })),
      conditions: observations.filter((o) => o.category === 'CONDITION').map((o) => o.name),
    };

    // Build structured physician-readable clinical summary
    const clinicalSummary = {
      chief_complaint: clinicalState.chief_complaint || targetCase.symptoms?.[0] || 'Urgent Symptoms',
      history_of_present_illness: session?.clinical_summary?.history_of_present_illness || 'Acute clinical presentation requiring urgent evaluation.',
      red_flags: targetCase.trigger?.category ? [targetCase.trigger.category] : targetCase.symptoms,
      trigger: targetCase.trigger,
      detected_at: targetCase.createdAt,
      key_findings: [
        `Risk level: ${targetCase.risk_level}`,
        `Priority: ${targetCase.priority}`,
        `Reported Duration: ${clinicalState.duration || 'Acute onset'}`,
        `Severity: ${clinicalState.severity || 'High/Critical'}`,
      ],
      data_provenance: {
        patient_reported: clinicalState.symptoms || targetCase.symptoms,
        ai_extracted: {
          triage_level: targetCase.priority,
          specialties_matched: targetCase.specialties,
        },
        clinically_verified: latestRecord ? 'Previous Consultation Records on File' : 'Pending Physician Verification',
      },
    };

    return {
      case: {
        case_id: targetCase.case_id,
        priority: targetCase.priority,
        risk_level: targetCase.risk_level,
        status: targetCase.status,
        specialties: targetCase.specialties,
        assigned_doctor_id: targetCase.assigned_doctor_id,
        claimed_at: targetCase.claimed_at,
        created_at: targetCase.createdAt,
      },
      patient: patient
        ? {
            patient_id: patient.patient_id,
            name: `${patient.first_name} ${patient.last_name}`.trim(),
            gender: patient.gender,
            date_of_birth: patient.date_of_birth,
            phone: patient.phone,
          }
        : { patient_id: targetCase.patient_id, name: 'Verified Patient' },
      current_health_status: {
        chief_complaint: clinicalState.chief_complaint || targetCase.symptoms?.[0],
        symptoms: clinicalState.symptoms || targetCase.symptoms,
        severity: clinicalState.severity || 'CRITICAL',
        onset: clinicalState.onset || 'Immediate',
        duration: clinicalState.duration || 'Acute',
        associated_symptoms: clinicalState.associated_symptoms || [],
      },
      medical_history: {
        conditions: observationsSummary.conditions.concat(clinicalState.relevant_history || []),
        allergies: observationsSummary.allergies.concat(clinicalState.allergies || []),
        medications: observationsSummary.medications.concat(clinicalState.medications || []),
        previous_records: (recordsResult?.records || []).map((r) => ({
          record_id: r.record_id,
          chief_complaint: r.chief_complaint,
          reviewed_at: r.reviewed_at,
          doctor_notes: r.doctor_notes,
          prescriptions: r.physician_prescription,
        })),
      },
      documents: (documents || []).map((d) => ({
        document_id: d.document_id,
        document_type: d.document_type,
        file_name: d.file_name,
        extracted_summary: d.extracted_text ? d.extracted_text.slice(0, 300) : '',
        uploaded_at: d.createdAt,
      })),
      clinical_summary: clinicalSummary,
      audit_trail: targetCase.transfer_history || [],
    };
  }

  /**
   * CASE TRANSFER:
   * Controlled clinical handoff from one physician to another
   */
  async transferCase({ caseId, fromDoctorId, toDoctorId, reason, actorId, userRole }) {
    const targetCase = await redFlagRepository.findByCaseId(caseId);
    if (!targetCase) {
      throw ApiError.notFound(`Case '${caseId}' not found.`, 'CASE_NOT_FOUND');
    }

    const isAssignedDoctor = targetCase.assigned_doctor_id === fromDoctorId;
    const isAdmin = userRole === ROLES.ADMIN;

    if (!isAssignedDoctor && !isAdmin) {
      throw ApiError.forbidden('Only the currently assigned doctor or an administrator can transfer this case.', 'FORBIDDEN_TRANSFER');
    }

    // Transfer case in repository
    const updated = await redFlagRepository.transferCase(caseId, fromDoctorId, toDoctorId, reason, actorId);

    // Create notification for recipient doctor
    await doctorNotificationRepository.createNotifications([
      {
        notification_id: this.generateNotificationId(),
        case_id: caseId,
        doctor_id: toDoctorId,
        reason: `TRANSFERRED_BY_${fromDoctorId}: ${reason}`,
        priority: 'EMERGENCY',
        status: NOTIFICATION_STATUS.ACTIVE,
        preview_data: {
          chief_complaint: targetCase.symptoms?.[0] || 'Transferred Case',
          symptoms: targetCase.symptoms,
          triage_reason: reason,
          risk_level: 'RED_FLAG',
        },
        notified_at: new Date(),
      },
    ]);

    logger.info(`[Transfer] case_id=${caseId} from=${fromDoctorId} to=${toDoctorId} reason="${reason}"`);

    await auditRepository.create({
      user_id: actorId || fromDoctorId,
      action: 'CASE_TRANSFERRED',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: { from_doctor_id: fromDoctorId, to_doctor_id: toDoctorId, reason },
    });

    return { success: true, case: updated };
  }

  /**
   * RESOLVE CASE:
   * Concludes clinical consultation and handles disposition
   */
  async resolveCase({ caseId, doctorId, notes, disposition, userRole }) {
    const targetCase = await redFlagRepository.findByCaseId(caseId);
    if (!targetCase) {
      throw ApiError.notFound(`Case '${caseId}' not found.`, 'CASE_NOT_FOUND');
    }

    const isAssignedDoctor = targetCase.assigned_doctor_id === doctorId;
    const isAdmin = userRole === ROLES.ADMIN;

    if (!isAssignedDoctor && !isAdmin) {
      throw ApiError.forbidden('Only the assigned doctor or administrator can resolve this case.', 'FORBIDDEN_RESOLVE');
    }

    const resolved = await redFlagRepository.resolveCase(caseId, {
      notes,
      disposition,
      resolvedBy: doctorId,
    });

    // Update associated clinical session status to CONSULTATION_COMPLETE
    if (targetCase.clinical_session_id) {
      await sessionRepository.updateStatus(targetCase.clinical_session_id, 'CONSULTATION_COMPLETE', {
        completed_at: new Date(),
      }).catch((e) => logger.warn(`[Session Status Sync Notice]: ${e.message}`));
    }

    await auditRepository.create({
      user_id: doctorId,
      action: 'CASE_RESOLVED',
      resource: 'RedFlagCase',
      resource_id: caseId,
      details: { disposition, notes },
    });

    logger.info(`[Resolve] case_id=${caseId} doctor_id=${doctorId} disposition=${disposition}`);
    return { success: true, case: resolved };
  }

  /**
   * Retrieve active emergency cases and pending alerts for a doctor
   */
  async getDoctorActiveEmergencyCases(doctorId) {
    if (!doctorId) return { active_alerts: [], assigned_cases: [] };

    const [activeNotifications, assignedCases] = await Promise.all([
      doctorNotificationRepository.findActiveByDoctor(doctorId),
      redFlagRepository.findAssignedCasesForDoctor(doctorId),
    ]);

    return {
      active_alerts: activeNotifications,
      assigned_cases: assignedCases,
    };
  }

  /**
   * Admin view of all red flag cases
   */
  async getAllRedFlagCases(filter = {}, pagination = {}) {
    return redFlagRepository.findAll(filter, pagination);
  }
}

export const redFlagCaseService = new RedFlagCaseService();
export default redFlagCaseService;
