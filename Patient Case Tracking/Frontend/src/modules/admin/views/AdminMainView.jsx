import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import AdminDashboardView from './AdminDashboardView';
import QueueAdminView from './QueueAdminView';
import TriageAdminView from './TriageAdminView';
import PatientsAdminView from './PatientsAdminView';
import DoctorsAdminView from './DoctorsAdminView';
import MedicinesAdminView from './MedicinesAdminView';
import AIKnowledgeAdminView from './AIKnowledgeAdminView';
import AIAssistantAdminView from './AIAssistantAdminView';
import AnalyticsAdminView from './AnalyticsAdminView';
import AuditLogsAdminView from './AuditLogsAdminView';
import SystemHealthAdminView from './SystemHealthAdminView';
import SettingsAdminView from './SettingsAdminView';
import adminApiService from '../services/adminApiService';

/**
 * AdminMainView Component
 * Central administrative shell driving all operational control modules.
 */
export const AdminMainView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [kpis, setKpis] = useState({});
  const [liveOps, setLiveOps] = useState({ queue: [], doctors: [], emergencies: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('ALL_SYSTEMS_OPERATIONAL');

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [kpiRes, opsRes] = await Promise.allSettled([
        adminApiService.getDashboardKPIs(),
        adminApiService.getLiveOperationalStatus(),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value?.data) {
        setKpis(kpiRes.value.data.kpis || {});
      }
      if (opsRes.status === 'fulfilled' && opsRes.value?.data) {
        setLiveOps(opsRes.value.data || {});
        if (opsRes.value.data.system_status) {
          setSystemStatus(opsRes.value.data.system_status);
        }
      }
    } catch (err) {
      console.error('Error fetching admin telemetry:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // 30-second background polling for live operational queue
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'queue':
        return 'Live OPD Queue';
      case 'triage':
        return 'Triage & Red-Flag Alerts';
      case 'patients':
        return 'Patient Directory';
      case 'doctors':
        return 'Doctor Rosters & Schedules';
      case 'medicines':
        return 'Medicine Knowledge & openFDA';
      case 'knowledge':
        return 'AI Knowledge Base';
      case 'assistant':
        return 'Smart Assistant Config';
      case 'analytics':
        return 'Clinical Analytics';
      case 'audit':
        return 'Security Audit Logs';
      case 'health':
        return 'System Diagnostics';
      case 'settings':
        return 'Hospital Settings & RBAC';
      case 'dashboard':
      default:
        return 'Operations Dashboard';
    }
  };

  return (
    <AdminLayout
      activeTab={currentTab}
      onSelectTab={handleSelectTab}
      activeTabTitle={getTabTitle(currentTab)}
      systemStatus={systemStatus}
      onRefresh={loadData}
      refreshing={refreshing}
      counts={{
        waiting_patients: kpis.waiting_patients,
        emergency_cases: kpis.emergency_cases,
        total_patients: kpis.total_patients,
        doctors_available: kpis.doctors_available,
      }}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboardView
          kpis={kpis}
          liveOps={liveOps}
          onNavigateTab={handleSelectTab}
        />
      )}
      {currentTab === 'queue' && (
        <QueueAdminView
          queue={liveOps.queue}
          onRefresh={loadData}
        />
      )}
      {currentTab === 'triage' && (
        <TriageAdminView />
      )}
      {currentTab === 'patients' && (
        <PatientsAdminView />
      )}
      {currentTab === 'doctors' && (
        <DoctorsAdminView onRefreshRoster={loadData} />
      )}
      {currentTab === 'medicines' && (
        <MedicinesAdminView />
      )}
      {currentTab === 'knowledge' && (
        <AIKnowledgeAdminView />
      )}
      {currentTab === 'assistant' && (
        <AIAssistantAdminView />
      )}
      {currentTab === 'analytics' && (
        <AnalyticsAdminView kpis={kpis} />
      )}
      {currentTab === 'audit' && (
        <AuditLogsAdminView />
      )}
      {currentTab === 'health' && (
        <SystemHealthAdminView />
      )}
      {currentTab === 'settings' && (
        <SettingsAdminView />
      )}
    </AdminLayout>
  );
};

export default AdminMainView;
