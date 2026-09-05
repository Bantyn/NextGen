import express from 'express';
import { z } from 'zod';
import {
  initializeSession,
  getSessionById,
  updateStatus,
  getActiveSessions,
} from '../controllers/sessionController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

const initSessionSchema = z.object({
  patient_id: z.string().min(1, 'patient_id is required'),
  language: z.string().optional(),
  consultation_type: z.enum(['GENERAL', 'AYUSH_AYURVEDA']).optional(),
  chief_complaint_category: z.string().nullable().optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, 'status is required'),
});

router.use(optionalAuthenticate);

router.post('/', validate({ body: initSessionSchema }), initializeSession);
router.get('/active', getActiveSessions);
router.get('/:id', getSessionById);
router.put('/:id/status', validate({ body: updateStatusSchema }), updateStatus);

export default router;
