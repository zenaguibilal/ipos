'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BackupAndRestore } from "@/components/profile/BackupAndRestore";

export default function ProfilePage() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Profil & Paramètres"
                description="Gérez les informations de votre entreprise et vos données."
            />

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Profil de l'Entreprise</TabsTrigger>
                    <TabsTrigger value="backup">Sauvegarde & Restauration</TabsTrigger>
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
                <TabsContent value="backup">
                     <BackupAndRestore />
                </TabsContent>
            </Tabs>
        </div>
    );
}
