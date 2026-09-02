import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

/**
 * ForgotPasswordView Component
 * Account Recovery & Security Reset View
 */
export const ForgotPasswordView = () => {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-10 px-4">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <AuthCard
        title="Password Recovery"
        subtitle="Reset your hospital staff credentials via two-factor email verification."
        maxWidth="max-w-lg"
      >
        <ForgotPasswordForm />
      </AuthCard>
    </div>
  );
};

export default ForgotPasswordView;
