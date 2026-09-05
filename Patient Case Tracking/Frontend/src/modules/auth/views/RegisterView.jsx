import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { RegisterForm } from '../components/RegisterForm';

/**
 * RegisterView Component
 * Healthcare Staff Onboarding & Account Registration View
 */
export const RegisterView = () => {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-10 px-4">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

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
