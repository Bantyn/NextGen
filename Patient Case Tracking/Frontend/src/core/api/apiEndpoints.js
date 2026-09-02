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
};

export default API_ENDPOINTS;
