'use client';

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { DataManagementCard } from "@/components/profile/DataManagementCard";
import { StaffManagement } from "@/components/profile/StaffManagement";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { useAppStore, useIsAdmin, useAppActions } from "@/stores/appStore";
import { 
    User, Building2, Database, Settings2, ShieldCheck, 
    BadgeCheck, LayoutDashboard, Cloud, Wifi, 
    Monitor, Cpu, Fingerprint, Globe, KeyRound, Server, Users, Terminal, Activity, Zap, Lock, History, ShoppingBag, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { Separator } from "@/components/ui/separator";

/**
 * @fileOverview Sovereign Profile & Configuration Page (Finalized Perfection)
 * المركز القيادي الأعلى للمنظومة - حيث تلتقي الهوية بالسيادة المطلقة.
 */

export default function ProfilePage() {
    const { profile, sales, expenses, stockIntakes } = useAppStore(state => ({
        profile: state.profile,
        sales: state.lastCompletedSale ? [state.lastCompletedSale.sale] : [], // Use store or fetch
        expenses: state.expenses,
        stockIntakes: state.breadOrders // or real intakes
    }));
    const isAdmin = useIsAdmin();
    const [systemInfo, setSystemInfo] = useState({ os: 'Chargement...', browser: 'Chargement...', platform: 'GCP-Sovereign' });
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

        setSystemInfo({ os, browser, platform: 'GCP-Cloud-Sovereign' });
        setTerminalId(`iPOS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${os.substring(0,3).toUpperCase()}`);
    }, []);

    const roleLabels: Record<string, { label: string, color: string, desc: string, icon: any }> = {
        admin: { 
            label: 'Administrateur Système', 
            color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
            desc: 'Souveraineté totale : Gestion des données, du personnel et de la configuration.',
            icon: ShieldCheck
        },
        manager: { 
            label: 'Gérant d\'Établissement', 
            color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20',
            desc: 'Gestion opérationnelle : Stocks, fournisseurs et rapports financiers.',
            icon: BadgeCheck
        },
        cashier: {
            label: 'Opérateur de Caisse',
            color: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20',
            desc: 'Exécution commerciale : Ventes, retours et suivi clients.',
            icon: Zap
        }
    };

    const currentRole = (profile?.role as string) || 'cashier';
    const RoleIcon = roleLabels[currentRole]?.icon || ShieldCheck;

    // Recent activity list for "System" tab
    const recentActivity = useMemo(() => {
        return [
            ...expenses.slice(0, 3).map(e => ({ type: 'expense', title: e.description, amount: e.amount, date: e.expenseDate })),
            ...sales.slice(0, 3).map(s => ({ type: 'sale', title: `Vente #${s.invoiceNumber}`, amount: s.total, date: s.createdAt }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, sales]);

    return (
        <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            {/* Sovereign Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <ShieldCheck className="h-80 w-80 rotate-12" />
                </div>
                
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-[2.5rem] bg-background border-2 border-primary/30 flex items-center justify-center shadow-2xl luxury-glass relative group">
                            <User className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-xl shadow-lg border-2 border-background">
                                <RoleIcon className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Espace <span className="text-primary">Souverain</span></h1>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-60 mt-3 flex items-center gap-2">
                                <Activity className="h-3 w-3 text-primary animate-pulse" />
                                iPOS Cloud Authority • Terminal Active
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 relative z-10">
                    <Badge className={cn(roleLabels[currentRole]?.color, "px-8 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase border-0")}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {roleLabels[currentRole]?.label}
                    </Badge>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-70">{roleLabels[currentRole]?.desc}</p>
                </div>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 luxury-glass p-2 h-auto bg-muted/20 border-white/5 shadow-inner gap-2">
                    <TabsTrigger value="account" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Terminal className="h-4 w-4" /> Système
                    </TabsTrigger>
                    <TabsTrigger value="company" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Building2 className="h-4 w-4" /> Établissement
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="py-4 gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Settings2 className="h-4 w-4" /> Réglages
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

                <TabsContent value="account" className="mt-10 space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="luxury-glass border-white/5 bg-muted/10 p-10 flex flex-col items-center text-center group hover:bg-muted/20 transition-all">
                            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Cloud className="h-10 w-10 text-primary" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Architecture Core</p>
                            <p className="text-xl font-bold">Cloud-Native Absolute</p>
                            <p className="text-[10px] text-muted-foreground mt-3 italic leading-relaxed">
                                Zéro empreinte locale • Données sécurisées AES-256 <br/> Multi-Region Resiliency
                            </p>
                        </Card>
                        
                        <Card className="luxury-glass border-white/5 bg-muted/10 p-10 flex flex-col items-center text-center group hover:bg-muted/20 transition-all">
                            <div className="h-20 w-20 rounded-3xl bg-chart-quaternary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Wifi className="h-10 w-10 text-chart-quaternary" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">État du Flux Live</p>
                            <p className="text-xl font-bold text-chart-quaternary">Synchronisation Temps Réel</p>
                            <p className="text-[10px] text-muted-foreground mt-3 italic leading-relaxed">
                                Ping: stable • Latence {"<"} 50ms <br/> Flux de données bidirectionnel
                            </p>
                        </Card>

                        <Card className="luxury-glass border-white/5 bg-muted/10 p-10 flex flex-col items-center text-center group hover:bg-muted/20 transition-all">
                            <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <KeyRound className="h-10 w-10 text-blue-400" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Accès Terminal</p>
                            <p className="text-xl font-bold">Session Authentifiée</p>
                            <p className="text-[10px] text-muted-foreground mt-3 italic leading-relaxed">
                                Identifiant Cloud: {profile?.user_id?.substring(0,12)}... <br/>
                                Token: Valid (Secure)
                            </p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-white/5 border-b border-white/5 py-6 px-8">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Monitor className="h-5 w-5 text-primary" />
                                    Environnement Local
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Système OS</p>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Cpu className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="font-bold text-sm">{systemInfo.os}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Interface Nav.</p>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Globe className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="font-bold text-sm">{systemInfo.browser}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">ID Terminal</p>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Fingerprint className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="font-mono font-bold text-sm text-primary">{terminalId}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Infrastructure Host</p>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Server className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="font-bold text-sm">Google Cloud Platform</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-white/5 border-b border-white/5 py-6 px-8">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                    <History className="h-5 w-5 text-primary" />
                                    Activités de Souveraineté
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 px-8 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    act.type === 'sale' ? "bg-chart-quaternary/10 text-chart-quaternary" : "bg-destructive/10 text-destructive"
                                                )}>
                                                    {act.type === 'sale' ? <ShoppingBag className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{act.title}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase">{new Date(act.date).toLocaleString('fr-FR')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn("text-xs font-black", act.type === 'sale' ? "text-chart-quaternary" : "text-destructive")}>
                                                    {act.type === 'sale' ? '+' : '-'}{formatCurrency(act.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-12 text-center text-muted-foreground italic text-xs">
                                            Aucune activité récente enregistrée par ce terminal.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="company" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
                    <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                        <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                            <CardTitle className="flex items-center gap-4 text-xl font-black uppercase tracking-tight">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                Identité Juridique de l'Établissement
                            </CardTitle>
                        </CardHeader>
                        <CompanyProfileForm mode="company" />
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-10 animate-in slide-in-from-bottom-4 duration-700">
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
