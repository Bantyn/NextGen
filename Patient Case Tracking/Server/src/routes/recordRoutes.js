import express from 'express';
import { z } from 'zod';
import {
  generateRecord,
  getRecordById,
  reviewRecord,
  getPatientHistory,
} from '../controllers/recordController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { RECORD_REVIEW_STATUS } from '../constants/patientStatus.js';

const router = express.Router();

const generateRecordSchema = z.object({
  patient_id: z.string().min(1, 'patient_id is required'),
  session_id: z.string().min(1, 'session_id is required'),
});

const reviewRecordSchema = z.object({
  review_status: z.enum(Object.values(RECORD_REVIEW_STATUS)),
  doctor_notes: z.string().optional(),
  physician_prescription: z
    .array(
      z.object({
        medicine_name: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
        instructions: z.string().optional(),
      })
    )
    .optional(),
  reviewed_by: z.string().optional(),
});

router.use(optionalAuthenticate);

router.post('/generate', validate({ body: generateRecordSchema }), generateRecord);
router.get('/patient/:patientId', getPatientHistory);
router.get('/:id', getRecordById);
router.put('/:id/review', validate({ body: reviewRecordSchema }), reviewRecord);

export default router;
