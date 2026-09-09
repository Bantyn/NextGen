import { observationService } from '../services/observationService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Observation Controller — Thin HTTP Request/Response Handlers
 */
export const createObservation = async (req, res, next) => {
  try {
    const observation = await observationService.createObservation(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Observation stored successfully', observation);
  } catch (error) {
    next(error);
  }
};

export const getSessionObservations = async (req, res, next) => {
  try {
    const result = await observationService.getSessionObservations(req.params.sessionId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Clinical observations retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export default {
  createObservation,
  getSessionObservations,
};
