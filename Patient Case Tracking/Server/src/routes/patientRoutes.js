import express from 'express';
import { z } from 'zod';
import { createPatient, searchPatients, getPatientById, attachIdentity } from '../controllers/patientController.js';
import {
  getPatientDashboard,
  recordPatientVitals,
  getPatientAppointments,
  createPatientAppointment,
  getPatientNotifications,
  markNotificationRead,
  updateJourneyStep,
} from '../controllers/patientDashboardController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

const createPatientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().or(z.date()).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  address: z.string().optional(),
  opd_type: z.enum(['GENERAL', 'AYUSH']).optional(),
  opd_system: z.string().optional(),
  medical_specialization: z.string().optional(),
  emergency_contact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional(),
});

const attachIdentitySchema = z.object({
  identity_type: z.enum(['ABHA', 'AADHAAR', 'LOCAL']),
  identity_reference: z.string().min(1, 'Identity reference is required'),
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED']).optional(),
});

// Patient endpoints allow kiosk/staff interaction with optional authentication
router.use(optionalAuthenticate);

// 1. Dashboard Aggregation Endpoints (must come before /:id)
router.get('/dashboard', getPatientDashboard);
router.get('/dashboard/:id', getPatientDashboard);

// 2. Vitals Recording & History
router.post('/vitals', recordPatientVitals);

// 3. Appointments
router.get('/appointments', getPatientAppointments);
router.get('/appointments/:id', getPatientAppointments);
router.post('/appointments', createPatientAppointment);

// 4. Notifications
router.get('/notifications', getPatientNotifications);
router.get('/notifications/:id', getPatientNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// 5. Live OPD Journey & Queue Progression
router.patch('/journey-step', updateJourneyStep);
router.post('/journey-step', updateJourneyStep);

// 6. Patient Demographics & Search
router.post('/', validate({ body: createPatientSchema }), createPatient);
router.get('/', searchPatients);
router.get('/:id', getPatientById);
router.post('/:id/identities', validate({ body: attachIdentitySchema }), attachIdentity);

export default router;
