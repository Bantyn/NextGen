import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { signToken } from '../utils/generateToken.js';
import { ApiError } from '../utils/apiError.js';
import { ROLES, ALL_ROLES } from '../constants/roles.js';

/**
 * Authentication Service — Pure Domain Business Logic for Auth
 */
export class AuthService {
  /**
   * Register a new user/physician
   */
  async register({ name, email, phone, password, role = ROLES.STAFF }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict(`A user account with email '${email}' already exists.`, 'EMAIL_EXISTS');
    }

    if (role && !ALL_ROLES.includes(role)) {
      throw ApiError.badRequest(`Invalid role '${role}'. Permitted: [${ALL_ROLES.join(', ')}]`, 'INVALID_ROLE');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await userRepository.create({
      name,
      email,
      phone,
      password_hash,
      role,
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
      is_active: user.is_active,
      created_at: user.createdAt,
    };
  }
}

export const authService = new AuthService();
export default authService;
