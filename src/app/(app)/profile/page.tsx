
'use client';

import { useUser } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalProfileForm } from '@/components/profile/personal-profile-form';
import { CompanyProfileForm } from '@/components/profile/company-profile-form';

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading || !user) {
        return (
            <div className="flex h-full items-center justify-center">
                <p>Chargement du profil...</p>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
             <Tabs defaultValue="personal" className="w-full max-w-2xl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Profil Personnel</TabsTrigger>
                    <TabsTrigger value="company">Profil de l'Entreprise</TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                   <PersonalProfileForm user={user} />
                </TabsContent>
                <TabsContent value="company">
                    <CompanyProfileForm user={user} />
                </TabsContent>
            </Tabs>
        </main>
    );
}
