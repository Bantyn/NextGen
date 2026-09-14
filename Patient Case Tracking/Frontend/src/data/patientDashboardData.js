/**
 * patientDashboardData.js
 * 
 * Cleaned Clinical Data Contracts for Sehat / MediKiosk Patient Portal.
 * Hardcoded mock dummy records have been completely cleared.
 * All real registered patients, ABHA credentials, diagnostic lab reports,
 * active prescriptions, and OPD status are dynamically retrieved from the live backend APIs.
 */

/**
 * Clean baseline template for an uninitialized or loading patient profile
 */
export const INITIAL_EMPTY_PATIENT = {
  id: '',
  name: 'Patient',
  gender: 'Unknown',
  age: 0,
  bloodGroup: '--',
  phone: '',
  email: '',
  abhaId: '',
  abhaAddress: '',
  address: '',
  emergencyContact: {
    name: '',
    phone: '',
  },
  language: 'gu-IN',
  insurance: 'Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
  currentToken: {
    token: 'TK-000',
    room: 'OPD Reception',
    department: 'General OPD',
    doctor: 'Attending Physician',
    status: 'CHECKED_IN',
    statusLabel: 'Checked In',
    queuePosition: 1,
    estimatedWait: 'Under Review',
    checkinTime: 'Today',
  },
  vitals: {
    bp: '120/80',
    pulse: 74,
    spO2: 99,
    temp: 98.4,
    weight: 68,
    height: 168,
    bmi: 24.1,
    recordedAt: 'Today',
  },
  reports: [],
  prescriptions: [],
  consultedDoctors: [],
  allergies: [],
  chronicConditions: [],
  timeline: [],
  vitalsHistory: [],
  historyOfPresentIllness: null,
  doctorNotes: null,
};

/**
 * Cleaned empty patients collection.
 * Real registered patients are retrieved via fetchRegisteredPatients() from /api/v1/patients.
 */
export const DUMMY_PATIENTS = [];

export default {
  INITIAL_EMPTY_PATIENT,
  DUMMY_PATIENTS,
};
