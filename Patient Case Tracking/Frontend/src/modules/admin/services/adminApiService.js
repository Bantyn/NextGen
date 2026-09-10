import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';

/**
 * Admin API Service
 * Centralized client for all Sehat Admin Panel control operations.
 */
export const adminApiService = {
  // 1. Dashboard & Live Operations
  async getDashboardKPIs() {
    return apiClient.get(API_ENDPOINTS.ADMIN_DASHBOARD_KPIS);
  },

  async getLiveOperationalStatus() {
    return apiClient.get(API_ENDPOINTS.ADMIN_OPERATIONS_LIVE);
  },

  // 2. Patient Directory
  async getPatients({ page = 1, limit = 20, search = '' } = {}) {
    const query = new URLSearchParams({ page, limit, search }).toString();
    return apiClient.get(`${API_ENDPOINTS.ADMIN_PATIENTS}?${query}`);
  },

  // 3. Triage & Red-Flag Emergencies
  async getRedFlags({ status = '', page = 1, limit = 20 } = {}) {
    const query = new URLSearchParams({ status, page, limit }).toString();
    return apiClient.get(`${API_ENDPOINTS.ADMIN_TRIAGE_REDFLAGS}?${query}`);
  },

  async resolveRedFlag(id, resolution = 'RESOLVED_BY_ADMIN') {
    return apiClient.patch(API_ENDPOINTS.ADMIN_TRIAGE_RESOLVE(id), { resolution });
  },

  // 4. Doctor Management
  async getDoctors() {
    return apiClient.get(API_ENDPOINTS.ADMIN_DOCTORS);
  },

  async updateDoctorStatus(id, updates) {
    return apiClient.patch(API_ENDPOINTS.ADMIN_DOCTOR_STATUS(id), updates);
  },

  // 5. OPD Queue Priority Override
  async overrideQueuePriority(sessionId, newPriority, reason) {
    return apiClient.patch(API_ENDPOINTS.ADMIN_QUEUE_PRIORITY(sessionId), {
      new_priority: newPriority,
      reason,
    });
  },

  // 6. Medicine Knowledge Base
  async getMedicines({ page = 1, limit = 20, search = '' } = {}) {
    const query = new URLSearchParams({ page, limit, search }).toString();
    return apiClient.get(`${API_ENDPOINTS.ADMIN_MEDICINES}?${query}`);
  },

  async saveMedicine(data) {
    return apiClient.post(API_ENDPOINTS.ADMIN_MEDICINES, data);
  },

  async updateMedicine(id, data) {
    return apiClient.put(API_ENDPOINTS.ADMIN_MEDICINE_BY_ID(id), data);
  },

  async deleteMedicine(id) {
    return apiClient.delete(API_ENDPOINTS.ADMIN_MEDICINE_BY_ID(id));
  },

  // 7. openFDA Search & Import
  async searchOpenFDA(drugName) {
    return apiClient.get(`${API_ENDPOINTS.ADMIN_OPENFDA_SEARCH}?drug=${encodeURIComponent(drugName)}`);
  },

  async importOpenFDAMedicine(fdaData) {
    return apiClient.post(API_ENDPOINTS.ADMIN_OPENFDA_IMPORT, fdaData);
  },

  // 8. AI Knowledge Base
  async getAIKnowledge(category = 'faq') {
    return apiClient.get(API_ENDPOINTS.ADMIN_KNOWLEDGE(category));
  },

  async saveAIKnowledge(category, data) {
    return apiClient.post(API_ENDPOINTS.ADMIN_KNOWLEDGE(category), data);
  },

  // 9. Smart AI Assistant Runtime Config
  async getAssistantConfig() {
    return apiClient.get(API_ENDPOINTS.ADMIN_ASSISTANT_CONFIG);
  },

  async updateAssistantConfig(configUpdates) {
    return apiClient.put(API_ENDPOINTS.ADMIN_ASSISTANT_CONFIG, configUpdates);
  },

  // 10. System Health Diagnostics
  async getSystemHealth() {
    return apiClient.get(API_ENDPOINTS.ADMIN_SYSTEM_HEALTH);
  },

  // 11. Audit Logs
  async getAuditLogs({ page = 1, limit = 25, action = '', search = '' } = {}) {
    const query = new URLSearchParams({ page, limit, action, search }).toString();
    return apiClient.get(`${API_ENDPOINTS.ADMIN_AUDIT_LOGS}?${query}`);
  },
};

export default adminApiService;
