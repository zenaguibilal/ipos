'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";

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
    </div>
  );
}
