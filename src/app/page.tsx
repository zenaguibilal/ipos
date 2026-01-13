
import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';

// This page will now directly render the login form, acting as the entry point.
// The logic to redirect if already logged in is handled inside the login page/component itself.
export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
             <div className="flex min-h-screen items-center justify-center p-4">
                <Suspense fallback={<div className="text-center">Chargement...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}
