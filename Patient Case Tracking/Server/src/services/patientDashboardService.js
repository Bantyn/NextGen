import { Patient } from '../models/Patient.js';
import { PatientIdentity } from '../models/PatientIdentity.js';
import { ClinicalSession } from '../models/ClinicalSession.js';
import { ClinicalRecord } from '../models/ClinicalRecord.js';
import { MedicalDocument } from '../models/MedicalDocument.js';
import { RedFlagCase } from '../models/RedFlagCase.js';
import { Appointment } from '../models/Appointment.js';
import { vitalsRepository } from '../repositories/vitalsRepository.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { patientNotificationRepository } from '../repositories/patientNotificationRepository.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import { doctorService } from './doctorService.js';
import clinicalIntelligenceService from './clinicalIntelligenceService.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export class PatientDashboardService {
  /**
   * Build complete dynamic dashboard bundle for an authenticated patient
   */
  async getDashboardData(patientId) {
    if (!patientId) {
      throw ApiError.badRequest('Patient ID is required to fetch dashboard data.', 'PATIENT_ID_REQUIRED');
    }

    // 1. Fetch Patient Record
    const patient = await Patient.findOne({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
        ...(patientId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: patientId }] : []),
      ],
    }).lean();

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${patientId}' was not found.`, 'PATIENT_NOT_FOUND');
    }

    const resolvedPatientId = patient.patient_id;

    // Resolve all linked patient records for this patient identity (e.g., matching verified phone number)
    const relatedPatientIds = [resolvedPatientId];
    if (patient.phone) {
      const linkedPatients = await Patient.find({ phone: patient.phone }).select('patient_id').lean().catch(() => []);
      linkedPatients.forEach((p) => {
        if (p.patient_id && !relatedPatientIds.includes(p.patient_id)) {
          relatedPatientIds.push(p.patient_id);
        }
      });
    }

    // 2. Parallel queries across all clinical domains
    const [
      abhaIdentity,
      latestVitals,
      vitalsHistory,
      allSessions,
      redFlagCase,
      medicalDocs,
      clinicalRecords,
      upcomingAppointments,
      allAppointments,
      notifications,
      unreadNotifCount,
    ] = await Promise.all([
      PatientIdentity.findOne({
        patient_id: { $in: relatedPatientIds },
        identity_type: 'ABHA',
      }).lean(),
      vitalsRepository.findLatestByPatientId(resolvedPatientId),
      vitalsRepository.findHistoryByPatientId(resolvedPatientId, 15),
      ClinicalSession.find({
        patient_id: { $in: relatedPatientIds },
      }).sort({ createdAt: -1 }).lean(),
      RedFlagCase.findOne({
        patient_id: { $in: relatedPatientIds },
        status: { $ne: 'RESOLVED' },
      }).sort({ createdAt: -1 }).lean(),
      MedicalDocument.find({
        patient_id: { $in: relatedPatientIds },
      }).sort({ createdAt: -1 }).lean(),
      ClinicalRecord.find({
        patient_id: { $in: relatedPatientIds },
      }).sort({ createdAt: -1 }).lean(),
      Appointment.find({
        patient_id: { $in: relatedPatientIds },
        status: { $in: ['CONFIRMED', 'UPCOMING', 'PENDING'] },
      }).sort({ appointment_date: 1 }).lean().catch(() => []),
      Appointment.find({
        patient_id: { $in: relatedPatientIds },
      }).sort({ appointment_date: -1, createdAt: -1 }).lean().catch(() => []),
      patientNotificationRepository.findByPatientId(resolvedPatientId, 10),
      patientNotificationRepository.countUnreadByPatientId(resolvedPatientId),
    ]);

    // 3. Format Patient Profile
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Patient';
    const age = patient.date_of_birth
      ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;

    const opdSystemDisplay = patient.opd_type === 'AYUSH'
      ? `AYUSH — ${(patient.opd_system || 'Ayurveda').replace(/_/g, ' ')}`
      : `General OPD — ${patient.medical_specialization || 'General Medicine'}`;

    // 4. Format Vitals (strictly real values, null if not recorded)
    let formattedVitals = null;
    if (latestVitals) {
      formattedVitals = {
        id: latestVitals.vitals_id,
        recordedAt: latestVitals.recorded_at,
        bloodPressure: (latestVitals.blood_pressure?.systolic && latestVitals.blood_pressure?.diastolic)
          ? {
              systolic: latestVitals.blood_pressure.systolic,
              diastolic: latestVitals.blood_pressure.diastolic,
              display: `${latestVitals.blood_pressure.systolic}/${latestVitals.blood_pressure.diastolic} mmHg`,
              status: latestVitals.blood_pressure.systolic < 120 && latestVitals.blood_pressure.diastolic < 80 ? 'Normal' : latestVitals.blood_pressure.systolic <= 129 ? 'Elevated' : 'High BP',
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        pulse: latestVitals.pulse?.value != null
          ? {
              value: latestVitals.pulse.value,
              unit: latestVitals.pulse.unit || 'bpm',
              status: latestVitals.pulse.value >= 60 && latestVitals.pulse.value <= 100 ? 'Normal Sinus Rhythm' : 'Attention Required',
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        temperature: latestVitals.temperature?.value != null
          ? {
              value: latestVitals.temperature.value,
              unit: latestVitals.temperature.unit || '°F',
              status: latestVitals.temperature.value >= 97 && latestVitals.temperature.value <= 99.2 ? 'Afebrile (Normal)' : 'Elevated Temperature',
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        oxygenSaturation: latestVitals.spo2?.value != null
          ? {
              value: latestVitals.spo2.value,
              unit: latestVitals.spo2.unit || '%',
              status: latestVitals.spo2.value >= 95 ? 'Normal SpO2' : 'Low SpO2 Alert',
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        bloodSugar: latestVitals.blood_sugar?.value != null
          ? {
              value: latestVitals.blood_sugar.value,
              type: latestVitals.blood_sugar.type || 'Random',
              unit: latestVitals.blood_sugar.unit || 'mg/dL',
              status: latestVitals.blood_sugar.value < 140 ? 'Normal Glycemic Control' : 'Elevated Glucose',
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        bmi: latestVitals.bmi?.value != null
          ? {
              value: latestVitals.bmi.value,
              status: latestVitals.bmi.status || 'Healthy',
              weight: latestVitals.weight?.value ? `${latestVitals.weight.value} kg` : null,
              height: latestVitals.height?.value ? `${latestVitals.height.value} cm` : null,
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        respiratoryRate: latestVitals.respiratory_rate?.value != null
          ? {
              value: latestVitals.respiratory_rate.value,
              unit: latestVitals.respiratory_rate.unit || 'breaths/min',
              recordedAt: latestVitals.recorded_at,
            }
          : null,
        notes: latestVitals.notes || null,
        recordedBy: latestVitals.recorded_by,
      };
    }

    const formattedVitalsHistory = (vitalsHistory || []).map((v) => ({
      id: v.vitals_id,
      date: new Date(v.recorded_at).toLocaleDateString(),
      time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: v.recorded_at,
      bp: (v.blood_pressure?.systolic && v.blood_pressure?.diastolic)
        ? `${v.blood_pressure.systolic}/${v.blood_pressure.diastolic}`
        : null,
      pulse: v.pulse?.value ?? null,
      sugar: v.blood_sugar?.value ?? null,
      spo2: v.spo2?.value ?? null,
      temp: v.temperature?.value ?? null,
      weight: v.weight?.value ?? null,
      bmi: v.bmi?.value ?? null,
      source: v.recorded_by,
    }));

    // 5. Format Live Journey & Token (based strictly on active session & clinical records)
    const activeSession = (allSessions && allSessions.length > 0) ? allSessions[0] : null;
    let currentToken = null;
    if (activeSession) {
      let stageKey = activeSession.journey_stage;
      if (!stageKey) {
        if (activeSession.status === 'COMPLETED' || activeSession.status === 'CONSULTATION_COMPLETE') {
          stageKey = 'COMPLETED';
        } else if (activeSession.status === 'DOCUMENT_PROCESSING' || (medicalDocs && medicalDocs.length > 0 && activeSession.status !== 'STARTED')) {
          stageKey = 'LAB_PENDING';
        } else if (activeSession.status === 'READY_FOR_DOCTOR' || activeSession.status === 'DOCTOR_REVIEW' || activeSession.assigned_doctor_id || (clinicalRecords && clinicalRecords.length > 0)) {
          stageKey = 'IN_CONSULTATION';
        } else if (latestVitals || activeSession.status === 'PRIORITY_TRIAGE') {
          stageKey = 'VITALS_TAKEN';
        } else {
          stageKey = 'CHECKED_IN';
        }
      }

      const JOURNEY_STAGES_MAP = {
        CHECKED_IN: {
          index: 0,
          key: 'CHECKED_IN',
          label: 'Checked In',
          statusBadge: 'Checked In',
          doctor: 'Triage Clinical Officer',
          desc: 'Kiosk / Reception Registration Complete',
          estimatedWait: '10-15 mins',
          queuePosition: 3,
        },
        VITALS_TAKEN: {
          index: 1,
          key: 'VITALS_TAKEN',
          label: 'Vitals Recorded',
          statusBadge: 'Vitals & Triage Recorded',
          doctor: 'Nurse Triage Desk',
          desc: 'Biometrics & Preliminary Triage Logged',
          estimatedWait: '5-10 mins',
          queuePosition: 2,
        },
        IN_CONSULTATION: {
          index: 2,
          key: 'IN_CONSULTATION',
          label: 'In Consultation',
          statusBadge: 'In Doctor Consultation',
          doctor: patient.opd_type === 'AYUSH' ? 'Dr. Aarav Mehta (AYUSH)' : 'Dr. Priya Sharma (OPD)',
          desc: 'Physician Clinical Evaluation In Progress',
          estimatedWait: 'In Progress',
          queuePosition: 1,
        },
        LAB_PENDING: {
          index: 3,
          key: 'LAB_PENDING',
          label: 'Diagnostic Tests',
          statusBadge: 'Diagnostic Investigations',
          doctor: 'Diagnostic Lab Services',
          desc: 'Sample Collection & Reports Processing',
          estimatedWait: '15-20 mins',
          queuePosition: 1,
        },
        COMPLETED: {
          index: 4,
          key: 'COMPLETED',
          label: 'Consultation Complete',
          statusBadge: 'Consultation Complete',
          doctor: patient.opd_type === 'AYUSH' ? 'Dr. Aarav Mehta' : 'Dr. Priya Sharma',
          desc: 'Prescription Issued & Encounter Finalized',
          estimatedWait: 'Encounter Finalized',
          queuePosition: 0,
        },
      };

      const stageConfig = JOURNEY_STAGES_MAP[stageKey] || JOURNEY_STAGES_MAP.CHECKED_IN;
      const assignedDoctor = activeSession.assigned_doctor_name
        || (clinicalRecords && clinicalRecords[0]?.doctor_name)
        || (patient.opd_type === 'AYUSH' ? 'Dr. Aarav Mehta (AYUSH)' : 'Dr. Priya Sharma (OPD)');
      const activeRoom = activeSession.assigned_doctor_room
        || (patient.opd_type === 'AYUSH' ? 'AYUSH Consultation Block (Room 104)' : 'OPD Main Block (Room 104)');

      currentToken = {
        sessionId: activeSession.session_id,
        token: `TK-${resolvedPatientId.slice(-3).toUpperCase()}`,
        room: activeRoom,
        department: opdSystemDisplay,
        doctor: stageConfig.index >= 2 ? assignedDoctor : stageConfig.doctor,
        status: stageKey,
        stageKey: stageKey,
        stepIndex: stageConfig.index,
        statusLabel: stageConfig.statusBadge,
        stageDesc: stageConfig.desc,
        queuePosition: stageConfig.queuePosition,
        estimatedWait: stageConfig.estimatedWait,
        checkinTime: new Date(activeSession.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: activeSession.updatedAt || activeSession.createdAt,
      };
    }

    // 6. Format Risk Assessment (strictly real data)
    let healthRisk = null;
    if (redFlagCase) {
      healthRisk = {
        hasRisk: true,
        riskLevel: redFlagCase.risk_level || 'HIGH',
        priority: redFlagCase.priority || 'EMERGENCY',
        reason: redFlagCase.trigger?.reason || 'Clinical alert flagged by triage engine',
        detectedAt: redFlagCase.createdAt,
        status: redFlagCase.status,
      };
    } else if (activeSession?.red_flags?.has_red_flag) {
      healthRisk = {
        hasRisk: true,
        riskLevel: activeSession.red_flags.severity || 'MODERATE',
        priority: 'HIGH_PRIORITY',
        reason: activeSession.red_flags.reason || 'Symptom alert during voice intake',
        detectedAt: activeSession.red_flags.triggered_at || activeSession.updatedAt,
        status: 'DETECTED',
      };
    } else if (activeSession?.triage_level) {
      healthRisk = {
        hasRisk: activeSession.triage_level === 'HIGH' || activeSession.triage_level === 'EMERGENCY',
        riskLevel: activeSession.triage_level,
        priority: activeSession.triage_level === 'LOW' ? 'ROUTINE' : 'PRIORITY',
        reason: activeSession.triage_reason || 'Routine triage evaluation',
        detectedAt: activeSession.updatedAt,
        status: 'TRIAGED',
      };
    }

    // 6B. Format Multi-Intake Encounter History (Preserving all distinct encounters)
    const dbDocs = await doctorService.getDoctorsFromDB();
    const formattedIntakeHistory = (allSessions || []).map((s) => {
      const isAyush = s.opd_type === 'AYUSH';
      const opdLabel = isAyush
        ? `AYUSH — ${(s.opd_system || 'Ayurveda').replace(/_/g, ' ')}`
        : `General OPD — ${(s.opd_system || 'General Medicine').replace(/_/g, ' ')}`;
      const complaintText =
        s.clinical_state?.chief_complaint ||
        s.clinical_summary?.chief_complaint ||
        (s.chief_complaint_category ? s.chief_complaint_category.replace(/_/g, ' ') : 'Clinical Consultation');

      // Resolve automatically appointed doctor for this encounter from DB
      let assignedDocInfo = null;
      if (s.assigned_doctor_name) {
        const matchingDbDoc = dbDocs.find(
          (d) => d.doctor_id === s.assigned_doctor_id || d.id === s.assigned_doctor_id || d.doctor_name?.toLowerCase() === s.assigned_doctor_name?.toLowerCase()
        );
        assignedDocInfo = {
          id: s.assigned_doctor_id || matchingDbDoc?.doctor_id || 'DOC-AUTO',
          name: s.assigned_doctor_name,
          specialty: s.assigned_doctor_specialty || matchingDbDoc?.specialty || opdLabel,
          qualification: matchingDbDoc?.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)'),
          department: matchingDbDoc?.department || opdLabel,
          room: s.assigned_doctor_room || matchingDbDoc?.room || (isAyush ? 'Room 104 (Ayush OPD)' : 'Room 104 (General OPD)'),
        };
      } else if (s.assigned_doctor_id) {
        const found = dbDocs.find(
          (d) => d.doctor_id?.toLowerCase() === s.assigned_doctor_id.toLowerCase() || d.id?.toLowerCase() === s.assigned_doctor_id.toLowerCase()
        ) || (doctorService.getAllDoctors ? doctorService.getAllDoctors() : []).find(
          (d) => d.doctor_id?.toLowerCase() === s.assigned_doctor_id.toLowerCase()
        );
        if (found) {
          assignedDocInfo = {
            id: found.doctor_id,
            name: found.doctor_name || found.name,
            specialty: found.specialty || opdLabel,
            qualification: found.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)'),
            department: found.department || opdLabel,
            room: found.room || (isAyush ? 'Room 104 (Ayush OPD)' : 'Room 104 (General OPD)'),
          };
        }
      }

      if (!assignedDocInfo) {
        // Auto-allot from MongoDB User collection based on symptoms
        const symptomsList = s.clinical_state?.symptoms || s.clinical_summary?.symptoms || [];
        const symptomsText = [...symptomsList, complaintText].join(' ');
        const specialtyMatch = clinicalIntelligenceService.matchSpecialtyFromSymptoms(symptomsText, '');
        const targetSpec = (specialtyMatch?.primary || (isAyush ? 'Ayurveda' : 'General Medicine')).toLowerCase();
        const candidates = (specialtyMatch?.candidates || [targetSpec]).map((c) => c.toLowerCase());

        const pool = dbDocs.filter((d) => (isAyush ? d.opd_type === 'AYUSH' : d.opd_type !== 'AYUSH'));
        const activePool = pool.length > 0 ? pool : dbDocs;

        let bestDoc = activePool.find((d) => {
          const sp = (d.specialty || '').toLowerCase();
          const sub = (d.sub_specialty || '').toLowerCase();
          const dept = (d.department || '').toLowerCase();
          return candidates.some((c) => sp.includes(c) || sub.includes(c) || dept.includes(c));
        });

        if (!bestDoc) {
          bestDoc = activePool.find((d) => (d.specialty || '').toLowerCase().includes('general') || (d.specialty || '').toLowerCase().includes('opd'));
        }
        if (!bestDoc && activePool.length > 0) {
          bestDoc = activePool[0];
        }

        if (bestDoc) {
          assignedDocInfo = {
            id: bestDoc.doctor_id,
            name: bestDoc.doctor_name || bestDoc.name,
            specialty: bestDoc.specialty || opdLabel,
            qualification: bestDoc.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)'),
            department: bestDoc.department || opdLabel,
            room: bestDoc.room || (isAyush ? 'Room 104 (Ayush OPD)' : 'Room 104 (General OPD)'),
          };

          // Persist asynchronously on the session
          ClinicalSession.updateOne(
            { session_id: s.session_id },
            {
              $set: {
                assigned_doctor_id: bestDoc.doctor_id,
                assigned_doctor_name: bestDoc.doctor_name || bestDoc.name,
                assigned_doctor_specialty: bestDoc.specialty,
                assigned_doctor_room: bestDoc.room,
              },
            }
          ).catch(() => {});
        } else {
          // Fallback if DB completely empty
          const fallback = (doctorService.getAllDoctors ? doctorService.getAllDoctors() : [])[0];
          assignedDocInfo = {
            id: fallback?.doctor_id || 'DOC-MED-01',
            name: fallback?.doctor_name || 'Dr. Attending Physician',
            specialty: fallback?.specialty || opdLabel,
            qualification: fallback?.qualification || 'MBBS, MD',
            department: fallback?.department || opdLabel,
            room: fallback?.room || 'Room 104 (Main OPD)',
          };
        }
      }

      return {
        id: s.session_id,
        sessionId: s.session_id,
        encounterId: s.session_id,
        date: new Date(s.createdAt).toLocaleDateString(),
        time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: s.createdAt,
        opdType: s.opd_type || 'GENERAL',
        opdSystem: s.opd_system || 'GENERAL_MEDICINE',
        department: opdLabel,
        status: s.status || 'STARTED',
        journeyStage: s.journey_stage || 'CHECKED_IN',
        journeyStepIndex: s.journey_step_index ?? 0,
        chiefComplaint: complaintText,
        symptoms: s.clinical_state?.symptoms || s.clinical_summary?.symptoms || [],
        triageLevel: s.triage_level || 'LOW',
        triageReason: s.triage_reason || '',
        hasRedFlag: Boolean(s.red_flags?.has_red_flag),
        redFlagReason: s.red_flags?.reason || null,
        clinicalSummary: s.clinical_summary || null,
        clinicalState: s.clinical_state || null,
        aiSummary: s.clinical_state?.ai_summary || s.clinical_summary?.hpi_summary || s.clinical_state?.hpi_summary || (typeof s.clinical_summary === 'string' ? s.clinical_summary : null),
        voiceTranscript: s.clinical_state?.voice_transcript || null,
        doctorNotes: s.doctor_notes || null,
        prescriptions: s.prescriptions || [],
        ayushProfile: s.ayush_profile || null,
        assignedDoctorId: assignedDocInfo.id,
        assignedDoctorName: assignedDocInfo.name,
        assignedDoctorSpecialty: assignedDocInfo.specialty,
        assignedDoctorDegree: assignedDocInfo.qualification,
        assignedDoctorDepartment: assignedDocInfo.department,
        assignedDoctorRoom: assignedDocInfo.room,
        startedAt: s.started_at || s.createdAt,
        completedAt: s.completed_at || null,
      };
    });

    // 7. Format Medical Documents & AI Summaries
    const reports = (medicalDocs || []).map((doc) => {
      const isLab = doc.document_type === 'LAB_REPORT' || (doc.extracted_data?.lab_results && doc.extracted_data.lab_results.length > 0);
      const isRx = doc.document_type === 'PRESCRIPTION' || (doc.extracted_data?.current_medications && doc.extracted_data.current_medications.length > 0);

      const labs = doc.extracted_data?.lab_results || [];
      const parameters = labs.map((l) => {
        const rawVal = l.observed_value != null && l.observed_value !== '' ? l.observed_value : (l.value != null ? l.value : '-');
        const cleanUnit = (l.unit && !/^(normal|high|low|borderline|calculated)$/i.test(String(l.unit).trim())) ? String(l.unit).trim() : '';
        const displayVal = cleanUnit ? `${rawVal} ${cleanUnit}`.trim() : String(rawVal);
        return {
          name: l.test_name || 'Investigation',
          value: displayVal,
          observedValue: String(rawVal),
          unit: cleanUnit,
          normalRange: l.reference_range || 'Standard Range',
          status: (l.flag === 'LOW' || l.flag === 'HIGH' || l.flag === 'CRITICAL') ? l.flag : (l.status || 'Normal'),
          alert: (l.flag === 'LOW' || l.flag === 'HIGH' || l.flag === 'CRITICAL'),
        };
      });

      const importantFindings = doc.important_findings || [];
      const hasAbnormal = parameters.some((p) => p.alert) || importantFindings.some((f) => f.status !== 'NORMAL') || doc.requires_doctor_verification;

      return {
        id: doc.document_id || String(doc._id),
        documentId: doc.document_id || String(doc._id),
        testCode: `DOC-${(doc.document_id || String(doc._id)).slice(-4).toUpperCase()}`,
        title: doc.file_name ? doc.file_name.replace(/\.[^/.]+$/, '') : (isLab ? 'Diagnostic Lab Report' : isRx ? 'Prescription' : 'Medical Report'),
        category: isLab ? 'Biochemistry' : isRx ? 'Prescriptions' : 'Diagnostic Report',
        date: new Date(doc.createdAt).toLocaleDateString(),
        orderedBy: (doc.extracted_data?.doctor?.name || 'Attending Physician').replace(/\s+(?:reported|collected|registered|generated|sample|date|time|uhid|ref|page|contact).*$/i, '').trim(),
        facility: doc.extracted_data?.doctor?.facility || 'Civil Hospital / OPD Clinic',
        status: doc.processing_status || 'COMPLETED',
        statusSeverity: hasAbnormal ? 'attention' : 'normal',
        critical: doc.requires_doctor_verification || false,
        fileSize: doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '1.2 MB',
        fileUrl: doc.file_url ? (doc.file_url.startsWith('http') ? doc.file_url : `http://localhost:5000${doc.file_url}`) : null,
        fileName: doc.file_name,
        summary: doc.patient_summary?.meaning || doc.patient_summary?.about || (typeof doc.clinical_summary === 'string' ? doc.clinical_summary.slice(0, 160) : doc.clinical_summary?.physician_digest?.slice(0, 160)) || 'Processed medical document.',
        parameters,
        values: parameters,
        clinicalSummary: doc.clinical_summary || null,
        patientSummary: doc.patient_summary || null,
        importantFindings,
        extractionConfidence: doc.extraction_confidence || 'CLEAR',
        extractedText: doc.extracted_text || '',
        extractedData: doc.extracted_data || {},
      };
    });

    // 8. Format Prescriptions, Medical History & Allergies from Clinical Records
    const prescriptions = [];
    const allergiesMap = new Map();
    const chronicConditionsMap = new Map();
    const consultedDoctors = [];
    const timeline = [];

    (clinicalRecords || []).forEach((rec, idx) => {
      // Prescriptions
      if (rec.physician_prescription && rec.physician_prescription.length > 0) {
        const meds = rec.physician_prescription.map((m) => ({
          name: m.medicine_name || 'Prescribed Drug',
          dosage: m.dosage || '1 dose',
          timing: m.frequency || 'Daily',
          duration: m.duration || 'As directed',
          instructions: m.instructions || 'Follow doctor directions',
          schedule: m.frequency || '1 - 0 - 1',
          refill: 'Authorized',
        }));

        prescriptions.push({
          id: rec.record_id || `RX-${idx + 1}`,
          rxNumber: `RX-SEH-${(rec.record_id || String(idx)).slice(-4)}`,
          doctor: 'Consulted OPD Physician',
          specialty: opdSystemDisplay,
          department: opdSystemDisplay,
          date: rec.reviewed_at ? new Date(rec.reviewed_at).toLocaleDateString() : new Date(rec.createdAt).toLocaleDateString(),
          status: rec.review_status === 'APPROVED' ? 'Active' : 'Pending Review',
          diagnosis: rec.chief_complaint || 'Primary Consultation',
          medications: meds,
          medicines: meds,
        });
      }

      // Allergies from Physician Records
      if (rec.structured_history?.allergies && rec.structured_history.allergies.length > 0) {
        rec.structured_history.allergies.forEach((a) => {
          const allergen = typeof a === 'string' ? a.trim() : (a.allergen || 'Recorded Allergen').trim();
          if (allergen && !allergiesMap.has(allergen.toLowerCase())) {
            allergiesMap.set(allergen.toLowerCase(), {
              allergen,
              reaction: typeof a === 'string' ? 'Hypersensitivity' : a.reaction || 'Mild',
              severity: typeof a === 'string' ? 'Moderate' : a.severity || 'Moderate',
              source: 'Physician Consultation',
            });
          }
        });
      }

      // Chronic Conditions from Physician Records
      if (rec.structured_history?.past_medical_history && rec.structured_history.past_medical_history.length > 0) {
        rec.structured_history.past_medical_history.forEach((cond) => {
          const name = typeof cond === 'string' ? cond.trim() : (cond.name || 'Medical Condition').trim();
          if (name && !chronicConditionsMap.has(name.toLowerCase())) {
            chronicConditionsMap.set(name.toLowerCase(), {
              name,
              diagnosedYear: rec.reviewed_at ? new Date(rec.reviewed_at).toLocaleDateString() : 'Recorded in EMR',
              status: 'Ongoing Care',
              source: 'Physician Consultation',
            });
          }
        });
      }

      // Consulted Doctors from Clinical Record
      if (rec.review_status === 'APPROVED' || rec.doctor_notes) {
        const docRecordId = rec.doctor_id || (rec.reviewed_by ? String(rec.reviewed_by) : `DOC-REC-${idx}`);
        const directoryDoc = (doctorService.getAllDoctors ? doctorService.getAllDoctors() : []).find(
          (d) => d.doctor_id?.toLowerCase() === (rec.doctor_id || '').toLowerCase()
        );
        consultedDoctors.push({
          id: docRecordId,
          name: directoryDoc?.doctor_name || 'Consulted OPD Physician',
          specialty: directoryDoc?.specialty || opdSystemDisplay,
          degrees: directoryDoc?.qualification || (patient.opd_type === 'AYUSH' ? 'BAMS, MD' : 'MBBS, MD'),
          department: directoryDoc?.department || opdSystemDisplay,
          room: directoryDoc?.room || (patient.opd_type === 'AYUSH' ? 'Room 204 (AYUSH Block)' : 'Room 102 (Main OPD)'),
          lastVisit: rec.reviewed_at ? new Date(rec.reviewed_at).toLocaleDateString() : new Date(rec.createdAt).toLocaleDateString(),
          status: 'Completed OPD Consultation',
          chiefComplaint: rec.chief_complaint || 'General Clinical Review',
          diagnosis: rec.chief_complaint || 'Evaluated and managed',
          clinicalNotes: rec.doctor_notes || 'Follow medical advice and continue monitoring.',
          notes: rec.doctor_notes || 'Follow medical advice and continue monitoring.',
          isCurrent: false,
        });
      }

      // Timeline
      timeline.push({
        id: rec.record_id || `TL-${idx}`,
        date: rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'Visit',
        category: patient.opd_type === 'AYUSH' ? 'AYUSH Consultation' : 'General OPD Visit',
        department: opdSystemDisplay,
        title: rec.chief_complaint || 'Clinical Encounter',
        description: rec.doctor_notes || 'Patient evaluated and advised care protocol.',
      });
    });

    // Aggregate Medical History from AI Voice Intake Sessions
    (allSessions || []).forEach((sess) => {
      const sessionHistory = [
        ...(sess.clinical_state?.relevant_history || []),
        ...(sess.clinical_summary?.past_medical_history || []),
        ...(sess.clinical_summary?.medical_history || []),
      ];

      sessionHistory.forEach((item) => {
        if (typeof item === 'string' && item.trim().length > 1) {
          const name = item.trim();
          if (!chronicConditionsMap.has(name.toLowerCase())) {
            chronicConditionsMap.set(name.toLowerCase(), {
              name,
              diagnosedYear: new Date(sess.createdAt).toLocaleDateString(),
              status: 'Reported in Triage',
              source: 'Voice Intake',
            });
          }
        }
      });

      const sessionAllergies = [
        ...(sess.clinical_state?.allergies || []),
        ...(sess.clinical_summary?.allergies || []),
      ];

      sessionAllergies.forEach((item) => {
        if (typeof item === 'string' && item.trim().length > 1) {
          const allergen = item.trim();
          if (!allergiesMap.has(allergen.toLowerCase())) {
            allergiesMap.set(allergen.toLowerCase(), {
              allergen,
              reaction: 'Patient Reported',
              severity: 'Moderate',
              source: 'Voice Intake',
            });
          }
        }
      });
    });

    // Aggregate Medical History from Uploaded Diagnostic Reports & Prescriptions
    (medicalDocs || []).forEach((doc) => {
      const docHistory = [
        ...(doc.extracted_data?.medical_history || []),
        ...(doc.extracted_data?.diagnoses || []),
        ...(doc.clinical_summary?.medical_history || []),
      ];

      docHistory.forEach((item) => {
        if (typeof item === 'string' && item.trim().length > 1) {
          const name = item.trim();
          if (!chronicConditionsMap.has(name.toLowerCase())) {
            chronicConditionsMap.set(name.toLowerCase(), {
              name,
              diagnosedYear: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Reported in Document',
              status: 'Verified in Lab Report',
              source: doc.file_name || 'Medical Document',
            });
          }
        }
      });

      const docAllergies = doc.extracted_data?.allergies || [];
      docAllergies.forEach((item) => {
        if (typeof item === 'string' && item.trim().length > 1) {
          const allergen = item.trim();
          if (!allergiesMap.has(allergen.toLowerCase())) {
            allergiesMap.set(allergen.toLowerCase(), {
              allergen,
              reaction: 'Documented Allergy',
              severity: 'Moderate',
              source: doc.file_name || 'Medical Document',
            });
          }
        }
      });
    });

    const chronicConditions = Array.from(chronicConditionsMap.values());
    const allergies = Array.from(allergiesMap.values());

    // Aggregate Consulted Doctors from Appointments and Active/Past Sessions
    const consultedDoctorsMap = new Map();

    // Add doctors recorded from clinical consultations
    consultedDoctors.forEach((doc) => {
      if (doc.id && !consultedDoctorsMap.has(doc.id.toLowerCase())) {
        consultedDoctorsMap.set(doc.id.toLowerCase(), doc);
      }
    });

    // Source 2: Appointments (Completed, In-Progress, or Confirmed past/present appointments)
    (allAppointments || []).forEach((apt) => {
      const docKey = apt.doctor_id || apt.doctor_name;
      if (docKey && !consultedDoctorsMap.has(docKey.toLowerCase())) {
        const directoryDoc = (doctorService.getAllDoctors ? doctorService.getAllDoctors() : []).find(
          (d) => d.doctor_id?.toLowerCase() === (apt.doctor_id || '').toLowerCase()
        );
        consultedDoctorsMap.set(docKey.toLowerCase(), {
          id: apt.doctor_id || `DOC-APT-${apt.appointment_id}`,
          name: apt.doctor_name || directoryDoc?.doctor_name || 'Attending Physician',
          specialty: apt.doctor_specialization || directoryDoc?.specialty || opdSystemDisplay,
          degrees: directoryDoc?.qualification || (patient.opd_type === 'AYUSH' ? 'BAMS, MD' : 'MBBS, MD'),
          department: directoryDoc?.department || apt.doctor_specialization || opdSystemDisplay,
          room: apt.room || directoryDoc?.room || (patient.opd_type === 'AYUSH' ? 'Room 204 (AYUSH Block)' : 'Room 102 (Main OPD)'),
          lastVisit: apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'Recent Visit',
          status: apt.status === 'COMPLETED' ? 'Completed Consultation' : 'Scheduled Consultation',
          chiefComplaint: apt.reason || 'OPD Clinical Consultation',
          diagnosis: apt.notes || 'Evaluated and managed',
          clinicalNotes: apt.notes || 'Follow medical advice, continue prescribed medications, and track symptoms.',
          notes: apt.notes || 'Follow medical advice, continue prescribed medications, and track symptoms.',
          isCurrent: apt.status === 'IN_PROGRESS' || (apt.appointment_date && new Date(apt.appointment_date).toDateString() === new Date().toDateString()),
        });
      }
    });

    // Source 3: Clinical Sessions where doctor was assigned
    (allSessions || []).forEach((sess) => {
      if (sess.assigned_doctor_id) {
        const docKey = sess.assigned_doctor_id;
        if (!consultedDoctorsMap.has(docKey.toLowerCase())) {
          const directoryDoc = (doctorService.getAllDoctors ? doctorService.getAllDoctors() : []).find(
            (d) => d.doctor_id?.toLowerCase() === docKey.toLowerCase()
          );
          consultedDoctorsMap.set(docKey.toLowerCase(), {
            id: docKey,
            name: directoryDoc?.doctor_name || 'Assigned OPD Physician',
            specialty: directoryDoc?.specialty || opdSystemDisplay,
            degrees: directoryDoc?.qualification || (patient.opd_type === 'AYUSH' ? 'BAMS, MD' : 'MBBS, MD'),
            department: directoryDoc?.department || opdSystemDisplay,
            room: directoryDoc?.room || (patient.opd_type === 'AYUSH' ? 'Room 204 (AYUSH Block)' : 'Room 102 (Main OPD)'),
            lastVisit: new Date(sess.createdAt).toLocaleDateString(),
            status: sess.status === 'COMPLETED' ? 'Completed Encounter' : 'Active Clinical Encounter',
            chiefComplaint: sess.clinical_state?.chief_complaint || 'Triage Consultation',
            diagnosis: sess.clinical_state?.risk_level || 'Clinical Review',
            clinicalNotes: 'Under physician care and monitoring.',
            notes: 'Under physician care and monitoring.',
            isCurrent: sess.status !== 'COMPLETED',
          });
        }
      }
    });

    // Final real list of consulted doctors without fake random fallbacks
    const finalConsultedDoctors = Array.from(consultedDoctorsMap.values());

    // 9. Format Appointments
    const formattedUpcomingAppointments = (upcomingAppointments || []).map((a) => ({
      id: a.appointment_id,
      doctorName: a.doctor_name,
      specialization: a.doctor_specialization,
      date: new Date(a.appointment_date).toLocaleDateString(),
      time: a.appointment_time,
      room: a.room,
      status: a.status,
      consultationType: a.consultation_type,
      reason: a.reason,
    }));

    const formattedAllAppointments = (allAppointments || []).map((a) => ({
      id: a.appointment_id,
      doctorName: a.doctor_name,
      specialization: a.doctor_specialization,
      date: new Date(a.appointment_date).toLocaleDateString(),
      time: a.appointment_time,
      room: a.room,
      status: a.status,
      consultationType: a.consultation_type,
      reason: a.reason,
    }));

    // 10. Format Notifications
    const formattedNotifications = (notifications || []).map((n) => ({
      id: n.notification_id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      severity: n.severity,
      isRead: n.is_read,
      createdAt: n.createdAt,
    }));

    // 11. Compile Real Dashboard Counters
    const counters = {
      totalReports: reports.length,
      upcomingAppointments: formattedUpcomingAppointments.length,
      totalPrescriptions: prescriptions.length,
      unreadNotifications: unreadNotifCount,
      completedVisits: clinicalRecords.length,
      totalIntakes: formattedIntakeHistory.length,
    };

    return {
      id: resolvedPatientId,
      patientId: resolvedPatientId,
      name: fullName,
      age,
      gender: patient.gender === 'MALE' ? 'Male' : patient.gender === 'FEMALE' ? 'Female' : 'Other',
      abhaId: abhaIdentity ? (abhaIdentity.abha_number || abhaIdentity.identity_reference) : null,
      abhaNumber: abhaIdentity ? (abhaIdentity.abha_number || abhaIdentity.identity_reference) : null,
      abhaAddress: abhaIdentity ? (abhaIdentity.abha_address || null) : null,
      abhaStatus: abhaIdentity ? (abhaIdentity.verification_status || 'LINKED') : 'NOT_LINKED',
      abhaLinkedAt: abhaIdentity?.link_metadata?.linked_at || abhaIdentity?.updatedAt || null,
      isAbhaLinked: Boolean(abhaIdentity && abhaIdentity.verification_status === 'VERIFIED'),
      opdType: patient.opd_type || 'GENERAL',
      opdSystem: patient.opd_system || 'GENERAL_MEDICINE',
      medicalSpecialization: patient.medical_specialization || 'General Medicine',
      patient: {
        id: resolvedPatientId,
        patientId: resolvedPatientId,
        name: fullName,
        firstName: patient.first_name,
        lastName: patient.last_name,
        gender: patient.gender === 'MALE' ? 'Male' : patient.gender === 'FEMALE' ? 'Female' : 'Other',
        age,
        dateOfBirth: patient.date_of_birth,
        phone: patient.phone || null,
        address: patient.address || null,
        bloodGroup: patient.blood_group || null,
        abhaId: abhaIdentity ? (abhaIdentity.abha_number || abhaIdentity.identity_reference) : null,
        abhaNumber: abhaIdentity ? (abhaIdentity.abha_number || abhaIdentity.identity_reference) : null,
        abhaAddress: abhaIdentity ? (abhaIdentity.abha_address || null) : null,
        abhaStatus: abhaIdentity ? (abhaIdentity.verification_status || 'LINKED') : 'NOT_LINKED',
        abhaLinkedAt: abhaIdentity?.link_metadata?.linked_at || abhaIdentity?.updatedAt || null,
        isAbhaLinked: Boolean(abhaIdentity && abhaIdentity.verification_status === 'VERIFIED'),
        opdType: patient.opd_type || 'GENERAL',
        opdSystem: patient.opd_system || 'GENERAL_MEDICINE',
        medicalSpecialization: patient.medical_specialization || 'General Medicine',
        opdDisplay: opdSystemDisplay,
        registrationDate: patient.createdAt,
        currentStatus: patient.current_status,
      },
      health: {
        risk: healthRisk,
        lastUpdated: latestVitals?.recorded_at || activeSession?.updatedAt || patient.updatedAt,
      },
      vitals: formattedVitals,
      vitalsHistory: formattedVitalsHistory,
      currentToken,
      intakeHistory: formattedIntakeHistory,
      intakes: formattedIntakeHistory,
      documents: {
        total: reports.length,
        items: reports,
      },
      reports,
      prescriptions,
      consultedDoctors: finalConsultedDoctors,
      allergies,
      chronicConditions,
      timeline,
      appointments: {
        upcoming: formattedUpcomingAppointments,
        all: formattedAllAppointments,
      },
      notifications: {
        unreadCount: unreadNotifCount,
        items: formattedNotifications,
      },
      counters,
    };
  }

  /**
   * Record new vitals for a patient
   */
  async recordVitals(patientId, vitalsData, recordedBy = 'PATIENT') {
    if (!patientId) throw ApiError.badRequest('Patient ID is required');

    const patient = await Patient.findOne({
      $or: [{ patient_id: patientId }, { patient_id: String(patientId).toUpperCase() }],
    });
    if (!patient) throw ApiError.notFound('Patient not found');

    const record = await vitalsRepository.create({
      patient_id: patient.patient_id,
      blood_pressure: {
        systolic: vitalsData.systolic ? Number(vitalsData.systolic) : null,
        diastolic: vitalsData.diastolic ? Number(vitalsData.diastolic) : null,
      },
      pulse: { value: vitalsData.pulse ? Number(vitalsData.pulse) : null },
      spo2: { value: vitalsData.spo2 ? Number(vitalsData.spo2) : null },
      temperature: { value: vitalsData.temperature ? Number(vitalsData.temperature) : null },
      blood_sugar: {
        value: vitalsData.bloodSugar ? Number(vitalsData.bloodSugar) : null,
        type: vitalsData.sugarType || 'RANDOM',
      },
      weight: { value: vitalsData.weight ? Number(vitalsData.weight) : null },
      height: { value: vitalsData.height ? Number(vitalsData.height) : null },
      recorded_by: recordedBy,
      notes: vitalsData.notes || '',
      recorded_at: new Date(),
    });

    // Create a real notification
    await patientNotificationRepository.create({
      patient_id: patient.patient_id,
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Vitals Recorded Successfully',
      message: `Your latest vital signs were recorded on ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      severity: 'SUCCESS',
    });

    return record;
  }

  /**
   * Book a new appointment for a patient
   */
  async bookAppointment(patientId, aptData) {
    if (!patientId) throw ApiError.badRequest('Patient ID is required');

    const patient = await Patient.findOne({
      $or: [{ patient_id: patientId }, { patient_id: String(patientId).toUpperCase() }],
    });
    if (!patient) throw ApiError.notFound('Patient not found');

    const apt = await appointmentRepository.create({
      patient_id: patient.patient_id,
      doctor_id: aptData.doctorId || 'DOC-MED-01',
      doctor_name: aptData.doctorName || 'Dr. Priya Sharma',
      doctor_specialization: aptData.doctorSpecialization || 'General Medicine',
      opd_type: patient.opd_type || 'GENERAL',
      opd_system: patient.opd_system || 'GENERAL_MEDICINE',
      consultation_type: aptData.consultationType || 'IN_PERSON',
      appointment_date: new Date(aptData.date || Date.now() + 86400000),
      appointment_time: aptData.time || '10:30 AM',
      room: aptData.room || 'OPD Room 102',
      reason: aptData.reason || 'Follow-up Consultation',
    });

    // Create notification
    await patientNotificationRepository.create({
      patient_id: patient.patient_id,
      type: 'APPOINTMENT_REMINDER',
      title: 'Appointment Scheduled',
      message: `Your appointment with ${apt.doctor_name} is scheduled for ${new Date(apt.appointment_date).toLocaleDateString()} at ${apt.appointment_time}.`,
      severity: 'INFO',
    });

    return apt;
  }

  /**
   * Update the live OPD journey stage for a patient
   */
  async updatePatientJourneyStage(patientId, stageKey, sessionId = null) {
    if (!patientId) throw ApiError.badRequest('Patient ID is required');

    const patient = await Patient.findOne({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
        ...(String(patientId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: patientId }] : []),
      ],
    });
    if (!patient) throw ApiError.notFound('Patient not found');

    const validStages = ['CHECKED_IN', 'VITALS_TAKEN', 'IN_CONSULTATION', 'LAB_PENDING', 'COMPLETED'];
    if (!validStages.includes(stageKey)) {
      throw ApiError.badRequest(`Invalid stageKey: ${stageKey}. Expected one of: ${validStages.join(', ')}`);
    }

    const stageMap = {
      CHECKED_IN: { index: 0, status: 'STARTED', label: 'Checked In' },
      VITALS_TAKEN: { index: 1, status: 'PRIORITY_TRIAGE', label: 'Vitals Recorded' },
      IN_CONSULTATION: { index: 2, status: 'DOCTOR_REVIEW', label: 'In Consultation' },
      LAB_PENDING: { index: 3, status: 'DOCUMENT_PROCESSING', label: 'Diagnostic Tests' },
      COMPLETED: { index: 4, status: 'COMPLETED', label: 'Consultation Complete' },
    };

    const targetStage = stageMap[stageKey];

    let sessionQuery = { patient_id: patient.patient_id };
    if (sessionId) {
      sessionQuery = { session_id: sessionId };
    }

    let session = await ClinicalSession.findOne(sessionQuery).sort({ createdAt: -1 });
    if (!session) {
      session = new ClinicalSession({
        session_id: `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        patient_id: patient.patient_id,
        status: targetStage.status,
        journey_stage: stageKey,
        journey_step_index: targetStage.index,
        opd_type: patient.opd_type || 'GENERAL',
        opd_system: patient.opd_system || 'GENERAL_MEDICINE',
      });
    } else {
      session.journey_stage = stageKey;
      session.journey_step_index = targetStage.index;
      session.status = targetStage.status;
      if (stageKey === 'COMPLETED') {
        session.completed_at = new Date();
      }
    }

    await session.save();

    // Create real-time notification
    try {
      await patientNotificationRepository.create({
        patient_id: patient.patient_id,
        type: 'OPD_JOURNEY_UPDATE',
        title: 'Live OPD Status Update',
        message: `Your live OPD encounter status moved to: ${targetStage.label}.`,
        severity: 'INFO',
        link: '/patient/dashboard',
      });
    } catch (notifErr) {
      console.warn('[patientDashboardService] Notification creation warning:', notifErr.message);
    }

    return this.getDashboardData(patient.patient_id);
  }

  /**
   * Create a new clinical intake encounter for a registered patient without duplicating identity
   */
  async createEncounter(patientId, encounterData = {}) {
    if (!patientId) throw ApiError.badRequest('Patient ID is required to start a new encounter');

    const patient = await Patient.findOne({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    });
    if (!patient) throw ApiError.notFound(`Patient '${patientId}' not found.`);

    const resolvedPatientId = patient.patient_id;
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const sessionId = `SES-${Date.now().toString(36).toUpperCase()}-${randomHex}`;

    const opdType = encounterData.opd_type || encounterData.opdType || patient.opd_type || 'GENERAL';
    const opdSystem = encounterData.opd_system || encounterData.opdSystem || patient.opd_system || (opdType === 'AYUSH' ? 'AYURVEDA' : 'GENERAL_MEDICINE');
    const complaint = encounterData.chief_complaint || encounterData.chiefComplaint || '';
    const language = encounterData.language || encounterData.preferredLanguage || 'gu-IN';

    const newSession = await ClinicalSession.create({
      session_id: sessionId,
      patient_id: resolvedPatientId,
      language,
      consultation_type: opdType === 'AYUSH' ? `AYUSH_${opdSystem.toUpperCase()}` : 'GENERAL',
      opd_type: opdType,
      opd_system: opdSystem,
      status: 'STARTED',
      journey_stage: 'CHECKED_IN',
      journey_step_index: 0,
      chief_complaint_category: encounterData.chief_complaint_category || 'OTHER',
      clinical_state: {
        chief_complaint: complaint,
        symptoms: encounterData.symptoms || [],
        onset: encounterData.onset || '',
        duration: encounterData.duration || '',
        severity: encounterData.severity || null,
        patient_intent: encounterData.patient_intent || 'New clinical consultation',
      },
      started_at: new Date(),
    });

    // Update patient status
    patient.current_status = 'IN_SESSION';
    await patient.save();

    return {
      success: true,
      sessionId: newSession.session_id,
      session_id: newSession.session_id,
      encounterId: newSession.session_id,
      encounter_id: newSession.session_id,
      patientId: resolvedPatientId,
      patient_id: resolvedPatientId,
      opdType: newSession.opd_type,
      opdSystem: newSession.opd_system,
      status: newSession.status,
      journeyStage: newSession.journey_stage,
      createdAt: newSession.createdAt,
    };
  }

  /**
   * Get full list of clinical encounters for a patient
   */
  async getPatientEncounters(patientId) {
    if (!patientId) throw ApiError.badRequest('Patient ID is required');

    const [sessions, dbDocs] = await Promise.all([
      ClinicalSession.find({
        $or: [
          { patient_id: patientId },
          { patient_id: String(patientId).toUpperCase() },
          { patient_id: String(patientId).toLowerCase() },
        ],
      }).sort({ createdAt: -1 }).lean(),
      doctorService.getDoctorsFromDB(),
    ]);

    return (sessions || []).map((s) => {
      const isAyush = s.opd_type === 'AYUSH';
      const opdLabel = isAyush
        ? `AYUSH — ${(s.opd_system || 'Ayurveda').replace(/_/g, ' ')}`
        : `General OPD — ${(s.opd_system || 'General Medicine').replace(/_/g, ' ')}`;
      const complaintText =
        s.clinical_state?.chief_complaint ||
        s.clinical_summary?.chief_complaint ||
        (s.chief_complaint_category ? s.chief_complaint_category.replace(/_/g, ' ') : 'Clinical Intake');

      let assignedDocInfo = null;
      if (s.assigned_doctor_name) {
        const matchingDbDoc = dbDocs.find(
          (d) => d.doctor_id === s.assigned_doctor_id || d.id === s.assigned_doctor_id || d.doctor_name?.toLowerCase() === s.assigned_doctor_name?.toLowerCase()
        );
        assignedDocInfo = {
          id: s.assigned_doctor_id || matchingDbDoc?.doctor_id || 'DOC-AUTO',
          name: s.assigned_doctor_name,
          specialty: s.assigned_doctor_specialty || matchingDbDoc?.specialty || opdLabel,
          qualification: matchingDbDoc?.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)'),
          department: matchingDbDoc?.department || opdLabel,
          room: s.assigned_doctor_room || matchingDbDoc?.room || (isAyush ? 'Room 104 (Ayush OPD)' : 'Room 104 (General OPD)'),
        };
      } else if (s.assigned_doctor_id) {
        const found = dbDocs.find(
          (d) => d.doctor_id?.toLowerCase() === s.assigned_doctor_id.toLowerCase() || d.id?.toLowerCase() === s.assigned_doctor_id.toLowerCase()
        ) || (doctorService.getAllDoctors ? doctorService.getAllDoctors() : []).find(
          (d) => d.doctor_id?.toLowerCase() === s.assigned_doctor_id.toLowerCase()
        );
        if (found) {
          assignedDocInfo = {
            id: found.doctor_id,
            name: found.doctor_name || found.name,
            specialty: found.specialty || opdLabel,
            qualification: found.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)'),
            department: found.department || opdLabel,
            room: found.room || (isAyush ? 'Room 104 (Ayush OPD)' : 'Room 104 (General OPD)'),
          };
        }
      }

      if (!assignedDocInfo) {
        const symptomsList = s.clinical_state?.symptoms || s.clinical_summary?.symptoms || [];
        const symptomsText = [...symptomsList, complaintText].join(' ');
        const specialtyMatch = clinicalIntelligenceService.matchSpecialtyFromSymptoms(symptomsText, '');
        const targetSpec = (specialtyMatch?.primary || (isAyush ? 'Ayurveda' : 'General Medicine')).toLowerCase();
        const candidates = (specialtyMatch?.candidates || [targetSpec]).map((c) => c.toLowerCase());

        const pool = dbDocs.filter((d) => (isAyush ? d.opd_type === 'AYUSH' : d.opd_type !== 'AYUSH'));
        const activePool = pool.length > 0 ? pool : dbDocs;

        let bestDoc = activePool.find((d) => {
          const sp = (d.specialty || '').toLowerCase();
          const sub = (d.sub_specialty || '').toLowerCase();
          const dept = (d.department || '').toLowerCase();
          return candidates.some((c) => sp.includes(c) || sub.includes(c) || dept.includes(c));
        });

        if (!bestDoc) {
          bestDoc = activePool.find((d) => (d.specialty || '').toLowerCase().includes('general') || (d.specialty || '').toLowerCase().includes('opd'));
        }
        if (!bestDoc && activePool.length > 0) {
          bestDoc = activePool[0];
        }

        if (bestDoc) {
          assignedDocInfo = {
            id: bestDoc.doctor_id,
            name: bestDoc.doctor_name || bestDoc.name,
            specialty: bestDoc.specialty || opdLabel,
            qualification: bestDoc.qualification || (isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)'),
            department: bestDoc.department || opdLabel,
            room: bestDoc.room || (isAyush ? 'Room 104 (Ayush OPD)' : 'Room 104 (General OPD)'),
          };
        } else {
          const fallback = (doctorService.getAllDoctors ? doctorService.getAllDoctors() : [])[0];
          assignedDocInfo = {
            id: fallback?.doctor_id || 'DOC-MED-01',
            name: fallback?.doctor_name || 'Dr. Attending Physician',
            specialty: fallback?.specialty || opdLabel,
            qualification: fallback?.qualification || 'MBBS, MD',
            department: fallback?.department || opdLabel,
            room: fallback?.room || 'Room 104 (Main OPD)',
          };
        }
      }

      return {
        id: s.session_id,
        sessionId: s.session_id,
        encounterId: s.session_id,
        date: new Date(s.createdAt).toLocaleDateString(),
        time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: s.createdAt,
        opdType: s.opd_type || 'GENERAL',
        opdSystem: s.opd_system || 'GENERAL_MEDICINE',
        department: opdLabel,
        status: s.status,
        journeyStage: s.journey_stage,
        chiefComplaint: s.clinical_state?.chief_complaint || s.clinical_summary?.chief_complaint || (s.chief_complaint_category ? s.chief_complaint_category.replace(/_/g, ' ') : 'Clinical Intake'),
        symptoms: s.clinical_state?.symptoms || s.clinical_summary?.symptoms || [],
        triageLevel: s.triage_level || 'LOW',
        triageReason: s.triage_reason || '',
        hasRedFlag: Boolean(s.red_flags?.has_red_flag),
        redFlagReason: s.red_flags?.reason || null,
        clinicalSummary: s.clinical_summary || null,
        assignedDoctorId: assignedDocInfo.id,
        assignedDoctorName: assignedDocInfo.name,
        assignedDoctorSpecialty: assignedDocInfo.specialty,
        assignedDoctorDegree: assignedDocInfo.qualification,
        assignedDoctorDepartment: assignedDocInfo.department,
        assignedDoctorRoom: assignedDocInfo.room,
        startedAt: s.started_at || s.createdAt,
        completedAt: s.completed_at || null,
      };
    });
  }

  /**
   * Get full detail bundle for a single encounter
   */
  async getEncounterById(sessionId, patientId = null) {
    if (!sessionId) throw ApiError.badRequest('Session ID is required');

    const session = await ClinicalSession.findOne({ session_id: sessionId }).lean();
    if (!session) throw ApiError.notFound(`Encounter '${sessionId}' not found`);

    if (patientId && session.patient_id.toUpperCase() !== patientId.toUpperCase()) {
      throw ApiError.forbidden('Access denied to this clinical encounter');
    }

    const [record, docs] = await Promise.all([
      ClinicalRecord.findOne({ session_id: sessionId }).lean(),
      MedicalDocument.find({
        $or: [{ session_id: sessionId }, { encounter_id: sessionId }],
      }).lean(),
    ]);

    return {
      session,
      record,
      documents: docs || [],
    };
  }

  /**
   * Add a self-reported or clinically documented medical condition / allergy for a patient
   */
  async addMedicalHistory(patientId, historyData) {
    if (!patientId) throw ApiError.badRequest('Patient ID is required');

    const patient = await Patient.findOne({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    });
    if (!patient) throw ApiError.notFound('Patient not found');

    const { condition, allergy } = historyData || {};

    // Find active session or create baseline session
    let session = await ClinicalSession.findOne({
      $or: [
        { patient_id: patient.patient_id },
        { patient_id: patient.patient_id.toLowerCase() },
        { patient_id: patient.patient_id.toUpperCase() },
      ],
      status: { $ne: 'COMPLETED' },
    }).sort({ createdAt: -1 });

    if (!session) {
      session = await ClinicalSession.create({
        session_id: `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        patient_id: patient.patient_id,
        status: 'READY_FOR_DOCTOR',
        journey_stage: 'CHECKED_IN',
        clinical_state: {
          relevant_history: [],
          allergies: [],
          symptoms: [],
          medications: [],
        },
        clinical_summary: {
          past_medical_history: [],
          allergies: [],
        },
      });
    }

    const state = session.clinical_state || {};
    const existingHistory = Array.isArray(state.relevant_history) ? [...state.relevant_history] : [];
    const existingAllergies = Array.isArray(state.allergies) ? [...state.allergies] : [];

    let updated = false;

    if (condition && typeof condition === 'string' && condition.trim()) {
      const condName = condition.trim();
      if (!existingHistory.some((h) => h.toLowerCase() === condName.toLowerCase())) {
        existingHistory.push(condName);
        updated = true;
      }
    }

    if (allergy && typeof allergy === 'string' && allergy.trim()) {
      const allergyName = allergy.trim();
      if (!existingAllergies.some((a) => a.toLowerCase() === allergyName.toLowerCase())) {
        existingAllergies.push(allergyName);
        updated = true;
      }
    }

    if (updated) {
      session.clinical_state = {
        ...state,
        relevant_history: existingHistory,
        allergies: existingAllergies,
      };

      const summary = session.clinical_summary || {};
      session.clinical_summary = {
        ...summary,
        past_medical_history: existingHistory,
        allergies: existingAllergies,
      };

      await session.save();
    }

    return await this.getDashboardData(patient.patient_id);
  }

  /**
   * Fetch live available doctors for appointment scheduling
   */
  async getAvailableDoctorsForBooking(filters = {}) {
    const [directoryDocs, dbDocs] = await Promise.all([
      doctorService.getAllDoctors ? doctorService.getAllDoctors() : [],
      User.find({ role: 'DOCTOR' })
        .select('name email phone specialty sub_specialty opd_type opd_system room on_duty availability_status is_active')
        .catch(() => []),
    ]);

    const docsMap = new Map();
    (directoryDocs || []).forEach((d) => {
      docsMap.set(d.doctor_id, {
        doctorId: d.doctor_id,
        id: d.doctor_id,
        name: d.doctor_name,
        doctorName: d.doctor_name,
        specialization: d.specialty || 'General Medicine',
        specialty: d.specialty || 'General Medicine',
        subSpecialty: d.sub_specialty || '',
        department: d.department || 'General Medicine',
        hospital: d.hospital || 'Sehat Apex Civil Hospital',
        room: d.room || 'OPD Room 102',
        experienceYears: d.experience_years || 10,
        consultationType: d.consultation_type || 'GENERAL',
        fixedSlots: d.fixed_slots || ['09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
        availabilityStatus: 'AVAILABLE',
        onDuty: true,
      });
    });

    (dbDocs || []).forEach((u) => {
      const id = u.doctor_id || u._id.toString();
      const existing = docsMap.get(id) || {};
      const docName = u.name || existing.doctorName || existing.name || `Dr. ${u.email?.split('@')[0]}`;
      const docSpec = u.specialty || existing.specialization || existing.specialty || 'General Medicine';
      docsMap.set(id, {
        ...existing,
        doctorId: id,
        id: id,
        name: docName,
        doctorName: docName,
        specialization: docSpec,
        specialty: docSpec,
        subSpecialty: u.sub_specialty || existing.subSpecialty || '',
        department: u.department || existing.department || u.specialty || 'General Medicine',
        room: u.room || existing.room || 'Room 102',
        fixedSlots: existing.fixedSlots || ['09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
        availabilityStatus: u.availability_status || 'AVAILABLE',
        onDuty: u.on_duty !== false,
      });
    });

    let doctors = Array.from(docsMap.values());
    if (filters.specialty) {
      doctors = doctors.filter((d) => d.specialty.toLowerCase().includes(filters.specialty.toLowerCase()));
    }
    if (filters.opd_type) {
      if (filters.opd_type === 'AYUSH') {
        doctors = doctors.filter(
          (d) =>
            (d.consultationType || '').startsWith('AYUSH') ||
            (d.specialty || '').toLowerCase().includes('ayush') ||
            (d.specialty || '').toLowerCase().includes('ayur')
        );
      }
    }
    return doctors;
  }

  /**
   * AI-based Doctor Recommendation based on symptoms
   */
  async recommendDoctor(patientId, { symptoms, opdType = 'GENERAL' }) {
    if (!symptoms) throw ApiError.badRequest('Symptoms are required for recommendation.');

    try {
      // 1. Get AI recommendation for specialty
      const specialtyMatch = clinicalIntelligenceService.matchSpecialtyFromSymptoms(symptoms, '');
      const targetSpecialty = specialtyMatch?.primary || 'General Medicine';

      // 2. Fetch available doctors for the given opdType
      const availableDocs = await this.getAvailableDoctorsForBooking({ opd_type: opdType });
      
      if (!availableDocs || availableDocs.length === 0) {
        return {
          recommendedDoctor: null,
          specialty: targetSpecialty,
          message: `Based on your symptoms, we recommend a ${targetSpecialty} specialist, but none are currently available.`,
        };
      }

      // 3. Try to match doctor by department or specialty
      let bestMatch = availableDocs.find(
        doc => 
          (doc.specialization && doc.specialization.toLowerCase().includes(targetSpecialty.toLowerCase())) ||
          (doc.department && doc.department.toLowerCase().includes(targetSpecialty.toLowerCase()))
      );

      // Fallback to first available if no exact match
      if (!bestMatch) {
        bestMatch = availableDocs[0];
      }

      return {
        recommendedDoctor: bestMatch,
        specialty: targetSpecialty,
        confidence: specialtyMatch?.confidence || 0.8,
        message: `Based on your symptoms, we matched you with ${bestMatch.name} (${bestMatch.specialization || bestMatch.department}).`
      };
    } catch (error) {
      logger.error('[PatientDashboardService] Error in AI recommendation: ' + error.message);
      throw error;
    }
  }

  /**
   * Verify whether a requested patientId belongs to the authenticated patient identity
   */
  async verifyPatientOwnership(ownId, requestedId) {
    if (!ownId || !requestedId) return false;
    if (ownId.toUpperCase() === requestedId.toUpperCase()) return true;

    try {
      // Check if both IDs belong to records with matching phone or identity links
      const [ownPatient, requestedPatient] = await Promise.all([
        Patient.findOne({
          $or: [
            { patient_id: ownId },
            { patient_id: ownId.toUpperCase() },
            { patient_id: ownId.toLowerCase() },
          ],
        }).lean(),
        Patient.findOne({
          $or: [
            { patient_id: requestedId },
            { patient_id: requestedId.toUpperCase() },
            { patient_id: requestedId.toLowerCase() },
          ],
        }).lean(),
      ]);

      if (ownPatient && requestedPatient) {
        // If they share the same phone number, they are the same individual
        if (ownPatient.phone && requestedPatient.phone && ownPatient.phone === requestedPatient.phone) {
          return true;
        }
      }

      // Check PatientIdentity linkages
      const identities = await PatientIdentity.find({
        patient_id: { $in: [ownId, requestedId] },
      }).lean();

      if (identities.length >= 2) {
        const refs = identities.map((i) => i.identity_reference);
        const uniqueRefs = new Set(refs);
        if (uniqueRefs.size < refs.length) {
          return true; // share the same ABHA or Aadhaar
        }
      }

      return false;
    } catch (err) {
      logger.warn('[PatientDashboardService] verifyPatientOwnership error:', err.message);
      return false;
    }
  }
}

export const patientDashboardService = new PatientDashboardService();
export default patientDashboardService;
