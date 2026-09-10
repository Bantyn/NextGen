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
};

export default API_ENDPOINTS;

