import { patientService } from '../services/patientService.js';
import { abhaService } from '../services/abhaService.js';
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

export const checkPhone = async (req, res, next) => {
  try {
    const result = await patientService.checkPhoneAvailable(req.params.phone);
    return sendSuccess(res, HTTP_STATUS.OK, 'Phone availability check completed', result);
  } catch (error) {
    next(error);
  }
};

/**
 * ABHA Onboarding & Identity Linking Handlers
 */
export const initiateAbha = async (req, res, next) => {
  try {
    const patientId = req.user?.patient_id || req.user?.id || req.body.patient_id || req.body.patientId || req.query.patient_id || req.query.patientId;
    const { method, auth_method, identifier } = req.body;
    const result = await abhaService.initiateAbhaCreation({
      patientId,
      method: method || auth_method,
      identifier,
    });
    return sendSuccess(res, HTTP_STATUS.OK, 'ABHA creation initiated', result);
  } catch (error) {
    next(error);
  }
};

export const verifyAbhaOtp = async (req, res, next) => {
  try {
    const { txnId, otp, preferredAbhaAddress, preferred_address } = req.body;
    const result = await abhaService.verifyOtpAndGenerateAbha({
      txnId,
      otp,
      preferredAbhaAddress: preferredAbhaAddress || preferred_address,
    });
    return sendSuccess(res, HTTP_STATUS.OK, 'ABHA OTP verified successfully', result);
  } catch (error) {
    next(error);
  }
};

export const linkAbha = async (req, res, next) => {
  try {
    const patientId = req.user?.patient_id || req.user?.id || req.body.patient_id || req.body.patientId || req.query.patient_id || req.query.patientId;
    const { txnId, abhaNumber, abha_number, abhaAddress, abha_address, verification_method, metadata } = req.body;
    const result = await abhaService.linkAbhaToPatient({
      patientId,
      txnId,
      abhaNumber: abhaNumber || abha_number,
      abhaAddress: abhaAddress || abha_address,
      verificationMethod: verification_method,
      metadata,
    });
    return sendSuccess(res, HTTP_STATUS.OK, 'ABHA linked to patient successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getAbhaStatus = async (req, res, next) => {
  try {
    const patientId = req.user?.patient_id || req.user?.id || req.query.patient_id || req.query.patientId || req.params.id;
    const result = await abhaService.getAbhaLinkStatus(patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'ABHA status retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export default {
  createPatient,
  searchPatients,
  getPatientById,
  attachIdentity,
  checkPhone,
  initiateAbha,
  verifyAbhaOtp,
  linkAbha,
  getAbhaStatus,
};
