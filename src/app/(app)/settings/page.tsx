'use client';

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { StaffManagement } from "@/components/profile/StaffManagement";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { DisplaySettings } from "@/components/profile/DisplaySettings";
import { useIsManagerOrAdmin, useIsAdmin } from "@/stores/appStore";
import { 
    Settings2, Palette, Lock, Users, Database, 
    Zap, Activity, ShieldCheck, Cog
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * @fileOverview Sovereign System Settings Page
 * المركز القيادي التقني للمنظومة - إدارة القواعد و الموظفين و المظهر.
 */

export default function SettingsPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const isAdmin = useIsAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!isManagerOrAdmin) {
            toast.error("Accès Souverain Requis", { 
                description: "Les paramètres système sont réservés aux autorités de gestion." 
            });
            router.replace('/dashboard');
        }
    }, [isManagerOrAdmin, router]);

    if (!isManagerOrAdmin) return null;

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            {/* Sovereign Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Cog className="h-80 w-80 rotate-12" />
                </div>
                
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-[2.5rem] bg-background border-2 border-primary/30 flex items-center justify-center shadow-2xl luxury-glass relative group">
                            <Settings2 className="h-12 w-12 text-primary group-hover:rotate-90 transition-transform duration-1000" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Réglages <span className="text-primary">Système</span></h1>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-60 mt-3 flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
                                iPOS Cloud Management • Authority Console
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 luxury-glass p-2 h-auto bg-muted/20 border-white/5 shadow-inner gap-2">
                    <TabsTrigger value="config" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Activity className="h-4 w-4" /> Métier
                    </TabsTrigger>
                    <TabsTrigger value="display" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Palette className="h-4 w-4" /> Affichage
                    </TabsTrigger>
                    <TabsTrigger value="security" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Lock className="h-4 w-4" /> Sécurité
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Users className="h-4 w-4" /> Personnel
                    </TabsTrigger>
                    <TabsTrigger value="data" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all" disabled={!isAdmin}>
                        <Database className="h-4 w-4" /> Données
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
                    <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                            <CardTitle className="flex items-center gap-4 text-xl font-black uppercase tracking-tight">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Settings2 className="h-6 w-6 text-primary" />
                                </div>
                                Paramètres Métier & Références Marché
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="settings" />
                    </Card>
                </TabsContent>

                <TabsContent value="display" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
                    <DisplaySettings />
                </TabsContent>

                <TabsContent value="security" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
                    <SecuritySettings />
                </TabsContent>

                <TabsContent value="staff" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
                    <StaffManagement />
                </TabsContent>

                <TabsContent value="data" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
                    <DataManagementCard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
