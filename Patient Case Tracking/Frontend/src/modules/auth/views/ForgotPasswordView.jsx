import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

/**
 * ForgotPasswordView Component
 * Account Recovery & Security Reset View
 */
export const ForgotPasswordView = () => {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-6 sm:py-10 px-4">
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
