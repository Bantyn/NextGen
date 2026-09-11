import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { RegisterForm } from '../components/RegisterForm';

/**
 * RegisterView Component
 * Healthcare Staff Onboarding & Account Registration View
 */
export const RegisterView = () => {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-6 sm:py-10 px-4">
      <AuthCard
        title="Register Hospital Staff"
        subtitle="Create an authorized clinical or administrative profile for Sehat OPD integration."
        maxWidth="max-w-2xl"
      >
        <RegisterForm />
      </AuthCard>
    </div>
  );
};

export default RegisterView;
