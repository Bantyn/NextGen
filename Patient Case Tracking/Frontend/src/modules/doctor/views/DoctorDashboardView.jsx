import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardStats } from '../components/DashboardStats';
import { QueueFilters } from '../components/QueueFilters';
import { PatientSearch } from '../components/PatientSearch';
import { OPDQueueTable } from '../components/OPDQueueTable';
import {
  getDashboardStats,
  getPatients,
  resetQueue,
  subscribeDoctorDashboard,
} from '../services/doctorDashboardService';

/**
 * DoctorDashboardView Component
 * Primary clinical dashboard for OPD physicians.
 * Consumes data cleanly via doctorDashboardService and renders the live patient queue.
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
  const [stats, setStats] = useState({
    totalOPD: 28,
    awaitingReview: 3,
    emergencyTriage: 1,
    completedToday: 24,
  });
  const [loading, setLoading] = useState(false);

  // Sync filter when URL parameter changes (e.g. user clicks Priority Triage in sidebar)
  useEffect(() => {
    if (urlTab === 'triage') {
      setFilter('RED_FLAG');
    } else if (urlTab === 'archive') {
      setFilter('APPROVED');
    } else if (!urlTab && filter !== 'ALL' && filter !== 'PENDING' && filter !== 'RED_FLAG' && filter !== 'APPROVED') {
      setFilter('ALL');
    }
  }, [urlTab]);

  // Load initial data from service
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, patientsData] = await Promise.all([
        getDashboardStats(),
        getPatients(),
      ]);
      setStats(statsData);
      setPatients(patientsData);
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

    return () => unsubscribe();
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

  // Dynamic client-side filtering and search
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // 1. Tab Status Filter
      if (filter === 'PENDING' && patient.status !== 'PENDING_REVIEW') {
        return false;
      }
      if (
        filter === 'RED_FLAG' &&
        patient.triageLevel !== 'RED_FLAG' &&
        patient.triage !== 'red-flag'
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
  }, [patients, filter, searchQuery]);

  // Dynamic counts for filter badges
  const pendingCount = useMemo(() => {
    return patients.filter((p) => p.status === 'PENDING_REVIEW').length;
  }, [patients]);

  const redFlagCount = useMemo(() => {
    return patients.filter(
      (p) => p.triageLevel === 'RED_FLAG' || p.triage === 'red-flag'
    ).length;
  }, [patients]);

  return (
    <div className="space-y-6">
      {/* 1. Platform Title Banner */}
      <DashboardHeader />

      {/* 2. Metric KPI Summary Cards */}
      <DashboardStats
        stats={stats}
        onTriageClick={() => handleFilterChange('RED_FLAG')}
        onPendingClick={() => handleFilterChange('PENDING')}
        onCompletedClick={() => handleFilterChange('APPROVED')}
      />

      {/* 3. Filter Tabs & Dynamic Search Bar */}
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

      {/* 4. Live OPD Queue Table */}
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
