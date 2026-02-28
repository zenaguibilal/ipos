'use client';

import { CompanyProfileForm } from '@/components/profile/company-profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackupAndRestore } from '@/components/profile/BackupAndRestore';
import { GoogleSync } from '@/components/profile/GoogleSync';

export default function ProfilePage() {
    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
             <div className="w-full max-w-2xl grid gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Profil de l'Entreprise</CardTitle>
                        <CardDescription>
                            Gérez les informations de votre entreprise pour la facturation et les documents.
                        </CardDescription>
                    </CardHeader>
                    <CompanyProfileForm />
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Synchronisation Google Sheets</CardTitle>
                        <CardDescription>
                            Sauvegardez vos données sur une feuille de calcul Google Sheets via un Web App.
                        </CardDescription>
                    </CardHeader>
                    <GoogleSync />
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Sauvegarde et Restauration Locale</CardTitle>
                        <CardDescription>
                            Gérez les données de votre application. Créez des sauvegardes ou restaurez à partir d'un fichier.
                        </CardDescription>
                    </CardHeader>
                    <BackupAndRestore />
                </Card>
            </div>
        </main>
    );
}
