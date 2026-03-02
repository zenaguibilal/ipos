'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileForm } from '@/components/profile/company-profile-form';
import { BackupAndRestore } from '@/components/profile/BackupAndRestore';
import { Building, History } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Profil & Paramètres</h1>
                <p className="text-muted-foreground">Gérez les informations de votre entreprise et les données de l'application.</p>
            </header>

            <Tabs defaultValue="profile" className="flex-grow">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">
                        <Building className="mr-2 h-4 w-4" />
                        Profil de l'entreprise
                    </TabsTrigger>
                    <TabsTrigger value="backup">
                        <History className="mr-2 h-4 w-4" />
                        Sauvegarde & Restauration
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations sur l'entreprise</CardTitle>
                            <CardDescription>Mettez à jour les détails qui apparaissent sur les reçus et autres documents.</CardDescription>
                        </CardHeader>
                        <CompanyProfileForm />
                    </Card>
                </TabsContent>
                <TabsContent value="backup" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Sauvegarde et Restauration des Données</CardTitle>
                            <CardDescription>
                                Gérez les données de votre application. Les sauvegardes sont cruciales car toutes les données sont stockées localement sur cet appareil.
                            </CardDescription>
                        </CardHeader>
                        <BackupAndRestore />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
