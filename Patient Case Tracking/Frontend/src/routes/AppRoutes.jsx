import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute, PatientKioskRoute, useAuth } from '../core/auth';
import { ROLES, ROLE_CONFIGS } from '../core/config/roles';
import { PageLayout, DoctorLayout } from '../components/layout';
import { SmartAssistant } from '../components/SmartAssistant';
import { HomeView } from '../modules/landing/HomeView';
import {
  PatientCheckinView,
  PatientIntakeView,
  PatientSuccessView,
  PatientDashboardView,
  PatientLoginView,
} from '../modules/patient';
import {
  DoctorDashboardView,
  DoctorCaseDetailView,
  DoctorArchiveView,
  DoctorAnalyticsView,
  DoctorTemplatesView,
  DoctorLiveOPDView,
  DoctorAppointmentsView,
  DoctorTriageView,
  DoctorPatientsView,
  DoctorConsultationsView,
  DoctorPrescriptionsView,
  DoctorReportsView,
  DoctorNotificationsView,
  DoctorSettingsView,
} from '../modules/doctor';
import {
  LoginView,
  RegisterView,
  ForgotPasswordView,
  UnauthorizedView,
} from '../modules/auth';
import { AdminMainView } from '../modules/admin';

/**
 * PatientIndexRedirect
 * Resolves /patient route based on active authentication and role.
 */
const PatientIndexRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated && role) {
    const target = ROLE_CONFIGS[role]?.defaultRoute || '/patient/dashboard';
    return <Navigate to={target} replace />;
  }
  return <Navigate to="/patient/login" replace />;
};

/**
 * AppRoutes Component
 * Central client-side routing provider with AuthProvider and strict RBAC Route Guards.
 * Mutual exclusivity:
 * - Patient: Can access /patient/dashboard and kiosk routes. Blocked from /doctor/* and /admin/* (redirects to /patient/dashboard).
 * - Doctor: Can access /doctor/* routes. Blocked from /patient/* and /admin/* (redirects to /doctor).
 * - Admin: Can access /admin/* routes. Blocked from /patient/* and /doctor/* (redirects to /admin).
 */
export const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={
              <PageLayout>
                <HomeView />
              </PageLayout>
            }
          />

          {/* Patient Index Route */}
          <Route
            path="/patient"
            element={<PatientIndexRedirect />}
          />

          {/* Patient Auth (If already authenticated, redirects to active role portal) */}
          <Route
            path="/patient/login"
            element={
              <PublicOnlyRoute>
                <PageLayout>
                  <PatientLoginView />
                </PageLayout>
              </PublicOnlyRoute>
            }
          />

          {/* Patient Dashboard (Strictly PATIENT role: Doctors and Admins redirected to their portals) */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <PageLayout>
                  <PatientDashboardView />
                </PageLayout>
              </ProtectedRoute>
            }
          />

          {/* Patient Kiosk Intake Flow (Kiosk users and Patients: Doctors and Admins redirected to their portals) */}
          <Route
            path="/patient/register"
            element={
              <PatientKioskRoute>
                <PageLayout>
                  <PatientCheckinView />
                </PageLayout>
              </PatientKioskRoute>
            }
          />
          <Route
            path="/patient/intake"
            element={
              <PatientKioskRoute>
                <PageLayout>
                  <PatientIntakeView />
                </PageLayout>
              </PatientKioskRoute>
            }
          />
          <Route
            path="/patient/success"
            element={
              <PatientKioskRoute>
                <PageLayout>
                  <PatientSuccessView />
                </PageLayout>
              </PatientKioskRoute>
            }
          />

          {/* Staff Auth Routes (If already authenticated, redirects to active role portal) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <PageLayout>
                  <LoginView />
                </PageLayout>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <PageLayout>
                  <RegisterView />
                </PageLayout>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PageLayout>
                <ForgotPasswordView />
              </PageLayout>
            }
          />
          <Route
            path="/unauthorized"
            element={
              <PageLayout>
                <UnauthorizedView />
              </PageLayout>
            }
          />

          {/* Doctor OPD Portal Routes (Strictly DOCTOR role: Patients and Admins redirected to their portals) */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorDashboardView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/opd"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorLiveOPDView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorAppointmentsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/triage"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorTriageView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorPatientsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/archives"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorArchiveView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/archive"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorArchiveView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consultations"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorConsultationsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/prescriptions"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorPrescriptionsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorReportsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/templates"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorTemplatesView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/analytics"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorAnalyticsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/notifications"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorNotificationsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/messages"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorNotificationsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/settings"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorSettingsView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/cases/:sessionId"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorLayout>
                  <DoctorCaseDetailView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Control Center (Strictly ADMIN role: Patients and Doctors redirected to their portals) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminMainView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminMainView />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        {/* Global Site-Wide Smart AI Assistant */}
        <SmartAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;

