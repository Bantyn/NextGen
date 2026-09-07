import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { LoginForm } from '../components/LoginForm';

/**
 * LoginView Component
 * Staff & Physician Portal Authentication View
 */
export const LoginView = () => {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-6 sm:py-10 px-4">
      <AuthCard
        title="Healthcare Staff Portal"
        subtitle="Sign in to access OPD queues, patient triage records, and clinical consultation tools."
        maxWidth="max-w-lg"
      >
        <LoginForm />
      </AuthCard>
    </div>
  );
};

export default LoginView;
