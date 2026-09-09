import { recordService } from '../services/recordService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Clinical Record Controller — Thin HTTP Request/Response Handlers
 */
export const generateRecord = async (req, res, next) => {
  try {
    const record = await recordService.generateDraftRecord(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Draft SOAP clinical record synthesized', record);
  } catch (error) {
    next(error);
  }
};

export const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Clinical record retrieved successfully', record);
  } catch (error) {
    next(error);
  }
};

export const reviewRecord = async (req, res, next) => {
  try {
    const reviewData = {
      ...req.body,
      reviewed_by: req.user?.id || req.body.reviewed_by,
    };
    const record = await recordService.reviewRecord(req.params.id, reviewData);
    return sendSuccess(res, HTTP_STATUS.OK, 'Clinical record review finalized', record);
  } catch (error) {
    next(error);
  }
};

export const getPatientHistory = async (req, res, next) => {
  try {
    const { records, meta } = await recordService.getPatientRecordHistory(req.params.patientId, req.query);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patient clinical record history retrieved', records, meta);
  } catch (error) {
    next(error);
  }
};

export default {
  generateRecord,
  getRecordById,
  reviewRecord,
  getPatientHistory,
};
