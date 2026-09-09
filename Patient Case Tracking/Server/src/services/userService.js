import { userRepository } from '../repositories/userRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { ALL_ROLES } from '../constants/roles.js';

/**
 * User Management Service — Pure Domain Logic for Staff Management
 */
export class UserService {
  async listUsers({ role, isActive, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const { users, total } = await userRepository.findAll({
      role,
      isActive,
      skip,
      limit: limitNum,
    });

    const meta = buildPaginationMeta(pageNum, limitNum, total);
    return { users, meta };
  }

  async updateUserRole(userId, newRole, requesterId) {
    if (!ALL_ROLES.includes(newRole)) {
      throw ApiError.badRequest(`Invalid role '${newRole}'. Valid options: [${ALL_ROLES.join(', ')}]`, 'INVALID_ROLE');
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw ApiError.notFound('Target user not found.', 'USER_NOT_FOUND');
    }

    const updatedUser = await userRepository.updateRole(userId, newRole);

    await auditRepository.create({
      user_id: requesterId,
      action: 'USER_ROLE_UPDATED',
      resource: 'User',
      resource_id: userId,
      details: { previous_role: targetUser.role, new_role: newRole },
    });

    return updatedUser;
  }

  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
    }
    return user;
  }
}

export const userService = new UserService();
export default userService;
