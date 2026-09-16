import { patientDashboardService } from '../services/patientDashboardService.js';
import { patientNotificationRepository } from '../repositories/patientNotificationRepository.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { logger } from '../utils/logger.js';

export const getPatientDashboard = async (req, res, next) => {
  try {
    let patientId = null;

    // Authorization: If logged in as PATIENT, enforce identity ownership
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      const requestedId = (req.params.id || req.query.patient_id || req.query.patientId || '').toUpperCase();

      if (requestedId && ownId && requestedId !== ownId) {
        // Verify if requestedId belongs to the same patient via phone, identity or alias
        const isSamePatient = await patientDashboardService.verifyPatientOwnership(ownId, requestedId);
        if (!isSamePatient) {
          throw ApiError.forbidden("Access denied: You are not authorized to view another patient's medical records.", 'FORBIDDEN_ACCESS');
        }
      }
      patientId = requestedId || ownId;
    } else {
      // Staff / Doctor / Admin / Dev Kiosk mode allows passing patient_id
      patientId = req.params.id || req.query.patient_id || req.query.patientId || req.user?.patient_id || req.user?.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Patient identification is required to load dashboard. Please provide patient_id or log in.',
      });
    }

    const dashboard = await patientDashboardService.getDashboardData(patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patient dashboard loaded successfully', dashboard);
  } catch (error) {
    logger.error('[PatientDashboardController] Error: ' + error.message);
    next(error);
  }
};

export const recordPatientVitals = async (req, res, next) => {
  try {
    let patientId = req.body.patient_id || req.body.patientId;
    if (req.user?.role === 'PATIENT') {
      throw ApiError.forbidden(
        'Access denied: Patients are not permitted to record clinical vitals. Vitals must be recorded by authorized clinical triage or attending physicians.',
        'PATIENT_OPERATION_NOT_ALLOWED'
      );
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to record vitals.',
      });
    }

    const recordedBy = req.user?.role || 'PATIENT';
    const record = await patientDashboardService.recordVitals(patientId, req.body, recordedBy);

    return sendSuccess(res, HTTP_STATUS.CREATED, 'Vitals recorded successfully', record);
  } catch (error) {
    logger.error('[RecordVitalsController] Error: ' + error.message);
    next(error);
  }
};

export const getPatientAppointments = async (req, res, next) => {
  try {
    let patientId = req.params.id || req.query.patient_id || req.query.patientId;
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      if (patientId && patientId.toUpperCase() !== ownId) {
        throw ApiError.forbidden("Access denied: You cannot access another patient's appointments.", 'FORBIDDEN_ACCESS');
      }
      patientId = req.user.patient_id || req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to fetch appointments.',
      });
    }

    const appointments = await appointmentRepository.findByPatientId(patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Appointments retrieved successfully', appointments);
  } catch (error) {
    next(error);
  }
};

export const createPatientAppointment = async (req, res, next) => {
  try {
    let patientId = req.body.patient_id || req.body.patientId;
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      if (patientId && patientId.toUpperCase() !== ownId) {
        throw ApiError.forbidden("Access denied: You cannot book an appointment for another patient.", 'FORBIDDEN_ACCESS');
      }
      patientId = req.user.patient_id || req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to schedule an appointment.',
      });
    }

    const apt = await patientDashboardService.bookAppointment(patientId, req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Appointment scheduled successfully', apt);
  } catch (error) {
    next(error);
  }
};

export const getPatientNotifications = async (req, res, next) => {
  try {
    let patientId = req.params.id || req.query.patient_id || req.query.patientId;
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      if (patientId && patientId.toUpperCase() !== ownId) {
        throw ApiError.forbidden("Access denied: You cannot view another patient's notifications.", 'FORBIDDEN_ACCESS');
      }
      patientId = req.user.patient_id || req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to fetch notifications.',
      });
    }

    const notifs = await patientNotificationRepository.findByPatientId(patientId);
    const unread = await patientNotificationRepository.countUnreadByPatientId(patientId);

    return sendSuccess(res, HTTP_STATUS.OK, 'Notifications retrieved successfully', {
      unreadCount: unread,
      items: notifs,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notifId = req.params.id;
    const notif = await patientNotificationRepository.markAsRead(notifId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Notification marked as read', notif);
  } catch (error) {
    next(error);
  }
};

export const updateJourneyStep = async (req, res, next) => {
  try {
    let patientId = req.body.patient_id || req.body.patientId || req.query.patientId;
    if (req.user?.role === 'PATIENT') {
      throw ApiError.forbidden(
        'Access denied: Patients are not permitted to advance or modify OPD journey stages. Stage transitions must be authorized by attending doctors or clinical staff.',
        'PATIENT_OPERATION_NOT_ALLOWED'
      );
    }

    const { stageKey, sessionId } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to update journey status.',
      });
    }

    if (!stageKey) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'stageKey is required (e.g. CHECKED_IN, VITALS_TAKEN, IN_CONSULTATION, LAB_PENDING, COMPLETED).',
      });
    }

    const bundle = await patientDashboardService.updatePatientJourneyStage(patientId, stageKey, sessionId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Live OPD journey status updated successfully', bundle);
  } catch (error) {
    next(error);
  }
};

