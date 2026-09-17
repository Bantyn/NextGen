import express from 'express';
import { z } from 'zod';
import { register, login, patientLogin, getMe } from '../controllers/authController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { ALL_ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';

const router = express.Router();

// ─── Static fallback department list ────────────────────────────────────────
const STATIC_DEPARTMENTS = [
  'Kayachikitsa (Internal Medicine)',
  'Panchakarma & Detox Therapy',
  'Shalya Tantra (Ayurvedic Surgery)',
  'Shalakya Tantra (ENT & Ophthalmology)',
  'Stri Roga & Prasuti Tantra (Gynaecology & Obstetrics)',
  'Kaumar Bhritya (Paediatrics)',
  'Manas Roga (Psychiatry & Mental Health)',
  'Rasayana & Geriatric Wellness',
  'Yoga & Naturopathy OPD',
  'Ayush & Integrative Medicine',
  'General OPD',
  'Emergency & Triage',
  'Dermatology (Twak Roga)',
  'Orthopaedics & Marma',
  'Swasthavritta & Preventive Health',
  'Nidana (Diagnostics & Pathology)',
];

/**
 * GET /auth/departments
 * Public endpoint — returns live department/specialty list from DB users + static fallback
 */
router.get('/departments', async (req, res) => {
  try {
    const dbDepts = await User.distinct('specialty', { specialty: { $ne: null, $ne: '' } });
    const merged = [...new Set([...dbDepts.filter(Boolean), ...STATIC_DEPARTMENTS])].sort();
    return res.json({ success: true, data: merged });
  } catch {
    return res.json({ success: true, data: STATIC_DEPARTMENTS });
  }
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(ALL_ROLES).optional(),
  age: z
    .preprocess(
      (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
      z.number().int().min(0, 'Age cannot be negative').max(150, 'Age cannot exceed 150').optional()
    ),
  gender: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() ? val.trim().toUpperCase() : undefined),
      z.enum(['MALE', 'FEMALE', 'OTHER']).optional()
    ),
  department: z.string().optional(),
  license: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/patient-login', patientLogin);
router.get('/me', authenticate, getMe);

export default router;

