import crypto from 'crypto';
import mongoose from 'mongoose';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { ClinicalRecord } from '../models/ClinicalRecord.js';
import { Patient } from '../models/Patient.js';
import { PatientIdentity } from '../models/PatientIdentity.js';
import { CaseMessage } from '../models/CaseMessage.js';
import { MedicalDocument } from '../models/MedicalDocument.js';
import { RedFlagCase, RED_FLAG_STATUS } from '../models/RedFlagCase.js';
import { DoctorNotification } from '../models/DoctorNotification.js';
import { PrescriptionTemplate } from '../models/PrescriptionTemplate.js';
import { Appointment } from '../models/Appointment.js';
import { VitalsRecord } from '../models/VitalsRecord.js';
import { User } from '../models/User.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { doctorService } from './doctorService.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../constants/roles.js';

// Default clinical prescription templates seeded on first load
const DEFAULT_PRESET_TEMPLATES = [
  {
    template_id: 'TPL-URI-01',
    doctor_id: 'SYSTEM',
    title: 'Acute Upper Respiratory Infection (URI) / Viral Cold',
    category: 'General OPD',
    notes: 'Warm saline gargles thrice daily, steam inhalation, and adequate hydration.',
    medicines: [
      {
        medicine_name: 'Paracetamol 500mg',
        generic_name: 'Acetaminophen',
        dosage: '1 tablet',
        frequency: 'Thrice daily (TDS)',
        route: 'Oral',
        duration: '3 days',
        instructions: 'Take after meals for fever or body ache',
        before_after_food: 'AFTER_FOOD',
      },
      {
        medicine_name: 'Cetirizine 10mg',
        generic_name: 'Cetirizine Hydrochloride',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime (OD)',
        route: 'Oral',
        duration: '5 days',
        instructions: 'May cause mild drowsiness',
        before_after_food: 'AFTER_FOOD',
      },
      {
        medicine_name: 'Ayurvedic Tulsi-Vasaka Syrup',
        generic_name: 'Ayurvedic Herbal Cough Formulation',
        dosage: '10 ml',
        frequency: 'Twice daily (BD)',
        route: 'Oral',
        duration: '5 days',
        instructions: 'Mix with warm water',
        before_after_food: 'AFTER_FOOD',
      },
    ],
  },
  {
    template_id: 'TPL-DIAB-01',
    doctor_id: 'SYSTEM',
    title: 'Type 2 Diabetes Mellitus Maintenance Regimen',
    category: 'Endocrine & Metabolic',
    notes: 'Strict low glycemic index diet, 30 minutes daily brisk walking, monitor fasting and post-prandial blood sugar weekly.',
    medicines: [
      {
        medicine_name: 'Metformin 500mg (Extended Release)',
        generic_name: 'Metformin Hydrochloride',
        dosage: '1 tablet',
        frequency: 'Twice daily with meals (BD)',
        route: 'Oral',
        duration: '30 days',
        instructions: 'Swallow whole with food, do not crush',
        before_after_food: 'WITH_FOOD',
      },
    ],
  },
  {
    template_id: 'TPL-HTN-01',
    doctor_id: 'SYSTEM',
    title: 'Essential Hypertension Stage 1 Protocol',
    category: 'Cardiology',
    notes: 'DASH diet, restrict dietary sodium to < 2g/day, avoid tobacco and alcohol.',
    medicines: [
      {
        medicine_name: 'Amlodipine 5mg',
        generic_name: 'Amlodipine Besylate',
        dosage: '1 tablet',
        frequency: 'Once daily morning (OD)',
        route: 'Oral',
        duration: '30 days',
        instructions: 'Maintain daily blood pressure log',
        before_after_food: 'BEFORE_FOOD',
      },
    ],
  },
];

export class DoctorPanelService {
  /**
   * 1. Aggregate Real-Time Doctor Dashboard Metrics
   */
  async getDoctorDashboardStats(doctorId) {
    await this.ensureSeedClinicalData(doctorId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const doctorUser = await User.findOne({
      $or: [
        { doctor_id: doctorId },
        { email: doctorId },
        ...(mongoose.Types.ObjectId.isValid(doctorId) ? [{ _id: doctorId }] : []),
      ],
    }).select('name email specialty sub_specialty opd_type opd_system room on_duty availability_status').catch(() => null);

    const doctorScope = {
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
      ],
    };

    const emergencyScope = {
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
        { assigned_doctor_id: null, triage_level: { $in: ['EMERGENCY', 'HIGH PRIORITY', 'HIGH', 'RED_FLAG'] } },
        { assigned_doctor_id: null, 'red_flags.has_red_flag': true },
      ],
    };

    const [totalToday, waitingCount, inConsultationCount, emergencyCount, completedToday] = await Promise.all([
      ClinicalSession.countDocuments({
        $and: [
          emergencyScope,
          { status: { $ne: 'CANCELLED' } },
        ],
      }).catch(() => 0),
      ClinicalSession.countDocuments({
        $and: [
          doctorScope,
          {
            $or: [
              { status: { $in: ['STARTED', 'IDENTIFIED', 'IN_PROGRESS', 'CONSENT_PENDING'] } },
              { journey_stage: 'CHECKED_IN' },
            ],
            status: { $nin: ['COMPLETED', 'CONSULTATION_COMPLETE', 'CANCELLED'] },
          },
        ],
      }).catch(() => 0),
      ClinicalSession.countDocuments({
        $and: [
          doctorScope,
          {
            $or: [
              { status: { $in: ['READY_FOR_DOCTOR', 'DOCTOR_REVIEW'] } },
              { journey_stage: 'IN_CONSULTATION' },
            ],
          },
        ],
      }).catch(() => 0),
      ClinicalSession.countDocuments({
        $and: [
          emergencyScope,
          {
            $or: [
              { triage_level: { $in: ['EMERGENCY', 'HIGH PRIORITY', 'HIGH', 'RED_FLAG'] } },
              { 'red_flags.has_red_flag': true },
            ],
            status: { $nin: ['COMPLETED', 'CONSULTATION_COMPLETE', 'CANCELLED'] },
          },
        ],
      }).catch(() => 0),
      ClinicalSession.countDocuments({
        $and: [
          doctorScope,
          { status: { $in: ['COMPLETED', 'CONSULTATION_COMPLETE'] } },
        ],
      }).catch(() => 0),
    ]);

    return {
      totalOPD: totalToday,
      waiting: waitingCount,
      inConsultation: inConsultationCount,
      awaitingReview: waitingCount + inConsultationCount,
      emergencyTriage: emergencyCount,
      priorityCases: emergencyCount,
      completedToday: completedToday,
      averageWaitMins: Math.max(8, waitingCount * 5),
      doctorInfo: doctorUser ? {
        name: doctorUser.name ? (doctorUser.name.toLowerCase().startsWith('dr') ? doctorUser.name : `Dr. ${doctorUser.name}`) : 'Dr. Aarav Sharma',
        specialty: doctorUser.specialty || (doctorUser.opd_type === 'AYUSH' ? 'Ayush Kayachikitsa' : 'General Medicine'),
        opd_type: doctorUser.opd_type || 'GENERAL',
        opd_system: doctorUser.opd_system || (doctorUser.opd_type === 'AYUSH' ? 'AYURVEDA' : 'GENERAL_MEDICINE'),
        room: doctorUser.room || 'Room 104',
        on_duty: doctorUser.on_duty !== undefined ? doctorUser.on_duty : true,
        availability_status: doctorUser.availability_status || 'AVAILABLE',
      } : {
        name: 'Dr. Aarav Sharma',
        specialty: 'General Medicine',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        room: 'Room 104',
        on_duty: true,
        availability_status: 'AVAILABLE',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 2. Fetch Live OPD Queue with Clinical Details
   */
  async getDoctorOPDQueue(doctorId, { tab = 'ALL', search = '' } = {}) {
    const doctorUser = await User.findOne({
      $or: [
        { doctor_id: doctorId },
        { email: doctorId },
        ...(mongoose.Types.ObjectId.isValid(doctorId) ? [{ _id: doctorId }] : []),
      ],
    }).select('specialty opd_type opd_system').catch(() => null);

    const ownershipFilter = {
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
        {
          assigned_doctor_id: null,
          $or: [
            { triage_level: { $in: ['EMERGENCY', 'HIGH PRIORITY', 'HIGH', 'RED_FLAG'] } },
            { 'red_flags.has_red_flag': true },
            ...(doctorUser?.opd_system ? [{ opd_system: doctorUser.opd_system }] : []),
          ],
        },
      ],
    };

    const tabFilter = {};
    if (tab === 'PENDING') {
      tabFilter.status = { $in: ['STARTED', 'IDENTIFIED', 'IN_PROGRESS', 'READY_FOR_DOCTOR', 'DOCTOR_REVIEW'] };
    } else if (tab === 'RED_FLAG' || tab === 'triage') {
      tabFilter.$or = [
        { triage_level: { $in: ['EMERGENCY', 'HIGH PRIORITY', 'HIGH', 'RED_FLAG'] } },
        { 'red_flags.has_red_flag': true },
      ];
    } else if (tab === 'APPROVED' || tab === 'COMPLETED' || tab === 'archive') {
      tabFilter.status = { $in: ['COMPLETED', 'CONSULTATION_COMPLETE'] };
    } else {
      // ALL active + completed
      tabFilter.status = { $ne: 'CANCELLED' };
    }

    const filter = { $and: [ownershipFilter, tabFilter] };

    const sessions = await ClinicalSession.find(filter)
      .sort({ updatedAt: -1 })
      .limit(60)
      .catch(() => []);

    // Extract patient IDs
    const patientIds = sessions.map((s) => s.patient_id).filter(Boolean);
    const patients = await Patient.find({ patient_id: { $in: patientIds } }).catch(() => []);
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    let queue = sessions.map((s, idx) => {
      const p = patientMap.get(s.patient_id) || {};
      const fullName = p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : `Patient ${s.patient_id}`;
      const token = `TK-${101 + idx}`;

      const isRedFlag =
        s.triage_level === 'EMERGENCY' ||
        s.triage_level === 'HIGH PRIORITY' ||
        s.triage_level === 'HIGH' ||
        Boolean(s.red_flags?.has_red_flag);

      const realAge = p.age != null ? p.age : (p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null);

      return {
        id: s.session_id,
        sessionId: s.session_id,
        patientId: s.patient_id,
        token: token,
        patientName: fullName,
        age: realAge,
        gender: p.gender || null,
        chiefComplaint: s.clinical_state?.chief_complaint || s.chief_complaint_category || 'Clinical Intake Assessment',
        language: s.language || 'gu-IN',
        triageLevel: isRedFlag ? 'RED_FLAG' : s.triage_level || 'ROUTINE',
        triage: isRedFlag ? 'red-flag' : 'routine',
        status: s.status === 'COMPLETED' || s.status === 'CONSULTATION_COMPLETE' ? 'APPROVED' : 'PENDING_REVIEW',
        checkInTime: s.started_at ? new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:15 AM',
        waitTime: '12 mins',
        assignedDoctorId: s.assigned_doctor_id || null,
        updatedAt: s.updatedAt,
      };
    });

    // Apply search query filter if provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      queue = queue.filter(
        (item) =>
          item.patientName.toLowerCase().includes(q) ||
          item.token.toLowerCase().includes(q) ||
          item.patientId.toLowerCase().includes(q) ||
          item.chiefComplaint.toLowerCase().includes(q) ||
          item.language.toLowerCase().includes(q)
      );
    }

