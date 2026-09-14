import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2, Clock, Activity, Sparkles } from 'lucide-react';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardStats } from '../components/DashboardStats';
import { QueueFilters } from '../components/QueueFilters';
import { PatientSearch } from '../components/PatientSearch';
import { OPDQueueTable } from '../components/OPDQueueTable';
import { DoctorArchiveView } from './DoctorArchiveView';
import { DoctorAnalyticsView } from './DoctorAnalyticsView';
import { DoctorTemplatesView } from './DoctorTemplatesView';
import {
  getDashboardStats,
  getPatients,
  resetQueue,
  subscribeDoctorDashboard,
  getEmergencyAlerts,
  acceptEmergencyCase,
} from '../services/doctorDashboardService';

/**
 * DoctorDashboardView Component
 * Primary clinical dashboard for OPD physicians.
 * Sub-views:
 * - Live OPD Queue
 * - Priority Triage (Red-Flag filtering)
 * - Patient Archives (urlTab === 'archive')
 * - Clinical Analytics (urlTab === 'analytics')
 * - Prescription Templates (urlTab === 'templates')
 * Includes real-time emergency red-flag case broadcasting and atomic assignment.
 */
export const DoctorDashboardView = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL search params sync for tab navigation from sidebar
  const urlTab = searchParams.get('tab');

  const [filter, setFilter] = useState(() => {
    if (urlTab === 'triage') return 'RED_FLAG';
    if (urlTab === 'archive') return 'APPROVED';
    return 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [acceptingCaseId, setAcceptingCaseId] = useState(null);
  const [stats, setStats] = useState({
    totalOPD: 0,
    awaitingReview: 0,
    emergencyTriage: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  // Sync filter when URL parameter changes
  useEffect(() => {
    if (urlTab === 'triage') {
      setFilter('RED_FLAG');
    } else if (urlTab === 'archive') {
      setFilter('APPROVED');
    } else if (!urlTab && filter !== 'ALL' && filter !== 'PENDING' && filter !== 'RED_FLAG' && filter !== 'APPROVED') {
      setFilter('ALL');
    }
  }, [urlTab]);

  // Load initial data and emergency alerts
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, patientsData, alerts] = await Promise.all([
        getDashboardStats(),
        getPatients(),
        getEmergencyAlerts().catch(() => []),
      ]);
      setStats(statsData);
      setPatients(patientsData);
      setEmergencyAlerts(alerts || []);
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to real-time service updates
    const unsubscribe = subscribeDoctorDashboard(({ patients: updatedPatients, stats: updatedStats }) => {
      setPatients(updatedPatients);
      setStats(updatedStats);
    });

    // 15s interval check for new emergency alerts
    const alertInterval = setInterval(async () => {
      try {
        const alerts = await getEmergencyAlerts();
        setEmergencyAlerts(alerts || []);
      } catch (err) {
        // silent
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(alertInterval);
    };
  }, [loadData]);

  // Handle filter changes and update URL search params gracefully
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'RED_FLAG') {
      setSearchParams({ tab: 'triage' });
    } else if (newFilter === 'APPROVED') {
      setSearchParams({ tab: 'archive' });
    } else {
      setSearchParams({});
    }
  };

  // Reset queue data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const refreshed = await resetQueue();
      const updatedStats = await getDashboardStats();
      setPatients(refreshed);
      setStats(updatedStats);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to patient examination view
  const handleExamine = (patient) => {
    if (!patient) return;
    navigate(`/doctor/cases/${patient.sessionId || patient.id}`);
  };

  // Atomic emergency case acceptance with race condition protection
  const handleAcceptPriorityCase = async (alert) => {
    const caseId = alert.case_id || alert.id;
    const sessionId = alert.clinical_session_id || alert.session_id || caseId;
    setAcceptingCaseId(caseId);

    try {
      await acceptEmergencyCase(caseId);
      // Case accepted atomically by this doctor!
      navigate(`/doctor/cases/${sessionId}`);
    } catch (err) {
      console.error('Failed to accept priority case:', err);
      if (err.response?.status === 409 || err.message?.includes('already assigned')) {
        window.alert('This priority case has already been assigned to another doctor.');
      } else {
        window.alert(err.response?.data?.message || 'Case already assigned or no longer available.');
      }
      // Refresh alerts to remove withdrawn case
      const updatedAlerts = await getEmergencyAlerts().catch(() => []);
      setEmergencyAlerts(updatedAlerts || []);
    } finally {
      setAcceptingCaseId(null);
    }
  };

  // Sub-view rendering based on active tab in URL
  if (urlTab === 'archive') {
    return <DoctorArchiveView />;
  }

  if (urlTab === 'analytics') {
    return <DoctorAnalyticsView />;
  }

  if (urlTab === 'templates') {
    return <DoctorTemplatesView />;
  }

  // Dynamic client-side filtering and search for OPD Queue
  const filteredPatients = patients.filter((patient) => {
    // 1. Tab Status Filter
    if (filter === 'PENDING' && patient.status !== 'PENDING_REVIEW') {
      return false;
    }
    if (
      filter === 'RED_FLAG' &&
      patient.triageLevel !== 'RED_FLAG' &&
      patient.triage !== 'red-flag' &&
      patient.triageLevel !== 'HIGH'
    ) {
      return false;
    }
    if (
      filter === 'APPROVED' &&
      patient.status !== 'APPROVED' &&
      patient.status !== 'COMPLETED'
    ) {
      return false;
    }

    // 2. Search Query Filter (Matches patient name, token, chief complaint, language)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = patient.patientName?.toLowerCase().includes(q);
      const matchToken = patient.token?.toLowerCase().includes(q);
      const matchComplaint = patient.chiefComplaint?.toLowerCase().includes(q);
      const matchLang = patient.language?.toLowerCase().includes(q);

      return matchName || matchToken || matchComplaint || matchLang;
    }

    return true;
  });

  const pendingCount = patients.filter((p) => p.status === 'PENDING_REVIEW').length;
  const redFlagCount = patients.filter(
    (p) => p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag' || p.triageLevel === 'HIGH'
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Platform Title Banner */}
      <DashboardHeader />

      {/* 2. Priority / Red-Flag Broadcast Alert Card (if any active alerts) */}
      {emergencyAlerts.length > 0 && (
        <div className="space-y-3">
          {emergencyAlerts.map((alert, idx) => (
            <div
              key={alert.case_id || alert.id || idx}
              className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-400 text-rose-950 shadow-sm space-y-3 animate-pulse-subtle"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                    🚨
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-2">
                      <span>CRITICAL PRIORITY CASE ALERT</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-semibold font-mono">
                        #{alert.case_id || 'CASE-10291'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-rose-700">
                      Genuine red-flag detected • Specialty: <strong className="font-semibold">{alert.specialty_required || 'Cardiology / General Medicine'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-white/70 px-2.5 py-1 rounded-full border border-rose-200">
                    <Clock className="w-3 h-3" />
                    <span>{alert.detected_time || 'Just now'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Patient</span>
                  <span className="font-semibold text-rose-900">{alert.patient_masked || 'P**** Patel'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Age / Gender</span>
                  <span className="font-medium text-rose-900">{alert.age || 54} Yrs / {alert.gender || 'MALE'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Reported Complaint</span>
                  <span className="font-medium text-rose-900 line-clamp-1">{alert.chief_complaint || 'Persistent chest discomfort'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Clinical Risk</span>
                  <span className="font-bold text-rose-700 uppercase">{alert.risk_level || 'HIGH / EMERGENCY'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/doctor/cases/${alert.clinical_session_id || alert.session_id || alert.case_id}`)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-rose-800 bg-white border border-rose-300 hover:bg-rose-100 transition cursor-pointer"
                >
                  View Case
                </button>
                <button
                  type="button"
                  disabled={acceptingCaseId === (alert.case_id || alert.id)}
                  onClick={() => handleAcceptPriorityCase(alert)}
                  className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{acceptingCaseId === (alert.case_id || alert.id) ? 'Accepting Case...' : 'Accept Case (Atomic Claim)'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Metric KPI Summary Cards */}
      <DashboardStats
        stats={stats}
        isLoading={loading}
        onTriageClick={() => handleFilterChange('RED_FLAG')}
        onPendingClick={() => handleFilterChange('PENDING')}
        onCompletedClick={() => handleFilterChange('APPROVED')}
      />

      {/* 4. Filter Tabs & Dynamic Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <QueueFilters
          activeFilter={filter}
          onFilterChange={handleFilterChange}
          pendingCount={pendingCount}
          redFlagCount={redFlagCount}
        />

        <PatientSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* 5. Live OPD Queue Table */}
      <OPDQueueTable
        patients={filteredPatients}
        isLoading={loading}
        onRefresh={handleRefresh}
        onExamine={handleExamine}
      />
    </div>
  );
};

export default DoctorDashboardView;
