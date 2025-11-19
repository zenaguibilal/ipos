'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';

function AuthButtons() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <p className="mt-4 text-lg">جار التحميل...</p>;
  }

  return (
    <div className="mt-8 flex gap-4">
      {user ? (
        <Link href="/dashboard" className="rounded-md bg-indigo-600 px-6 py-2 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500">
            الذهاب إلى لوحة التحكم
        </Link>
      ) : (
        <>
          <Link href="/login" className="rounded-md bg-white px-6 py-2 text-lg font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-600 hover:bg-gray-50">
              تسجيل الدخول
          </Link>
          <Link href="/signup" className="rounded-md bg-indigo-600 px-6 py-2 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500">
              إنشاء حساب
          </Link>
        </>
      )}
    </div>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">مشروع جديد</h1>
      <p className="mt-4 text-lg">نحن على استعداد للبدء. ما هي خطوتك التالية؟</p>
      <AuthButtons />
    </div>
  );
}
