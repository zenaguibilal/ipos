'use client';

import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      const redirectUrl = searchParams.get('redirectUrl') || '/dashboard';
      router.push(redirectUrl);
    }
  }, [user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!auth) {
      setError('خدمة المصادقة غير متوفرة.');
      return;
    }
    try {
        await initiateEmailSignIn(auth, email, password);
    } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        } else {
            setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
    }
  };

  if (isUserLoading || user) {
    return <div className="text-center">جار التحميل...</div>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email-address" className="sr-only">
            البريد الإلكتروني
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            كلمة المرور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </button>
      </div>
      <div className="text-sm text-center">
        <p>
          ليس لديك حساب؟{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            أنشئ حسابًا
          </Link>
        </p>
      </div>
    </form>
  );
}
