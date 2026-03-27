'use client';

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { StaffManagement } from "@/components/profile/StaffManagement";
import { useAppStore, useIsAdmin } from "@/stores/appStore";
import { 
    User, Building2, Database, Settings2, ShieldCheck, 
    BadgeCheck, LayoutDashboard, Cloud, Wifi, 
    Monitor, Cpu, Fingerprint, Globe, KeyRound, Server, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * @fileOverview Sovereign Profile & Configuration Page
 * المركز القيادي لإعدادات المنظومة وتخصيص هوية المؤسسة.
 */

export default function ProfilePage() {
    const { profile } = useAppStore();
    const isAdmin = useIsAdmin();
    const [systemInfo, setSystemInfo] = useState({ os: 'Chargement...', browser: 'Chargement...' });

    useEffect(() => {
        const ua = typeof window !== 'undefined' ? window.navigator.userAgent : "";
        let os = "Inconnu";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "macOS";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("like Mac") !== -1) os = "iOS";

        let browser = "Inconnu";
        if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";
        else if (ua.indexOf("Edge") !== -1) browser = "Edge";

        setSystemInfo({ os, browser });
    }, []);

    const roleLabels: Record<string, { label: string, color: string }> = {
        admin: { 
            label: 'Administrateur Système', 
            color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
        },
        manager: { 
            label: 'Gérant d\'Établissement', 
            color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
        },
        cashier: {
            label: 'Opérateur de Caisse',
            color: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
        }
    };

    const currentRole = profile?.role || 'admin';

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-20">
            <PageHeader 
                title="Configuration Système"
                description="Gérez les paramètres métier et l'identité souveraine de votre établissement."
            />

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 luxury-glass p-1.5 h-auto bg-muted/20 border-white/5 shadow-inner">
                    <TabsTrigger value="account" className="py-3 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <User className="h-3.5 w-3.5" /> Système
                    </TabsTrigger>
                    <TabsTrigger value="company" className="py-3 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Building2 className="h-3.5 w-3.5" /> Établissement
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="py-3 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Settings2 className="h-3.5 w-3.5" /> Réglages
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="py-3 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Users className="h-3.5 w-3.5" /> Personnel
                    </TabsTrigger>
                    <TabsTrigger value="data" className="py-3 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all" disabled={!isAdmin}>
                        <Database className="h-3.5 w-3.5" /> Données
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 pb-8">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="h-28 w-28 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center shadow-inner relative group">
                                    <User className="h-14 w-14 text-primary group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute -bottom-2 -right-2 bg-background border border-primary/20 p-2 rounded-xl shadow-lg">
                                        <BadgeCheck className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-4 flex-grow text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <h3 className="text-4xl font-black uppercase tracking-tighter">Terminal iPOS</h3>
                                        <Badge className={cn(roleLabels[currentRole]?.color || "bg-primary", "px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase")}>
                                            <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                            {roleLabels[currentRole]?.label || 'Souverain'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-muted-foreground font-bold">
                                        <span className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                            <Wifi className="h-4 w-4 text-chart-quaternary" /> Status: Accès Direct Live
                                        </span>
                                        <span className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                            <KeyRound className="h-4 w-4 text-primary" /> Session: Authentifiée
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-10 pb-10">
                            <div className="max-w-3xl mx-auto space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-[2rem] bg-muted/20 border border-white/5 flex flex-col items-center text-center group hover:bg-muted/30 transition-all">
                                        <LayoutDashboard className="h-8 w-8 text-primary mb-3 opacity-50 group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Accès Système</p>
                                        <p className="text-base font-bold">Permanent Solaire</p>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-muted/20 border border-white/5 flex flex-col items-center text-center group hover:bg-muted/30 transition-all">
                                        <Cloud className="h-8 w-8 text-primary mb-3 opacity-50 group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Synchronisation</p>
                                        <p className="text-base font-bold">Cloud-Native Live</p>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-muted/20 border border-white/5 flex flex-col items-center text-center group hover:bg-muted/30 transition-all">
                                        <Server className="h-8 w-8 text-primary mb-3 opacity-50 group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Infrastructure</p>
                                        <p className="text-base font-bold">Hybride Sécurisé</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-2">
                                        <Monitor className="h-4 w-4 text-primary" />
                                        État du Système Local & Environnement
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-muted/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:border-primary/20 transition-all">
                                            <Cpu className="h-5 w-5 text-muted-foreground opacity-50" />
                                            <span className="text-xs font-black uppercase tracking-tighter">{systemInfo.os}</span>
                                        </div>
                                        <div className="p-4 bg-muted/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:border-primary/20 transition-all">
                                            <Globe className="h-5 w-5 text-muted-foreground opacity-50" />
                                            <span className="text-xs font-black uppercase tracking-tighter">{systemInfo.browser}</span>
                                        </div>
                                        <div className="p-4 bg-muted/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:border-primary/20 transition-all">
                                            <Fingerprint className="h-5 w-5 text-muted-foreground opacity-50" />
                                            <span className="text-xs font-black uppercase tracking-tighter">Souverain</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="company" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                                <Building2 className="h-5 w-5 text-primary" />
                                Identité Juridique de l'Établissement
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="company" />
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                                <Settings2 className="h-5 w-5 text-primary" />
                                Paramètres Opérationnels & Références
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="settings" />
                    </Card>
                </TabsContent>

                <TabsContent value="staff" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                                <Users className="h-5 w-5 text-primary" />
                                Gestion du Personnel & Rôles
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <StaffManagement />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="data" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    {isAdmin ? <DataManagementCard /> : (
                        <Card className="luxury-glass border-destructive/20 bg-destructive/5 p-12 text-center">
                            <Monitor className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
                            <h4 className="text-lg font-bold text-destructive uppercase">Accès Refusé</h4>
                            <p className="text-sm text-muted-foreground mt-2">
                                Seul un <strong>Administrateur Système</strong> peut manipuler les archives de données.
                            </p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
