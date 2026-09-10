import { whatsappService } from '../services/whatsappService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * WhatsApp Controller — Thin HTTP Request Handling & Standardized Responses
 * Follows strict Decoupled 4-Tier Backend Architecture (No Business Logic or Direct DB Queries).
 */

/**
 * POST /api/v1/whatsapp/auth-check
 * Verify patient identity, session status, and DPDP consent from incoming WhatsApp payload
 */
export async function handleAuthCheck(req, res, next) {
  try {
    const { phone, chatId, pushName } = req.body;
    const result = await whatsappService.checkPatientSessionAndConsent({
      phone,
      chatId,
      pushName,
    });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/whatsapp/authorized-records
 * Fetch authorized, consent-gated medical records for authenticated patient
 */
export async function handleGetAuthorizedRecords(req, res, next) {
  try {
    const { patient_id, phone, session_id } = req.body;
    const result = await whatsappService.getAuthorizedPatientRecords({
      patientId: patient_id,
      phone,
      sessionId: session_id,
    });

    if (!result.authorized) {
      return res.status(200).json({
        success: false,
        authorized: false,
        reason: result.reason,
        message: result.message,
        records: null,
      });
    }

    return sendSuccess(res, 200, 'Authorized medical records retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/whatsapp/triage-alert
 * Log emergency triage event and notify hospital triage dashboard
 */
export async function handleTriageAlert(req, res, next) {
  try {
    const { patient_id, session_id, reason, category, phone } = req.body;
    const result = await whatsappService.logEmergencyTriageAlert({
      patientId: patient_id,
      sessionId: session_id,
      reason,
      category,
      phone,
    });

    return sendSuccess(res, 200, 'Emergency triage alert logged', result);
  } catch (error) {
    next(error);
  }
}

export default {
  handleAuthCheck,
  handleGetAuthorizedRecords,
  handleTriageAlert,
};
