import express from 'express';
import {
  handleAuthCheck,
  handleGetAuthorizedRecords,
  handleTriageAlert,
} from '../controllers/whatsappController.js';

const router = express.Router();

// 1. Patient identity, session & DPDP consent verification
router.post('/auth-check', handleAuthCheck);

// 2. Consent-gated authorized medical records retrieval
router.post('/authorized-records', handleGetAuthorizedRecords);

// 3. Emergency & red-flag triage alert logging
router.post('/triage-alert', handleTriageAlert);

export default router;
