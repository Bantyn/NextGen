import express from 'express';
import {
  handleAuthCheck,
  handleGetAuthorizedRecords,
  handleTriageAlert,
  handleSendRegistrationSuccess,
} from '../controllers/whatsappController.js';

const router = express.Router();

// 1. Patient identity, session & DPDP consent verification
router.post('/auth-check', handleAuthCheck);

// 2. Consent-gated authorized medical records retrieval
router.post('/authorized-records', handleGetAuthorizedRecords);

// 3. Emergency & red-flag triage alert logging
router.post('/triage-alert', handleTriageAlert);

// 4. Patient registration & OPD check-in success notification with token & status url
router.post('/send-registration-success', handleSendRegistrationSuccess);

export default router;
