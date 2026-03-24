'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { BackupAndRestore } from "@/components/profile/BackupAndRestore";
import { User, Database } from 'lucide-react';
import { PageHeader } from "@/components/layout/PageHeader";

export default function ProfilePage() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Profil & Paramètres"
                description="Gérez les informations de votre entreprise et les données de l'application."
            />

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="data">
                        <Database className="mr-2 h-4 w-4" />
                        Sauvegarde
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
