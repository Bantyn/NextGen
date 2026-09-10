import { adminService } from '../services/adminService.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Admin Controller — Thin HTTP Request Handlers
 * Strictly enforces Decoupled 4-Tier Backend Architecture (No direct DB queries or business logic).
 */

export async function handleGetDashboardKPIs(req, res, next) {
  try {
    const data = await adminService.getDashboardKPIs();
    return sendSuccess(res, HTTP_STATUS.OK, 'Dashboard operational KPIs retrieved successfully', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetLiveOperationalStatus(req, res, next) {
  try {
    const data = await adminService.getLiveOperationalStatus();
    return sendSuccess(res, HTTP_STATUS.OK, 'Live operational status retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetDoctors(req, res, next) {
  try {
    const data = await adminService.getDoctorsList();
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor directory retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateDoctorStatus(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 'ADMIN';
    const data = await adminService.updateDoctorStatus(id, req.body, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Doctor status updated successfully', data);
  } catch (err) {
    next(err);
  }
}

export async function handleOverrideQueuePriority(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { new_priority, reason } = req.body;
    const adminId = req.user?.id || 'ADMIN';

    const data = await adminService.overrideQueuePriority(sessionId, new_priority, reason, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Queue priority overridden and audit logged', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetMedicines(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const data = await adminService.getMedicines({ search, page, limit });
    const meta = buildPaginationMeta(data.current_page, limit || 20, data.total);
    return sendSuccess(res, HTTP_STATUS.OK, 'Medicines retrieved', data.medicines, meta);
  } catch (err) {
    next(err);
  }
}

export async function handleSaveMedicine(req, res, next) {
  try {
    const adminId = req.user?.id || 'ADMIN';
    const data = await adminService.saveMedicine(req.body, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Medicine record saved successfully', data);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 'ADMIN';
    const data = await adminService.deleteMedicine(id, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Medicine record deleted successfully', data);
  } catch (err) {
    next(err);
  }
}

export async function handleSearchOpenFDA(req, res, next) {
  try {
    const { drug } = req.query;
    const data = await adminService.searchOpenFDA(drug);
    return sendSuccess(res, HTTP_STATUS.OK, 'openFDA drug inquiry completed', data);
  } catch (err) {
    next(err);
  }
}

export async function handleImportFDAToLocal(req, res, next) {
  try {
    const adminId = req.user?.id || 'ADMIN';
    const data = await adminService.importFDAToLocal(req.body, adminId);
    return sendSuccess(res, HTTP_STATUS.CREATED, 'openFDA drug record imported to local database', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetAIKnowledge(req, res, next) {
  try {
    const { category } = req.params;
    const data = await adminService.getAIKnowledge(category);
    return sendSuccess(res, HTTP_STATUS.OK, 'AI knowledge records retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleSaveAIKnowledge(req, res, next) {
  try {
    const { category } = req.params;
    const adminId = req.user?.id || 'ADMIN';
    const data = await adminService.saveAIKnowledge(category, req.body, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'AI knowledge record saved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetAssistantConfig(req, res, next) {
  try {
    const data = adminService.getAssistantConfig();
    return sendSuccess(res, HTTP_STATUS.OK, 'Smart Assistant configuration retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateAssistantConfig(req, res, next) {
  try {
    const adminId = req.user?.id || 'ADMIN';
    const data = adminService.updateAssistantConfig(req.body, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Smart Assistant configuration updated', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetSystemHealth(req, res, next) {
  try {
    const data = await adminService.getSystemHealth();
    return sendSuccess(res, HTTP_STATUS.OK, 'System health diagnostics completed', data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetAuditLogs(req, res, next) {
  try {
    const { page, limit, action, search } = req.query;
    const data = await adminService.getAuditLogs({ page, limit, action, search });
    const meta = buildPaginationMeta(data.current_page, limit || 25, data.total);
    return sendSuccess(res, HTTP_STATUS.OK, 'Audit logs retrieved', data.logs, meta);
  } catch (err) {
    next(err);
  }
}

export async function handleGetPatients(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const data = await adminService.getPatientsList({ page, limit, search });
    const meta = buildPaginationMeta(data.current_page, limit || 20, data.total);
    return sendSuccess(res, HTTP_STATUS.OK, 'Patient directory retrieved', data.patients, meta);
  } catch (err) {
    next(err);
  }
}

export async function handleGetRedFlags(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const data = await adminService.getRedFlagCases({ status, page, limit });
    const meta = buildPaginationMeta(data.current_page, limit || 20, data.total);
    return sendSuccess(res, HTTP_STATUS.OK, 'Emergency red-flag cases retrieved', data.cases, meta);
  } catch (err) {
    next(err);
  }
}

export async function handleResolveRedFlag(req, res, next) {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = req.user?.id || 'ADMIN';
    const data = await adminService.resolveRedFlagCase(id, resolution, adminId);
    return sendSuccess(res, HTTP_STATUS.OK, 'Red-flag case resolved successfully', data);
  } catch (err) {
    next(err);
  }
}

export default {
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
};

