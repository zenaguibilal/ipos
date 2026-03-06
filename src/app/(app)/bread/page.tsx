'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { db } from '@/lib/database';
import { useReactToPrint } from 'react-to-print';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BreadOrder, CompanyProfile, DailyBreadOrder, Sale } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Plus, Printer, Check, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import BreadStatsCards from '@/components/bread/BreadStatsCards';
import BreadOrderCard from '@/components/bread/BreadOrderCard';
import BreadCustomerDialog from '@/components/bread/BreadCustomerDialog';
import DeleteCustomerDialog from '@/components/bread/DeleteCustomerDialog';
import EditOrderDialog from '@/components/bread/EditOrderDialog';
import { PrintableBreadList } from '@/components/bread/PrintableBreadList';
import { toast } from 'sonner';

export default function BreadPage() {
    const [date, setDate] = useState<Date>();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setDate(new Date());
        setIsMounted(true);
    }, []);

    const dateString = useMemo(() => date ? format(date, 'yyyy-MM-dd') : '', [date]);

    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
    const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<BreadOrder | null>(null);
    const [selectedIds, setSelectedIds] = useState(new Set<number>());
    const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
    const [isFinalizing, setIsFinalizing] = useState(false);

    const companyProfile = useLiveQuery<CompanyProfile | undefined>(() => dataService.getCompanyProfile());
    
    const todaysOrders = useLiveQuery(() => {
        if (!dateString) return [];
        return db.dailyBreadOrders.where('date').equals(dateString).toArray();
    }, [dateString]);

    const allCustomers = useLiveQuery(() => db.breadCustomers.where('isActive').equals(1).toArray(), []);
    
    const salesForDate = useLiveQuery(() => {
        if (!dateString) return [];
        return db.sales.where('breadOrderDate').equals(dateString).toArray();
    }, [dateString]);

    const orders = useMemo<BreadOrder[] | undefined>(() => {
        if (allCustomers === undefined || todaysOrders === undefined || salesForDate === undefined) {
            return undefined;
        }

        const ordersMap = new Map(todaysOrders.map(o => [o.breadCustomerId, o]));
        const salesMap = new Map(salesForDate.map(s => [s.id, s]).filter(s => s[0] !== undefined) as [number, Sale][]);

        return allCustomers.map(customer => {
            const todaysOrder = ordersMap.get(customer.id!);
            let finalOrder: (DailyBreadOrder & { saleId?: number }) | undefined = undefined;
            if (todaysOrder) {
                const sale = todaysOrder.saleId ? salesMap.get(todaysOrder.saleId) : undefined;
                finalOrder = { ...todaysOrder, saleId: sale?.id };
            }
            return { ...customer, id: customer.id!, todaysOrder: finalOrder };
        }).sort((a,b) => a.name.localeCompare(b.name));

    }, [allCustomers, todaysOrders, salesForDate]);

    const isLoading = orders === undefined || companyProfile === undefined || !isMounted;

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Commandes-Pain-${dateString}`,
    });

    const handleUpdateStatus = async (orderId: number, field: 'isPaid' | 'isDelivered', value: boolean) => {
        setIsUpdating(prev => ({...prev, [orderId]: true}));
        try {
            await dataService.updateOrderStatus(orderId, dateString, field, value);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour du statut.");
            console.error(error);
        } finally {
            setIsUpdating(prev => ({...prev, [orderId]: false}));
        }
    };

    const handleToggleSelection = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleToggleSelectAll = () => {
        if (orders && selectedIds.size === orders.length) {
            setSelectedIds(new Set());
        } else if (orders) {
            setSelectedIds(new Set(orders.map(o => o.id)));
        }
    };

    const handleFinalizeSales = async () => {
        if (selectedIds.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande à valider.");
            return;
        }
        setIsFinalizing(true);
        try {
            const result = await dataService.finalizeBreadSales(Array.from(selectedIds), dateString);
            toast.success(`${result.count} vente(s) finalisée(s) avec succès !`);
            setSelectedIds(new Set());
        } catch (error: any) {
            console.error(error);
            toast.error("Erreur lors de la finalisation des ventes", { description: error.message });
        } finally {
            setIsFinalizing(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>)}
                </div>
            )
        }

        if (!orders || orders.length === 0) {
            return (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucun client de pain</h3>
                    <p className="text-muted-foreground mt-2">Commencez par ajouter votre premier client pour les commandes de pain.</p>
                     <Button className="mt-4" onClick={() => setIsCustomerDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                    </Button>
                </div>
            )
        }

        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {orders.map(order => (
                    <BreadOrderCard
                        key={order.id}
                        order={order}
                        isSelected={selectedIds.has(order.id)}
                        onSelect={() => handleToggleSelection(order.id)}
                        onEdit={() => { setSelectedOrder(order); setIsEditOrderOpen(true); }}
                        onDelete={() => { setSelectedOrder(order); setIsDeleteCustomerOpen(true); }}
                        onUpdateStatus={(field, value) => handleUpdateStatus(order.id, field, value)}
                        isUpdating={isUpdating[order.id]}
                        isPriceSet={!!companyProfile?.breadPrice && companyProfile.breadPrice > 0}
                    />
                ))}
            </div>
        )
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Gestion des Commandes de Pain</h1>
                    <p className="text-muted-foreground">Suivez les commandes quotidiennes, mettez à jour les statuts et validez les ventes.</p>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button className="w-full sm:w-auto" onClick={() => setIsCustomerDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter Client
                    </Button>
                     <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrint} disabled={!date}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer Liste
                    </Button>
                </div>
            </header>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-card border rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setDate(d => d ? subDays(d, 1) : subDays(new Date(), 1))} disabled={!date}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <DatePicker date={date} setDate={(d) => setDate(d || new Date())} />
                    <Button variant="outline" size="icon" onClick={() => setDate(d => d ? addDays(d, 1) : addDays(new Date(), 1))} disabled={!date}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={() => setDate(new Date())} variant="ghost" size="sm">Aujourd'hui</Button>
            </div>

            {!isLoading && (!companyProfile?.breadPrice || companyProfile.breadPrice <= 0) && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Prix du pain non configuré !</AlertTitle>
                    <AlertDescription>
                        Veuillez définir un "Prix de vente du pain" dans <a href="/profile" className="font-bold underline">Profil & Paramètres</a> pour pouvoir valider les ventes.
                    </AlertDescription>
                </Alert>
            )}
            
            <BreadStatsCards orders={orders} isLoading={isLoading} />

            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-card border rounded-lg p-3">
                <div className="flex items-center gap-3">
                    <Checkbox id="select-all" checked={!isLoading && orders && orders.length > 0 && selectedIds.size === orders.length} onCheckedChange={handleToggleSelectAll} disabled={isLoading || !orders || orders.length === 0} />
                    <label htmlFor="select-all" className="text-sm font-medium">
                        {selectedIds.size > 0 ? `${selectedIds.size} sélectionné(s)` : "Tout sélectionner"}
                    </label>
                </div>
                 <Button onClick={handleFinalizeSales} disabled={selectedIds.size === 0 || isFinalizing || !companyProfile?.breadPrice || companyProfile.breadPrice <= 0}>
                    {isFinalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    {isFinalizing ? 'Validation...' : `Valider ${selectedIds.size} Vente(s)`}
                </Button>
            </div>
            
            <div>{renderContent()}</div>
            
            <div style={{ display: 'none' }}>
                {date && <PrintableBreadList ref={printRef} orders={orders || []} date={date} companyProfile={companyProfile || null} />}
            </div>

            <BreadCustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} />

            {selectedOrder && dateString && (
                <>
                    <EditOrderDialog 
                        isOpen={isEditOrderOpen} 
                        onOpenChange={setIsEditOrderOpen}
                        order={selectedOrder}
                        dateString={dateString}
                    />
                    <DeleteCustomerDialog
                        isOpen={isDeleteCustomerOpen}
                        onOpenChange={setIsDeleteCustomerOpen}
                        customer={selectedOrder}
                    />
                </>
            )}
        </div>
    );
}
