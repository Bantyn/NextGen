import express from 'express';
import { z } from 'zod';
import { register, login, getMe } from '../controllers/authController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { ALL_ROLES } from '../constants/roles.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(ALL_ROLES).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
