'use client';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Suspense } from 'react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-center">Chargement...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
