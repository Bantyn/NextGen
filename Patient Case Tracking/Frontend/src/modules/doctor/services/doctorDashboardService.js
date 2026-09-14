/**
 * doctorDashboardService.js
 * 
 * Production Clinical Data-Access Layer for Doctor Workspace.
 * Interacts with live backend endpoints under /api/v1/doctor and /api/v1/clinical-cases,
 * with structured in-memory fallback for offline/local resilience.
 */

import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  initialDashboardStats,
  dummyPatients,
} from '../../../data/doctorDashboardDummyData';

// Local mutable in-memory cache
let memoryPatients = [];
let memoryStats = null;
const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener({ patients: [...memoryPatients], stats: memoryStats ? { ...memoryStats } : null });
    } catch (err) {
      console.error('Error notifying doctor service listener:', err);
    }
  });
};

/**
 * Subscribe to real-time doctor dashboard updates
 */
export function subscribeDoctorDashboard(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * 1. Fetch high-level OPD intake & triage metrics from live backend
 */
export async function getDashboardStats() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_DASHBOARD);
    if (res?.data) {
      memoryStats = res.data;
      return res.data;
    }
  } catch (err) {
    console.warn('[DoctorService] Live stats fetch failed, using fallback:', err.message);
  }

  if (memoryStats) return memoryStats;

  return {
    ...initialDashboardStats,
  };
}

/**
 * 2. Fetch live patient queue list from backend
 */
export async function getPatients(filters = {}) {
  try {
    const query = new URLSearchParams({
      tab: filters.tab || 'ALL',
      search: filters.search || '',
    }).toString();

    const res = await apiClient.get(`${API_ENDPOINTS.DOCTOR_QUEUE}?${query}`);
    if (res?.data && Array.isArray(res.data)) {
      memoryPatients = res.data;
      return res.data;
    }
  } catch (err) {
    console.warn('[DoctorService] Fetching live queue from backend failed:', err.message);
  }

  // Fallback to local memory if backend is unreachable
  if (memoryPatients && memoryPatients.length > 0) {
    let result = [...memoryPatients];
    if (filters.tab && filters.tab !== 'ALL') {
      if (filters.tab === 'PENDING') {
        result = result.filter((p) => p.status === 'PENDING_REVIEW');
      } else if (filters.tab === 'RED_FLAG' || filters.tab === 'triage') {
        result = result.filter((p) => p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag');
      } else if (filters.tab === 'APPROVED' || filters.tab === 'COMPLETED' || filters.tab === 'archive') {
        result = result.filter((p) => p.status === 'APPROVED' || p.status === 'COMPLETED');
      }
    }
    return result;
  }

  // Offline demo fallback only if database completely empty or unreachable
  let result = [...dummyPatients];
  if (filters.tab && filters.tab !== 'ALL') {
    if (filters.tab === 'PENDING') {
      result = result.filter((p) => p.status === 'PENDING_REVIEW');
    } else if (filters.tab === 'RED_FLAG' || filters.tab === 'triage') {
      result = result.filter((p) => p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag');
    } else if (filters.tab === 'APPROVED' || filters.tab === 'COMPLETED' || filters.tab === 'archive') {
      result = result.filter((p) => p.status === 'APPROVED' || p.status === 'COMPLETED');
    }
  }
  return result;
}

/**
 * 3. Fetch an individual patient record & clinical case workspace bundle from live backend
 */
export async function getPatientById(identifier) {
  if (!identifier) return memoryPatients[0] || null;

  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_CASE_BUNDLE(identifier));
    if (res?.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('[DoctorService] Backend case bundle fetch failed:', err.message);
  }

  const found = memoryPatients.find(
    (p) => p.sessionId === identifier || p.id === identifier || p.token?.toLowerCase() === identifier.toLowerCase()
  );

  return found || null;
}

/**
 * 4. Get the next waiting patient for consultation ("Call Next" button)
 */
export async function getNextWaitingPatient() {
  const patients = await getPatients({ tab: 'PENDING' });

  // Prioritize red-flag emergency first, then standard pending cases
  const redFlag = patients.find(
    (p) => (p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag') && p.status === 'PENDING_REVIEW'
  );
  if (redFlag) return redFlag;

  const nextWaiting = patients.find((p) => p.status === 'PENDING_REVIEW');
  return nextWaiting || patients[0] || null;
}

/**
 * 5. Save clinical notes & assessment
 */
export async function saveConsultationNotes(sessionId, encounterData) {
  try {
    const res = await apiClient.post(API_ENDPOINTS.DOCTOR_CONSULTATION_NOTES(sessionId), encounterData);
    return res.data;
  } catch (err) {
    console.warn('[DoctorService] Save notes failed:', err.message);
  }
}

/**
 * 6. Save structured physician prescription
 */
export async function savePrescription(sessionId, medicines = []) {
  try {
    const res = await apiClient.post(API_ENDPOINTS.DOCTOR_PRESCRIBE(sessionId), { medicines });
    return res.data;
  } catch (err) {
    console.warn('[DoctorService] Save prescription failed:', err.message);
  }
}

/**
 * 7. Complete & digitally sign consultation encounter
 */
export async function updatePatientStatus(sessionId, status, doctorRxNotes, prescriptions = []) {
  try {
    const res = await apiClient.post(API_ENDPOINTS.DOCTOR_COMPLETE(sessionId), {
      status,
      doctorRxNotes,
      prescriptions,
    });
    if (res?.data) {
      notifyListeners();
      return res.data;
    }
  } catch (err) {
    console.warn('[DoctorService] Complete encounter failed on backend, updating local state:', err.message);
  }

  // Local fallback
  let updatedPatient = null;
  memoryPatients = memoryPatients.map((p) => {
    if (p.sessionId === sessionId || p.id === sessionId) {
      updatedPatient = {
        ...p,
        status: status || p.status,
        consultationStatus: status === 'COMPLETED' || status === 'APPROVED' ? 'completed' : 'in_progress',
        doctorRxNotes: doctorRxNotes !== undefined ? doctorRxNotes : p.doctorRxNotes,
      };
      return updatedPatient;
    }
    return p;
  });

  notifyListeners();
  return updatedPatient;
}

/**
 * 8. Emergency Red-Flag Broadcast Alerts
 */
export async function getEmergencyAlerts() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.CLINICAL_CASES_EMERGENCY);
    return res?.data?.active_alerts || [];
  } catch (err) {
    console.warn('[DoctorService] Emergency alerts query failed:', err.message);
    return [];
  }
}

