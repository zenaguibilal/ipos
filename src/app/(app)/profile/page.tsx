'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { BackupAndRestore } from "@/components/profile/BackupAndRestore";
import { User, Database } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Profil & Paramètres</h1>
                <p className="text-muted-foreground">Gérez les informations de votre entreprise et les données de l'application.</p>
            </header>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Profil de l'entreprise
                    </TabsTrigger>
                    <TabsTrigger value="data">
                        <Database className="mr-2 h-4 w-4" />
                        Sauvegarde & Restauration
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations sur l'entreprise</CardTitle>
                            <CardDescription>
                                Ces informations seront utilisées sur les reçus et autres documents.
                            </CardDescription>
                        </CardHeader>
                        <CompanyProfileForm />
                    </Card>
                </TabsContent>
                <TabsContent value="data">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gestion des données</CardTitle>
                            <CardDescription>
                                Sauvegardez vos données localement ou restaurez-les à partir d'un fichier.
                            </CardDescription>
                        </CardHeader>
                        <BackupAndRestore />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