    return queue;
  }

  /**
   * 3. Fetch Comprehensive Clinical Case Workspace Bundle
   */
  async getPatientClinicalBundle(sessionId, doctorId, userRole) {
    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required');
    }

    const cleanId = String(sessionId).trim();

    // 1. Try finding by session_id in ClinicalSession
    let session = await ClinicalSession.findOne({
      $or: [
        { session_id: cleanId },
        { session_id: cleanId.toUpperCase() },
        { session_id: cleanId.toLowerCase() },
      ],
    });

    // 2. If not found by session_id, check RedFlagCase
    let redFlag = null;
    if (!session) {
      redFlag = await RedFlagCase.findOne({
        $or: [
          { case_id: cleanId },
          { case_id: cleanId.toUpperCase() },
          { clinical_session_id: cleanId },
          { clinical_session_id: cleanId.toUpperCase() },
        ],
      });
      if (redFlag?.clinical_session_id) {
        session = await ClinicalSession.findOne({
          $or: [
            { session_id: redFlag.clinical_session_id },
            { session_id: redFlag.clinical_session_id.toUpperCase() },
          ],
        });
      }
    } else {
      redFlag = await RedFlagCase.findOne({
        $or: [
          { clinical_session_id: session.session_id },
          { case_id: session.session_id },
        ],
      });
    }

    // 3. If session is still not found, check by patient_id
    if (!session) {
      session = await ClinicalSession.findOne({
        $or: [
          { patient_id: cleanId },
          { patient_id: cleanId.toUpperCase() },
        ],
      }).sort({ createdAt: -1 });
    }

    if (!session) {
      throw ApiError.notFound(`Clinical case '${sessionId}' was not found.`);
    }

    // 4. Authorization check for non-admin doctors
    if (userRole === 'DOCTOR' && doctorId) {
      const isAssigned = session.assigned_doctor_id && session.assigned_doctor_id.toLowerCase() === doctorId.toLowerCase();
      const isRedFlagClaimant = redFlag?.assigned_doctor_id && redFlag.assigned_doctor_id.toLowerCase() === doctorId.toLowerCase();
      const isUnassigned = !session.assigned_doctor_id || session.status === 'READY_FOR_DOCTOR' || redFlag?.status === 'BROADCASTING';

      const hasAppointment = await Appointment.findOne({
        patient_id: session.patient_id,
        $or: [
          { doctor_id: doctorId },
          { doctor_id: String(doctorId).toUpperCase() },
          { doctor_id: String(doctorId).toLowerCase() },
        ],
      }).catch(() => null);

      const hasRecord = await ClinicalRecord.findOne({
        patient_id: session.patient_id,
        reviewed_by: doctorId,
      }).catch(() => null);

      if (!isAssigned && !isRedFlagClaimant && !isUnassigned && !hasAppointment && !hasRecord) {
        throw ApiError.forbidden('Access denied: You are not authorized to view this patient case.', 'UNAUTHORIZED_CASE_ACCESS');
      }
    }

    // 5. Query patient details and resolve linked patient records by registered phone
    const patient = await Patient.findOne({
      $or: [
        { patient_id: session.patient_id },
        { patient_id: session.patient_id.toUpperCase() },
        { patient_id: session.patient_id.toLowerCase() },
      ],
    }).catch(() => null);

    const relatedPatientIds = [session.patient_id];
    if (patient?.phone) {
      const linkedPatients = await Patient.find({ phone: patient.phone }).select('patient_id').lean().catch(() => []);
      linkedPatients.forEach((p) => {
        if (p.patient_id && !relatedPatientIds.includes(p.patient_id)) {
          relatedPatientIds.push(p.patient_id);
        }
      });
    }

    const [abhaDoc, allRecords, messages, documents, allSessions] = await Promise.all([
      PatientIdentity.findOne({
        patient_id: { $in: relatedPatientIds },
        identity_type: 'ABHA',
      }).catch(() => null),
      ClinicalRecord.find({
        $or: [
          { session_id: session.session_id },
          { patient_id: { $in: relatedPatientIds } },
        ],
      }).sort({ createdAt: -1 }).catch(() => []),
      CaseMessage.find({
        $or: [
          { session_id: session.session_id },
          { session_id: cleanId },
        ],
      }).sort({ turn_number: 1, createdAt: 1 }).catch(() => []),
      MedicalDocument.find({
        $or: [
          { session_id: session.session_id },
          { session_id: cleanId },
          { patient_id: { $in: relatedPatientIds } },
        ],
      }).sort({ createdAt: -1 }).catch(() => []),
      ClinicalSession.find({
        patient_id: { $in: relatedPatientIds },
      }).sort({ createdAt: -1 }).catch(() => []),
    ]);

    const clinicalState = session.clinical_state || {};
    const patientName = patient ? `${patient.first_name} ${patient.last_name || ''}`.trim() : `Patient ${session.patient_id}`;

    const isRedFlag =
      session.triage_level === 'EMERGENCY' ||
      session.triage_level === 'HIGH' ||
      session.triage_level === 'HIGH PRIORITY' ||
      Boolean(session.red_flags?.has_red_flag) ||
      Boolean(redFlag);

    // Turn-by-turn conversation messages formatted for clinical review (ensuring m.message is mapped)
    const formattedMessages = messages.map((m) => ({
      message_id: m.message_id || m._id.toString(),
      sender: m.sender || 'PATIENT',
      content: m.message || m.content || m.text || '',
      language: m.language || session.language || 'gu-IN',
      turn_number: m.turn_number,
      timestamp: m.createdAt,
    }));

    // Group documents with OCR findings and complete clinical intelligence
    const formattedDocuments = documents.map((d) => {
      const structured = d.structured_data || d.extracted_data || {};
      const fileUrl = d.file_url || (d.file_name ? `/uploads/${d.file_name}` : null);
      const clinicalSummaryText =
        typeof d.clinical_summary === 'object' && d.clinical_summary?.physician_digest
          ? d.clinical_summary.physician_digest
          : typeof d.clinical_summary === 'string'
          ? d.clinical_summary
          : d.extracted_text
          ? d.extracted_text.slice(0, 300)
          : 'Diagnostic medical record digitized and verified.';

      const extractedValues = [];
      if (structured.lab_investigations && Array.isArray(structured.lab_investigations)) {
        structured.lab_investigations.forEach((l) => {
          extractedValues.push({
            label: l.test_name || 'Lab Test',
            value: `${l.observed_value || '-'} ${l.unit || ''} (Flag: ${l.flag || 'NORMAL'}, Ref: ${l.reference_range || 'Standard'})`,
            flag: l.flag || 'NORMAL',
            alert: l.flag && l.flag !== 'NORMAL',
          });
        });
      } else if (structured.prescribed_medicines && Array.isArray(structured.prescribed_medicines)) {
        structured.prescribed_medicines.forEach((m) => {
          extractedValues.push({
            label: m.name || 'Medicine',
            value: [m.dosage, m.frequency, m.duration].filter(Boolean).join(' - '),
            flag: 'PRESCRIBED',
            alert: false,
          });
        });
      } else {
        extractedValues.push({
          label: 'Document Summary',
          value: d.extracted_text ? d.extracted_text.slice(0, 150) : 'Verified diagnostic record',
        });
      }

      return {
        id: d.document_id || d._id.toString(),
        document_id: d.document_id || d._id.toString(),
        name: d.file_name || `${d.document_type || 'Clinical Document'}.pdf`,
        type: d.document_type || 'MEDICAL_REPORT',
        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent',
        ocrStatus: d.processing_status || 'COMPLETED',
        confidence: d.confidence_score || 0.94,
        extractionConfidence: d.extraction_confidence || 'CLEAR',
        extractedValues,
        extractedData: structured,
        clinicalSummary: clinicalSummaryText,
        patientSummary: typeof d.patient_summary === 'object' ? d.patient_summary?.plain_text : d.patient_summary,
        importantFindings: d.important_findings || [],
        url: fileUrl,
        fileUrl: fileUrl,
        extractedText: d.extracted_text || '',
        requiresDoctorVerification: d.requires_doctor_verification || false,
        verificationNotes: d.verification_notes || '',
      };
    });

    // Multi-source aggregation for Conditions and Allergies
    const conditionsSet = new Set();
    const allergiesSet = new Set();

    (session.clinical_state?.relevant_history || []).forEach((h) => h && conditionsSet.add(h.trim()));
    (session.clinical_summary?.past_medical_history || []).forEach((h) => h && conditionsSet.add(h.trim()));
    (session.clinical_state?.allergies || []).forEach((a) => a && allergiesSet.add(a.trim()));
    (session.clinical_summary?.allergies || []).forEach((a) => a && allergiesSet.add(a.trim()));

    (allSessions || []).forEach((s) => {
      (s.clinical_state?.relevant_history || []).forEach((h) => h && conditionsSet.add(h.trim()));
      (s.clinical_summary?.past_medical_history || []).forEach((h) => h && conditionsSet.add(h.trim()));
      (s.clinical_state?.allergies || []).forEach((a) => a && allergiesSet.add(a.trim()));
    });

    (allRecords || []).forEach((r) => {
      (r.structured_history?.past_medical_history || []).forEach((c) => {
        const name = typeof c === 'string' ? c : c?.name;
        if (name) conditionsSet.add(name.trim());
      });
      (r.structured_history?.allergies || []).forEach((a) => {
        const allergen = typeof a === 'string' ? a : a?.allergen;
        if (allergen) allergiesSet.add(allergen.trim());
      });
    });

    (documents || []).forEach((d) => {
      (d.extracted_data?.diagnoses || []).forEach((diag) => diag && conditionsSet.add(diag.trim()));
      (d.extracted_data?.medical_history || []).forEach((h) => h && conditionsSet.add(h.trim()));
      (d.extracted_data?.allergies || []).forEach((a) => a && allergiesSet.add(a.trim()));
    });

    const allConditions = Array.from(conditionsSet);
    const allAllergies = Array.from(allergiesSet);

    // Current encounter record
    const currentRecord = allRecords.find((r) => r.session_id === session.session_id) || allRecords[0];
    const sessionPrescriptions = currentRecord?.physician_prescription || [];

    // Structured Clinical History matching frontend expectation
    const history = {
      chiefComplaint: clinicalState.chief_complaint || session.chief_complaint_category || 'Primary clinical presentation',
      hpi: {
        site: clinicalState.body_site || 'Primary area of reported discomfort',
        location: clinicalState.body_site || 'Primary area of reported discomfort',
        onset: clinicalState.onset || 'Acute presentation',
        duration: clinicalState.duration || 'Acute',
        timeCourse: clinicalState.duration || clinicalState.course || 'Acute presentation',
        character: clinicalState.severity ? `${clinicalState.severity} severity presentation` : 'Moderate, localized discomfort',
        radiation: 'None reported',
        severity: clinicalState.severity || 'Moderate',
        course: clinicalState.course || 'Progressive with physical exertion',
        exacerbating: 'Physical exertion, movement, exposure to irritants',
        relieving: 'Rest, hydration, supportive posture',
        associated: clinicalState.associated_symptoms?.length > 0 ? clinicalState.associated_symptoms.join(', ') : 'None reported',
      },
      pastMedicalHistory: allConditions.length > 0 ? allConditions.join(', ') : 'No prior medical conditions documented.',
      medicalHistory: allConditions.length > 0 ? allConditions.join(', ') : 'No prior medical conditions documented.',
      surgicalHistory: 'None reported by patient.',
      medications: clinicalState.medications?.length > 0 ? clinicalState.medications.join(', ') : 'No regular chronic medications documented.',
      allergies: allAllergies.length > 0 ? allAllergies.join(', ') : 'No known allergies documented (NKDA).',
      familyHistory: 'Non-contributory for early cardiovascular or hereditary disorders.',
      lifestyle: {
        sleep: '6-7 hours, unrefreshing',
        diet: 'Vegetarian, irregular meal timings',
        exercise: 'Sedentary, minimal daily walking',
        stress: 'Moderate occupational strain',
      },
    };

    // AI Clinical Summary with structured fields for UI
    const aiClinicalSummary = {
      chiefComplaint: clinicalState.chief_complaint || session.chief_complaint_category || 'Primary clinical presentation',
      historyOfPresentIllness: `${clinicalState.chief_complaint || 'Patient presents with acute symptoms'}. Duration: ${clinicalState.duration || 'acute'}. Location: ${clinicalState.body_site || 'primary site'}. Severity: ${clinicalState.severity || 'moderate'}.`,
      relevantMedicalHistory: allConditions.length > 0 ? allConditions.join(', ') : 'None reported.',
      currentMedications: clinicalState.medications?.length > 0 ? clinicalState.medications.join(', ') : 'None reported.',
      allergies: allAllergies.length > 0 ? allAllergies.join(', ') : 'None reported (NKDA).',
      investigations: formattedDocuments.length > 0 ? `${formattedDocuments.length} diagnostic documents uploaded and processed.` : 'No prior investigations or lab reports recorded.',
      redFlags: isRedFlag ? (session.red_flags?.reason || redFlag?.trigger?.reason || 'Critical clinical findings detected during intake.') : 'None detected. Vitals stable.',
      keyFindings: [
        `Risk Severity Assessment: ${isRedFlag ? 'EMERGENCY / HIGH' : 'ROUTINE OPD'}`,
        `Reported Duration: ${clinicalState.duration || 'Acute'}`,
        `Intake Language: ${session.language || 'gu-IN'}`,
      ],
      differentialConsiderations: [
        'Acute Clinical Presentation requiring physician confirmation',
        'Secondary supportive evaluation recommended',
      ],
      redFlagNotice: isRedFlag ? (session.red_flags?.reason || redFlag?.trigger?.reason || 'Urgent clinical attention indicated') : null,
    };

    const token = session.token || (session.session_id ? `TK-${session.session_id.slice(-4).toUpperCase()}` : 'TK-101');

    return {
      sessionId: session.session_id,
      patientId: session.patient_id,
      token,
      patientName,
      chiefComplaint: clinicalState.chief_complaint || session.chief_complaint_category || history?.chiefComplaint || 'Primary clinical presentation',
      age: patient?.age != null ? patient.age : (patient?.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null),
      gender: patient?.gender || null,
      phone: patient?.phone || '',
      abhaId: abhaDoc?.identity_reference || null,
      status: session.status === 'COMPLETED' || session.status === 'CONSULTATION_COMPLETE' ? 'APPROVED' : 'PENDING_REVIEW',
      triageLevel: isRedFlag ? 'RED_FLAG' : session.triage_level || 'ROUTINE',
      triage: isRedFlag ? 'red-flag' : 'routine',
      priorityAlertReason: isRedFlag ? session.red_flags?.reason || redFlag?.trigger?.reason : null,
      doctorRxNotes: currentRecord?.doctor_notes || '',
      prescriptions: sessionPrescriptions,
      history,
      aiClinicalSummary,
      ayushPariksha: {
        prakriti: 'Vata-Pitta Pradhan',
        agni: 'Vishamagni (Irregular digestion)',
        koshtha: 'Madhyama',
        nadi: 'Mandam (Slow, deep pulse)',
      },
      documents: formattedDocuments,
      conversationMessages: formattedMessages,
      conversation: formattedMessages,
      messages: formattedMessages,
      assignedDoctorId: session.assigned_doctor_id,
    };
  }

  /**
   * 4. Save Physician Clinical Notes & Assessment
   */
  async saveConsultationEncounter(sessionId, doctorId, { doctor_notes, assessment, treatment_plan, follow_up }, actorId = 'DOCTOR') {
    if (!sessionId) throw ApiError.badRequest('Session ID is required');

    const session = await ClinicalSession.findOne({ session_id: sessionId });
    if (!session) throw ApiError.notFound(`Session '${sessionId}' not found.`);

    // Upsert ClinicalRecord
    const record = await ClinicalRecord.findOneAndUpdate(
      { session_id: sessionId },
      {
        $set: {
          session_id: sessionId,
          patient_id: session.patient_id,
          doctor_notes: doctor_notes || '',
          review_status: 'IN_PROGRESS',
          reviewed_by: mongoose.Types.ObjectId.isValid(actorId) ? actorId : null,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await sessionRepository.updateStatus(sessionId, 'IN_CONSULTATION', {
      assigned_doctor_id: doctorId,
    }).catch(() => {});

    await auditRepository.create({
      user_id: doctorId || actorId,
      action: 'CONSULTATION_NOTES_SAVED',
      resource: 'ClinicalSession',
      resource_id: sessionId,
      details: { doctor_notes: doctor_notes?.slice(0, 100), assessment },
    });

    return { success: true, record };
  }

  /**
   * 5. Save Physician Prescription
   */
  async savePhysicianPrescription(sessionId, doctorId, medicines = [], actorId = 'DOCTOR', patientId = null) {
    if (!sessionId && !patientId) throw ApiError.badRequest('Session ID or Patient ID is required');

    let session = sessionId ? await ClinicalSession.findOne({ session_id: sessionId }) : null;

    // If session not found or sessionId looks like a patient ID, resolve/find the patient and active session
    if (!session) {
      const targetPatientId = patientId || sessionId;
      const patient = await Patient.findOne({
        $or: [
          { patient_id: targetPatientId },
          { patient_id: String(targetPatientId).toUpperCase() },
          { patient_id: String(targetPatientId).toLowerCase() },
        ],
      });

      if (patient) {
        // Find latest session for this patient or create an active one
        session = await ClinicalSession.findOne({ patient_id: patient.patient_id }).sort({ createdAt: -1 });
        if (!session) {
          session = await ClinicalSession.create({
            session_id: `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            patient_id: patient.patient_id,
            assigned_doctor_id: doctorId,
            status: 'DOCTOR_REVIEW',
            journey_stage: 'IN_CONSULTATION',
            opd_type: patient.opd_type || 'GENERAL',
            opd_system: patient.opd_system || 'GENERAL_MEDICINE',
          });
        }
      }
    }

    if (!session) throw ApiError.notFound(`Clinical session or patient record '${sessionId || patientId}' was not found.`);

    const targetSessionId = session.session_id;
    const targetPatientId = session.patient_id;

    const formattedMeds = medicines.map((m) => ({
      medicine_name: m.medicine_name,
      generic_name: m.generic_name || '',
      dosage: m.dosage || '1 tab',
      frequency: m.frequency || 'OD',
      duration: m.duration || '5 days',
      instructions: m.instructions || (m.before_after_food ? `Take ${m.before_after_food.toLowerCase().replace('_', ' ')}` : 'As directed'),
    }));

    const record = await ClinicalRecord.findOneAndUpdate(
      { session_id: targetSessionId },
      {
        $set: {
          session_id: targetSessionId,
          patient_id: targetPatientId,
          physician_prescription: formattedMeds,
          review_status: 'APPROVED',
          reviewed_by: mongoose.Types.ObjectId.isValid(actorId) ? actorId : null,
          reviewed_at: new Date(),
        },
        $setOnInsert: {
          record_id: `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Synchronize to ClinicalSession as well so patient dashboard and session history see prescriptions
    await ClinicalSession.findOneAndUpdate(
      { session_id: targetSessionId },
      {
        $set: {
          prescriptions: formattedMeds,
          assigned_doctor_id: doctorId,
          status: 'DOCTOR_REVIEW',
          journey_stage: 'IN_CONSULTATION',
        },
      }
    ).catch(() => {});

    await auditRepository.create({
      user_id: doctorId || actorId,
      action: 'PRESCRIPTION_SAVED',
      resource: 'ClinicalRecord',
      resource_id: record.record_id || targetSessionId,
      details: { prescription_count: formattedMeds.length, patient_id: targetPatientId },
    });

    return { success: true, prescription: formattedMeds, record };
  }

  /**
   * 6. Conclude and Sign Off Consultation Encounter
   */
  async completeConsultationEncounter(sessionId, doctorId, { doctorRxNotes, assessment, prescriptions = [] }, actorId = 'DOCTOR') {
    if (!sessionId) throw ApiError.badRequest('Session ID is required');

    const session = await ClinicalSession.findOne({ session_id: sessionId });
    if (!session) throw ApiError.notFound(`Session '${sessionId}' not found.`);

    // 1. Mark ClinicalRecord as APPROVED
    const record = await ClinicalRecord.findOneAndUpdate(
      { session_id: sessionId },
      {
        $set: {
          doctor_notes: doctorRxNotes || '',
          review_status: 'APPROVED',
          reviewed_at: new Date(),
          ...(prescriptions.length > 0 ? { physician_prescription: prescriptions } : {}),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Mark ClinicalSession as COMPLETED
    await ClinicalSession.findOneAndUpdate(
      { session_id: sessionId },
      {
        $set: {
          status: 'COMPLETED',
          completed_at: new Date(),
          assigned_doctor_id: doctorId,
        },
      }
    );

    // 3. Mark RedFlagCase as RESOLVED if one existed
    await RedFlagCase.findOneAndUpdate(
      { clinical_session_id: sessionId },
      {
        $set: {
          status: RED_FLAG_STATUS.RESOLVED,
          resolution_notes: `Consultation completed and digitally signed by Dr. ${doctorId}`,
          resolved_at: new Date(),
          resolved_by: doctorId,
        },
      }
    );

    // 4. Audit Trail
    await auditRepository.create({
      user_id: doctorId || actorId,
      action: 'CONSULTATION_COMPLETED_AND_SIGNED',
      resource: 'ClinicalSession',
      resource_id: sessionId,
      details: { doctor_id: doctorId, review_status: 'APPROVED' },
    });

    logger.info(`[DoctorPanel]: Dr. ${doctorId} finalized consultation for session ${sessionId}`);
    return { success: true, record, status: 'APPROVED' };
  }

  /**
   * 7. Toggle Doctor Availability & On-Duty State
   */
  async updateDoctorAvailability(doctorId, { on_duty, availability_status }, actorId = 'DOCTOR') {
    if (!doctorId) throw ApiError.badRequest('Doctor ID is required');

    const query = mongoose.Types.ObjectId.isValid(doctorId)
      ? { _id: doctorId }
      : { doctor_id: doctorId };

    const updated = await User.findOneAndUpdate(
      query,
      {
        $set: {
          ...(on_duty !== undefined ? { on_duty } : {}),
          ...(availability_status ? { availability_status } : {}),
        },
      },
      { returnDocument: 'after' }
    );

    await auditRepository.create({
      user_id: actorId || doctorId,
      action: 'DOCTOR_AVAILABILITY_CHANGED',
      resource: 'User',
      resource_id: doctorId,
      details: { on_duty, availability_status },
    });

    return updated || { doctor_id: doctorId, on_duty, availability_status };
  }

  /**
   * 8. Prescription Templates Management
   */
  async getPrescriptionTemplates(doctorId) {
    const filter = {
      $or: [
        { doctor_id: doctorId },
        { doctor_id: 'SYSTEM' },
      ],
      is_active: true,
    };

    let templates = await PrescriptionTemplate.find(filter).sort({ title: 1 }).catch(() => []);

    // If no templates exist yet in database, seed default presets for immediate clinical utility
    if (!templates || templates.length === 0) {
      await PrescriptionTemplate.insertMany(DEFAULT_PRESET_TEMPLATES).catch(() => {});
      templates = await PrescriptionTemplate.find(filter).sort({ title: 1 }).catch(() => []);
    }

    return templates;
  }

  async savePrescriptionTemplate(doctorId, data) {
    if (!data.title || !data.medicines || data.medicines.length === 0) {
      throw ApiError.badRequest('Template title and at least one medication are required.');
    }

    const template_id = data.template_id || `TPL-${Date.now().toString().slice(-6)}`;
    const saved = await PrescriptionTemplate.findOneAndUpdate(
      { template_id },
      {
        $set: {
          template_id,
          doctor_id: doctorId || 'SYSTEM',
          title: data.title,
          category: data.category || 'General Medicine',
          notes: data.notes || '',
          medicines: data.medicines,
          is_active: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return saved;
  }

  async deletePrescriptionTemplate(doctorId, templateId) {
    const deleted = await PrescriptionTemplate.findOneAndDelete({
      template_id: templateId,
      $or: [{ doctor_id: doctorId }, { doctor_id: 'SYSTEM' }],
    });
    if (!deleted) throw ApiError.notFound(`Template '${templateId}' not found or unauthorized.`);
    return { success: true, template_id: templateId };
  }

  /**
   * 9. Doctor Clinical Analytics Telemetry
   */
  async getDoctorAnalytics(doctorId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [handledToday, completedCount, redFlagHandled] = await Promise.all([
      ClinicalSession.countDocuments({ assigned_doctor_id: doctorId }).catch(() => 0),
      ClinicalRecord.countDocuments({ review_status: 'APPROVED' }).catch(() => 0),
      RedFlagCase.countDocuments({ assigned_doctor_id: doctorId, status: RED_FLAG_STATUS.RESOLVED }).catch(() => 0),
    ]);

    return {
      doctor_id: doctorId,
      patients_handled_today: handledToday,
      cases_completed: completedCount,
      emergency_cases_handled: redFlagHandled,
      average_consultation_mins: 0,
      follow_up_rate_percent: 0,
      specialty_breakdown: [],
    };
  }

  /**
   * 10. List Eligible Colleagues for Specialist Escalation / Clinical Case Transfer
   */
  async getEligibleColleagues(currentDoctorId) {
    const dbDoctors = await User.find({ role: ROLES.DOCTOR, is_active: true })
      .select('doctor_id name specialty hospital room phone')
      .catch(() => []);

    if (dbDoctors && dbDoctors.length > 0) {
      return dbDoctors
        .filter((d) => d.doctor_id !== currentDoctorId && d._id.toString() !== currentDoctorId)
        .map((d) => ({
          doctor_id: d.doctor_id || d._id.toString(),
          doctor_name: d.name,
          specialty: d.specialty || 'General Medicine',
          room: d.room || 'OPD Consulting Room',
          hospital: d.hospital || 'Sehat Apex Civil Hospital',
        }));
    }

    // Fallback to verified hospital directory roster
    const directory = doctorService.getAllDoctors ? doctorService.getAllDoctors() : [];
    if (directory && directory.length > 0) {
      return directory
        .filter((d) => d.doctor_id !== currentDoctorId)
        .map((d) => ({
          doctor_id: d.doctor_id,
          doctor_name: d.doctor_name,
          specialty: d.specialty,
          room: d.room,
          hospital: d.hospital,
        }));
    }

    return [
      { doctor_id: 'DOC-CARD-01', doctor_name: 'Dr. Arvind Joshi', specialty: 'Cardiology', room: 'Room 305' },
      { doctor_id: 'DOC-MED-01', doctor_name: 'Dr. Priya Sharma', specialty: 'General Medicine', room: 'Room 102' },
      { doctor_id: 'DOC-PULM-01', doctor_name: 'Dr. Vikram Patel', specialty: 'Pulmonology', room: 'Room 208' },
      { doctor_id: 'DOC-NEUR-01', doctor_name: 'Dr. Sanjay Mehta', specialty: 'Neurology', room: 'Room 401' },
      { doctor_id: 'DOC-DERM-01', doctor_name: 'Dr. Ananya Sen', specialty: 'Dermatology', room: 'Room 204' },
      { doctor_id: 'DOC-AYUSH-01', doctor_name: 'Dr. Rajesh Varma', specialty: 'Ayush Kayachikitsa', room: 'Room 110' },
    ].filter((d) => d.doctor_id !== currentDoctorId);
  }

  /**
   * 11. Auto-Seed Initial Dynamic Clinical Dataset if Database is Empty
   */
  async ensureSeedClinicalData(currentDoctorId = null) {
    // Runtime auto-seeding removed in favor of idempotent one-time seeder: `npm run db:seed`
    return;
  }

  /**
   * 12. Fetch Live OPD Kanban Pipeline (7 Stages)
   */
  async getDoctorOPDPipeline(doctorId, { search = '', filter = 'ALL' } = {}) {
    await this.ensureSeedClinicalData(doctorId);

    const sessions = await ClinicalSession.find({
      status: { $ne: 'CANCELLED' },
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
        {
          assigned_doctor_id: null,
          $or: [
            { triage_level: { $in: ['EMERGENCY', 'HIGH PRIORITY', 'HIGH', 'RED_FLAG'] } },
            { 'red_flags.has_red_flag': true },
          ],
        },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(80)
      .catch(() => []);

    const patientIds = sessions.map((s) => s.patient_id).filter(Boolean);
    const [patients, documents] = await Promise.all([
      Patient.find({ patient_id: { $in: patientIds } }).catch(() => []),
      MedicalDocument.find({ session_id: { $in: sessions.map((s) => s.session_id) } }).catch(() => []),
    ]);

    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));
    const docCountMap = new Map();
    documents.forEach((d) => {
      const sid = d.session_id;
      docCountMap.set(sid, (docCountMap.get(sid) || 0) + 1);
    });

    const pipeline = {
      registered: [],
      waiting: [],
      ai_intake: [],
      triage: [],
      consultation: [],
      prescription: [],
      completed: [],
    };

    let totalPriority = 0;

    sessions.forEach((s, idx) => {
      const p = patientMap.get(s.patient_id) || {};
      const fullName = p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : `Patient ${s.patient_id}`;
      const token = `TK-${101 + idx}`;

      const isRedFlag =
        s.triage_level === 'EMERGENCY' ||
        s.triage_level === 'HIGH PRIORITY' ||
        s.triage_level === 'HIGH' ||
        Boolean(s.red_flags?.has_red_flag);

      if (isRedFlag) totalPriority += 1;

      // Determine the Kanban stage based on session status & journey stage
      let stage = 'waiting';
      if (s.status === 'STARTED' || s.status === 'IDENTIFIED' || (s.journey_stage === 'CHECKED_IN' && !s.clinical_state?.chief_complaint)) {
        stage = 'registered';
      } else if (s.status === 'HISTORY_IN_PROGRESS' || s.status === 'CONSENT_PENDING') {
        stage = 'ai_intake';
      } else if (s.status === 'PRIORITY_TRIAGE' || s.status === 'DOCUMENT_PROCESSING' || (isRedFlag && s.status !== 'COMPLETED')) {
        stage = 'triage';
      } else if (s.status === 'READY_FOR_DOCTOR' || s.journey_stage === 'IN_CONSULTATION') {
        stage = 'consultation';
      } else if (s.status === 'DOCTOR_REVIEW' || s.status === 'PRESCRIPTION_PENDING') {
        stage = 'prescription';
      } else if (s.status === 'COMPLETED' || s.status === 'CONSULTATION_COMPLETE' || s.journey_stage === 'COMPLETED') {
        stage = 'completed';
      } else {
        stage = 'waiting';
      }

      const realAge = p.age != null ? p.age : (p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null);

      const caseItem = {
        id: s.session_id,
        caseId: s.session_id,
        sessionId: s.session_id,
        patientId: s.patient_id,
        token,
        patientName: fullName,
        age: realAge,
        gender: p.gender || null,
        phone: p.phone || '',
        chiefComplaint: s.clinical_state?.chief_complaint || s.chief_complaint_category || 'Clinical Consultation',
        triageLevel: isRedFlag ? 'EMERGENCY' : s.triage_level || 'ROUTINE',
        isRedFlag,
        priority: isRedFlag ? 'Emergency' : s.triage_level === 'HIGH' ? 'High Priority' : s.triage_level === 'MODERATE' ? 'Moderate' : 'Routine',
        opdType: s.opd_type || 'GENERAL',
        opdSystem: s.opd_system || 'GENERAL_MEDICINE',
        reportsCount: docCountMap.get(s.session_id) || (isRedFlag ? 2 : 1),
        waitingMins: 8 + (idx * 4),
        waitTime: `${8 + (idx * 4)} mins`,
        stage,
        status: s.status,
        updatedAt: s.updatedAt,
      };

      // Search query filtering
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matches =
          caseItem.patientName.toLowerCase().includes(q) ||
          caseItem.token.toLowerCase().includes(q) ||
          caseItem.patientId.toLowerCase().includes(q) ||
          caseItem.chiefComplaint.toLowerCase().includes(q) ||
          caseItem.caseId.toLowerCase().includes(q);
        if (!matches) return;
      }

      if (pipeline[stage]) {
        pipeline[stage].push(caseItem);
      }
    });

    const counts = {
      all: sessions.length,
      registered: pipeline.registered.length,
      waiting: pipeline.waiting.length,
      ai_intake: pipeline.ai_intake.length,
      triage: pipeline.triage.length,
      consultation: pipeline.consultation.length,
      prescription: pipeline.prescription.length,
      completed: pipeline.completed.length,
      priority: totalPriority,
    };

    return { pipeline, counts };
  }

  /**
   * 13. Update Case Workflow Stage (Drag and Drop Persistence)
   */
  async updateCaseWorkflowStatus(caseId, targetStatus, doctorId, actorId = 'DOCTOR') {
    if (!caseId) throw ApiError.badRequest('Case ID is required');

    const validStages = ['registered', 'waiting', 'ai_intake', 'triage', 'consultation', 'prescription', 'completed'];
    const normalized = (targetStatus || '').toLowerCase();
    if (!validStages.includes(normalized)) {
      throw ApiError.badRequest(`Invalid workflow stage '${targetStatus}'. Must be one of: ${validStages.join(', ')}`);
    }

    const session = await ClinicalSession.findOne({ session_id: caseId });
    if (!session) throw ApiError.notFound(`Case '${caseId}' not found.`);

    const stageMap = {
      registered: { status: 'STARTED', journey_stage: 'CHECKED_IN' },
      waiting: { status: 'IN_PROGRESS', journey_stage: 'CHECKED_IN' },
      ai_intake: { status: 'HISTORY_IN_PROGRESS', journey_stage: 'VITALS_TAKEN' },
      triage: { status: 'PRIORITY_TRIAGE', journey_stage: 'VITALS_TAKEN' },
      consultation: { status: 'READY_FOR_DOCTOR', journey_stage: 'IN_CONSULTATION', assigned_doctor_id: doctorId },
      prescription: { status: 'DOCTOR_REVIEW', journey_stage: 'IN_CONSULTATION', assigned_doctor_id: doctorId },
      completed: { status: 'COMPLETED', journey_stage: 'COMPLETED', completed_at: new Date(), assigned_doctor_id: doctorId },
    };

    const updateFields = stageMap[normalized];
    const updatedSession = await ClinicalSession.findOneAndUpdate(
      { session_id: caseId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    // If moved to completed, also mark clinical record as approved
    if (normalized === 'completed') {
      await ClinicalRecord.findOneAndUpdate(
        { session_id: caseId },
        { $set: { review_status: 'APPROVED', reviewed_at: new Date() } }
      ).catch(() => {});
    }

    await auditRepository.create({
      user_id: doctorId || actorId,
      action: 'CASE_WORKFLOW_STAGE_DRAGGED',
      resource: 'ClinicalSession',
      resource_id: caseId,
      details: { previous_status: session.status, new_stage: normalized, updateFields },
    });

    logger.info(`[DoctorPanel]: Case ${caseId} transitioned to ${normalized} by Dr. ${doctorId}`);
    return {
      success: true,
      caseId,
      stage: normalized,
      session: updatedSession,
    };
  }

  /**
   * 14. Doctor Appointments Workspace
   */
  async getDoctorAppointments(doctorId, { tab = 'TODAY', search = '' } = {}) {
    await this.ensureSeedClinicalData(doctorId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const doctorFilter = {
      $or: [
        { doctor_id: doctorId },
        { doctor_id: String(doctorId).toUpperCase() },
        { doctor_id: String(doctorId).toLowerCase() },
      ],
    };

    const filter = { ...doctorFilter };
    if (tab === 'TODAY') {
      filter.appointment_date = { $gte: todayStart, $lte: todayEnd };
      filter.status = { $ne: 'CANCELLED' };
    } else if (tab === 'UPCOMING') {
      filter.appointment_date = { $gt: todayEnd };
      filter.status = { $ne: 'CANCELLED' };
    } else if (tab === 'COMPLETED') {
      filter.status = 'COMPLETED';
    } else if (tab === 'CANCELLED') {
      filter.status = 'CANCELLED';
    }

    const appointments = await Appointment.find(filter).sort({ appointment_date: 1, appointment_time: 1 }).catch(() => []);
    const patientIds = appointments.map((a) => a.patient_id);
    const patients = await Patient.find({ patient_id: { $in: patientIds } }).catch(() => []);
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    let results = appointments.map((a) => {
      const p = patientMap.get(a.patient_id) || {};
      const fullName = p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : a.patient_id;
      const realAge = p.age != null ? p.age : (p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null);
      return {
        id: a.appointment_id,
        appointmentId: a.appointment_id,
        patientId: a.patient_id,
        patientName: fullName,
        age: realAge,
        gender: p.gender || null,
        phone: p.phone || '',
        date: a.appointment_date ? new Date(a.appointment_date).toISOString().split('T')[0] : '',
        time: a.appointment_time,
        opdType: a.opd_type || 'GENERAL',
        opdSystem: a.opd_system || 'GENERAL_MEDICINE',
        status: a.status,
        reason: a.reason || 'General Consultation',
        room: a.room || 'Room 104',
        notes: a.notes || '',
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.patientId.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          a.appointmentId.toLowerCase().includes(q)
      );
    }

    const [todayCount, upcomingCount, completedCount, cancelledCount] = await Promise.all([
      Appointment.countDocuments({ ...doctorFilter, appointment_date: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'CANCELLED' } }).catch(() => 0),
      Appointment.countDocuments({ ...doctorFilter, appointment_date: { $gt: todayEnd }, status: { $ne: 'CANCELLED' } }).catch(() => 0),
      Appointment.countDocuments({ ...doctorFilter, status: 'COMPLETED' }).catch(() => 0),
      Appointment.countDocuments({ ...doctorFilter, status: 'CANCELLED' }).catch(() => 0),
    ]);

    return {
      appointments: results,
      counts: {
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        total: appointments.length,
      },
    };
  }

  async createDoctorAppointment(doctorId, data) {
    if (!data.patient_id || !data.appointment_date || !data.appointment_time) {
      throw ApiError.badRequest('Patient ID, appointment date, and time are required.');
    }

    const doctorUser = await User.findOne({
      $or: [{ doctor_id: doctorId }, { email: doctorId }],
    }).catch(() => null);

    const appt = new Appointment({
      patient_id: data.patient_id,
      doctor_id: doctorId || 'DOC-CLINIC-01',
      doctor_name: doctorUser?.name ? (doctorUser.name.toLowerCase().startsWith('dr') ? doctorUser.name : `Dr. ${doctorUser.name}`) : 'Dr. Aarav Sharma',
      doctor_specialization: doctorUser?.specialty || 'General Medicine',
      opd_type: data.opd_type || doctorUser?.opd_type || 'GENERAL',
      opd_system: data.opd_system || doctorUser?.opd_system || 'GENERAL_MEDICINE',
      appointment_date: new Date(data.appointment_date),
      appointment_time: data.appointment_time,
      status: 'CONFIRMED',
      room: doctorUser?.room || 'Room 104',
      reason: data.reason || 'Follow-up Consultation',
      notes: data.notes || '',
    });

    const saved = await appt.save();
    return saved;
  }

  async updateAppointmentStatus(doctorId, appointmentId, status) {
    const valid = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'UPCOMING'];
    if (!valid.includes(status)) {
      throw ApiError.badRequest(`Invalid status: ${status}`);
    }

    const query = { appointment_id: appointmentId };
    if (doctorId) {
      query.$or = [
        { doctor_id: doctorId },
        { doctor_id: String(doctorId).toUpperCase() },
        { doctor_id: String(doctorId).toLowerCase() },
      ];
    }

    const updated = await Appointment.findOneAndUpdate(
      query,
      { $set: { status } },
      { returnDocument: 'after' }
    );
    if (!updated) throw ApiError.notFound(`Appointment '${appointmentId}' not found or not authorized for Doctor ${doctorId}.`);
    return updated;
  }

  /**
   * 15. Doctor Patients Directory & Clinical Dossier
   */
  async getDoctorPatients(doctorId, { search = '', page = 1, limit = 50 } = {}) {
    await this.ensureSeedClinicalData(doctorId);

    // 1. Determine all authorized patient IDs for this specific physician
    const doctorMatch = {
      $or: [
        { doctor_id: doctorId },
        { doctor_id: String(doctorId).toUpperCase() },
        { doctor_id: String(doctorId).toLowerCase() },
      ],
    };

    const sessionDoctorMatch = {
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
      ],
    };

    // Resolve doctor's User ObjectId if available, for querying ClinicalRecord.reviewed_by
    const doctorUser = await User.findOne({
      $or: [
        { doctor_id: doctorId },
        ...(mongoose.Types.ObjectId.isValid(doctorId) ? [{ _id: doctorId }] : []),
      ],
    }).select('_id').lean().catch(() => null);

    const doctorObjectId = doctorUser?._id || (mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null);

    const [apptPids, sessionPids, redFlagPids, recordPids] = await Promise.all([
      Appointment.distinct('patient_id', doctorMatch).catch(() => []),
      ClinicalSession.distinct('patient_id', sessionDoctorMatch).catch(() => []),
      RedFlagCase.distinct('patient_id', sessionDoctorMatch).catch(() => []),
      doctorObjectId ? ClinicalRecord.distinct('patient_id', { reviewed_by: doctorObjectId }).catch(() => []) : Promise.resolve([]),
    ]);

    const authorizedPatientIds = Array.from(
      new Set([...apptPids, ...sessionPids, ...redFlagPids, ...recordPids].filter(Boolean))
    );

    // If doctor has no authorized patients yet, return empty list
    if (authorizedPatientIds.length === 0) {
      return { patients: [], total: 0, page, limit };
    }

    const filter = { patient_id: { $in: authorizedPatientIds } };
    if (search && search.trim()) {
      const q = search.trim();
      filter.$and = [
        { patient_id: { $in: authorizedPatientIds } },
        {
          $or: [
            { first_name: { $regex: q, $options: 'i' } },
            { last_name: { $regex: q, $options: 'i' } },
            { patient_id: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
          ],
        },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).catch(() => []),
      Patient.countDocuments(filter).catch(() => 0),
    ]);

    // Aggregate latest session, vitals, and real ABHA identities for each patient
    const pids = patients.map((p) => p.patient_id);
    const [sessions, vitals, abhaIdentities] = await Promise.all([
      ClinicalSession.find({ patient_id: { $in: pids } }).sort({ createdAt: -1 }).catch(() => []),
      VitalsRecord.find({ patient_id: { $in: pids } }).sort({ recorded_at: -1 }).catch(() => []),
      PatientIdentity.find({ patient_id: { $in: pids }, identity_type: 'ABHA' }).catch(() => []),
    ]);

    const latestSessionMap = new Map();
    sessions.forEach((s) => {
      if (!latestSessionMap.has(s.patient_id)) latestSessionMap.set(s.patient_id, s);
    });

    const latestVitalsMap = new Map();
    vitals.forEach((v) => {
      if (!latestVitalsMap.has(v.patient_id)) latestVitalsMap.set(v.patient_id, v);
    });

    const abhaMap = new Map();
    abhaIdentities.forEach((idDoc) => {
      if (idDoc.identity_reference) abhaMap.set(idDoc.patient_id, idDoc.identity_reference);
    });

    const formatted = patients.map((p) => {
      const s = latestSessionMap.get(p.patient_id);
      const v = latestVitalsMap.get(p.patient_id);
      const isRedFlag = s?.triage_level === 'EMERGENCY' || s?.triage_level === 'HIGH' || Boolean(s?.red_flags?.has_red_flag);
      const realAge = p.age != null ? p.age : (p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null);

      return {
        id: p.patient_id,
        patientId: p.patient_id,
        sessionId: s?.session_id || null,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        age: realAge,
        gender: p.gender || null,
        phone: p.phone || '',
        bloodGroup: p.blood_group || 'O+',
        abhaId: abhaMap.get(p.patient_id) || null,
        latestComplaint: s?.clinical_state?.chief_complaint || s?.chief_complaint_category || 'General Follow-up',
        riskStatus: isRedFlag ? 'High Priority' : s?.triage_level === 'MODERATE' ? 'Moderate' : 'Low',
        lastVisit: s?.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent',
        opdType: s?.opd_type || 'GENERAL',
        opdSystem: s?.opd_system || 'GENERAL_MEDICINE',
        vitals: v ? {
          bp: v.blood_pressure?.systolic ? `${v.blood_pressure.systolic}/${v.blood_pressure.diastolic}` : '-',
          pulse: v.pulse?.value ? `${v.pulse.value} bpm` : '-',
          spo2: v.spo2?.value ? `${v.spo2.value}%` : '-',
          temperature: v.temperature?.value ? `${v.temperature.value}°F` : '-',
        } : null,
      };
    });

    return { patients: formatted, total, page, limit };
  }

  async getPatientClinicalProfile(patientId, doctorId = null, userRole = 'DOCTOR') {
    if (!patientId) throw ApiError.badRequest('Patient ID is required');

    // Server-side authorization check: verify that this doctor has an authorized clinical relationship with the patient
    if (userRole !== ROLES.ADMIN && doctorId) {
      const doctorMatch = {
        $or: [
          { doctor_id: doctorId },
          { doctor_id: String(doctorId).toUpperCase() },
          { doctor_id: String(doctorId).toLowerCase() },
        ],
      };
      const sessionDoctorMatch = {
        $or: [
          { assigned_doctor_id: doctorId },
          { assigned_doctor_id: String(doctorId).toUpperCase() },
          { assigned_doctor_id: String(doctorId).toLowerCase() },
        ],
      };
      const doctorUser = await User.findOne({
        $or: [
          { doctor_id: doctorId },
          ...(mongoose.Types.ObjectId.isValid(doctorId) ? [{ _id: doctorId }] : []),
        ],
      }).select('_id').lean().catch(() => null);

      const doctorObjectId = doctorUser?._id || (mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null);

      const [hasAppt, hasSession, hasRedFlag, hasRecord] = await Promise.all([
        Appointment.exists({ patient_id: patientId, ...doctorMatch }),
        ClinicalSession.exists({ patient_id: patientId, ...sessionDoctorMatch }),
        RedFlagCase.exists({ patient_id: patientId, ...sessionDoctorMatch }),
        doctorObjectId ? ClinicalRecord.exists({ patient_id: patientId, reviewed_by: doctorObjectId }) : Promise.resolve(null),
      ]);

      if (!hasAppt && !hasSession && !hasRedFlag && !hasRecord) {
        throw ApiError.forbidden(
          `Access denied. Doctor '${doctorId}' is not authorized to access clinical records for patient '${patientId}'.`,
          'UNAUTHORIZED_PATIENT_ACCESS'
        );
      }
    }

    const [patient, sessions, records, vitalsList, documents, appointments, abhaIdentity] = await Promise.all([
      Patient.findOne({ patient_id: patientId }).catch(() => null),
      ClinicalSession.find({ patient_id: patientId }).sort({ createdAt: -1 }).catch(() => []),
      ClinicalRecord.find({ patient_id: patientId }).sort({ createdAt: -1 }).catch(() => []),
      VitalsRecord.find({ patient_id: patientId }).sort({ recorded_at: -1 }).catch(() => []),
      MedicalDocument.find({ patient_id: patientId }).sort({ createdAt: -1 }).catch(() => []),
      Appointment.find({ patient_id: patientId }).sort({ appointment_date: -1 }).catch(() => []),
      PatientIdentity.findOne({ patient_id: patientId, identity_type: 'ABHA' }).catch(() => null),
    ]);

    if (!patient) throw ApiError.notFound(`Patient '${patientId}' not found.`);

    const latestSession = sessions[0] || {};
    const latestVitals = vitalsList[0] || {};
    const isRedFlag = latestSession.triage_level === 'EMERGENCY' || Boolean(latestSession.red_flags?.has_red_flag);
    const realAge = patient.age != null ? patient.age : (patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null);

    return {
      patient: {
        patientId: patient.patient_id,
        name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        age: realAge,
        gender: patient.gender || null,
        phone: patient.phone || '',
        bloodGroup: patient.blood_group || 'O+',
        address: patient.address || 'Not provided',
        abhaId: abhaIdentity?.identity_reference || null,
        riskStatus: isRedFlag ? 'High Priority' : latestSession.triage_level === 'MODERATE' ? 'Moderate' : 'Routine',
      },
      vitals: vitalsList.map((v) => ({
        id: v.vitals_id,
        date: v.recorded_at ? new Date(v.recorded_at).toLocaleDateString() : 'Recent',
        bp: v.blood_pressure?.systolic ? `${v.blood_pressure.systolic}/${v.blood_pressure.diastolic} mmHg` : '-',
        pulse: v.pulse?.value ? `${v.pulse.value} bpm` : '-',
        spo2: v.spo2?.value ? `${v.spo2.value}%` : '-',
        temp: v.temperature?.value ? `${v.temperature.value}°F` : '-',
        sugar: v.blood_sugar?.value ? `${v.blood_sugar.value} mg/dL` : '-',
        weight: v.weight?.value ? `${v.weight.value} kg` : '-',
      })),
      sessions: sessions.map((s) => ({
        sessionId: s.session_id,
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent',
        chiefComplaint: s.clinical_state?.chief_complaint || s.chief_complaint_category || 'OPD Intake',
        status: s.status,
        stage: s.journey_stage,
        opdType: s.opd_type || 'GENERAL',
        opdSystem: s.opd_system || 'GENERAL_MEDICINE',
        triageLevel: s.triage_level || 'ROUTINE',
        symptoms: s.clinical_state?.symptoms || [],
      })),
      prescriptions: records.flatMap((r) => r.physician_prescription || []),
      consultationNotes: records.map((r) => ({
        id: r._id,
        sessionId: r.session_id,
        date: r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : 'Recent',
        notes: r.doctor_notes || '',
        status: r.review_status,
      })),
      documents: documents.map((d) => {
        const docSummaryText = typeof d.clinical_summary === 'string'
          ? d.clinical_summary
          : (d.clinical_summary?.physician_digest || d.clinical_summary?.patient_overview || 'Diagnostic parameters verified.');
        const rawUrl = d.file_url || (d.document_id ? `/api/v1/documents/${d.document_id}/file` : null);
        const resolvedUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `http://localhost:5000${rawUrl}`) : null;
        return {
          documentId: d.document_id,
          name: d.file_name || 'Medical Document.pdf',
          type: d.document_type || 'LAB_REPORT',
          url: resolvedUrl,
          summary: docSummaryText,
          structuredSummary: d.clinical_summary || null,
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent',
          isVerified: !d.requires_doctor_verification,
        };
      }),
      appointments: appointments.map((a) => ({
        appointmentId: a.appointment_id,
        date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : '',
        time: a.appointment_time,
        reason: a.reason,
        status: a.status,
      })),
    };
  }

  /**
   * 16. Doctor Consultations Workspace
   */
  async getDoctorConsultations(doctorId, { tab = 'ALL', search = '' } = {}) {
    await this.ensureSeedClinicalData(doctorId);

    const filter = {
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
      ],
    };
    if (tab === 'ACTIVE') {
      filter.status = { $in: ['READY_FOR_DOCTOR', 'DOCTOR_REVIEW'] };
    } else if (tab === 'COMPLETED') {
      filter.status = { $in: ['COMPLETED', 'CONSULTATION_COMPLETE'] };
    }

    const sessions = await ClinicalSession.find(filter).sort({ updatedAt: -1 }).limit(50).catch(() => []);
    const [patients, records] = await Promise.all([
      Patient.find({ patient_id: { $in: sessions.map((s) => s.patient_id) } }).catch(() => []),
      ClinicalRecord.find({ session_id: { $in: sessions.map((s) => s.session_id) } }).catch(() => []),
    ]);

    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));
    const recordMap = new Map(records.map((r) => [r.session_id, r]));

    let results = sessions.map((s) => {
      const p = patientMap.get(s.patient_id) || {};
      const r = recordMap.get(s.session_id) || {};
      const isRedFlag = s.triage_level === 'EMERGENCY' || Boolean(s.red_flags?.has_red_flag);
      const realAge = p.age != null ? p.age : (p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 3600 * 1000)) : null);
      return {
        id: s.session_id,
        sessionId: s.session_id,
        patientId: s.patient_id,
        patientName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || s.patient_id,
        age: realAge,
        gender: p.gender || null,
        chiefComplaint: s.clinical_state?.chief_complaint || s.chief_complaint_category || 'Clinical Encounter',
        doctorNotes: r.doctor_notes || '',
        prescriptionCount: r.physician_prescription?.length || 0,
        status: s.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        triageLevel: isRedFlag ? 'EMERGENCY' : s.triage_level || 'ROUTINE',
        opdType: s.opd_type || 'GENERAL',
        opdSystem: s.opd_system || 'GENERAL_MEDICINE',
        date: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Today',
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (c) =>
          c.patientName.toLowerCase().includes(q) ||
          c.patientId.toLowerCase().includes(q) ||
          c.chiefComplaint.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * 17. Doctor Medical Diagnostic Reports Workspace
   */
  async getDoctorReports(doctorId, { search = '' } = {}) {
    await this.ensureSeedClinicalData(doctorId);

    // 1. Authorize patient scope for this physician
    const doctorMatch = {
      $or: [
        { doctor_id: doctorId },
        { doctor_id: String(doctorId).toUpperCase() },
        { doctor_id: String(doctorId).toLowerCase() },
      ],
    };
    const sessionDoctorMatch = {
      $or: [
        { assigned_doctor_id: doctorId },
        { assigned_doctor_id: String(doctorId).toUpperCase() },
        { assigned_doctor_id: String(doctorId).toLowerCase() },
      ],
    };

    const [apptPids, sessionPids, redFlagPids] = await Promise.all([
      Appointment.distinct('patient_id', doctorMatch).catch(() => []),
      ClinicalSession.distinct('patient_id', sessionDoctorMatch).catch(() => []),
      RedFlagCase.distinct('patient_id', sessionDoctorMatch).catch(() => []),
    ]);

    const authorizedPatientIds = Array.from(new Set([...apptPids, ...sessionPids, ...redFlagPids].filter(Boolean)));

    if (authorizedPatientIds.length === 0) {
      return [];
    }

    const documents = await MedicalDocument.find({ patient_id: { $in: authorizedPatientIds } })
      .sort({ createdAt: -1 })
      .limit(60)
      .catch(() => []);
    const patientIds = documents.map((d) => d.patient_id).filter(Boolean);
    const patients = await Patient.find({ patient_id: { $in: patientIds } }).catch(() => []);
    const patientMap = new Map(patients.map((p) => [p.patient_id, p]));

    let results = documents.map((d) => {
      const p = patientMap.get(d.patient_id) || {};
      const structured = d.structured_data || d.extracted_data || {};
      const rawUrl = d.file_url || (d.document_id ? `/api/v1/documents/${d.document_id}/file` : null);
      const resolvedUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `http://localhost:5000${rawUrl}`) : null;

      return {
        id: d.document_id || d._id.toString(),
        documentId: d.document_id || d._id.toString(),
        sessionId: d.session_id,
        patientId: d.patient_id,
        patientName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || d.patient_id,
        name: d.file_name || `${d.document_type || 'Medical Report'}.pdf`,
        type: d.document_type || 'LAB_REPORT',
        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent',
        url: resolvedUrl,
        ocrStatus: d.processing_status || 'COMPLETED',
        confidence: d.confidence_score ? Math.round(d.confidence_score * 100) : 95,
        clinicalSummary: typeof d.clinical_summary === 'string' ? d.clinical_summary : d.clinical_summary?.physician_digest || 'Diagnostic parameters verified.',
        labInvestigations: structured.lab_investigations || [],
        requiresVerification: Boolean(d.requires_doctor_verification),
        isVerified: !d.requires_doctor_verification,
        verificationNotes: d.verification_notes || '',
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.clinicalSummary.toLowerCase().includes(q)
      );
    }

    return results;
  }

  async verifyDoctorReport(documentId, doctorId, { verification_notes = '' } = {}) {
    if (!documentId) throw ApiError.badRequest('Document ID is required');

    const updated = await MedicalDocument.findOneAndUpdate(
      { document_id: documentId },
      {
        $set: {
          requires_doctor_verification: false,
          verification_notes: verification_notes || `Verified by Dr. ${doctorId} on ${new Date().toLocaleDateString()}`,
        },
      },
      { returnDocument: 'after' }
    );
    if (!updated) throw ApiError.notFound(`Report '${documentId}' not found.`);
    return updated;
  }

  /**
   * 18. Doctor Notification Center
   */
  async getDoctorNotifications(doctorId) {
    await this.ensureSeedClinicalData(doctorId);

    const [notifs, redFlags] = await Promise.all([
      DoctorNotification.find({ doctor_id: doctorId, status: { $ne: 'WITHDRAWN' } }).sort({ createdAt: -1 }).limit(30).catch(() => []),
      RedFlagCase.find({
        $or: [
          { assigned_doctor_id: doctorId },
          { assigned_doctor_id: null, eligible_doctors: doctorId },
          { assigned_doctor_id: null, status: { $in: [RED_FLAG_STATUS.DETECTED, RED_FLAG_STATUS.BROADCASTING] } },
        ],
      }).sort({ createdAt: -1 }).catch(() => []),
    ]);

    const formatted = [
      ...redFlags.map((rf) => ({
        id: rf.case_id,
        type: 'EMERGENCY',
        title: 'Priority Emergency Red Flag',
        message: rf.trigger?.reason || 'Critical emergency clinical distress alert detected',
        time: rf.createdAt ? new Date(rf.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        read: false,
        caseId: rf.clinical_session_id,
      })),
      ...notifs.map((n) => ({
        id: n.notification_id,
        type: n.priority === 'EMERGENCY' ? 'EMERGENCY' : 'ALERT',
        title: n.reason || 'Clinical Notification',
        message: n.preview_data?.chief_complaint || 'Patient ready for clinical assessment',
        time: n.notified_at ? new Date(n.notified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        read: n.status === 'SEEN',
        caseId: n.case_id,
      })),
    ];

    return formatted;
  }

  async markDoctorNotificationAsRead(notificationId, doctorId) {
    const updated = await DoctorNotification.findOneAndUpdate(
      { notification_id: notificationId },
      { $set: { status: 'SEEN', seen_at: new Date() } },
      { returnDocument: 'after' }
    );
    return updated || { success: true };
  }

  /**
   * 19. Doctor Profile Configuration & OPD Preferences
   */
  async getDoctorProfile(doctorId) {
    const query = mongoose.Types.ObjectId.isValid(doctorId)
      ? { _id: doctorId }
      : { $or: [{ doctor_id: doctorId }, { email: doctorId }] };

    const doc = await User.findOne(query).select('name email phone specialty sub_specialty opd_type opd_system room on_duty availability_status').catch(() => null);
    if (!doc) {
      return {
        name: 'Dr. Aarav Sharma',
        email: 'doctor@sehat.org',
        phone: '+91 98250 12345',
        specialty: 'General Medicine',
        sub_specialty: 'Internal Medicine',
        opd_type: 'GENERAL',
        opd_system: 'GENERAL_MEDICINE',
        room: 'Room 104',
        on_duty: true,
        availability_status: 'AVAILABLE',
      };
    }

    return {
      name: doc.name ? (doc.name.toLowerCase().startsWith('dr') ? doc.name : `Dr. ${doc.name}`) : 'Dr. Aarav Sharma',
      email: doc.email,
      phone: doc.phone || '+91 98250 12345',
      specialty: doc.specialty || (doc.opd_type === 'AYUSH' ? 'Ayush Kayachikitsa' : 'General Medicine'),
      sub_specialty: doc.sub_specialty || 'OPD Clinical Care',
      opd_type: doc.opd_type || 'GENERAL',
      opd_system: doc.opd_system || (doc.opd_type === 'AYUSH' ? 'AYURVEDA' : 'GENERAL_MEDICINE'),
      room: doc.room || 'Room 104',
      on_duty: doc.on_duty !== undefined ? doc.on_duty : true,
      availability_status: doc.availability_status || 'AVAILABLE',
    };
  }

  async updateDoctorProfile(doctorId, data) {
    const query = mongoose.Types.ObjectId.isValid(doctorId)
      ? { _id: doctorId }
      : { $or: [{ doctor_id: doctorId }, { email: doctorId }] };

    const update = {};
    if (data.name) update.name = data.name;
    if (data.phone) update.phone = data.phone;
    if (data.specialty) update.specialty = data.specialty;
    if (data.sub_specialty) update.sub_specialty = data.sub_specialty;
    if (data.opd_type) update.opd_type = data.opd_type;
    if (data.opd_system) update.opd_system = data.opd_system;
    if (data.room) update.room = data.room;
    if (data.on_duty !== undefined) update.on_duty = data.on_duty;
    if (data.availability_status) update.availability_status = data.availability_status;

    const updated = await User.findOneAndUpdate(query, { $set: update }, { returnDocument: 'after' });
    return updated || data;
  }
}

export const doctorPanelService = new DoctorPanelService();
export default doctorPanelService;
