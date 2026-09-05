import express from 'express';
import { z } from 'zod';
import { postMessage, getSessionMessages } from '../controllers/caseMessageController.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

const postMessageSchema = z.object({
  session_id: z.string().min(1, 'session_id is required'),
  sender: z.enum(['AI', 'PATIENT', 'DOCTOR']),
  message: z.string().min(1, 'message is required'),
  message_type: z.enum(['TEXT', 'VOICE']).optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/', validate({ body: postMessageSchema }), postMessage);
router.get('/:sessionId', getSessionMessages);

export default router;
