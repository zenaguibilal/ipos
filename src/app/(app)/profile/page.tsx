
'use client';

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { useAppStore, useIsManagerOrAdmin } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Building2, Database, Settings2, LogOut, ShieldCheck, Mail, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const { user, profile, actions } = useAppStore();
    const isManagerOrAdmin = useIsManagerOrAdmin();

    const handleSignOut = async () => {
        try {
            await actions.signOut();
            toast.success("Vous avez été déconnecté.");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const roleLabels: Record<string, { label: string, color: string }> = {
        admin: { label: 'Administrateur', color: 'bg-primary text-primary-foreground' },
        manager: { label: 'Gérant', color: 'bg-blue-500 text-white' },
        cashier: { label: 'Caissier', color: 'bg-muted text-muted-foreground' },
    };

    const currentRole = profile?.role || 'cashier';

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
            <PageHeader 
                title="Profil & Paramètres"
                description="Gérez votre identité, les informations de votre entreprise et la sécurité de vos données."
            />

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 luxury-glass p-1 h-auto bg-muted/20">
                    <TabsTrigger value="account" className="py-2 gap-2 rounded-xl font-bold data-[state=active]:bg-background">
                        <User className="h-4 w-4" /> Compte
                    </TabsTrigger>
                    <TabsTrigger value="company" className="py-2 gap-2 rounded-xl font-bold data-[state=active]:bg-background">
                        <Building2 className="h-4 w-4" /> Établissement
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="py-2 gap-2 rounded-xl font-bold data-[state=active]:bg-background">
                        <Settings2 className="h-4 w-4" /> Réglages
                    </TabsTrigger>
                    <TabsTrigger value="data" className="py-2 gap-2 rounded-xl font-bold data-[state=active]:bg-background">
                        <Database className="h-4 w-4" /> Données
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Account Info */}
                <TabsContent value="account" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Informations Personnelles
                            </CardTitle>
                            <CardDescription>Détails de votre session actuelle.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="h-24 w-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner">
                                    <User className="h-12 w-12 text-primary" />
                                </div>
                                <div className="space-y-3 flex-grow text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-3">
                                        <h3 className="text-xl font-black uppercase tracking-tight">{user?.email?.split('@')[0]}</h3>
                                        <Badge className={roleLabels[currentRole].color}>
                                            <ShieldCheck className="h-3 w-3 mr-1" />
                                            {roleLabels[currentRole].label}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" /> {user?.email}</span>
                                        <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" /> ID: {user?.id.substring(0, 12)}...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="bg-white/5" />
                            
                            <div className="bg-muted/30 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs text-muted-foreground italic text-center">
                                    "Vous êtes connecté en tant que <b>{roleLabels[currentRole].label}</b>. Vos permissions d'accès sont définies par ce rôle pour garantir la sécurité du système iPOS."
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-white/5 p-4 flex justify-center md:justify-end border-t border-white/5">
                            <Button variant="destructive" onClick={handleSignOut} className="rounded-xl px-8 shadow-lg shadow-destructive/20 font-bold gap-2">
                                <LogOut className="h-4 w-4" /> Se déconnecter
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Tab: Company Info */}
                <TabsContent value="company" className="mt-6 animate-in fade-in-50 duration-300">
                    <Card className="luxury-glass border-white/5">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Identité de l'Établissement
                            </CardTitle>
                            <CardDescription>
                                Ces informations figureront sur vos tickets de caisse, factures et rapports.
                            </CardDescription>
                        </CardHeader>
                        <CompanyProfileForm mode="company" />
                    </Card>
                </TabsContent>

                {/* Tab: App Settings */}
                <TabsContent value="settings" className="mt-6 animate-in fade-in-50 duration-300">
                    <Card className="luxury-glass border-white/5">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-primary" />
                                Paramètres Opérationnels
                            </CardTitle>
                            <CardDescription>
                                Configurez les valeurs de référence utilisées pour les calculs automatiques.
                            </CardDescription>
                        </CardHeader>
                        <CompanyProfileForm mode="settings" />
                    </Card>
                </TabsContent>

                {/* Tab: Data Management */}
                <TabsContent value="data" className="mt-6 animate-in fade-in-50 duration-300">
                    {isManagerOrAdmin ? (
                        <DataManagementCard />
                    ) : (
                        <Card className="luxury-glass border-destructive/20 bg-destructive/5">
                            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-destructive/10">
                                    <ShieldCheck className="h-12 w-12 text-destructive" />
                                </div>
                                <h3 className="text-xl font-bold text-destructive">Accès Restreint</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Désolé, seul un <b>Administrateur</b> ou un <b>Gérant</b> peut accéder à la gestion des sauvegardes et à la restauration des données.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
