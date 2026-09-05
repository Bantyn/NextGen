/**
 * Sehat Role Definitions & RBAC Constants
 */

export const ROLES = {
  DOCTOR: 'DOCTOR',
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
