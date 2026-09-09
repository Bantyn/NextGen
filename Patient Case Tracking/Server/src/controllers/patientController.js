import { patientService } from '../services/patientService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Patient Controller — Thin HTTP Request/Response Handlers
 */
export const createPatient = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Patient created successfully', patient);
  } catch (error) {
    next(error);
  }
};

export const searchPatients = async (req, res, next) => {
  try {
    const { patients, meta } = await patientService.searchPatients(req.query);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patients retrieved successfully', patients, meta);
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patient retrieved successfully', patient);
  } catch (error) {
    next(error);
  }
};

export const attachIdentity = async (req, res, next) => {
  try {
    const identity = await patientService.attachIdentity(req.params.id, req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Patient identity linked successfully', identity);
  } catch (error) {
    next(error);
  }
};

export default {
  createPatient,
  searchPatients,
  getPatientById,
  attachIdentity,
};
