import { consentService } from '../services/consentService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Consent Controller — Thin HTTP Request/Response Handlers
 */
export const grantConsent = async (req, res, next) => {
  try {
    const consent = await consentService.grantConsent(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Consent granted successfully', consent);
  } catch (error) {
    next(error);
  }
};

export const getPatientConsents = async (req, res, next) => {
  try {
    const consents = await consentService.getPatientConsents(req.params.patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Consents retrieved successfully', consents);
  } catch (error) {
    next(error);
  }
};

export default {
  grantConsent,
  getPatientConsents,
};
