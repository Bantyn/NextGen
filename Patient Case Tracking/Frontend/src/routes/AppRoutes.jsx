import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PageLayout, DoctorLayout } from '../components/layout';
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

/**
 * AppRoutes Component
 * Central client-side routing provider with separate Layout wrappers for Public Kiosk & Doctor Portal.
 */
export const AppRoutes = () => {
  return (
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

        {/* Doctor OPD Portal Routes (Dedicated Doctor Dashboard Layout) */}
        <Route
          path="/doctor"
          element={
            <DoctorLayout>
              <DoctorDashboardView />
            </DoctorLayout>
          }
        />
        <Route
          path="/doctor/cases/:sessionId"
          element={
            <DoctorLayout>
              <DoctorCaseDetailView />
            </DoctorLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
