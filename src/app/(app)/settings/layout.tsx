
import { SettingsNav } from '@/components/settings/settings-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 p-4 sm:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Paramètres</CardTitle>
                <CardDescription>Gérez les paramètres de votre compte et de votre entreprise.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <aside className="sm:w-1/4 lg:w-1/5">
                        <SettingsNav />
                    </aside>
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
