
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
import { Loader2, ChevronLeft, ChevronRight, Calendar, Users, Wheat } from 'lucide-react';
import type { BreadOrder } from '@/lib/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const [orders, setOrders] = useState<BreadOrder[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const fetchOrders = useCallback(async (date: string) => {
        setIsLoading(true);
        try {
            const data = await api.get<BreadOrder[]>(`bread?date=${date}`);
            setOrders(data);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des commandes.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(formattedDate);
    }, [formattedDate, fetchOrders]);


    const handleDateChange = useCallback((days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    }, []);

    const isToday = formatDateToYYYYMMDD(new Date()) === formattedDate;

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full">
            <PageHeader 
                title="Gestion de la Boulangerie"
                description="Automatisation des commandes récurrentes et suivi des distributions."
            />

            <Tabs defaultValue="distribution" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
                    <TabsTrigger value="distribution" className="gap-2">
                        <Wheat className="h-4 w-4" />
                        Distribution
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="gap-2">
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
                        <BreadStats orders={orders} isLoading={isLoading}/>

                        <div className="flex flex-col">
                            {isLoading && !orders ? (
                                <div className="flex justify-center items-center h-64 luxury-glass">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <BreadDayView 
                                    orders={orders || []} 
                                    currentDate={formattedDate}
                                    onOrdersChange={() => fetchOrders(formattedDate)}
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="clients" className="h-[calc(100vh-250px)] outline-none">
                    <BreadClientList onListChange={() => fetchOrders(formattedDate)} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
