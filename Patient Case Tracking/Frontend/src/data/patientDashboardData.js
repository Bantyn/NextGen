/**
 * patientDashboardData.js
 * 
 * Clean Baseline Clinical Data Contracts for Sehat Patient Portal.
 * All dummy records and hardcoded fallback metrics have been completely cleared.
 * Genuine clinical records, ABHA credentials, diagnostic lab reports, vitals,
 * active prescriptions, and OPD status are dynamically retrieved from the live backend APIs.
 */

/**
 * Baseline contract for uninitialized or loading patient profile
 * Strict zero fake fallback values
 */
export const INITIAL_EMPTY_PATIENT = {
  id: '',
  patientId: '',
  name: '',
  firstName: '',
  lastName: '',
  gender: '',
  age: null,
  dateOfBirth: null,
  bloodGroup: '',
  phone: '',
  email: '',
  abhaId: null,
  isAbhaLinked: false,
  address: '',
  emergencyContact: null,
  opdType: 'GENERAL',
  opdSystem: 'GENERAL_MEDICINE',
  medicalSpecialization: 'General Medicine',
  opdDisplay: 'General OPD',
  registrationDate: null,
  currentStatus: null,
  currentToken: null, // Null when no active checkin exists
  health: {
    risk: null,
    lastUpdated: null,
  },
  vitals: null, // Null when no vitals have been recorded yet
  vitalsHistory: [],
  reports: [],
  documents: {
    total: 0,
    items: [],
  },
  prescriptions: [],
  consultedDoctors: [],
  allergies: [],
  chronicConditions: [],
  timeline: [],
  appointments: {
    upcoming: [],
    all: [],
  },
  notifications: {
    unreadCount: 0,
    items: [],
  },
  counters: {
    totalReports: 0,
    upcomingAppointments: 0,
    totalPrescriptions: 0,
    unreadNotifications: 0,
    completedVisits: 0,
    totalIntakes: 0,
  },
  intakes: [],
  intakeHistory: [],
  activeSession: null,
  historyOfPresentIllness: null,
  doctorNotes: null,
};

export const DUMMY_PATIENTS = [];

export default {
  INITIAL_EMPTY_PATIENT,
  DUMMY_PATIENTS,
};
