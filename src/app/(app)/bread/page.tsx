
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
import { Loader2, ChevronLeft, ChevronRight, Calendar, Users, Wheat, ShieldAlert } from 'lucide-react';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * @fileOverview Bread Management Page (Guarded)
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

    // Role Guard
    useEffect(() => {
        if (profile && !isManagerOrAdmin) {
            toast.error("Accès restreint", { description: "La gestion de la boulangerie est réservée aux gérants." });
            router.replace('/sell');
        }
    }, [profile, isManagerOrAdmin, router]);

    useEffect(() => {
        if (isManagerOrAdmin) refreshBreadOrders(formattedDate);
    }, [formattedDate, refreshBreadOrders, isManagerOrAdmin]);

    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const isToday = formatDateToYYYYMMDD(new Date()) === formattedDate;

    if (!profile || !isManagerOrAdmin) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <ShieldAlert className="h-12 w-12 text-primary animate-pulse" />
                <h2 className="text-xl font-black uppercase tracking-widest">Vérification des Décrets...</h2>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full animate-in fade-in duration-500">
            <PageHeader 
                title="Gestion de la Boulangerie"
                description="Automatisation des commandes récurrentes et suivi des distributions."
            />

            <Tabs defaultValue="distribution" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 luxury-glass p-1 h-12 bg-muted/20">
                    <TabsTrigger value="distribution" className="gap-2 rounded-xl font-bold">
                        <Wheat className="h-4 w-4" />
                        Distribution
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="gap-2 rounded-xl font-bold">
                        <Users className="h-4 w-4" />
                        Base Clients
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="distribution" className="space-y-6 outline-none">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)} className="rounded-xl"><ChevronLeft className="h-4 w-4"/></Button>
                            <div className="px-4 text-center">
                                <h2 className="text-lg font-bold capitalize">
                                    {format(currentDate, 'EEEE d MMMM', { locale: fr })}
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{format(currentDate, 'yyyy')}</p>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => handleDateChange(1)} className="rounded-xl"><ChevronRight className="h-4 w-4"/></Button>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button 
                                variant={isToday ? "secondary" : "outline"} 
                                onClick={() => setCurrentDate(new Date())} 
                                disabled={isToday}
                                className="flex-1 sm:flex-none rounded-xl"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Aujourd'hui
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <BreadStats orders={breadOrders} isLoading={isLoading}/>

                        <div className="flex flex-col">
                            {isLoading && breadOrders.length === 0 ? (
                                <div className="flex justify-center items-center h-64 luxury-glass">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

                <TabsContent value="clients" className="h-[calc(100vh-250px)] outline-none">
                    <BreadClientList onListChange={() => refreshBreadOrders(formattedDate)} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
