
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrder } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Loader2, Wheat, ShoppingCart, Trash2, Sparkles, PackageCheck, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface BreadDayViewProps {
    orders: BreadOrder[];
    currentDate: string;
    onOrdersChange: () => void;
}

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const [selectedOrders, setSelectedOrders] = useState(new Set<string>());
    const [isConverting, setIsConverting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
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
        if (selectedOrders.size === unbilledOrders.length && unbilledOrders.length > 0) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(unbilledOrders.map(o => o.uuid)));
        }
    };
    
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Updated to use direct API Wall
            const result = await api.post<{ count: number }>('bread/generate', { date: currentDate });
            if (result.count > 0) {
                toast.success(`${result.count} commande(s) générée(s) avec succès.`);
                onOrdersChange();
            } else {
                toast.info("Aucune commande à générer. Tous les clients programmés ont déjà une commande.");
            }
        } catch (error: any) {
            toast.error("Échec de la génération automatique.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConvertToSales = async () => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande à facturer.");
            return;
        }
        if (breadPrice <= 0) {
            toast.error("Le prix du pain n'est pas configuré.", { description: "Veuillez le régler dans Profil > Paramètres." });
            return;
        }
        
        setIsConverting(true);
        try {
            // Updated to use direct API Wall
            await api.post('bread/convert-to-sales', { orderUuids: Array.from(selectedOrders), breadPrice });
            toast.success(`${selectedOrders.size} commande(s) transformée(s) en factures.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur lors de la facturation.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleMarkDelivered = async () => {
        if (selectedOrders.size === 0) return;
        try {
            for (const uuid of Array.from(selectedOrders)) {
                await api.put(`bread/${uuid}`, { est_livre: true });
            }
            toast.success("Commandes marquées comme livrées.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error) {
            toast.error("Erreur de mise à jour.");
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedOrders.size === 0) return;
        setIsDeleting(true);
        try {
            // Updated to use direct API Wall
            await api.post('bread/bulk-delete', { uuids: Array.from(selectedOrders) });
            toast.success("Commandes supprimées.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur de suppression.");
        } finally {
            setIsDeleting(false);
        }
    };

    const unbilledOrdersCount = orders.filter(o => !o.venteUuid).length;
    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    return (
        <Card className="flex flex-col h-full min-h-[500px] luxury-glass border-white/5 overflow-hidden">
            <CardHeader className="flex-shrink-0 border-b border-white/5 bg-white/5 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex items-center space-x-3">
                        <Checkbox 
                            id="select-all-bread" 
                            checked={isAllSelected} 
                            onCheckedChange={handleSelectAll} 
                            className="h-5 w-5 rounded-md border-primary/30" 
                        />
                        <div className="flex flex-col">
                            <label htmlFor="select-all-bread" className="text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer select-none">
                                {selectedOrders.size > 0 ? `${selectedOrders.size} sélectionné(s)` : 'Tout sélectionner'}
                            </label>
                            {breadPrice === 0 && (
                                <span className="text-[9px] text-destructive font-bold flex items-center gap-1 animate-pulse">
                                    <AlertCircle className="h-2.5 w-2.5" /> Prix du pain non configuré
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap w-full lg:w-auto">
                        {selectedOrders.size > 0 ? (
                            <div className="flex items-center gap-2 w-full lg:w-auto animate-in slide-in-from-right-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleDeleteSelected} 
                                    disabled={isDeleting} 
                                    className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 rounded-xl"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleMarkDelivered} 
                                    className="rounded-xl border-primary/20 bg-primary/5 text-primary"
                                >
                                    <PackageCheck className="h-4 w-4 mr-2" />
                                    Marquer Livré
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleConvertToSales} 
                                    disabled={isConverting} 
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 px-6"
                                >
                                    {isConverting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                                    Facturer ({selectedOrders.size})
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleGenerate} 
                                    disabled={isGenerating} 
                                    className="rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    Générer depuis Récurence
                                </Button>
                                <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                                <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-h-0 p-4 sm:p-6 bg-black/5">
                <ScrollArea className="h-full">
                    {orders.length === 0 ? (
                        <EmptyState
                            icon={Wheat}
                            title="Aucune commande pour ce jour"
                            description="Générez les commandes automatiques ou ajoutez une commande ponctuelle."
                            className="py-24"
                        >
                            <Button 
                                onClick={handleGenerate} 
                                disabled={isGenerating} 
                                className="rounded-xl px-8 h-12 text-lg shadow-lg shadow-primary/20"
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                Lancer la génération
                            </Button>
                        </EmptyState>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
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
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
