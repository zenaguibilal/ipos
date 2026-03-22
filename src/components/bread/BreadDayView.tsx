'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithClient } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { dataService } from '@/services/data-service';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wheat } from 'lucide-react';

interface BreadDayViewProps {
    orders: BreadOrderWithClient[];
    currentDate: string;
    breadPrice: number;
}

export function BreadDayView({ orders, currentDate, breadPrice }: BreadDayViewProps) {
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [isConverting, setIsConverting] = useState(false);

    const handleToggleSelection = (orderId: number) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const unbilledOrders = orders.filter(o => !o.vente_id);
        if (selectedOrders.size === unbilledOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(unbilledOrders.map(o => o.id!)));
        }
    };
    
    const handleConvertToSales = async () => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande à convertir.");
            return;
        }
        if (breadPrice <= 0) {
            toast.error("Le prix du pain n'est pas défini.", {
                description: "Veuillez le configurer dans la page de profil avant de continuer."
            });
            return;
        }
        
        setIsConverting(true);
        try {
            await dataService.convertBreadOrdersToSales(Array.from(selectedOrders), breadPrice);
            toast.success(`${selectedOrders.size} commande(s) convertie(s) en ventes.`);
            setSelectedOrders(new Set());
        } catch (error: any) {
            toast.error("Erreur lors de la conversion en ventes.", { description: error.message });
        } finally {
            setIsConverting(false);
        }
    };

    const isAllSelected = useMemo(() => {
        const unbilledOrders = orders.filter(o => !o.vente_id);
        return unbilledOrders.length > 0 && selectedOrders.size === unbilledOrders.length;
    }, [orders, selectedOrders]);

    if (orders.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Commandes du Jour</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={Wheat}
                        title="Aucune commande pour aujourd'hui"
                        description="Aucun client n'a de commande récurrente pour ce jour. Vous pouvez en ajouter une manuellement."
                    >
                        <ManualAddDialog currentDate={currentDate} />
                    </EmptyState>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Commandes du Jour</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="select-all-bread" checked={isAllSelected} onCheckedChange={handleSelectAll} />
                        <label htmlFor="select-all-bread" className="text-sm font-medium">
                            Tout sélectionner ({selectedOrders.size})
                        </label>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleConvertToSales} disabled={isConverting || selectedOrders.size === 0}>
                            {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Convertir en Vente
                        </Button>
                        <ManualAddDialog currentDate={currentDate} />
                        <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map(order => (
                            <BreadOrderCard 
                                key={order.id} 
                                order={order}
                                isSelected={selectedOrders.has(order.id!)}
                                onToggleSelection={handleToggleSelection}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
