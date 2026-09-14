import { doctorPanelService } from '../services/doctorPanelService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export async function handleGetDoctorDashboard(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.getDoctorDashboardStats(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor dashboard stats retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetDoctorQueue(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { tab, search } = req.query;
    const data = await doctorPanelService.getDoctorOPDQueue(doctorId, { tab, search });
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor OPD queue retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetPatientCaseBundle(req, res, next) {
  try {
    const { sessionId } = req.params;
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const userRole = req.user?.role || 'DOCTOR';
    const data = await doctorPanelService.getPatientClinicalBundle(sessionId, doctorId, userRole);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patient clinical bundle retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleSaveConsultationNotes(req, res, next) {
  try {
    const { sessionId } = req.params;
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.saveConsultationEncounter(sessionId, doctorId, req.body, req.user?.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Consultation notes saved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleSavePrescription(req, res, next) {
  try {
    const { sessionId } = req.params;
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { medicines } = req.body;
    const data = await doctorPanelService.savePhysicianPrescription(sessionId, doctorId, medicines, req.user?.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Prescription saved to clinical record', data);
  } catch (err) {
    next(err);
  }
}

export async function handleCompleteConsultation(req, res, next) {
  try {
    const { sessionId } = req.params;
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.completeConsultationEncounter(sessionId, doctorId, req.body, req.user?.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Consultation completed and digitally signed', data);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateDoctorAvailability(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.updateDoctorAvailability(doctorId, req.body, req.user?.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor availability updated', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetPrescriptionTemplates(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.getPrescriptionTemplates(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Prescription templates retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleSavePrescriptionTemplate(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.savePrescriptionTemplate(doctorId, req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Prescription template saved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleDeletePrescriptionTemplate(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { id } = req.params;
    const data = await doctorPanelService.deletePrescriptionTemplate(doctorId, id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Prescription template deleted', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetDoctorAnalytics(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.getDoctorAnalytics(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor analytics retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetEligibleColleagues(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.getEligibleColleagues(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Eligible colleagues retrieved for clinical handoff', data);
  } catch (err) {
    next(err);
  }
}

export default {
  handleGetDoctorDashboard,
  handleGetDoctorQueue,
  handleGetPatientCaseBundle,
  handleSaveConsultationNotes,
  handleSavePrescription,
  handleCompleteConsultation,
  handleUpdateDoctorAvailability,
  handleGetPrescriptionTemplates,
  handleSavePrescriptionTemplate,
  handleDeletePrescriptionTemplate,
  handleGetDoctorAnalytics,
  handleGetEligibleColleagues,
};
