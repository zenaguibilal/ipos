'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrderWithClient, CartItem } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { salesService } from '@/services/sales.service';
import { breadRepository, customerRepository } from '@/repositories';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wheat } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface BreadDayViewProps {
    orders: BreadOrderWithClient[];
    currentDate: string;
    onOrdersChange: () => void;
}

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const [selectedOrders, setSelectedOrders] = new Set<string>();
    const [isConverting, setIsConverting] = useState(false);
    const breadPrice = useAppStore((state) => state.profile?.prix_pain) || 0;

    const handleToggleSelection = (orderUuid: string) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderUuid)) {
                newSet.delete(orderUuid);
            } else {
                newSet.add(orderUuid);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const unbilledOrders = orders.filter(o => !o.venteUuid);
        if (selectedOrders.size === unbilledOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(unbilledOrders.map(o => o.uuid)));
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
            await breadService.convertBreadOrdersToSales(Array.from(selectedOrders), breadPrice);
            toast.success(`${selectedOrders.size} commande(s) convertie(s) en ventes.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur lors de la conversion en ventes.", { description: error.message });
        } finally {
            setIsConverting(false);
        }
    };

    const isAllSelected = useMemo(() => {
        const unbilledOrders = orders.filter(o => !o.venteUuid);
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
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                    </EmptyState>
                </CardContent>
            </Card>
        );
    }
    
    const handleCardChange = () => {
        onOrdersChange();
    };
    
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
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
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                        <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-h-0">
                <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map(order => (
                            <BreadOrderCard 
                                key={order.uuid} 
                                order={order}
                                isSelected={selectedOrders.has(order.uuid)}
                                onToggleSelection={handleToggleSelection}
                                onUpdate={handleCardChange}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