/**
 * Start a new clinical intake encounter for a logged-in patient without creating a new patient identity
 */
export const createPatientEncounter = async (req, res, next) => {
  try {
    let patientId = req.body.patient_id || req.body.patientId;
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      if (patientId && patientId.toUpperCase() !== ownId) {
        throw ApiError.forbidden("Access denied: You cannot create an encounter for another patient.", 'FORBIDDEN_ACCESS');
      }
      patientId = req.user.patient_id || req.user.id;
    } else if (!patientId && req.user) {
      patientId = req.user.patient_id || req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to start a new clinical encounter.',
      });
    }

    const encounter = await patientDashboardService.createEncounter(patientId, req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Clinical encounter created successfully', encounter);
  } catch (error) {
    logger.error('[CreatePatientEncounterController] Error: ' + error.message);
    next(error);
  }
};

/**
 * Retrieve all clinical encounters for a patient (Encounter / Intake History)
 */
export const getPatientEncounters = async (req, res, next) => {
  try {
    let patientId = req.params.id || req.query.patient_id || req.query.patientId;
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      if (patientId && patientId.toUpperCase() !== ownId) {
        throw ApiError.forbidden("Access denied: You cannot view another patient's encounters.", 'FORBIDDEN_ACCESS');
      }
      patientId = req.user.patient_id || req.user.id;
    } else if (!patientId && req.user) {
      patientId = req.user.patient_id || req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to retrieve clinical encounters.',
      });
    }

    const encounters = await patientDashboardService.getPatientEncounters(patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Clinical encounters retrieved successfully', encounters);
  } catch (error) {
    logger.error('[GetPatientEncountersController] Error: ' + error.message);
    next(error);
  }
};

/**
 * Retrieve full details of a specific clinical encounter
 */
export const getPatientEncounterById = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const patientId = req.user?.role === 'PATIENT' ? (req.user.patient_id || req.user.id) : null;
    const details = await patientDashboardService.getEncounterById(sessionId, patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Clinical encounter details retrieved successfully', details);
  } catch (error) {
    logger.error('[GetPatientEncounterByIdController] Error: ' + error.message);
    next(error);
  }
};

/**
 * Add a self-reported or clinically documented medical condition or allergy
 */
export const addPatientMedicalHistory = async (req, res, next) => {
  try {
    let patientId = req.params.id || req.body.patient_id || req.body.patientId;
    if (req.user?.role === 'PATIENT') {
      const ownId = (req.user.patient_id || req.user.id || '').toUpperCase();
      if (patientId && patientId.toUpperCase() !== ownId) {
        throw ApiError.forbidden('Access denied: You cannot modify another patient records.', 'FORBIDDEN_ACCESS');
      }
      patientId = req.user.patient_id || req.user.id;
    } else if (!patientId && req.user) {
      patientId = req.user.patient_id || req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'patient_id is required to update medical history.',
      });
    }

    const updatedDashboard = await patientDashboardService.addMedicalHistory(patientId, req.body);
    return sendSuccess(res, HTTP_STATUS.OK, 'Medical history updated successfully', updatedDashboard);
  } catch (error) {
    logger.error('[AddPatientMedicalHistoryController] Error: ' + error.message);
    next(error);
  }
};

export const getAvailableDoctors = async (req, res, next) => {
  try {
    const doctors = await patientDashboardService.getAvailableDoctorsForBooking(req.query);
    return sendSuccess(res, HTTP_STATUS.OK, 'Available doctors retrieved successfully', doctors);
  } catch (error) {
    logger.error('[GetAvailableDoctorsController] Error: ' + error.message);
    next(error);
  }
};

export const recommendDoctor = async (req, res, next) => {
  try {
    const patientId = req.user?.patient_id || req.user?.id || req.body.patient_id;
    const { symptoms, opdType } = req.body;
    
    if (!symptoms) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'error',
        message: 'Symptoms are required',
      });
    }

    const recommendation = await patientDashboardService.recommendDoctor(patientId, { symptoms, opdType });
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor recommendation retrieved successfully', recommendation);
  } catch (error) {
    logger.error('[RecommendDoctorController] Error: ' + error.message);
    next(error);
  }
};

export default {
  getPatientDashboard,
  recordPatientVitals,
  getPatientAppointments,
  createPatientAppointment,
  getPatientNotifications,
  markNotificationRead,
  updateJourneyStep,
  createPatientEncounter,
  getPatientEncounters,
  getPatientEncounterById,
  addPatientMedicalHistory,
  getAvailableDoctors,
  recommendDoctor,
};
