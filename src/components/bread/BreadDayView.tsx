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
    CheckCircle2, Clock, Banknote, ListFilter
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

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
                toast.success(`${result.count} commande(s) générée(s) مع النجاح.`);
                onOrdersChange();
            } else {
                toast.info("Aucune commande à générer. Tous les clients programmés sont déjà enregistrés.");
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
            toast.error("Prix du pain non configuré.", { description: "Veuillez le régler dans Profil > Paramètres." });
            return;
        }
        
        setIsConverting(true);
        try {
            await api.post('bread/convert-to-sales', { orderUuids: Array.from(selectedOrders), breadPrice });
            toast.success(`${selectedOrders.size} commande(s) transformée(s) en factures m.a.c.`);
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error: any) {
            toast.error("Erreur lors de la facturation souveraine.");
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
            toast.success("Statut de livraison mis à jour.");
            setSelectedOrders(new Set());
            onOrdersChange();
        } catch (error) {
            toast.error("Erreur de mise à jour des flux.");
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

    const unbilledOrdersCount = filteredOrders.filter(o => !o.venteUuid).length;
    const isAllSelected = unbilledOrdersCount > 0 && selectedOrders.size === unbilledOrdersCount;

    return (
        <div className="space-y-6">
            <Card className="flex flex-col h-full min-h-[600px] luxury-glass border-white/5 overflow-hidden shadow-2xl">
                <CardHeader className="flex-shrink-0 border-b border-white/5 bg-white/5 p-6 sm:p-8 space-y-6">
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
                                    {selectedOrders.size > 0 ? `${selectedOrders.size} flux sélectionné(s)` : 'Sélection Collective'}
                                </label>
                                {breadPrice === 0 && (
                                    <Badge variant="destructive" className="h-5 text-[8px] font-black uppercase animate-pulse gap-1.5 px-3">
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
                                    <PrintBreadListDialog orders={filteredOrders} currentDate={currentDate}/>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-grow group w-full">
                            <div className="absolute inset-0 bg-primary/5 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <Input 
                                placeholder="Rechercher une livraison (Client, Lieu...)"
                                className="pl-11 h-12 luxury-glass rounded-xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto luxury-glass p-1.5 bg-muted/20 border-white/5 shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-[10px] gap-3 px-5 uppercase tracking-widest">
                                        <ListFilter className="h-3.5 w-3.5 text-primary" />
                                        {statusFilter === 'all' ? 'Tous les flux' : statusFilter === 'pending' ? 'À livrer' : statusFilter === 'delivered' ? 'Livré / Non M.A.C' : 'Facturé'}
                                        <X className="h-3 w-3 opacity-20" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="luxury-glass min-w-[200px] p-2">
                                    <DropdownMenuLabel className="text-[9px] uppercase font-black opacity-50 px-2 py-1.5 tracking-widest">Audit par État</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatusFilter)}>
                                        <DropdownMenuRadioItem value="all" className="font-bold py-2.5 rounded-lg text-xs">Vue Panoramique (Tout)</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="pending" className="font-bold py-2.5 rounded-lg text-xs flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-orange-400" /> Flux en attente
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="delivered" className="font-bold py-2.5 rounded-lg text-xs flex items-center gap-2">
                                            <PackageCheck className="h-3 w-3 text-blue-400" /> Livré • Non encaissé
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="billed" className="font-bold py-2.5 rounded-lg text-xs flex items-center gap-2">
                                            <Banknote className="h-3 w-3 text-chart-quaternary" /> Archivé • Facturé
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-0 bg-muted/5">
                    <ScrollArea className="h-full">
                        {filteredOrders.length === 0 ? (
                            <EmptyState
                                icon={Wheat}
                                title={searchQuery || statusFilter !== 'all' ? "Aucun résultat trouvé" : "Registre de distribution vierge"}
                                description={searchQuery || statusFilter !== 'all' ? "Ajustez vos filtres ou votre recherche pour explorer le planning." : "Aucune commande n'est programmée pour cette date. Lancez la génération automatique."}
                                className="py-32"
                            >
                                {isManagerOrAdmin && !searchQuery && statusFilter === 'all' && (
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
                description={`Êtes-vous certain de vouloir supprimer ces ${selectedOrders.size} bon(s) de distribution ? Cette action est irréversible و ستختفي من سجل التوزيع السحابي.`} 
                onConfirm={handleDeleteSelected} 
                confirmText="Révoker définitivement" 
            />
        </div>
    );
}
