'use client';

import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getFirestore } from 'firebase/firestore';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!auth) {
      setError('خدمة المصادقة غير متوفرة.');
      return;
    }
    
    try {
        const userCredential = await initiateEmailSignUp(auth, email, password);
        
        // This is a non-blocking call, but we need the user to create the document
        // This is a simplified example. In a real app, you might want to wait for the user object to be available
        // via onAuthStateChanged listener before creating the user document.
        if (auth.currentUser) {
            const userDocRef = doc(getFirestore(), "users", auth.currentUser.uid);
            setDocumentNonBlocking(userDocRef, {
                id: auth.currentUser.uid,
                email: auth.currentUser.email,
                createdAt: new Date().toISOString(),
            }, { merge: true });
        }
    } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError('هذا البريد الإلكتروني مستخدم بالفعل.');
        } else if (err.code === 'auth/weak-password') {
            setError('كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.');
        } else {
            setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            console.error(err);
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
            autoComplete="new-password"
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
          إنشاء حساب
        </button>
      </div>
      <div className="text-sm text-center">
        <p>
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            سجل الدخول
          </Link>
        </p>
      </div>
    </form>
  );
}
