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

    // Strict Authorization: If logged in as PATIENT, strictly enforce own ID
    if (req.user?.role === 'PATIENT') {
      patientId = req.user.patient_id || req.user.id;
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
      patientId = req.user.patient_id || req.user.id;
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
    const { id } = req.params;
    const updated = await patientNotificationRepository.markAsRead(id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Notification marked as read', updated);
  } catch (error) {
    next(error);
  }
};

export const updateJourneyStep = async (req, res, next) => {
  try {
    let patientId = req.body.patient_id || req.body.patientId || req.query.patientId;
    if (req.user?.role === 'PATIENT') {
      patientId = req.user.patient_id || req.user.id;
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

export default {
  getPatientDashboard,
  recordPatientVitals,
  getPatientAppointments,
  createPatientAppointment,
  getPatientNotifications,
  markNotificationRead,
};
