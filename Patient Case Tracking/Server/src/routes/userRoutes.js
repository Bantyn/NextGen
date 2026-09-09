import express from 'express';
import { z } from 'zod';
import { listUsers, updateRole, getUserById } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { ROLES, ALL_ROLES } from '../constants/roles.js';

const router = express.Router();

const updateRoleSchema = z.object({
  role: z.enum(ALL_ROLES, { errorMap: () => ({ message: 'Invalid role specified' }) }),
});

// All user management routes require JWT authentication and ADMIN role
router.use(authenticate, restrictTo(ROLES.ADMIN));

router.get('/', listUsers);
router.get('/:id', getUserById);
router.put('/:id/role', validate({ body: updateRoleSchema }), updateRole);

export default router;
