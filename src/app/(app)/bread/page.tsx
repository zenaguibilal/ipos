'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { Loader2 } from 'lucide-react';
import type { BreadOrderWithClient } from '@/lib/types';
import { breadService } from '@/services';
import { useAppStore } from '@/stores/appStore';
import { breadRepository } from '@/repositories';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const orders = useLiveQuery<BreadOrderWithClient[]>(
        () => breadService.getBreadOrdersForDate(formattedDate),
        [formattedDate]
    );

    const companyProfile = useAppStore((state) => state.profile);

    const [isGenerating, setIsGenerating] = useState(false);
    const isLoading = orders === undefined || isGenerating;
    
    // Auto-generate orders for the current day if they don't exist
    useEffect(() => {
        const generate = async () => {
            setIsGenerating(true);
            try {
                const ordersExist = await breadRepository.ordersExistForDate(formattedDate);
                if (!ordersExist) {
                    await breadService.createDayOrders(formattedDate);
                }
            } catch (error) {
                console.error("Failed to generate daily bread orders:", error);
            } finally {
                setIsGenerating(false);
            }
        };
        generate();
    }, [formattedDate]);

    const handleDateChange = (days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    };

    const isToday = formatDateToYYYYMMDD(new Date()) === formattedDate;

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full">
            <PageHeader 
                title="Gestion des Commandes de Pain"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <Button variant="outline" onClick={() => handleDateChange(-1)}>Précédent</Button>
                <Button variant={isToday ? "secondary" : "outline"} onClick={() => setCurrentDate(new Date())} disabled={isToday}>Aujourd'hui</Button>
                <Button variant="outline" onClick={() => handleDateChange(1)}>Suivant</Button>
            </PageHeader>

            <BreadStats orders={orders} isLoading={isLoading}/>

            <div className="grid lg:grid-cols-3 gap-6 items-stretch flex-grow min-h-0">
                <div className="lg:col-span-2 flex flex-col">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <BreadDayView 
                            orders={orders || []} 
                            currentDate={formattedDate}
                        />
                    )}
                </div>

                <div className="lg:col-span-1 flex flex-col">
                    <BreadClientList />
                </div>
            </div>
        </div>
    );
}
