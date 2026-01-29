'use client';

import { useUser } from '@/firebase';
import { PersonalProfileForm } from '@/components/profile/personal-profile-form';
import { CompanyProfileForm } from '@/components/profile/company-profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackupAndRestore } from '@/components/profile/BackupAndRestore';

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
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
             <div className="w-full max-w-2xl grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profil Personnel</CardTitle>
                        <CardDescription>
                            Gérez les informations de votre compte personnel.
                        </CardDescription>
                    </CardHeader>
                    <PersonalProfileForm user={user} />
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Profil de l'Entreprise</CardTitle>
                        <CardDescription>
                            Gérez les informations de votre entreprise pour la facturation et les documents.
                        </CardDescription>
                    </CardHeader>
                    <CompanyProfileForm user={user} />
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Sauvegarde et Restauration</CardTitle>
                        <CardDescription>
                            Gérez les données de votre application. Créez des sauvegardes ou restaurez à partir d'un fichier.
                        </CardDescription>
                    </CardHeader>
                    <BackupAndRestore user={user} />
                </Card>
            </div>
        </main>
    );
}
