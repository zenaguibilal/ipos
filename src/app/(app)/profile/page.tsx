'use client';

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { useAppStore } from "@/stores/appStore";
import { 
    User, Building2, Database, Settings2, ShieldCheck, 
    BadgeCheck, LayoutDashboard, Cloud, Wifi, 
    Monitor, Cpu, Fingerprint, Globe 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * @fileOverview Profile Page (Domination Mode)
 * Purged: unused variables and imports.
 */

export default function ProfilePage() {
    const { profile } = useAppStore();
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

    const roleLabels: Record<string, { label: string, color: string, description: string }> = {
        admin: { 
            label: 'Administrateur', 
            color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
            description: 'Accès total à toutes les fonctions système.'
        },
        manager: { 
            label: 'Gérant', 
            color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20',
            description: 'Gestion complète des stocks et finances.'
        }
    };

    const currentRole = profile?.role || 'admin';

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-20">
            <PageHeader 
                title="Configuration Système"
                description="Gérez les paramètres métier de votre établissement en mode souverain."
            />

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 luxury-glass p-1.5 h-auto bg-muted/20 border-white/5">
                    <TabsTrigger value="account" className="py-2.5 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <User className="h-3.5 w-3.5" /> Système
                    </TabsTrigger>
                    <TabsTrigger value="company" className="py-2.5 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Building2 className="h-3.5 w-3.5" /> Étabلissement
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="py-2.5 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Settings2 className="h-3.5 w-3.5" /> Réglages
                    </TabsTrigger>
                    <TabsTrigger value="data" className="py-2.5 gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Database className="h-3.5 w-3.5" /> Données
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 pb-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center shadow-inner relative">
                                    <User className="h-12 w-12 text-primary" />
                                    <div className="absolute -bottom-2 -right-2 bg-background border border-primary/20 p-1.5 rounded-xl shadow-lg">
                                        <BadgeCheck className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-3 flex-grow text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-3">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter">Terminal iPOS</h3>
                                        <Badge className={cn(roleLabels[currentRole]?.color || "bg-primary", "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase")}>
                                            <ShieldCheck className="h-3 w-3 mr-1.5" />
                                            {roleLabels[currentRole]?.label || 'Souverain'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground font-bold">
                                        <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                                            <Wifi className="h-4 w-4 text-chart-quaternary" /> Status: Accès Direct
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 pb-8">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 flex flex-col items-center text-center">
                                        <LayoutDashboard className="h-6 w-6 text-primary mb-2 opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Accès Système</p>
                                        <p className="text-sm font-bold">Permanent</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 flex flex-col items-center text-center">
                                        <Cloud className="h-6 w-6 text-primary mb-2 opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Synchronisation</p>
                                        <p className="text-sm font-bold">Temps réel Cloud</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-primary" />
                                        État du Système Local
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-muted/10 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                                            <Cpu className="h-4 w-4 text-muted-foreground opacity-50" />
                                            <span className="text-[11px] font-bold">{systemInfo.os}</span>
                                        </div>
                                        <div className="p-3 bg-muted/10 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                                            <Globe className="h-4 w-4 text-muted-foreground opacity-50" />
                                            <span className="text-[11px] font-bold">{systemInfo.browser}</span>
                                        </div>
                                        <div className="p-3 bg-muted/10 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                                            <Fingerprint className="h-4 w-4 text-muted-foreground opacity-50" />
                                            <span className="text-[11px] font-bold">Souverain</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="company" className="mt-6 animate-in fade-in-50 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                                <Building2 className="h-5 w-5 text-primary" />
                                Identité de l'Établissement
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="company" />
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6 animate-in fade-in-50 duration-500">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                                <Settings2 className="h-5 w-5 text-primary" />
                                Paramètres Opérationnels
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="settings" />
                    </Card>
                </TabsContent>

                <TabsContent value="data" className="mt-6 animate-in fade-in-50 duration-500">
                    <DataManagementCard />
                </TabsContent>
            </Tabs>
        </div>
    );
}