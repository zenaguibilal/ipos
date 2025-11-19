'use client';

import { SignupForm } from '@/components/auth/signup-form';
import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-center">جار التحميل...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
