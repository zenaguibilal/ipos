'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { BreadOrder, BreadCustomer, CompanyProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Users, Printer, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { BreadStatsCards } from '@/components/bread/BreadStatsCards';
import { BreadCustomerDialog } from '@/components/bread/BreadCustomerDialog';
import { BreadOrderCard } from '@/components/bread/BreadOrderCard';
import { DeleteCustomerDialog } from '@/components/bread/DeleteCustomerDialog';
import { PrintableBreadList } from '@/components/bread/PrintableBreadList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from 'sonner';

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export default function BreadPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<BreadCustomer | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [isGeneratingSales, setIsGeneratingSales] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    const dateString = formatDate(selectedDate);
    
    // Stable data fetching using a single useLiveQuery with Promise.all
    const { data, isLoading } = useLiveQuery(async () => {
        try {
            const [customers, orders, profile] = await Promise.all([
                dataService.getBreadCustomers(),
                dataService.getDailyBreadOrders(dateString),
                dataService.getCompanyProfile(),
            ]);
            return { customers, orders, profile };
        } catch (error) {
            console.error("Error fetching bread data:", error);
            return { customers: [], orders: [], profile: null, error };
        }
    }, [dateString], { data: { customers: [], orders: [], profile: null }, isLoading: true });

    const { customers, orders, profile } = data.data;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const combinedOrders: BreadOrder[] = useMemo(() => {
        if (!customers || !orders) return [];

        const orderMap = new Map(orders.map(order => [order.breadCustomerId, order]));
        
        return customers
            .filter(c => c.isActive)
            .map(customer => {
                const todaysOrder = orderMap.get(customer.id!);
                const defaultQuantity = dataService.getDefaultBreadQuantityForDay(customer, selectedDate);
                const isModified = todaysOrder ? todaysOrder.quantity !== defaultQuantity : false;
                
                return {
                    ...customer,
                    id: customer.id!,
                    todaysOrder,
                    isModified
                };
            })
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [customers, orders, selectedDate]);
    
    const unassignedCustomers = useMemo(() => {
        if (!customers || !orders) return [];
        const assignedCustomerIds = new Set(orders.map(o => o.breadCustomerId));
        return customers.filter(c => c.isActive && !assignedCustomerIds.has(c.id!));
    }, [customers, orders]);


    const handleEditCustomer = (customer: BreadCustomer) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    };

    const handleAddManualOrder = async (customerId: number, quantity: number) => {
        try {
            await dataService.addManualBreadOrder(customerId, dateString, quantity);
            toast.success("Commande manuelle ajoutée.");
        } catch (e: any) {
            toast.error("Erreur", { description: e.message });
        }
    };

    const handleSelectOrder = (orderId: number) => {
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
        const allSelectableOrders = combinedOrders
            .filter(o => o.todaysOrder && o.todaysOrder.status !== 'paye')
            .map(o => o.todaysOrder!.id!);
            
        if (selectedOrders.size === allSelectableOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(allSelectableOrders));
        }
    };

    const handleGenerateSales = async () => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande à facturer.");
            return;
        }
        setIsGeneratingSales(true);
        try {
            const result = await dataService.generateBreadSales(Array.from(selectedOrders));
            toast.success(`${result.count} vente(s) générée(s) avec succès !`);
            setSelectedOrders(new Set());
        } catch (e: any) {
            toast.error("Erreur lors de la génération des ventes", { description: e.message });
        } finally {
            setIsGeneratingSales(false);
        }
    };

    useEffect(() => {
        if (isPrintMode) {
            setTimeout(() => {
                window.print();
                setIsPrintMode(false);
            }, 100);
        }
    }, [isPrintMode]);

    const pageIsLoading = isLoading || !isMounted;

    return (
        <>
        <div className="p-4 sm:p-6 space-y-6 print-hide">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 luxury-glass p-1 rounded-full">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}><ChevronLeft className="h-5 w-5"/></Button>
                        <Button variant="ghost" className="w-48 hidden sm:block" onClick={() => setSelectedDate(new Date())}>{format(selectedDate, "'Aujourd'hui,' d MMMM", { locale: fr })}</Button>
                        <Button variant="ghost" className="w-28 sm:hidden" onClick={() => setSelectedDate(new Date())}>{format(selectedDate, "d MMM", { locale: fr })}</Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight className="h-5 w-5"/></Button>
                    </div>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsPrintMode(true)}><Printer className="mr-2 h-4 w-4"/> Imprimer</Button>
                    <Button className="w-full sm:w-auto" onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                        <Users className="mr-2 h-4 w-4" /> Gérer les clients
                    </Button>
                </div>
            </header>

            {!profile?.breadPrice && !pageIsLoading && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Prix du pain non configuré !</AlertTitle>
                    <AlertDescription>
                        La génération de factures est désactivée. Veuillez définir un "Prix de vente du pain" dans la page <Link href="/profile" className="font-bold underline">Profil & Paramètres</Link>.
                    </AlertDescription>
                </Alert>
            )}

            <BreadStatsCards orders={orders} />

             <div className="p-3 luxury-glass flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="select-all" 
                        checked={combinedOrders.filter(o => o.todaysOrder && o.todaysOrder.status !== 'paye').length > 0 && selectedOrders.size === combinedOrders.filter(o => o.todaysOrder && o.todaysOrder.status !== 'paye').length}
                        onChange={handleSelectAll}
                        className="h-5 w-5 rounded border-primary text-primary focus:ring-primary"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                        {selectedOrders.size > 0 ? `${selectedOrders.size} sélectionné(s)` : 'Tout sélectionner'}
                    </label>
                </div>
                <Button 
                    onClick={handleGenerateSales} 
                    disabled={isGeneratingSales || selectedOrders.size === 0 || !profile?.breadPrice}
                >
                    {isGeneratingSales ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                    Facturer la sélection
                </Button>
            </div>

            {pageIsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                </div>
            ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {combinedOrders.map(order => (
                        <BreadOrderCard 
                            key={order.id} 
                            order={order} 
                            date={dateString}
                            isSelected={order.todaysOrder ? selectedOrders.has(order.todaysOrder.id!) : false}
                            onSelect={order.todaysOrder ? () => handleSelectOrder(order.todaysOrder!.id!) : undefined}
                        />
                    ))}
                </div>
            )}
            
            <BreadCustomerDialog
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={selectedCustomer}
                unassignedCustomers={unassignedCustomers}
                onAddManualOrder={handleAddManualOrder}
            />
        </div>
        
        {isPrintMode && <PrintableBreadList orders={combinedOrders} date={selectedDate} />}
        </>
    );
}
