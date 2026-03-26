
'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { BreadOrder } from '@/lib/types';
import { breadService } from '@/services/bread.service';
import { toast } from 'sonner';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const [orders, setOrders] = useState<BreadOrder[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const fetchOrders = useCallback(async (date: string) => {
        setIsLoading(true);
        try {
            const data = await breadService.getOrdersForDate(date);
            setOrders(data);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des commandes.", { description: error.message });
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
                title="Gestion des Commandes de Pain"
                description="Suivi des commandes par nom et quantité."
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}><ChevronLeft className="h-4 w-4"/></Button>
                    <Button 
                        variant={isToday ? "secondary" : "outline"} 
                        onClick={() => setCurrentDate(new Date())} 
                        disabled={isToday}
                        className="min-w-[120px]"
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Aujourd'hui
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}><ChevronRight className="h-4 w-4"/></Button>
                </div>
            </PageHeader>

            <div className="grid gap-6">
                <BreadStats orders={orders} isLoading={isLoading}/>

                <div className="flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                        </h2>
                    </div>
                    
                    {isLoading && !orders ? (
                        <div className="flex justify-center items-center h-64">
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
        </div>
    );
}
