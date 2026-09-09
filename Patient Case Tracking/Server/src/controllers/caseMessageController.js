import { caseMessageService } from '../services/caseMessageService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Case Message Controller — Thin HTTP Request/Response Handlers
 */
export const postMessage = async (req, res, next) => {
  try {
    const message = await caseMessageService.postMessage(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Message posted successfully', message);
  } catch (error) {
    next(error);
  }
};

export const getSessionMessages = async (req, res, next) => {
  try {
    const messages = await caseMessageService.getSessionMessages(req.params.sessionId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Session dialogue messages retrieved', messages);
  } catch (error) {
    next(error);
  }
};

export default {
  postMessage,
  getSessionMessages,
};
