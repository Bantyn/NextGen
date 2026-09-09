import express from 'express';
import { z } from 'zod';
import { createObservation, getSessionObservations } from '../controllers/observationController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { OBSERVATION_CATEGORY } from '../constants/patientStatus.js';

const router = express.Router();

const createObservationSchema = z.object({
  session_id: z.string().min(1, 'session_id is required'),
  category: z.enum(Object.values(OBSERVATION_CATEGORY)),
  name: z.string().min(1, 'name is required'),
  value: z.string().optional(),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
});

router.post('/', validate({ body: createObservationSchema }), createObservation);
router.get('/:sessionId', getSessionObservations);

export default router;
