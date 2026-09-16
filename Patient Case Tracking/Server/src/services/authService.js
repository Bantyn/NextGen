import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { signToken } from '../utils/generateToken.js';
import { ApiError } from '../utils/apiError.js';
import { ROLES, ALL_ROLES } from '../constants/roles.js';
import { Patient } from '../models/Patient.js';
import { PatientIdentity } from '../models/PatientIdentity.js';

/**
 * Authentication Service — Pure Domain Business Logic for Auth
 */
export class AuthService {
  /**
   * Register a new user/physician
   */
  async register({ name, email, phone, password, role = ROLES.STAFF, age, gender, department, license }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict(`A user account with email '${email}' already exists.`, 'EMAIL_EXISTS');
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone) {
        const existingPhone = await userRepository.findByPhone(cleanPhone);
        if (existingPhone) {
          throw ApiError.conflict(`An account with mobile number '${phone}' already exists. Please use a unique number or sign in.`, 'PHONE_EXISTS');
        }
      }
    }

    if (role && !ALL_ROLES.includes(role)) {
      throw ApiError.badRequest(`Invalid role '${role}'. Permitted: [${ALL_ROLES.join(', ')}]`, 'INVALID_ROLE');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const parsedAge = age !== undefined && age !== null && age !== '' ? Number(age) : null;
    const normalizedGender = gender ? String(gender).trim().toUpperCase() : 'OTHER';

    const user = await userRepository.create({
      name,
      email,
      phone,
      password_hash,
      role,
      age: parsedAge,
      gender: normalizedGender,
      specialty: department || null,
      is_active: true,
    });

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await auditRepository.create({
      user_id: user._id.toString(),
      action: 'USER_REGISTERED',
      resource: 'User',
      resource_id: user._id.toString(),
      details: { email: user.email, role: user.role, age: user.age, gender: user.gender },
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        age: user.age,
        gender: user.gender,
      },
    };
  }

  /**
   * Authenticate user and issue JWT
   */
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email address or password.', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.', 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email address or password.', 'INVALID_CREDENTIALS');
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await auditRepository.create({
      user_id: user._id.toString(),
      action: 'USER_LOGIN',
      resource: 'User',
      resource_id: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        age: user.age,
        gender: user.gender,
      },
    };
  }

  /**
   * Retrieve currently authenticated user profile
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.', 'USER_NOT_FOUND');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      age: user.age,
      gender: user.gender,
      is_active: user.is_active,
      created_at: user.createdAt,
    };
  }

  /**
   * Authenticate patient by ABHA ID, Phone, or Patient ID, issuing real signed JWT
   */
  async patientLogin({ identifier, phone, abhaId }) {
    const rawId = (identifier || phone || abhaId || '').trim();
    if (!rawId) {
      throw ApiError.badRequest('Patient identifier (ABHA ID, Phone, or Patient ID) is required.', 'IDENTIFIER_REQUIRED');
    }

    // Look up via PatientIdentity (ABHA / AADHAAR) first
    let identity = await PatientIdentity.findOne({
      identity_reference: { $regex: new RegExp(`^${rawId.replace(/[+ -]/g, '')}$`, 'i') },
    });
    if (!identity) {
      identity = await PatientIdentity.findOne({ identity_reference: rawId });
    }

    let patient = null;
    if (identity) {
      patient = await Patient.findOne({ patient_id: identity.patient_id });
    }

    // Direct search on Patient: patient_id or phone
    if (!patient) {
      patient = await Patient.findOne({
        $or: [
          { patient_id: rawId.toUpperCase() },
          { patient_id: rawId },
          { phone: rawId },
          { phone: { $regex: rawId.replace(/[^0-9]/g, '') } },
        ],
      });
    }

    if (!patient) {
      throw ApiError.notFound(`No patient record found matching '${rawId}'. Please register as a new patient.`, 'PATIENT_NOT_FOUND');
    }

    const patientFullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Patient';
    const token = signToken({
      id: patient._id.toString(),
      patient_id: patient.patient_id,
      email: `${patient.patient_id.toLowerCase()}@sehat.org`,
      role: 'PATIENT',
      name: patientFullName,
    });

    await auditRepository.create({
      user_id: patient._id.toString(),
      action: 'PATIENT_LOGIN',
      resource: 'Patient',
      resource_id: patient.patient_id,
      details: { patient_id: patient.patient_id, phone: patient.phone },
    });

    return {
      token,
      user: {
        id: patient.patient_id,
        patient_id: patient.patient_id,
        name: patientFullName,
        email: `${patient.patient_id.toLowerCase()}@sehat.org`,
        phone: patient.phone,
        role: 'PATIENT',
      },
      patient: {
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        gender: patient.gender,
        date_of_birth: patient.date_of_birth,
        opd_type: patient.opd_type,
        opd_system: patient.opd_system,
      },
    };
  }
}

export const authService = new AuthService();
export default authService;
