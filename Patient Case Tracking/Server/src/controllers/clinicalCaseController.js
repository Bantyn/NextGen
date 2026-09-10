import { redFlagCaseService } from '../services/redFlagCaseService.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Clinical Case Controller — Thin HTTP Request Handlers
 * Strictly enforces Decoupled 4-Tier Backend Architecture (No direct DB queries or business logic).
 */

/**
 * POST /api/v1/clinical-cases/trigger-red-flag
 * Trigger/escalate a high-priority red-flag case and broadcast to eligible doctors
 */
export async function handleTriggerRedFlag(req, res, next) {
  try {
    const {
      session_id,
      patient_id,
      category = 'CARDIOVASCULAR_EMERGENCY',
      reason,
      symptoms = [],
      clinical_state = {},
    } = req.body;

    const triageResult = {
      detected: true,
      category,
      reason: reason || 'Red flag condition identified for emergency physician routing.',
      triage_level: 'EMERGENCY',
    };

    const state = {
      ...clinical_state,
      symptoms: symptoms.length > 0 ? symptoms : clinical_state.symptoms || [category],
    };

    const result = await redFlagCaseService.triggerRedFlagCase({
      sessionId: session_id,
      patientId: patient_id,
      triageResult,
      state,
      actorId: req.user?.id || 'API_GATEWAY',
    });

    return sendSuccess(res, HTTP_STATUS.CREATED, 'Red flag emergency case created & broadcasted successfully', result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/clinical-cases/emergency
 * GET /api/v1/doctors/emergency-cases
 * Retrieve active emergency broadcasts and currently assigned cases for authenticated physician
 */
export async function handleGetDoctorEmergencyCases(req, res, next) {
  try {
    const doctorId = req.user.doctor_id || req.user.id;
    const result = await redFlagCaseService.getDoctorActiveEmergencyCases(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Active emergency cases retrieved', result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/clinical-cases/:caseId/accept
 * Atomically claim and assign an active emergency case
 */
export async function handleAcceptCase(req, res, next) {
  try {
    const { caseId } = req.params;
    const doctorId = req.user.doctor_id || req.user.id;

    const result = await redFlagCaseService.acceptCase(caseId, doctorId, req.user);

    if (!result.success && result.status === 'CASE_ALREADY_ASSIGNED') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        status: 'CASE_ALREADY_ASSIGNED',
        message: result.message,
        case_id: caseId,
      });
    }

    return sendSuccess(res, HTTP_STATUS.OK, result.message, result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/clinical-cases/:caseId/decline
 * Physician declines an emergency broadcast alert
 */
export async function handleDeclineCase(req, res, next) {
  try {
    const { caseId } = req.params;
    const doctorId = req.user.doctor_id || req.user.id;
    const { reason } = req.body;

    const result = await redFlagCaseService.declineCase(caseId, doctorId, reason);
    return sendSuccess(res, HTTP_STATUS.OK, 'Emergency case alert declined', result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/clinical-cases/:caseId
 * Retrieve complete, authorized clinical snapshot for assigned physician
 */
export async function handleGetCaseDetails(req, res, next) {
  try {
    const { caseId } = req.params;
    const doctorId = req.user.doctor_id || req.user.id;
    const userRole = req.user.role;

    const result = await redFlagCaseService.getAuthorizedCaseSnapshot(caseId, doctorId, userRole);
    return sendSuccess(res, HTTP_STATUS.OK, 'Authorized clinical case snapshot retrieved', result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/clinical-cases/:caseId/transfer
 * Transfer active case from one physician to another specialist
 */
export async function handleTransferCase(req, res, next) {
  try {
    const { caseId } = req.params;
    const fromDoctorId = req.user.doctor_id || req.user.id;
    const { to_doctor_id, reason } = req.body;
    const userRole = req.user.role;

    const result = await redFlagCaseService.transferCase({
      caseId,
      fromDoctorId,
      toDoctorId: to_doctor_id,
      reason,
      actorId: req.user.id,
      userRole,
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Emergency case transferred successfully', result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/clinical-cases/:caseId/resolve
 * Conclude emergency clinical consultation and mark case resolved
 */
export async function handleResolveCase(req, res, next) {
  try {
    const { caseId } = req.params;
    const doctorId = req.user.doctor_id || req.user.id;
    const { notes, disposition } = req.body;
    const userRole = req.user.role;

    const result = await redFlagCaseService.resolveCase({
      caseId,
      doctorId,
      notes,
      disposition,
      userRole,
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Emergency case marked as resolved', result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/clinical-cases/all
 * Administrative overview of all emergency red-flag cases
 */
export async function handleGetAllRedFlagCases(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const { cases, total } = await redFlagCaseService.getAllRedFlagCases(filter, { skip, limit });
    const meta = buildPaginationMeta(page, limit, total);

    return sendSuccess(res, HTTP_STATUS.OK, 'All red flag cases retrieved', cases, meta);
  } catch (error) {
    next(error);
  }
}

export default {
  handleTriggerRedFlag,
  handleGetDoctorEmergencyCases,
  handleAcceptCase,
  handleDeclineCase,
  handleGetCaseDetails,
  handleTransferCase,
  handleResolveCase,
  handleGetAllRedFlagCases,
};
