
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrder } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Loader2, Wheat, ShoppingCart, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/stores/appStore';

interface BreadDayViewProps {
    orders: BreadOrder[];
    currentDate: string;
    onOrdersChange: () => void;
}

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const [selectedOrders, setSelectedOrders] = useState(new Set<string>());
    const [isConverting, setIsConverting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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
            toast.success(`${selectedOrders.size} commande(s) enregistrée(s) comme ventes.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur lors de la conversion.", { description: error.message });
        } finally {
            setIsConverting(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedOrders.size === 0) return;
        setIsDeleting(true);
        try {
            await breadService.bulkDeleteOrders(Array.from(selectedOrders));
            toast.success("Commandes supprimées.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Échec de la suppression.");
        } finally {
            setIsDeleting(false);
        }
    }

    const unbilledOrdersCount = orders.filter(o => !o.venteUuid).length;
    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    if (orders.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Commandes du Jour</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={Wheat}
                        title="Aucune commande pour ce jour"
                        description="Ajoutez des commandes manuellement pour commencer le suivi."
                    >
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                    </EmptyState>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="flex flex-col h-full min-h-[500px]">
            <CardHeader className="flex-shrink-0 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="select-all-bread" checked={isAllSelected} onCheckedChange={handleSelectAll} />
                        <label htmlFor="select-all-bread" className="text-sm font-medium">
                            Tout sélectionner ({selectedOrders.size})
                        </label>
                    </div>
                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                        {selectedOrders.size > 0 && (
                            <>
                                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    <span className="ml-2 hidden sm:inline">Supprimer</span>
                                </Button>
                                <Button size="sm" onClick={handleConvertToSales} disabled={isConverting}>
                                    {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                    <span className="ml-2">Convertir en Vente</span>
                                </Button>
                            </>
                        )}
                        <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                        <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-h-0 p-4">
                <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map(order => (
                            <BreadOrderCard 
                                key={order.uuid} 
                                order={order}
                                isSelected={selectedOrders.has(order.uuid)}
                                onToggleSelection={handleToggleSelection}
                                onUpdate={onOrdersChange}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
