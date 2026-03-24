'use client';

import { useState, useEffect } from 'react';
import { dataService } from '@/services/data-service';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BreadClientList } from '@/components/bread/BreadClientList';
import { BreadDayView } from '@/components/bread/BreadDayView';
import { BreadStats } from '@/components/bread/BreadStats';
import { Loader2 } from 'lucide-react';
import type { CompanyProfile, BreadOrderWithClient } from '@/lib/types';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function BreadPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const formattedDate = formatDateToYYYYMMDD(currentDate);

    const [breadPriceSetting, setBreadPriceSetting] = useState<CompanyProfile['prix_pain']>();
    const [orders, setOrders] = useState<BreadOrderWithClient[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        dataService.getCompanyProfile().then(profile => setBreadPriceSetting(profile?.prix_pain));
        setOrders([]);
    }, [formattedDate]);

    const handleDateChange = (days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    };

    const isToday = formatDateToYYYYMMDD(new Date()) === formattedDate;

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
                        Veuillez définir un prix pour le pain dans les <Link href="/profile" className="font-bold underline">paramètres</Link> pour pouvoir convertir les commandes en ventes.
                    </AlertDescription>
                </Alert>
            )}

            <BreadStats orders={orders} isLoading={isLoading}/>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    {isLoading ? (
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
