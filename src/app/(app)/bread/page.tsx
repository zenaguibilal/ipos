'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { Loader2 } from 'lucide-react';
import type { BreadOrderWithClient } from '@/lib/types';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const orders = useLiveQuery<BreadOrderWithClient[]>(
        () => dataService.getBreadOrdersForDate(formattedDate),
        [formattedDate],
        []
    );

    const breadPriceSetting = useLiveQuery(() => dataService.getCompanyProfile().then(p => p?.prix_pain));

    useEffect(() => {
        const checkAndGenerateOrders = async () => {
            setIsLoading(true);
            const ordersExist = await dataService.checkIfBreadOrdersExist(formattedDate);
            if (!ordersExist) {
                setIsGenerating(true);
                try {
                    await dataService.createDayOrders(formattedDate);
                } catch (error) {
                    console.error("Failed to generate daily orders:", error);
                    toast.error("Erreur lors de la génération des commandes du jour.");
                } finally {
                    setIsGenerating(false);
                }
            }
            setIsLoading(false);
        };

        checkAndGenerateOrders();
    }, [formattedDate]);
    
    const handleDateChange = (days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    };

    const isToday = useMemo(() => formatDateToYYYYMMDD(new Date()) === formattedDate, [formattedDate]);

    const showLoadingState = isLoading || isGenerating || orders === undefined;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Gestion des Commandes de Pain"
                description={format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            >
                <Button variant="outline" onClick={() => handleDateChange(-1)}>Précédent</Button>
                <Button variant={isToday ? "secondary" : "outline"} onClick={() => setCurrentDate(new Date())} disabled={isToday}>Aujourd'hui</Button>
                <Button variant="outline" onClick={() => handleDateChange(1)}>Suivant</Button>
            </PageHeader>

            {(breadPriceSetting === undefined || breadPriceSetting === 0) && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Prix du pain non défini !</AlertTitle>
                    <AlertDescription>
                        Veuillez définir un prix pour le pain dans les <a href="/profile" className="font-bold underline">paramètres</a> pour pouvoir convertir les commandes en ventes.
                    </AlertDescription>
                </Alert>
            )}

            <BreadStats orders={orders} />

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    {showLoadingState ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <BreadDayView 
                            orders={orders || []} 
                            currentDate={formattedDate} 
                            breadPrice={breadPriceSetting || 0}
                        />
                    )}
                </div>

                <div className="lg:col-span-1">
                    <BreadClientList />
                </div>
            </div>
        </div>
    );
}