export async function acceptEmergencyCase(caseId) {
  return apiClient.post(API_ENDPOINTS.CLINICAL_CASE_ACCEPT(caseId));
}

export async function declineEmergencyCase(caseId, reason = '') {
  return apiClient.post(API_ENDPOINTS.CLINICAL_CASE_DECLINE(caseId), { reason });
}

export async function transferCase(caseId, toDoctorId, reason) {
  return apiClient.post(API_ENDPOINTS.CLINICAL_CASE_TRANSFER(caseId), {
    to_doctor_id: toDoctorId,
    reason,
  });
}

/**
 * 9. Prescription Templates CRUD
 */
export async function getPrescriptionTemplates() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_TEMPLATES);
    return res?.data || [];
  } catch (err) {
    console.warn('[DoctorService] Fetching templates failed:', err.message);
    return [];
  }
}

export async function savePrescriptionTemplate(templateData) {
  return apiClient.post(API_ENDPOINTS.DOCTOR_TEMPLATES, templateData);
}

export async function deletePrescriptionTemplate(templateId) {
  return apiClient.delete(API_ENDPOINTS.DOCTOR_TEMPLATE_BY_ID(templateId));
}

/**
 * 10. Doctor Availability & On-Duty State
 */
export async function updateDoctorAvailability(updates) {
  return apiClient.patch(API_ENDPOINTS.DOCTOR_AVAILABILITY, updates);
}

/**
 * 11. Clinical Analytics Telemetry
 */
export async function getDoctorAnalytics() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_ANALYTICS);
    return res?.data;
  } catch (err) {
    console.warn('[DoctorService] Analytics fetch failed:', err.message);
    return null;
  }
}

/**
 * 12. Fetch eligible colleagues for clinical case transfer
 */
export async function getEligibleColleagues() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_COLLEAGUES);
    if (res?.data && res.data.length > 0) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching colleagues failed, using local roster:', err.message);
  }

  return [
    { doctor_id: 'DOC-CARD-01', doctor_name: 'Dr. Arvind Joshi', specialty: 'Cardiology', room: 'Room 305' },
    { doctor_id: 'DOC-MED-01', doctor_name: 'Dr. Priya Sharma', specialty: 'General Medicine', room: 'Room 102' },
    { doctor_id: 'DOC-PULM-01', doctor_name: 'Dr. Vikram Patel', specialty: 'Pulmonology', room: 'Room 208' },
    { doctor_id: 'DOC-NEUR-01', doctor_name: 'Dr. Sanjay Mehta', specialty: 'Neurology', room: 'Room 401' },
    { doctor_id: 'DOC-DERM-01', doctor_name: 'Dr. Ananya Sen', specialty: 'Dermatology', room: 'Room 204' },
    { doctor_id: 'DOC-AYUSH-01', doctor_name: 'Dr. Rajesh Varma', specialty: 'Ayush Kayachikitsa', room: 'Room 110' },
  ];
}

/**
 * Reset / refresh queue to initial baseline
 */
export async function resetQueue() {
  memoryPatients = [...dummyPatients];
  memoryStats = { ...initialDashboardStats };
  notifyListeners();
  return memoryPatients;
}

/**
 * 13. Live OPD Kanban Pipeline (7 Stages with Drag and Drop)
 */
