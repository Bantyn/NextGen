import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import patientRoutes from './patientRoutes.js';
import consentRoutes from './consentRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import caseMessageRoutes from './caseMessageRoutes.js';
import observationRoutes from './observationRoutes.js';
import recordRoutes from './recordRoutes.js';
import documentRoutes from './documentRoutes.js';
import intakeRoutes from './intakeRoutes.js';
import assistantRoutes from './assistantRoutes.js';

const router = express.Router();

// Mount all modular API routes under /api/v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/consents', consentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/case-messages', caseMessageRoutes);
router.use('/observations', observationRoutes);
router.use('/records', recordRoutes);
router.use('/documents', documentRoutes);
router.use('/intake', intakeRoutes);
router.use('/assistant', assistantRoutes);

export default router;
