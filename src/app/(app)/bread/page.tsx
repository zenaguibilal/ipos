'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ChevronLeft, ChevronRight, Calendar, Users, Wheat, ShieldAlert, Lock, Activity, ShieldX } from 'lucide-react';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * @fileOverview Bread Management Page (Sovereign Authority - Protected)
 */

export default function BreadPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const [currentDate, setCurrentDate] = useState(new Date());
    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const { profile, breadOrders, isLoading } = useAppStore(state => ({
        profile: state.profile,
        breadOrders: state.breadOrders,
        isLoading: state.isLoading.bread
    }));
    const { refreshBreadOrders } = useAppActions();

    const isAllowed = profile?.permissions?.includes('bread') || isManagerOrAdmin;

    // Absolute Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Accès Souverain Refusé", { 
                description: "Vous ne possédez pas le décret nécessaire pour cette unité.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isAllowed, router]);

    useEffect(() => {
        if (isAllowed) refreshBreadOrders(formattedDate);
    }, [formattedDate, refreshBreadOrders, isAllowed]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const isToday = formatDateToYYYYMMDD(new Date()) === formattedDate;

    if (!profile || !isAllowed) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
                <div className="p-6 bg-destructive/5 rounded-[3rem] border border-destructive/10 shadow-2xl relative overflow-hidden group">
                    <Lock className="h-16 w-16 text-destructive animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-destructive/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint à l'Unité Boulangerie</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader 
                    title="Souveraineté Boulangère"
                    description="Automatisation des commandes récurrentes et suivi des flux de distribution."
                />
                <div className="flex items-center gap-3 luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                        <Activity className="h-3 w-3 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Terminal Actif</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="distribution" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-10 luxury-glass p-1.5 h-14 bg-muted/20 border-white/5 shadow-inner">
                    <TabsTrigger value="distribution" className="gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Wheat className="h-4 w-4" />
                        Distribution Active
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Users className="h-4 w-4" />
                        Abonnés Pain
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="distribution" className="space-y-8 outline-none animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-muted/30 p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)} className="rounded-2xl h-12 w-12 border-white/10 hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                                <ChevronLeft className="h-5 w-5"/>
                            </Button>
                            <div className="px-8 py-2 text-center luxury-glass bg-background/40 min-w-[240px]">
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {format(currentDate, 'EEEE d MMMM', { locale: fr })}
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.4em] mt-0.5 opacity-60">
                                    {format(currentDate, 'yyyy')}
                                </p>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => handleDateChange(1)} className="rounded-2xl h-12 w-12 border-white/10 hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                                <ChevronRight className="h-5 w-5"/>
                            </Button>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button 
                                variant={isToday ? "secondary" : "outline"} 
                                onClick={() => setCurrentDate(new Date())} 
                                disabled={isToday}
                                className="flex-1 sm:flex-none rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95"
                            >
                                <Calendar className="mr-2 h-4 w-4 opacity-50" />
                                Temps Réel
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        <BreadStats orders={breadOrders} isLoading={isLoading}/>

                        <div className="flex flex-col">
                            {isLoading && breadOrders.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-80 luxury-glass border-white/5 space-y-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronisation du Planning...</p>
                                </div>
                            ) : (
                                <BreadDayView 
                                    orders={breadOrders} 
                                    currentDate={formattedDate}
                                    onOrdersChange={() => refreshBreadOrders(formattedDate)}
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="clients" className="h-[calc(100vh-280px)] outline-none animate-in slide-in-from-bottom-4 duration-700">
                    <BreadClientList onListChange={() => refreshBreadOrders(formattedDate)} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
