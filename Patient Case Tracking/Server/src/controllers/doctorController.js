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

// 11. Live OPD Kanban Pipeline
export async function handleGetDoctorPipeline(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { search, filter } = req.query;
    const data = await doctorPanelService.getDoctorOPDPipeline(doctorId, { search, filter });
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor OPD pipeline retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateCaseWorkflowStatus(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { caseId } = req.params;
    const { status } = req.body;
    const data = await doctorPanelService.updateCaseWorkflowStatus(caseId, status, doctorId, req.user?.id);
    return sendSuccess(res, HTTP_STATUS.OK, `Case status updated to ${status}`, data);
  } catch (err) {
    next(err);
  }
}

// 12. Doctor Appointments Workspace
export async function handleGetDoctorAppointments(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { tab, search } = req.query;
    const data = await doctorPanelService.getDoctorAppointments(doctorId, { tab, search });
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor appointments retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleCreateDoctorAppointment(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.createDoctorAppointment(doctorId, req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'Appointment scheduled successfully', data);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateAppointmentStatus(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { id } = req.params;
    const { status } = req.body;
    const data = await doctorPanelService.updateAppointmentStatus(doctorId, id, status);
    return sendSuccess(res, HTTP_STATUS.OK, 'Appointment status updated', data);
  } catch (err) {
    next(err);
  }
}

// 13. Doctor Patients Directory & Dossier
export async function handleGetDoctorPatients(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { search, page, limit } = req.query;
    const data = await doctorPanelService.getDoctorPatients(doctorId, { search, page, limit });
    return sendSuccess(res, HTTP_STATUS.OK, 'Patients directory retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetPatientClinicalProfile(req, res, next) {
  try {
    const { patientId } = req.params;
    const data = await doctorPanelService.getPatientClinicalProfile(patientId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patient clinical dossier retrieved', data);
  } catch (err) {
    next(err);
  }
}

// 14. Doctor Consultations
export async function handleGetDoctorConsultations(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { tab, search } = req.query;
    const data = await doctorPanelService.getDoctorConsultations(doctorId, { tab, search });
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor consultations retrieved', data);
  } catch (err) {
    next(err);
  }
}

// 15. Medical Reports
export async function handleGetDoctorReports(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { search } = req.query;
    const data = await doctorPanelService.getDoctorReports(doctorId, { search });
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor diagnostic reports retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleVerifyDoctorReport(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { id } = req.params;
    const data = await doctorPanelService.verifyDoctorReport(id, doctorId, req.body);
    return sendSuccess(res, HTTP_STATUS.OK, 'Report verified successfully', data);
  } catch (err) {
    next(err);
  }
}

// 16. Doctor Notifications
export async function handleGetDoctorNotifications(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.getDoctorNotifications(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor notifications retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleMarkDoctorNotificationRead(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const { id } = req.params;
    const data = await doctorPanelService.markDoctorNotificationAsRead(id, doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Notification marked as read', data);
  } catch (err) {
    next(err);
  }
}

// 17. Doctor Profile & Settings
export async function handleGetDoctorProfile(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.getDoctorProfile(doctorId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor profile retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateDoctorProfile(req, res, next) {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id || 'DOC-MED-01';
    const data = await doctorPanelService.updateDoctorProfile(doctorId, req.body);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor profile updated', data);
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
  handleGetDoctorPipeline,
  handleUpdateCaseWorkflowStatus,
  handleGetDoctorAppointments,
  handleCreateDoctorAppointment,
  handleUpdateAppointmentStatus,
  handleGetDoctorPatients,
  handleGetPatientClinicalProfile,
  handleGetDoctorConsultations,
  handleGetDoctorReports,
  handleVerifyDoctorReport,
  handleGetDoctorNotifications,
  handleMarkDoctorNotificationRead,
  handleGetDoctorProfile,
  handleUpdateDoctorProfile,
};
