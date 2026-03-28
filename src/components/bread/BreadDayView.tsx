'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadOrder } from '@/lib/types';
import { BreadOrderCard } from './BreadOrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAddDialog } from './ManualAddDialog';
import { PrintBreadListDialog } from './PrintBreadListDialog';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { 
    Loader2, Wheat, ShoppingCart, Trash2, Sparkles, 
    PackageCheck, AlertCircle, Search, Filter, X, 
    CheckCircle2, Clock, ListFilter
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

/**
 * @fileOverview Bread Day View (Nuclear Cleaned)
 * PHASE 16: Verified imports and cleaned action flows.
 */

interface BreadDayViewProps {
    orders: BreadOrder[];
    currentDate: string;
    onOrdersChange: () => void;
}

type OrderStatusFilter = 'all' | 'pending' | 'delivered' | 'billed';

export function BreadDayView({ orders, currentDate, onOrdersChange }: BreadDayViewProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const [selectedOrders, setSelectedOrders] = useState(new Set<string>());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
    
    const [isConverting, setIsConverting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    
    const breadPrice = useAppStore((state) => state.profile?.prix_pain) || 0;

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.orderName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = 
                statusFilter === 'all' ? true :
                statusFilter === 'pending' ? (!order.est_livre && !order.venteUuid) :
                statusFilter === 'delivered' ? (order.est_livre && !order.venteUuid) :
                statusFilter === 'billed' ? !!order.venteUuid : true;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

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
        const selectables = filteredOrders.filter(o => !o.venteUuid);
        if (selectedOrders.size === selectables.length && selectables.length > 0) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(selectables.map(o => o.uuid)));
        }
    };
    
    const handleGenerate = async () => {
        if (!isManagerOrAdmin) return;
        setIsGenerating(true);
        try {
            const result = await api.post<{ count: number }>('bread/generate', { date: currentDate });
            if (result.count > 0) {
                toast.success(`${result.count} commande(s) générée(s).`);
                onOrdersChange();
            } else {
                toast.info("Rien à générer.");
            }
        } catch (error: any) {
            toast.error("Génération échouée.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConvertToSales = async () => {
        if (!isManagerOrAdmin) return;
        if (selectedOrders.size === 0) return;
        if (breadPrice <= 0) {
            toast.error("Définissez le prix du pain dans l'onglet Métier.");
            return;
        }
        
        setIsConverting(true);
        try {
            await api.post('bread/convert-to-sales', { orderUuids: Array.from(selectedOrders), breadPrice });
            toast.success("Conversion en factures terminée.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur de conversion.");
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
            toast.success("Livraisons confirmées.");
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
            toast.success("Suppressions effectuées.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur de suppression.");
        } finally {
            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const unbilledOrdersCount = filteredOrders.filter(o => !o.venteUuid).length;
    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    return (
        <div className="space-y-6">
            <Card className="flex flex-col h-full min-h-[600px] luxury-glass border-white/5 overflow-hidden shadow-2xl bg-muted/5">
                <CardHeader className="flex-shrink-0 border-b border-white/5 bg-white/5 p-6 sm:p-10 space-y-8">
                    <div className="flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-center">
                        <div className="flex items-center space-x-6">
                            <Checkbox 
                                id="select-all-bread" 
                                checked={isAllSelected} 
                                onCheckedChange={handleSelectAll} 
                                disabled={!isManagerOrAdmin || unbilledOrdersCount === 0}
                                className="h-7 w-7 rounded-xl border-primary/30 shadow-lg" 
                            />
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="select-all-bread" className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground cursor-pointer">
                                    {selectedOrders.size > 0 ? `${selectedOrders.size} sélection(s)` : 'Collective'}
                                </label>
                                {breadPrice === 0 && (
                                    <Badge variant="destructive" className="h-5 text-[8px] font-black uppercase animate-pulse gap-1.5 px-3">
                                        <AlertCircle className="h-2.5 w-2.5" /> P.U. NON DÉFINI
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
                                        className="h-14 px-8 bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2.5" /> Révoker
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleMarkDelivered} 
                                        className="h-14 px-8 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest"
                                    >
                                        <PackageCheck className="h-4 w-4 mr-2.5" /> Livré
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={handleConvertToSales} 
                                        disabled={isConverting || breadPrice <= 0} 
                                        className="h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-2xl font-black uppercase text-[10px] tracking-[0.3em] gap-3"
                                    >
                                        {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                        Facturer ({selectedOrders.size})
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 w-full xl:w-auto">
                                    {isManagerOrAdmin && (
                                        <>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={handleGenerate} 
                                                disabled={isGenerating} 
                                                className="h-14 px-8 rounded-2xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest"
                                            >
                                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2.5" /> : <Sparkles className="h-4 w-4 mr-2.5" />}
                                                Auto-Génération
                                            </Button>
                                            <ManualAddDialog currentDate={currentDate} onSuccess={onOrdersChange} />
                                        </>
                                    )}
                                    <PrintBreadListDialog orders={filteredOrders} currentDate={currentDate}/>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <div className="relative flex-grow group w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40" />
                            <Input 
                                placeholder="Rechercher un flux..."
                                className="pl-14 h-14 luxury-glass rounded-2xl bg-background/40 border-white/10 font-bold"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 rounded-xl border-white/5 font-black text-[10px] gap-3 px-6 uppercase">
                                        <ListFilter className="h-3.5 w-3.5 text-primary" />
                                        Audit État
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="luxury-glass min-w-[220px]">
                                    <DropdownMenuLabel className="text-[9px] uppercase font-black opacity-50 px-3 py-2">Filtre Souverain</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatusFilter)}>
                                        <DropdownMenuRadioItem value="all" className="font-bold py-3">Tout</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="pending" className="font-bold py-3">Attente</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="delivered" className="font-bold py-3">Livré</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="billed" className="font-bold py-3">Facturé</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-0">
                    <ScrollArea className="h-full">
                        {filteredOrders.length === 0 ? (
                            <EmptyState
                                icon={Wheat}
                                title="Aucun flux"
                                description="Lancez une génération ou ajustez vos filtres."
                                className="py-40 opacity-30 grayscale"
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 p-10 pb-24">
                                {filteredOrders.map(order => (
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
                title="Révocation Définitive" 
                description={`Êtes-vous certain de vouloir purger ces ${selectedOrders.size} flux de distribution ?`} 
                onConfirm={handleDeleteSelected} 
                confirmText="Révoker" 
            />
        </div>
    );
}