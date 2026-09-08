/**
 * doctorDashboardService.js
 * 
 * Clean Data-Access Layer for Doctor Dashboard.
 * 
 * CURRENT ARCHITECTURE:
 * React Components -> doctorDashboardService -> Local Dummy JSON Data (doctorDashboardDummyData.js)
 * 
 * FUTURE API ARCHITECTURE:
 * React Components -> doctorDashboardService -> apiClient.get('/api/v1/doctor/...') -> Backend / MongoDB / n8n
 * 
 * The UI components only interact with this service layer and remain completely decoupled
 * from the underlying transport (whether in-memory mock or real HTTP/REST/WebSocket).
 */

import {
  initialDashboardStats,
  dummyPatients,
} from '../../../data/doctorDashboardDummyData';

// Local mutable in-memory state for the active demo session
let memoryPatients = [...dummyPatients];
let memoryStats = { ...initialDashboardStats };

// Event listeners for reactive state updates across components (e.g. Call Next, Status update)
const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener({ patients: [...memoryPatients], stats: { ...memoryStats } });
    } catch (err) {
      console.error('Error notifying doctor service listener:', err);
    }
  });
};

/**
 * Subscribe to real-time doctor dashboard updates
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function subscribeDoctorDashboard(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Fetch high-level OPD intake & triage metrics
 * Future API: return (await apiClient.get('/api/v1/doctor/stats')).data;
 */
export async function getDashboardStats() {
  // Simulate minimal async delay for realism
  await new Promise((res) => setTimeout(res, 30));

  // Dynamically recalculate stats from current active memory state
  const awaitingReview = memoryPatients.filter(
    (p) => p.status === 'PENDING_REVIEW'
  ).length;
  const emergencyTriage = memoryPatients.filter(
    (p) => p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag'
  ).length;
  const completedToday = memoryPatients.filter(
    (p) => p.status === 'COMPLETED' || p.status === 'APPROVED'
  ).length;

  return {
    ...memoryStats,
    awaitingReview,
    emergencyTriage,
    completedToday: Math.max(memoryStats.completedToday, completedToday),
  };
}

/**
 * Fetch patient queue list with optional query and status filters
 * Future API: return (await apiClient.get('/api/v1/doctor/patients', { params: filters })).data;
 */
export async function getPatients(filters = {}) {
  await new Promise((res) => setTimeout(res, 30));

  let result = [...memoryPatients];

  if (filters.tab) {
    if (filters.tab === 'PENDING') {
      result = result.filter((p) => p.status === 'PENDING_REVIEW');
    } else if (filters.tab === 'RED_FLAG' || filters.tab === 'triage') {
      result = result.filter(
        (p) => p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag'
      );
    } else if (filters.tab === 'APPROVED' || filters.tab === 'COMPLETED' || filters.tab === 'archive') {
      result = result.filter(
        (p) => p.status === 'APPROVED' || p.status === 'COMPLETED'
      );
    }
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.token.toLowerCase().includes(q) ||
        p.chiefComplaint.toLowerCase().includes(q) ||
        (p.language && p.language.toLowerCase().includes(q))
    );
  }

  return result;
}

/**
 * Fetch an individual patient record by sessionId or patient ID
 * Future API: return (await apiClient.get(`/api/v1/doctor/cases/${id}`)).data;
 */
export async function getPatientById(identifier) {
  await new Promise((res) => setTimeout(res, 20));

  if (!identifier) return memoryPatients[0];

  const found = memoryPatients.find(
    (p) =>
      p.sessionId === identifier ||
      p.id === identifier ||
      p.token.toLowerCase() === identifier.toLowerCase()
  );

  return found || memoryPatients[0];
}

/**
 * Get the next waiting patient for consultation (for "Call Next" button)
 */
export async function getNextWaitingPatient() {
  await new Promise((res) => setTimeout(res, 10));

  // Prioritize red-flag emergency first, then standard pending cases in order of checkin
  const redFlag = memoryPatients.find(
    (p) => (p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag') && p.status === 'PENDING_REVIEW'
  );
  if (redFlag) return redFlag;

  const nextWaiting = memoryPatients.find(
    (p) => p.status === 'PENDING_REVIEW'
  );

  return nextWaiting || memoryPatients[0];
}

/**
 * Fetch all high-priority emergency triage cases
 */
export async function getTriageCases() {
  return getPatients({ tab: 'RED_FLAG' });
}

/**
 * Fetch all completed cases
 */
export async function getCompletedCases() {
  return getPatients({ tab: 'COMPLETED' });
}

/**
 * Update patient consultation status and optional doctor Rx notes
 * Future API: return (await apiClient.patch(`/api/v1/doctor/cases/${sessionId}/status`, { status, doctorRxNotes })).data;
 */
export async function updatePatientStatus(sessionId, status, doctorRxNotes) {
  await new Promise((res) => setTimeout(res, 50));

  let updatedPatient = null;
  memoryPatients = memoryPatients.map((p) => {
    if (p.sessionId === sessionId || p.id === sessionId) {
      updatedPatient = {
        ...p,
        status: status || p.status,
        consultationStatus: status === 'COMPLETED' || status === 'APPROVED' ? 'completed' : 'in_progress',
        doctorRxNotes: doctorRxNotes !== undefined ? doctorRxNotes : p.doctorRxNotes,
      };
      return updatedPatient;
    }
    return p;
  });

  notifyListeners();
  return updatedPatient;
}

/**
 * Reset / refresh queue to initial baseline
 */
export async function resetQueue() {
  memoryPatients = [...dummyPatients];
  memoryStats = { ...initialDashboardStats };
  notifyListeners();
  return memoryPatients;
}
