'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!auth) {
      setError('خدمة المصادقة غير متوفرة.');
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        'تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور. يرجى التحقق من بريدك الوارد.'
      );
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.');
      } else {
        setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl">نسيت كلمة المرور؟</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني أدناه وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {message && (
            <p className="text-sm text-green-500 text-center">{message}</p>
          )}
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'جار الإرسال...' : 'إرسال بريد الاستعادة'}
          </Button>
          <p className="text-xs text-center text-gray-400">
            تذكرت كلمة المرور؟{' '}
            <Link href="/login" className="underline">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
