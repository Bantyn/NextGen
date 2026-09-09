import express from 'express';
import { z } from 'zod';
import { grantConsent, getPatientConsents } from '../controllers/consentController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { CONSENT_STATUS, CONSENT_TYPE } from '../constants/patientStatus.js';

const router = express.Router();

const grantConsentSchema = z.object({
  patient_id: z.string().min(1, 'patient_id is required'),
  session_id: z.string().optional(),
  consent_type: z.enum(Object.values(CONSENT_TYPE)).optional(),
  status: z.enum(Object.values(CONSENT_STATUS)).optional(),
});

router.post('/', validate({ body: grantConsentSchema }), grantConsent);
router.get('/:patientId', getPatientConsents);

export default router;
