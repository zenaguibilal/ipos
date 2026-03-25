
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppStore, useIsManagerOrAdmin } from "@/stores/appStore";
import { DataManagementCard } from "@/components/profile/DataManagementCard";

export default function ProfilePage() {
    const { signOut } = useAppStore(state => state.actions);
    const isManagerOrAdmin = useIsManagerOrAdmin();

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("Vous avez été déconnecté.");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Profil & Paramètres"
                description="Gérez les informations de votre entreprise et votre session."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Informations sur l'entreprise</CardTitle>
                    <CardDescription>
                        Ces informations seront utilisées sur les reçus et autres documents.
                    </CardDescription>
                </CardHeader>
                <CompanyProfileForm />
            </Card>

            {isManagerOrAdmin && <DataManagementCard />}

            <Card>
                <CardHeader>
                    <CardTitle>Session</CardTitle>
                    <CardDescription>
                        Gérez votre session utilisateur.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Vous êtes actuellement connecté. Vous pouvez vous déconnecter en cliquant sur le bouton ci-dessous.</p>
                </CardContent>
                <CardFooter>
                     <Button variant="destructive" onClick={handleSignOut}>Se déconnecter</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
