/**
 * Sehat Role Definitions & RBAC Constants
 */

export const ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
};

export const ROLE_CONFIGS = {
  [ROLES.PATIENT]: {
    id: ROLES.PATIENT,
    label: 'Patient (ABHA Verified)',
    shortLabel: 'Patient',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description: 'Personal Health Records, Lab Reports & OPD Queue',
    defaultRoute: '/patient/dashboard',
    iconName: 'User',
    permissions: ['VIEW_OWN_RECORDS', 'DOWNLOAD_REPORTS', 'TRACK_TOKEN'],
  },
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
    role: ROLES.PATIENT,
    name: 'Ramesh Patel',
    email: 'ramesh.patel@gmail.com',
    phone: '+91 98765 43210',
    abhaId: '91-4432-8812-9901',
    password: 'Password123!',
    department: 'Patient Portal',
    license: 'ABHA-PAT-9011',
  },
  {
    role: ROLES.DOCTOR,
    name: 'Dr. Aarav Sharma',
    email: 'doctor@sehat.org',
    password: 'Password123!',
    department: 'Ayush & Integrative Medicine',
    license: 'AIIA-DOC-8941',
  },
  {
    role: ROLES.ADMIN,
    name: 'Dr. Vikramaditya (Admin)',
    email: 'admin@sehat.org',
    password: 'Password123!',
    department: 'Hospital Administration',
    license: 'AIIA-ADM-0001',
  },
];

