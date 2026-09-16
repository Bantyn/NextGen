/**
 * Centralized API Endpoint Constants
 * Matching Documentation/api_doc.md specifications
 */

export const API_ENDPOINTS = {
  // Health & Diagnostics
  HEALTH: '/health',

  // Authentication & Users
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_ME: '/auth/me',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  USERS: '/users',
  USER_ROLE: (id) => `/users/${id}/role`,

  // Patient Identity & Profile
  PATIENTS: '/patients',
  PATIENT_BY_ID: (id) => `/patients/${id}`,
  PATIENT_IDENTITIES: (id) => `/patients/${id}/identities`,
  PATIENT_DASHBOARD: (id) => id ? `/patient/dashboard?patient_id=${id}` : '/patient/dashboard',
  PATIENT_VITALS: '/patient/vitals',
  PATIENT_APPOINTMENTS: (id) => id ? `/patient/appointments?patient_id=${id}` : '/patient/appointments',
  PATIENT_NOTIFICATIONS: (id) => id ? `/patient/notifications?patient_id=${id}` : '/patient/notifications',
  PATIENT_NOTIFICATION_READ: (id) => `/patient/notifications/${id}/read`,
  PATIENT_JOURNEY_STEP: '/patient/journey-step',

  // Consent Management
  CONSENTS: '/consents',
  CONSENT_BY_PATIENT: (patientId) => `/consents/${patientId}`,

  // Clinical Sessions
  SESSIONS: '/sessions',
  SESSION_BY_ID: (id) => `/sessions/${id}`,
  SESSION_STATUS: (id) => `/sessions/${id}/status`,
  SESSIONS_ACTIVE: '/sessions/active',

  // Dialogue & AI Case Taking
  CASE_MESSAGES: '/case-messages',
  CASE_MESSAGES_BY_SESSION: (sessionId) => `/case-messages/${sessionId}`,

  // Clinical Observations
  OBSERVATIONS: '/observations',
  OBSERVATIONS_BY_SESSION: (sessionId) => `/observations/${sessionId}`,

  // Documents & OCR
  DOCUMENTS_UPLOAD: '/documents/upload',
  DOCUMENTS_BY_PATIENT: (patientId) => `/documents/patient/${patientId}`,
  DOCUMENTS_BY_SESSION: (sessionId) => `/documents/${sessionId}`,
  DOCUMENTS_OCR: (id) => `/documents/${id}/ocr`,

  // Records & Doctor Sign-off
  RECORDS_GENERATE: '/records/generate',
  RECORD_BY_ID: (id) => `/records/${id}`,
  RECORD_REVIEW: (id) => `/records/${id}/review`,
  RECORDS_BY_PATIENT: (patientId) => `/records/patient/${patientId}`,

  // Admin Operational & Configuration Endpoints
  ADMIN_DASHBOARD_KPIS: '/admin/dashboard/kpis',
  ADMIN_OPERATIONS_LIVE: '/admin/operations/live',
  ADMIN_PATIENTS: '/admin/patients',
  ADMIN_TRIAGE_REDFLAGS: '/admin/triage/redflags',
  ADMIN_TRIAGE_RESOLVE: (id) => `/admin/triage/redflags/${id}/resolve`,
  ADMIN_DOCTORS: '/admin/doctors',
  ADMIN_DOCTOR_STATUS: (id) => `/admin/doctors/${id}`,
  ADMIN_QUEUE_PRIORITY: (sessionId) => `/admin/queue/${sessionId}/priority`,
  ADMIN_MEDICINES: '/admin/medicines',
  ADMIN_MEDICINE_BY_ID: (id) => `/admin/medicines/${id}`,
  ADMIN_OPENFDA_SEARCH: '/admin/medicines/openfda/search',
  ADMIN_OPENFDA_IMPORT: '/admin/medicines/openfda/import',
  ADMIN_KNOWLEDGE: (category) => `/admin/knowledge/${category}`,
  ADMIN_ASSISTANT_CONFIG: '/admin/assistant/config',
  ADMIN_SYSTEM_HEALTH: '/admin/system/health',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',

  // Doctor Clinical Workspace Endpoints
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_QUEUE: '/doctor/queue',
  DOCTOR_PIPELINE: '/doctor/pipeline',
  DOCTOR_CASE_STATUS: (id) => `/doctor/opd/cases/${id}/status`,
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  DOCTOR_APPOINTMENT_STATUS: (id) => `/doctor/appointments/${id}/status`,
  DOCTOR_PATIENTS: '/doctor/patients',
  DOCTOR_PATIENT_PROFILE: (id) => `/doctor/patients/${id}/profile`,
  DOCTOR_CONSULTATIONS: '/doctor/consultations',
  DOCTOR_REPORTS: '/doctor/reports',
  DOCTOR_REPORT_VERIFY: (id) => `/doctor/reports/${id}/verify`,
  DOCTOR_NOTIFICATIONS: '/doctor/notifications',
  DOCTOR_NOTIFICATION_READ: (id) => `/doctor/notifications/${id}/read`,
  DOCTOR_PROFILE: '/doctor/profile',
  DOCTOR_CASE_BUNDLE: (id) => `/doctor/cases/${id}`,
  DOCTOR_CONSULTATION_NOTES: (id) => `/doctor/cases/${id}/notes`,
  DOCTOR_PRESCRIBE: (id) => `/doctor/cases/${id}/prescribe`,
  DOCTOR_COMPLETE: (id) => `/doctor/cases/${id}/complete`,
  DOCTOR_AVAILABILITY: '/doctor/availability',
  DOCTOR_TEMPLATES: '/doctor/templates',
  DOCTOR_TEMPLATE_BY_ID: (id) => `/doctor/templates/${id}`,
  DOCTOR_ANALYTICS: '/doctor/analytics',
  DOCTOR_COLLEAGUES: '/doctor/colleagues',

  // Clinical Red-Flag Case Alert & Handoff Endpoints
  CLINICAL_CASES_EMERGENCY: '/clinical-cases/emergency',
  CLINICAL_CASE_ACCEPT: (id) => `/clinical-cases/${id}/accept`,
  CLINICAL_CASE_DECLINE: (id) => `/clinical-cases/${id}/decline`,
  CLINICAL_CASE_TRANSFER: (id) => `/clinical-cases/${id}/transfer`,
};

export default API_ENDPOINTS;


