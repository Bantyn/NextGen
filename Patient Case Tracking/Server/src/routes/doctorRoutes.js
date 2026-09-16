import express from 'express';
import { z } from 'zod';
import {
  handleGetDoctorDashboard,
  handleGetDoctorQueue,
  handleGetPatientCaseBundle,
  handleSaveConsultationNotes,
  handleSavePrescription,
  handleCompleteConsultation,
  handleUpdateDoctorAvailability,
  handleGetPrescriptionTemplates,
  handleSavePrescriptionTemplate,
  handleDeletePrescriptionTemplate,
  handleGetDoctorAnalytics,
  handleGetEligibleColleagues,
  handleGetDoctorPipeline,
  handleUpdateCaseWorkflowStatus,
  handleGetDoctorAppointments,
  handleCreateDoctorAppointment,
  handleUpdateAppointmentStatus,
  handleGetDoctorPatients,
  handleGetPatientClinicalProfile,
  handleGetDoctorConsultations,
  handleGetDoctorReports,
  handleVerifyDoctorReport,
  handleGetDoctorNotifications,
  handleMarkDoctorNotificationRead,
  handleGetDoctorProfile,
  handleUpdateDoctorProfile,
} from '../controllers/doctorController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

const saveNotesSchema = z.object({
  doctor_notes: z.string().optional(),
  assessment: z.string().optional(),
  treatment_plan: z.string().optional(),
  follow_up: z.string().optional(),
});

const savePrescriptionSchema = z.object({
  medicines: z.array(
    z.object({
      medicine_name: z.string().min(1, 'Medicine name is required'),
      generic_name: z.string().optional(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      duration: z.string().optional(),
      instructions: z.string().optional(),
      before_after_food: z.string().optional(),
    })
  ),
});

const templateSchema = z.object({
  title: z.string().min(1, 'Template title is required'),
  category: z.string().optional(),
  notes: z.string().optional(),
  medicines: z.array(z.any()).min(1, 'At least one medicine is required'),
});

// Protect all doctor routes with JWT auth and DOCTOR role
router.use(authenticate);
router.use(restrictTo(ROLES.DOCTOR, ROLES.ADMIN));

// 1. Dashboard, Live Queue & Kanban Pipeline
router.get('/dashboard', handleGetDoctorDashboard);
router.get('/queue', handleGetDoctorQueue);
router.get('/pipeline', handleGetDoctorPipeline);
router.patch('/opd/cases/:caseId/status', handleUpdateCaseWorkflowStatus);

// 2. Appointments Workspace
router.get('/appointments', handleGetDoctorAppointments);
router.post('/appointments', handleCreateDoctorAppointment);
router.patch('/appointments/:id/status', handleUpdateAppointmentStatus);

// 3. Patients Directory & Dossier
router.get('/patients', handleGetDoctorPatients);
router.get('/patients/:patientId/profile', handleGetPatientClinicalProfile);

// 4. Patient Clinical Case Encounter Bundle & Actions
router.get('/cases/:sessionId', handleGetPatientCaseBundle);
router.post('/cases/:sessionId/notes', validate({ body: saveNotesSchema }), handleSaveConsultationNotes);
router.post('/cases/:sessionId/prescribe', validate({ body: savePrescriptionSchema }), handleSavePrescription);
router.post('/cases/:sessionId/complete', handleCompleteConsultation);

// 5. Consultations
router.get('/consultations', handleGetDoctorConsultations);

// 6. Diagnostic Reports
router.get('/reports', handleGetDoctorReports);
router.patch('/reports/:id/verify', handleVerifyDoctorReport);

// 7. Notifications Center
router.get('/notifications', handleGetDoctorNotifications);
router.patch('/notifications/:id/read', handleMarkDoctorNotificationRead);

// 8. Doctor Profile & Availability
router.get('/profile', handleGetDoctorProfile);
router.patch('/profile', handleUpdateDoctorProfile);
router.patch('/availability', handleUpdateDoctorAvailability);

// 9. Prescription Templates
router.get('/templates', handleGetPrescriptionTemplates);
router.post('/templates', validate({ body: templateSchema }), handleSavePrescriptionTemplate);
router.delete('/templates/:id', handleDeletePrescriptionTemplate);

// 10. Clinical Analytics
router.get('/analytics', handleGetDoctorAnalytics);

// 11. Specialist Escalation & Transfer Candidates
router.get('/colleagues', handleGetEligibleColleagues);

export default router;
