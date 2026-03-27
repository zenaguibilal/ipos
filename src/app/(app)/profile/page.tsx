
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
    Monitor, Cpu, Fingerprint, Globe, KeyRound, Server, Users, Terminal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * @fileOverview Sovereign Profile & Configuration Page (Finalized)
 * المركز القيادي لإعدادات المنظومة وتخصيص هوية المؤسسة وفرد السلطات.
 */

export default function ProfilePage() {
    const { profile } = useAppStore();
    const isAdmin = useIsAdmin();
    const [systemInfo, setSystemInfo] = useState({ os: 'Chargement...', browser: 'Chargement...' });
    const [terminalId, setTerminalId] = useState('INIT-0000');

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
        setTerminalId(`iPOS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${os.substring(0,3).toUpperCase()}`);
    }, []);

    const roleLabels: Record<string, { label: string, color: string, desc: string }> = {
        admin: { 
            label: 'Administrateur Système', 
            color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
            desc: 'Souveraineté totale : Gestion des données, du personnel et de la configuration.'
        },
        manager: { 
            label: 'Gérant d\'Établissement', 
            color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20',
            desc: 'Gestion opérationnelle : Stocks, fournisseurs et rapports financiers.'
        },
        cashier: {
            label: 'Opérateur de Caisse',
            color: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20',
            desc: 'Exécution commerciale : Ventes, retours et suivi clients.'
        }
    };

    const currentRole = profile?.role || 'cashier';

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                    <ShieldCheck className="h-64 w-64 rotate-12" />
                </div>
                
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-[2rem] bg-background border-2 border-primary/20 flex items-center justify-center shadow-2xl luxury-glass">
                            <User className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Espace <span className="text-primary">Souverain</span></h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60">Configuration & Identité iPOS System</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 relative z-10">
                    <Badge className={cn(roleLabels[currentRole]?.color, "px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border-0")}>
                        <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                        {roleLabels[currentRole]?.label}
                    </Badge>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">{roleLabels[currentRole]?.desc}</p>
                </div>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 luxury-glass p-1.5 h-auto bg-muted/20 border-white/5 shadow-inner gap-1">
                    <TabsTrigger value="account" className="py-4 gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Terminal className="h-3.5 w-3.5" /> Système
                    </TabsTrigger>
                    <TabsTrigger value="company" className="py-4 gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Building2 className="h-3.5 w-3.5" /> Établissement
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="py-4 gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Settings2 className="h-3.5 w-3.5" /> Réglages
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="py-4 gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Users className="h-3.5 w-3.5" /> Personnel
                    </TabsTrigger>
                    <TabsTrigger value="data" className="py-4 gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all" disabled={!isAdmin}>
                        <Database className="h-3.5 w-3.5" /> Données
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="luxury-glass border-white/5 bg-muted/10 p-8 flex flex-col items-center text-center group hover:bg-muted/20 transition-all">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Cloud className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Architecture</p>
                            <p className="text-lg font-bold">Cloud-Native Absolute</p>
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Zéro empreinte locale • Données sécurisées AES-256</p>
                        </Card>
                        
                        <Card className="luxury-glass border-white/5 bg-muted/10 p-8 flex flex-col items-center text-center group hover:bg-muted/20 transition-all">
                            <div className="h-16 w-16 rounded-2xl bg-chart-quaternary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Wifi className="h-8 w-8 text-chart-quaternary" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">État du Flux</p>
                            <p className="text-lg font-bold text-chart-quaternary">Synchronisation Live</p>
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Ping: stable • Flux de données bidirectionnel</p>
                        </Card>

                        <Card className="luxury-glass border-white/5 bg-muted/10 p-8 flex flex-col items-center text-center group hover:bg-muted/20 transition-all">
                            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <KeyRound className="h-8 w-8 text-blue-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Accès Terminal</p>
                            <p className="text-lg font-bold">Session Authentifiée</p>
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Identifiant Cloud: {profile?.user_id?.substring(0,8)}...</p>
                        </Card>
                    </div>

                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-primary" />
                                Environnement de Travail Local
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Système OS</p>
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-primary/50" />
                                        <p className="font-bold">{systemInfo.os}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Interface Nav.</p>
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary/50" />
                                        <p className="font-bold">{systemInfo.browser}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">ID Terminal</p>
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="h-4 w-4 text-primary/50" />
                                        <p className="font-mono font-bold text-primary">{terminalId}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Infrastructure</p>
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-primary/50" />
                                        <p className="font-bold">Google Cloud Platform</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="company" className="mt-8 animate-in slide-in-from-bottom-4 duration-700">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                            <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                Identité Juridique de l'Établissement
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="company" />
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-8 animate-in slide-in-from-bottom-4 duration-700">
                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
                            <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Settings2 className="h-5 w-5 text-primary" />
                                </div>
                                Paramètres Métier & Références Marché
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="settings" />
                    </Card>
                </TabsContent>

                <TabsContent value="staff" className="mt-8 animate-in slide-in-from-bottom-4 duration-700">
                    <StaffManagement />
                </TabsContent>

                <TabsContent value="data" className="mt-8 animate-in slide-in-from-bottom-4 duration-700">
                    <DataManagementCard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
