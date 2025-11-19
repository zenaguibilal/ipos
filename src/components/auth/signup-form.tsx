'use client';

import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getFirestore } from 'firebase/firestore';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SignupFormComponent() {
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
        
        if (userCredential.user) {
            const userDocRef = doc(getFirestore(), "users", userCredential.user.uid);
            // We are not including firstName and lastName for now
            setDocumentNonBlocking(userDocRef, {
                id: userCredential.user.uid,
                email: userCredential.user.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl">إنشاء حساب</CardTitle>
          <CardDescription>
            أدخل معلوماتك لإنشاء حساب جديد
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input 
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full">إنشاء حساب</Button>
          <p className="mt-4 text-xs text-center text-gray-400">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className=" underline">
              تسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export function SignupForm() {
  return (
    <Suspense fallback={<div className="text-center">جار التحميل...</div>}>
      <SignupFormComponent />
    </Suspense>
  )
}