export async function getDoctorPipeline(search = '', filter = 'ALL') {
  try {
    const query = new URLSearchParams({ search, filter }).toString();
    const res = await apiClient.get(`${API_ENDPOINTS.DOCTOR_PIPELINE}?${query}`);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching pipeline failed:', err.message);
  }
  return {
    pipeline: { registered: [], waiting: [], ai_intake: [], triage: [], consultation: [], prescription: [], completed: [] },
    counts: { all: 0, registered: 0, waiting: 0, ai_intake: 0, triage: 0, consultation: 0, prescription: 0, completed: 0, priority: 0 },
  };
}

export async function updateCaseWorkflowStatus(caseId, status) {
  const res = await apiClient.patch(API_ENDPOINTS.DOCTOR_CASE_STATUS(caseId), { status });
  notifyListeners();
  return res?.data;
}

/**
 * 14. Doctor Appointments Workspace
 */
export async function getDoctorAppointments(tab = 'TODAY', search = '') {
  try {
    const query = new URLSearchParams({ tab, search }).toString();
    const res = await apiClient.get(`${API_ENDPOINTS.DOCTOR_APPOINTMENTS}?${query}`);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching appointments failed:', err.message);
  }
  return { appointments: [], counts: { today: 0, upcoming: 0, completed: 0, cancelled: 0, total: 0 } };
}

export async function createDoctorAppointment(data) {
  const res = await apiClient.post(API_ENDPOINTS.DOCTOR_APPOINTMENTS, data);
  return res?.data;
}

export async function updateAppointmentStatus(id, status) {
  const res = await apiClient.patch(API_ENDPOINTS.DOCTOR_APPOINTMENT_STATUS(id), { status });
  return res?.data;
}

/**
 * 15. Doctor Patients Directory & Clinical Dossier
 */
export async function getDoctorPatients(search = '', page = 1) {
  try {
    const query = new URLSearchParams({ search, page: String(page) }).toString();
    const res = await apiClient.get(`${API_ENDPOINTS.DOCTOR_PATIENTS}?${query}`);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching patients failed:', err.message);
  }
  return { patients: [], total: 0, page: 1, limit: 50 };
}

export async function getPatientClinicalProfile(patientId) {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_PATIENT_PROFILE(patientId));
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching patient profile failed:', err.message);
  }
  return null;
}

/**
 * 16. Doctor Consultations
 */
export async function getDoctorConsultations(tab = 'ALL', search = '') {
  try {
    const query = new URLSearchParams({ tab, search }).toString();
    const res = await apiClient.get(`${API_ENDPOINTS.DOCTOR_CONSULTATIONS}?${query}`);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching consultations failed:', err.message);
  }
  return [];
}

/**
 * 17. Diagnostic Reports
 */
export async function getDoctorReports(search = '') {
  try {
    const query = new URLSearchParams({ search }).toString();
    const res = await apiClient.get(`${API_ENDPOINTS.DOCTOR_REPORTS}?${query}`);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching reports failed:', err.message);
  }
  return [];
}

export async function verifyDoctorReport(documentId, verification_notes = '') {
  const res = await apiClient.patch(API_ENDPOINTS.DOCTOR_REPORT_VERIFY(documentId), { verification_notes });
  return res?.data;
}

/**
 * 18. Notifications Center
 */
export async function getDoctorNotifications() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_NOTIFICATIONS);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching notifications failed:', err.message);
  }
  return [];
}

export async function markDoctorNotificationRead(id) {
  const res = await apiClient.patch(API_ENDPOINTS.DOCTOR_NOTIFICATION_READ(id));
  return res?.data;
}

/**
 * 19. Doctor Profile & Settings
 */
export async function getDoctorProfile() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.DOCTOR_PROFILE);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[DoctorService] Fetching doctor profile failed:', err.message);
  }
  return null;
}

export async function updateDoctorProfile(data) {
  const res = await apiClient.patch(API_ENDPOINTS.DOCTOR_PROFILE, data);
  return res?.data;
}

export default {
  getDashboardStats,
  getPatients,
  getPatientById,
  getNextWaitingPatient,
  saveConsultationNotes,
  savePrescription,
  updatePatientStatus,
  getEmergencyAlerts,
  acceptEmergencyCase,
  declineEmergencyCase,
  transferCase,
  getEligibleColleagues,
  getPrescriptionTemplates,
  savePrescriptionTemplate,
  deletePrescriptionTemplate,
  updateDoctorAvailability,
  getDoctorAnalytics,
  subscribeDoctorDashboard,
  resetQueue,
  getDoctorPipeline,
  updateCaseWorkflowStatus,
  getDoctorAppointments,
  createDoctorAppointment,
  updateAppointmentStatus,
  getDoctorPatients,
  getPatientClinicalProfile,
  getDoctorConsultations,
  getDoctorReports,
  verifyDoctorReport,
  getDoctorNotifications,
  markDoctorNotificationRead,
  getDoctorProfile,
  updateDoctorProfile,
};
