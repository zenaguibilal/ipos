'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Printer, RefreshCw, ListFilter, X, PackageOpen, Check, ShieldAlert, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import type { BreadCustomer, DailyBreadOrder, BreadOrder, CompanyProfile } from '@/lib/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PrintableBreadList } from '@/components/bread/PrintableBreadList';
import BreadStatsCards from '@/components/bread/BreadStatsCards';
import BreadOrderCard from '@/components/bread/BreadOrderCard';
import BreadCustomerDialog from '@/components/bread/BreadCustomerDialog';
import EditOrderDialog from '@/components/bread/EditOrderDialog';
import DeleteCustomerDialog from '@/components/bread/DeleteCustomerDialog';


type StatusFilter = "all" | "not-delivered" | "not-paid";

export default function BreadOrdersPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<BreadOrder | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<BreadCustomer | null>(null);
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingItems, setUpdatingItems] = useState<number[]>([]);
    
    const printableRef = useRef<HTMLDivElement>(null);

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    useEffect(() => {
        const savedDate = localStorage.getItem('bread_selected_date');
        if (savedDate) {
            const parsed = new Date(savedDate);
            if (!isNaN(parsed.valueOf())) setSelectedDate(parsed);
        }
        const savedFilter = localStorage.getItem('bread_status_filter') as StatusFilter;
        if (savedFilter && ['all', 'not-delivered', 'not-paid'].includes(savedFilter)) setStatusFilter(savedFilter);
        
        const savedSearch = localStorage.getItem('bread_search_query');
        if (savedSearch !== null) setSearchQuery(savedSearch);
    }, []);

    useEffect(() => { localStorage.setItem('bread_selected_date', selectedDate.toISOString()); }, [selectedDate]);
    useEffect(() => { localStorage.setItem('bread_status_filter', statusFilter); }, [statusFilter]);
    useEffect(() => { localStorage.setItem('bread_search_query', searchQuery); }, [searchQuery]);

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const breadCustomers = useLiveQuery(() => db.breadCustomers.orderBy('name').toArray());
    const dailyOrders = useLiveQuery(() => db.dailyBreadOrders.where('date').equals(dateString).toArray(), [dateString]);
    const companyProfile = useLiveQuery(() => db.companyProfile.get(1));

    const breadOrders = useMemo<BreadOrder[]>(() => {
        if (!breadCustomers) return [];
        return breadCustomers.map(customer => {
            const dailyOrder = dailyOrders?.find(d => d.breadCustomerId === customer.id);
            return {
                ...customer,
                id: customer.id!,
                todaysOrder: dailyOrder ? { ...dailyOrder, id: dailyOrder.id! } : undefined,
            };
        }).filter(c => c.isActive);
    }, [breadCustomers, dailyOrders]);

    const filteredOrders = useMemo(() => {
        return breadOrders.filter(order => {
            const nameMatch = order.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!nameMatch) return false;
            
            switch (statusFilter) {
                case 'not-delivered': return !(order.todaysOrder?.isDelivered ?? false);
                case 'not-paid': return !(order.todaysOrder?.isPaid ?? false);
                default: return true;
            }
        });
    }, [breadOrders, searchQuery, statusFilter]);
    
    const toggleOrderSelection = useCallback((orderId: number) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            newSet.has(orderId) ? newSet.delete(orderId) : newSet.add(orderId);
            return newSet;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (filteredOrders.length === 0) return;
        setSelectedOrders(prev => 
            prev.size === filteredOrders.length 
                ? new Set() 
                : new Set(filteredOrders.map(o => o.id))
        );
    }, [selectedOrders.size, filteredOrders]);

    const handleUpdateStatus = useCallback(async (order: BreadOrder, field: 'isPaid' | 'isDelivered', value: boolean) => {
        if (!order.id) return;
        setUpdatingItems(prev => [...prev, order.id!]);
        try {
            await dataService.handleBreadOrderStatusUpdate({ order, field, value, dateString });
            toast.success(`Statut pour ${order.name} mis à jour.`);
        } catch (error: any) {
            console.error("Failed to update status:", error);
            toast.error(error.message || "Échec de la mise à jour du statut.");
        } finally {
            setUpdatingItems(prev => prev.filter(id => id !== order.id));
        }
    }, [dateString]);

    const handleResetDay = useCallback(async () => {
        if (!dailyOrders || dailyOrders.length === 0) {
            toast.info("Aucune modification à réinitialiser pour cette date.");
            setIsResetDialogOpen(false);
            return;
        }
        setIsUpdating(true);
        try {
            await dataService.resetBreadOrdersForDay(dateString);
            toast.success("Les commandes du jour ont été réinitialisées.");
        } catch (error: any) {
            console.error("Error resetting day:", error);
            toast.error(error.message || "Erreur lors de la réinitialisation.");
        } finally {
            setIsUpdating(false);
            setIsResetDialogOpen(false);
        }
    }, [dailyOrders, dateString]);
    
    const handleBulkUpdate = useCallback(async (field: 'isPaid' | 'isDelivered', value: boolean) => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins un client.");
            return;
        }
        setIsUpdating(true);
        const selectedCustomers = breadOrders.filter(bo => selectedOrders.has(bo.id));

        try {
            await dataService.bulkUpdateBreadOrders({
                customers: selectedCustomers,
                field,
                value,
                dateString
            });
            toast.success(`${selectedOrders.size} commande(s) mise(s) à jour.`);
            setSelectedOrders(new Set());
        } catch (error: any) {
            console.error("Error in bulk update:", error);
            toast.error(error.message || "Erreur lors de la mise à jour groupée.");
        } finally {
            setIsUpdating(false);
        }
    }, [dateString, breadOrders, selectedOrders]);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = printableRef.current;
    
        if (!printableContent || !receiptElement) {
          toast.error("Erreur: Impossible de préparer le document pour l'impression.");
          return;
        }
    
        printableContent.innerHTML = '';
        printableContent.appendChild(receiptElement.cloneNode(true));
        
        setTimeout(() => { window.print(); }, 100);
    };

    const isLoading = breadCustomers === undefined || dailyOrders === undefined || companyProfile === undefined;
    const breadPrice = companyProfile?.breadPrice ?? 0;
    const isPriceSet = breadPrice > 0;

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Commandes de Pain du Jour</h1>
                    <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes.</p>
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                    {isClient ? (
                        <DatePicker date={selectedDate} setDate={setSelectedDate} />
                    ) : (
                        <Skeleton className="h-10 w-[280px]" />
                    )}
                     <Button variant="outline" onClick={handlePrint} disabled={filteredOrders.length === 0}><Printer className="mr-2 h-4 w-4" />Imprimer la liste</Button>
                     <Button variant="outline" onClick={() => setIsResetDialogOpen(true)} disabled={isUpdating}><RefreshCw className="mr-2 h-4 w-4" />Réinitialiser</Button>
                     <Button onClick={() => setIsCustomerDialogOpen(true)} disabled={isUpdating}><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button>
                </div>
            </div>
            
            <BreadStatsCards orders={filteredOrders} isLoading={isLoading} />
            
            <div className="my-6">
                <Card>
                    <div className="p-4 border-b">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher par nom..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full" />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <ListFilter className="mr-2 h-4 w-4" />
                                        Par Statut
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => setStatusFilter("all")}>Tout</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setStatusFilter("not-delivered")}>Non Livré</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setStatusFilter("not-paid")}>Non Payé</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-muted/50">
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                 checked={selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                                 onCheckedChange={toggleSelectAll}
                                 aria-label="Select all"
                            />
                            <span className="text-sm text-muted-foreground">{selectedOrders.size} / {filteredOrders.length} sélectionné(s)</span>
                             {selectedOrders.size > 0 && (
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="ml-2">
                                            Actions <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onSelect={() => handleBulkUpdate('isDelivered', true)}>Marquer comme Livré</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleBulkUpdate('isDelivered', false)}>Marquer comme Non Livré</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => handleBulkUpdate('isPaid', true)}>Marquer comme Payé</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleBulkUpdate('isPaid', false)}>Marquer comme Non Payé</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             )}
                        </div>
                         <div className="flex gap-2">
                            <Button variant={statusFilter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')}>Tout</Button>
                            <Button variant={statusFilter === 'not-delivered' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('not-delivered')} className="flex items-center gap-1"><X className="h-4 w-4"/>Non Livré</Button>
                            <Button variant={statusFilter === 'not-paid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('not-paid')} className="flex items-center gap-1"><PackageOpen className="h-4 w-4"/>Non Payé</Button>
                        </div>
                    </div>
                </Card>
            </div>
            
             {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                       <Card key={i} className="p-4 space-y-4">
                            <div className="flex justify-between items-center"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-6 w-6" /></div>
                            <Skeleton className="h-8 w-1/3" />
                            <div className="flex justify-between items-center"><Skeleton className="h-5 w-12" /><Skeleton className="h-6 w-12" /></div>
                            <div className="flex justify-between items-center"><Skeleton className="h-5 w-12" /><Skeleton className="h-6 w-12" /></div>
                       </Card>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">
                        {breadCustomers && breadCustomers.length > 0 ? "Aucun client ne correspond à vos filtres." : "Aucun client de pain. Commencez par en ajouter un."}
                    </p>
                </div>
            ) : (
                 <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", isUpdating && "opacity-50 pointer-events-none")}>
                    {filteredOrders.map(order => (
                        <BreadOrderCard
                            key={order.id}
                            order={order}
                            isSelected={selectedOrders.has(order.id)}
                            onSelect={() => toggleOrderSelection(order.id)}
                            onEdit={() => setEditingOrder(order)}
                            onDelete={() => setDeletingCustomer(order)}
                            onUpdateStatus={handleUpdateStatus}
                            isUpdating={updatingItems.includes(order.id)}
                            isPriceSet={isPriceSet}
                        />
                    ))}
                </div>
            )}


        
        <BreadCustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} />
        {editingOrder && (
            <EditOrderDialog
                isOpen={!!editingOrder}
                onOpenChange={() => setEditingOrder(null)}
                order={editingOrder}
                dateString={dateString}
            />
        )}
        {deletingCustomer && (
            <DeleteCustomerDialog
                isOpen={!!deletingCustomer}
                onOpenChange={() => setDeletingCustomer(null)}
                customer={deletingCustomer}
            />
        )}
        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser les commandes du jour ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action supprimera toutes les modifications (quantités, statuts de paiement et de livraison) pour le <span className="font-bold">{format(selectedDate, 'd MMMM yyyy', { locale: fr })}</span>. Les commandes reviendront à leur quantité par défaut.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isUpdating}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetDay} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer et réinitialiser
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="hidden">
            <PrintableBreadList ref={printableRef} orders={filteredOrders} date={selectedDate} companyProfile={companyProfile ?? null} />
        </div>
    </main>
    );
}
