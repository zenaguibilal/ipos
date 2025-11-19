'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { usePassword } from "@/components/auth/password-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function ChangePasswordForm() {
    const { changePassword } = usePassword();
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('كلمتا المرور الجديدتان غير متطابقتين.');
            return;
        }
        if (newPassword.length < 4) {
            setError('يجب أن تتكون كلمة المرور الجديدة من 4 أحرف على الأقل.');
            return;
        }

        setIsLoading(true);
        const success = changePassword(currentPassword, newPassword);
        setIsLoading(false);

        if (success) {
            toast({
                title: "تم تغيير كلمة المرور",
                description: "تم تحديث كلمة المرور الخاصة بك بنجاح.",
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError('كلمة المرور الحالية غير صحيحة.');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
            </Button>
        </form>
    )
}


export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
       <div className="grid gap-2">
            <h1 className="text-2xl font-bold tracking-tight">الإعدادات</h1>
            <p className="text-muted-foreground">
                تحكم في إعدادات التطبيق وتفضيلاتك.
            </p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>المظهر</CardTitle>
          <CardDescription>
            قم بتخصيص مظهر التطبيق. قم بالتبديل بين الوضع الفاتح والداكن.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="dark-mode-switch">الوضع الداكن</Label>
            <Switch
              id="dark-mode-switch"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الأمان</CardTitle>
          <CardDescription>
            قم بتغيير كلمة المرور الرئيسية للوصول إلى التطبيق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
