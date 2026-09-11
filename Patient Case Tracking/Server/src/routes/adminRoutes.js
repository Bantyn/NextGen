import express from 'express';
import { z } from 'zod';
import {
  handleGetDashboardKPIs,
  handleGetLiveOperationalStatus,
  handleGetDoctors,
  handleUpdateDoctorStatus,
  handleOverrideQueuePriority,
  handleGetMedicines,
  handleSaveMedicine,
  handleDeleteMedicine,
  handleSearchOpenFDA,
  handleImportFDAToLocal,
  handleGetAIKnowledge,
  handleSaveAIKnowledge,
  handleGetAssistantConfig,
  handleUpdateAssistantConfig,
  handleGetSystemHealth,
  handleGetAuditLogs,
  handleGetPatients,
  handleGetRedFlags,
  handleResolveRedFlag,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

const priorityOverrideSchema = z.object({
  new_priority: z.enum(['EMERGENCY', 'HIGH_PRIORITY', 'URGENT', 'MODERATE', 'ROUTINE']),
  reason: z.string().optional(),
});

const medicineSaveSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  generic_name: z.string().min(1, 'Generic name is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  category: z.string().optional(),
  brand_names: z.array(z.string()).optional(),
  dosage_forms: z.array(z.string()).optional(),
  general_usage_info: z.string().optional(),
  precautions_and_warnings: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  common_side_effects: z.array(z.string()).optional(),
  storage_instructions: z.string().optional(),
  requires_prescription: z.boolean().optional(),
});

// Protect all admin endpoints: require valid JWT and ADMIN role
router.use(authenticate);
router.use(restrictTo(ROLES.ADMIN));

// 1. Dashboard KPIs & Live Operations
router.get('/dashboard/kpis', handleGetDashboardKPIs);
router.get('/operations/live', handleGetLiveOperationalStatus);

// 2. Patient Directory & Search
router.get('/patients', handleGetPatients);

// 3. Triage & Red-Flag Monitoring
router.get('/triage/redflags', handleGetRedFlags);
router.patch('/triage/redflags/:id/resolve', handleResolveRedFlag);

// 4. Doctor Directory & Live Status Management
router.get('/doctors', handleGetDoctors);
router.patch('/doctors/:id', handleUpdateDoctorStatus);

// 5. Queue Management & Priority Overrides
router.patch('/queue/:sessionId/priority', validate({ body: priorityOverrideSchema }), handleOverrideQueuePriority);

// 6. Local Medicine Knowledge Base CRUD
router.get('/medicines', handleGetMedicines);
router.post('/medicines', validate({ body: medicineSaveSchema }), handleSaveMedicine);
router.put('/medicines/:id', handleSaveMedicine);
router.delete('/medicines/:id', handleDeleteMedicine);

// 7. openFDA Live Search & Import
router.get('/medicines/openfda/search', handleSearchOpenFDA);
router.post('/medicines/openfda/import', handleImportFDAToLocal);

// 8. AI Knowledge Base Management
router.get('/knowledge/:category', handleGetAIKnowledge);
router.post('/knowledge/:category', handleSaveAIKnowledge);

// 9. Smart AI Assistant Runtime Config
router.get('/assistant/config', handleGetAssistantConfig);
router.put('/assistant/config', handleUpdateAssistantConfig);

// 10. System Diagnostics & Audit Logs
router.get('/system/health', handleGetSystemHealth);
router.get('/audit-logs', handleGetAuditLogs);

export default router;

