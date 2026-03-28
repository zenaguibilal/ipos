
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadOrder } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Loader2, Wheat, ShoppingCart, Trash2, Sparkles, PackageCheck, AlertCircle, ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface BreadDayViewProps {
    orders: BreadOrder[];
    currentDate: string;
    onOrdersChange: () => void;
}

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const [selectedOrders, setSelectedOrders] = useState(new Set<string>());
    const [isConverting, setIsConverting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    
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
        if (!isManagerOrAdmin) return;
        setIsGenerating(true);
        try {
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
        if (!isManagerOrAdmin) return;
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
        if (!isManagerOrAdmin || selectedOrders.size === 0) return;
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
        if (!isManagerOrAdmin || selectedOrders.size === 0) return;
        setIsDeleting(true);
        try {
            await api.post('bread/bulk-delete', { uuids: Array.from(selectedOrders) });
            toast.success("Commandes purgées du registre.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur de suppression souveraine.");
        } finally {
            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const unbilledOrdersCount = orders.filter(o => !o.venteUuid).length;
    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    return (
        <>
            <Card className="flex flex-col h-full min-h-[600px] luxury-glass border-white/5 overflow-hidden shadow-2xl">
                <CardHeader className="flex-shrink-0 border-b border-white/5 bg-white/5 p-6 sm:p-8">
                    <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
                        <div className="flex items-center space-x-4">
                            <Checkbox 
                                id="select-all-bread" 
                                checked={isAllSelected} 
                                onCheckedChange={handleSelectAll} 
                                disabled={!isManagerOrAdmin || unbilledOrdersCount === 0}
                                className="h-6 w-6 rounded-lg border-primary/30 data-[state=checked]:bg-primary shadow-sm" 
                            />
                            <div className="flex flex-col gap-1">
                                <label htmlFor="select-all-bread" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground cursor-pointer select-none">
                                    {selectedOrders.size > 0 ? `${selectedOrders.size} flux sélectionné(s)` : 'Sélection collective'}
                                </label>
                                {breadPrice === 0 && (
                                    <Badge variant="destructive" className="h-5 text-[8px] font-black uppercase animate-pulse gap-1.5">
                                        <AlertCircle className="h-2.5 w-2.5" /> Prix unitaire non défini
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 flex-wrap w-full xl:w-auto">
                            {selectedOrders.size > 0 ? (
                                <div className="flex items-center gap-3 w-full sm:w-auto animate-in slide-in-from-right-4 duration-500">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setIsDeleteConfirmOpen(true)} 
                                        disabled={isDeleting} 
                                        className="h-12 px-6 bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Révoker
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleMarkDelivered} 
                                        className="h-12 px-6 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest shadow-sm"
                                    >
                                        <PackageCheck className="h-4 w-4 mr-2" />
                                        Livré
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={handleConvertToSales} 
                                        disabled={isConverting || breadPrice <= 0} 
                                        className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-[0.2em] gap-2 transition-all active:scale-95"
                                    >
                                        {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                        Facturer {selectedOrders.size} Bons
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {isManagerOrAdmin && (
                                        <>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={handleGenerate} 
                                                disabled={isGenerating} 
                                                className="h-12 px-6 rounded-2xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest shadow-sm transition-all"
                                            >
                                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-primary/60" />}
                                                Générer Auto.
                                            </Button>
                                            <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                                        </>
                                    )}
                                    <PrintBreadListDialog orders={orders} currentDate={currentDate}/>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-0 bg-muted/5">
                    <ScrollArea className="h-full">
                        {orders.length === 0 ? (
                            <EmptyState
                                icon={Wheat}
                                title="Registre de distribution vierge"
                                description="Aucune commande n'est programmée pour cette date. Lancez la génération automatique ou ajoutez des bons manuellement."
                                className="py-32"
                            >
                                {isManagerOrAdmin && (
                                    <Button 
                                        onClick={handleGenerate} 
                                        disabled={isGenerating} 
                                        className="rounded-[1.5rem] px-12 h-14 font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isGenerating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5" />}
                                        Initialiser le planning
                                    </Button>
                                )}
                            </EmptyState>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-8 pb-20">
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

            <ConfirmAlertDialog 
                isOpen={isDeleteConfirmOpen} 
                onOpenChange={setIsDeleteConfirmOpen} 
                title="Supprimer les commandes sélectionnées ?" 
                description={`Cette action est irréversible. Vous allez révoquer définitivement ${selectedOrders.size} bon(s) de distribution du registre sikh.`} 
                onConfirm={handleDeleteSelected} 
                confirmText="Confirmer la révocation" 
            />
        </>
    );
}
