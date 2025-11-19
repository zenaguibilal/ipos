'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-center">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
