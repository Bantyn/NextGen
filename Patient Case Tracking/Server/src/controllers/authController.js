import { authService } from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Auth Controller — Thin HTTP Request/Response Handlers
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, HTTP_STATUS.OK, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getMe(req.user.id);
    return sendSuccess(res, HTTP_STATUS.OK, 'Profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
};
