/**
 * System Role Definitions
 * Aligned with PRD.md and Roles/Backend.md
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  STAFF: 'STAFF',
});

export const ALL_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.DOCTOR,
  ROLES.STAFF,
]);

export default ROLES;
