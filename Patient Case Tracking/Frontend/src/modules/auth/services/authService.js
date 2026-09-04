/**
 * Auth Module API Service
 * Encapsulates all authentication network operations compliant with Documentation/api_doc.md
 */

import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';

export const authService = {
  /**
   * Log in user
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    return apiClient.post(API_ENDPOINTS.AUTH_LOGIN, credentials);
  },

  /**
   * Register new healthcare staff account
   * @param {{ name: string, email: string, phone: string, password: string, role: string, department?: string, license?: string }} userData
   */
  async register(userData) {
    return apiClient.post(API_ENDPOINTS.AUTH_REGISTER, userData);
  },

  /**
   * Get current authenticated user's profile
   */
  async getMe() {
    return apiClient.get(API_ENDPOINTS.AUTH_ME);
  },

  /**
   * List all hospital users (Admin scope)
   */
  async getUsers() {
    return apiClient.get(API_ENDPOINTS.USERS);
  },

  /**
   * Update a user's access role (Admin scope)
   * @param {string} userId
   * @param {string} newRole
   */
  async updateUserRole(userId, newRole) {
    return apiClient.put(API_ENDPOINTS.USER_ROLE(userId), { role: newRole });
  },

  /**
   * Request password recovery OTP/link
   * @param {string} email
   */
  async requestPasswordReset(email) {
    return apiClient.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
  },

  /**
   * Reset password with verification code
   * @param {{ email: string, code: string, newPassword: string }} payload
   */
  async resetPassword(payload) {
    return apiClient.post(API_ENDPOINTS.AUTH_RESET_PASSWORD, payload);
  },
};

export default authService;
