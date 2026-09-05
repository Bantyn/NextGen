import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from '../core/auth';
import { PageLayout, DoctorLayout } from '../components/layout';
import { SmartAssistant } from '../components/SmartAssistant';
import { HomeView } from '../modules/landing/HomeView';
import {
  PatientCheckinView,
  PatientIntakeView,
  PatientSuccessView,
} from '../modules/patient';
import {
  DoctorDashboardView,
  DoctorCaseDetailView,
} from '../modules/doctor';
import {
  LoginView,
  RegisterView,
  ForgotPasswordView,
  UnauthorizedView,
} from '../modules/auth';

/**
 * AppRoutes Component
 * Central client-side routing provider with AuthProvider and RBAC Route Guards.
 */
export const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Patient Kiosk Routes (Wrapped in PageLayout) */}
          <Route
            path="/"
            element={
              <PageLayout>
                <HomeView />
              </PageLayout>
            }
          />
          <Route
            path="/patient"
            element={<Navigate to="/patient/register" replace />}
          />
          <Route
            path="/patient/register"
            element={
              <PageLayout>
                <PatientCheckinView />
              </PageLayout>
            }
          />
          <Route
            path="/patient/intake"
            element={
              <PageLayout>
                <PatientIntakeView />
              </PageLayout>
            }
          />
          <Route
            path="/patient/success"
            element={
              <PageLayout>
                <PatientSuccessView />
              </PageLayout>
            }
          />

          {/* Authentication & Staff Onboarding Routes */}
          <Route
            path="/login"
            element={
              <PageLayout>
                <LoginView />
              </PageLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PageLayout>
                <RegisterView />
              </PageLayout>
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

          {/* Doctor OPD Portal Routes (Guarded by ProtectedRoute with DOCTOR & ADMIN roles) */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                <DoctorLayout>
                  <DoctorDashboardView />
                </DoctorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/cases/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                <DoctorLayout>
                  <DoctorCaseDetailView />
                </DoctorLayout>
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
