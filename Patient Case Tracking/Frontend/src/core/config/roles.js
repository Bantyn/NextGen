/**
 * MediKiosk Role Definitions & RBAC Constants
 */

export const ROLES = {
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
};

export const ROLE_CONFIGS = {
  [ROLES.DOCTOR]: {
    id: ROLES.DOCTOR,
    label: 'Physician / Doctor',
    shortLabel: 'Doctor',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'OPD Clinical Consultation, SOAP Sign-off & Rx Orders',
    defaultRoute: '/doctor',
    iconName: 'Stethoscope',
    permissions: ['VIEW_CASES', 'APPROVE_RECORDS', 'PRESCRIBE_MEDS', 'REVIEW_OBSERVATIONS'],
  },
  [ROLES.NURSE]: {
    id: ROLES.NURSE,
    label: 'Clinical Nurse',
    shortLabel: 'Nurse',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Vitals Triage, Ayush Pariksha & Observation Logs',
    defaultRoute: '/doctor',
    iconName: 'HeartPulse',
    permissions: ['VIEW_CASES', 'LOG_VITALS', 'ADD_OBSERVATIONS'],
  },
  [ROLES.RECEPTIONIST]: {
    id: ROLES.RECEPTIONIST,
    label: 'Frontdesk / Receptionist',
    shortLabel: 'Reception',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Patient Check-in, Kiosk Queue Assistance & ABHA Linking',
    defaultRoute: '/patient/register',
    iconName: 'UserCheck',
    permissions: ['REGISTER_PATIENT', 'START_SESSION', 'VIEW_QUEUE'],
  },
  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    label: 'Hospital Administrator',
    shortLabel: 'Admin',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Staff Management, System Logs & Facility Analytics',
    defaultRoute: '/doctor',
    iconName: 'ShieldCheck',
    permissions: ['ALL_PERMISSIONS', 'MANAGE_STAFF', 'SYSTEM_AUDIT'],
  },
};

/**
 * Quick Demo Credentials for Fast-Track Testing
 */
export const DEMO_USERS = [
  {
    role: ROLES.DOCTOR,
    name: 'Dr. Aarav Sharma',
    email: 'doctor@medikiosk.ai',
    password: 'Password123!',
    department: 'Ayush & Integrative Medicine',
    license: 'AIIA-DOC-8941',
  },
  {
    role: ROLES.NURSE,
    name: 'Nurse Ananya Roy',
    email: 'nurse@medikiosk.ai',
    password: 'Password123!',
    department: 'OPD Triage Unit',
    license: 'AIIA-NRS-3312',
  },
  {
    role: ROLES.RECEPTIONIST,
    name: 'Kavita Verma',
    email: 'reception@medikiosk.ai',
    password: 'Password123!',
    department: 'Patient Intake & Kiosks',
    license: 'AIIA-REC-1029',
  },
  {
    role: ROLES.ADMIN,
    name: 'Dr. Vikramaditya (Admin)',
    email: 'admin@medikiosk.ai',
    password: 'Password123!',
    department: 'Hospital Administration',
    license: 'AIIA-ADM-0001',
  },
];
