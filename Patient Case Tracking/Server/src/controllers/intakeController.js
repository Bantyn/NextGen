import { intakeService } from '../services/intakeService.js';
import { logger } from '../utils/logger.js';

/**
 * Helper exported for backward compatibility with existing unit tests
 */
export function checkDeterministicRedFlags(text, currentClinicalState = {}) {
  const result = intakeService.evaluateRedFlagAndTriage(text, currentClinicalState);
  if (result.detected) {
    return {
      detected: true,
      priority: result.priority,
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: result.category,
      reason: result.reason,
      patient_instruction: result.patient_instruction,
    };
  }
  return null;
}

/**
 * Thin HTTP Request Handler for AI Case-Taking Intake Chat Turn
 * Delegates all clinical reasoning, state tracking, and triage to intakeService.
 */
export const handleIntakeChat = async (req, res) => {
  try {
    const {
      session_id,
      patient_id,
      patient_answer,
      message,
      message_id = req.headers['x-message-id'] || null,
      turn_id = req.headers['x-turn-id'] || null,
      language = 'English',
      opd_mode = 'GENERAL',
      current_clinical_state = {},
      conversation_history = [],
    } = req.body;

    const patientText = (patient_answer || message || '').trim();

    if (!patientText) {
      return res.status(400).json({
        success: false,
        error: 'Patient input text is required.',
      });
    }

    const intakeResult = await intakeService.processIntakeTurn({
      session_id,
      patient_id,
      patient_answer: patientText,
      message: patientText,
      message_id,
      turn_id,
      language,
      opd_mode,
      current_clinical_state,
      conversation_history,
    });

    return res.status(200).json(intakeResult);
  } catch (err) {
    logger.error('[handleIntakeChat Error]: ' + err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during clinical history reasoning.',
    });
  }
};

export default { handleIntakeChat, checkDeterministicRedFlags };
