import express from 'express';
import { z } from 'zod';
import {
  handleTriggerRedFlag,
  handleGetDoctorEmergencyCases,
  handleAcceptCase,
  handleDeclineCase,
  handleGetCaseDetails,
  handleTransferCase,
  handleResolveCase,
  handleGetAllRedFlagCases,
} from '../controllers/clinicalCaseController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

const triggerRedFlagSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
  patient_id: z.string().min(1, 'Patient ID is required'),
  category: z.string().optional(),
  reason: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  clinical_state: z.record(z.any()).optional(),
});

const declineCaseSchema = z.object({
  reason: z.string().optional(),
});

const transferCaseSchema = z.object({
  to_doctor_id: z.string().min(1, 'Target doctor ID is required'),
  reason: z.string().min(1, 'Reason for transfer is required'),
});

const resolveCaseSchema = z.object({
  notes: z.string().optional(),
  disposition: z.string().optional(),
});

// Require authentication for all clinical case operations
router.use(authenticate);

// 1. Trigger / Escalate Red Flag Case
router.post('/trigger-red-flag', validate({ body: triggerRedFlagSchema }), handleTriggerRedFlag);

// 2. Active emergency cases for authenticated doctor
router.get('/emergency', restrictTo(ROLES.DOCTOR, ROLES.ADMIN), handleGetDoctorEmergencyCases);

// 3. Admin overview of all red-flag cases
router.get('/all', restrictTo(ROLES.ADMIN), handleGetAllRedFlagCases);

// 4. Authorized clinical case snapshot (Assigned doctor or Admin)
router.get('/:caseId', restrictTo(ROLES.DOCTOR, ROLES.ADMIN), handleGetCaseDetails);

// 5. Atomic Claim / Accept Emergency Case
router.post('/:caseId/accept', restrictTo(ROLES.DOCTOR, ROLES.ADMIN), handleAcceptCase);

// 6. Doctor declines case
router.post('/:caseId/decline', restrictTo(ROLES.DOCTOR, ROLES.ADMIN), validate({ body: declineCaseSchema }), handleDeclineCase);

// 7. Case Transfer
router.post('/:caseId/transfer', restrictTo(ROLES.DOCTOR, ROLES.ADMIN), validate({ body: transferCaseSchema }), handleTransferCase);

// 8. Case Resolution
router.post('/:caseId/resolve', restrictTo(ROLES.DOCTOR, ROLES.ADMIN), validate({ body: resolveCaseSchema }), handleResolveCase);

export default router;
