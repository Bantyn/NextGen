import { sessionService } from '../services/sessionService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Session Controller — Thin HTTP Request/Response Handlers
 */
export const initializeSession = async (req, res, next) => {
  try {
    const session = await sessionService.initializeSession(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Clinical session initialized', session);
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Session retrieved successfully', session);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, ...extraFields } = req.body;
    const session = await sessionService.updateSessionStatus(req.params.id, status, extraFields);
    return sendSuccess(res, HTTP_STATUS.OK, 'Session status updated', session);
  } catch (error) {
    next(error);
  }
};

export const getActiveSessions = async (req, res, next) => {
  try {
    const { sessions, meta } = await sessionService.getActiveSessions(req.query);
    return sendSuccess(res, HTTP_STATUS.OK, 'Active sessions retrieved successfully', sessions, meta);
  } catch (error) {
    next(error);
  }
};

export default {
  initializeSession,
  getSessionById,
  updateStatus,
  getActiveSessions,
};
