import { userService } from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * User Controller — Thin HTTP Request/Response Handlers
 */
export const listUsers = async (req, res, next) => {
  try {
    const { users, meta } = await userService.listUsers(req.query);
    return sendSuccess(res, HTTP_STATUS.OK, 'Users retrieved successfully', users, meta);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const updated = await userService.updateUserRole(req.params.id, req.body.role, req.user.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'User role updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

export default {
  listUsers,
  updateRole,
  getUserById,
};
