import express from 'express';
import { handleIntakeChat } from '../controllers/intakeController.js';

const router = express.Router();

/**
 * POST /api/v1/intake/chat
 * Multi-turn adaptive conversational clinical history intake with red-flag detection
 */
router.post('/chat', handleIntakeChat);

export default router;
