import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { LoginForm } from '../components/LoginForm';

/**
 * LoginView Component
 * Staff & Physician Portal Authentication View
 */
export const LoginView = () => {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-10 px-4">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

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
