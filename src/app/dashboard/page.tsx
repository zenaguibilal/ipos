'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmailVerification } from 'firebase/auth';

function VerificationNotice() {
  const { user } = useUser();
  const auth = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  const handleResendVerification = () => {
    if (user && auth) {
      sendEmailVerification(user)
        .then(() => {
          setMessage("تم إرسال بريد تحقق جديد. يرجى التحقق من بريدك الوارد.");
        })
        .catch((error) => {
          setMessage("حدث خطأ أثناء إرسال البريد. يرجى المحاولة مرة أخرى.");
          console.error(error);
        });
    }
  };
  
  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-yellow-500 bg-yellow-500/10 p-3 text-center text-sm">
      <p>بريدك الإلكتروني لم يتم التحقق منه. يرجى التحقق من بريدك الوارد للحصول على رابط التحقق.</p>
      <Button
        variant="link"
        className="h-auto p-0 text-yellow-400"
        onClick={handleResendVerification}
      >
        إعادة إرسال بريد التحقق
      </Button>
      {message && <p className="mt-2 text-xs">{message}</p>}
    </div>
  );
}


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جار التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>أهلاً بك في لوحة التحكم</CardTitle>
          <CardDescription>لقد سجلت الدخول بنجاح.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VerificationNotice />
          <p className="text-center text-muted-foreground">
            بريدك الإلكتروني: {user.email}
          </p>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
          >
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
