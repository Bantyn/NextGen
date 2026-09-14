/**
 * doctorDashboardDummyData.js
 * 
 * Cleaned Clinical Data Contracts for Sehat / MediKiosk Doctor Workspace.
 * Hardcoded mock dummy records have been completely cleared.
 * All real patient data, clinical queues, triage alerts, and consultations
 * are dynamically streamed from the live backend API (/api/v1/doctor/*).
 */

/**
 * Initial clean zero-state statistics for the OPD triage dashboard
 */
export const initialDashboardStats = {
  totalOPD: 0,
  awaitingReview: 0,
  emergencyTriage: 0,
  completedToday: 0,
  averageWaitMins: 0,
};

/**
 * Cleaned empty patients collection.
 * Real cases are loaded dynamically from /api/v1/doctor/queue.
 */
export const dummyPatients = [];

/**
 * Clean baseline template for a clinical encounter case
 */
export const getEmptyPatientTemplate = () => ({
  id: '',
  sessionId: '',
  token: 'TK-000',
  patientName: 'Patient',
  age: 0,
  gender: 'Unknown',
  phone: '',
  abhaId: '',
  language: 'gu-IN',
  chiefComplaint: 'Clinical consultation inquiry',
  checkinTime: '',
  triageLevel: 'NORMAL',
  triage: 'standard',
  status: 'CHECKED_IN',
  consultationStatus: 'pending',
  docsCount: 0,
  opdMode: 'General OPD',
  room: 'OPD Room 101',
  history: {
    chiefComplaint: '',
    hpi: {
      site: '',
      onset: '',
      character: '',
      radiation: '',
      associated: '',
      timing: '',
      exacerbating: '',
      relieving: '',
      severity: '',
    },
    duration: '',
    severity: '',
    associatedSymptoms: '',
    pastMedicalHistory: '',
    pastSurgicalHistory: '',
    medicationHistory: '',
    allergyHistory: '',
    familyHistory: '',
  },
  aiSummary: {
    clinicalImpression: '',
    recommendedWorkup: [],
    redFlagConcerns: [],
    ayushCorrelation: '',
  },
  reports: [],
});

export default {
  initialDashboardStats,
  dummyPatients,
  getEmptyPatientTemplate,
};
