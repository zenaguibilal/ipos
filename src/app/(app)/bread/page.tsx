'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, doc, writeBatch, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BreadCustomer, DailyBreadOrder, BreadOrder, CompanyProfile } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlusCircle, ArrowLeft, ArrowRight, CalendarIcon, RefreshCw, Printer, Search, ListFilter, Check, Package, AlertTriangle, Receipt, ChevronDown, X, HandCoins, Ban, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BreadCustomerDialog } from '@/components/bread/bread-customer-dialog';
import { DeleteBreadCustomerDialog } from '@/components/bread/delete-bread-customer-dialog';
import { SetOrderDialog } from '@/components/bread/set-order-dialog';
import { BreadOrderRow } from '@/components/bread/BreadOrderRow';
import { BreadOrderRowSkeleton } from '@/components/bread/BreadOrderRowSkeleton';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';


type StatusFilter = 'all' | 'not-delivered' | 'not-paid';

export default function BreadPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isSetOrderDialogOpen, setIsSetOrderDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<BreadCustomer | null>(null);
    const [customerToEdit, setCustomerToEdit] = useState<BreadCustomer | null>(null);
    const [orderToEdit, setOrderToEdit] = useState<BreadOrder | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});

    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // --- Data Fetching ---
    const customersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'breadCustomers'), where('isActive', '==', true), orderBy('name', 'asc')) : null, [user, firestore]);
    const ordersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'dailyBreadOrders'), where('date', '==', dateKey)) : null, [user, firestore, dateKey]);
    const companyProfileRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    
    const { data: breadCustomers, isLoading: isLoadingCustomers } = useCollection<BreadCustomer>(customersQuery);
    const { data: dailyOrders, isLoading: isLoadingOrders } = useCollection<DailyBreadOrder>(ordersQuery);
    const { data: companyProfile, isLoading: isCompanyProfileLoading } = useDoc<CompanyProfile>(companyProfileRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const breadOrders = useMemo<BreadOrder[]>(() => {
        if (!breadCustomers) return [];

        const ordersMap = new Map(dailyOrders?.map(order => [order.breadCustomerId, order]));

        return breadCustomers.map(customer => ({
            ...customer,
            todaysOrder: ordersMap.get(customer.id) ? {
                id: ordersMap.get(customer.id)!.id,
                quantity: ordersMap.get(customer.id)!.quantity,
                isPaid: ordersMap.get(customer.id)!.isPaid,
                isDelivered: ordersMap.get(customer.id)!.isDelivered,
            } : undefined
        }));
    }, [breadCustomers, dailyOrders]);

    const filteredBreadOrders = useMemo(() => {
        return breadOrders.filter(order => {
            const nameMatch = order.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!nameMatch) return false;

            const dailyOrder = order.todaysOrder;
            const quantity = dailyOrder?.quantity ?? order.defaultOrderQuantity;
            if(quantity === 0 && statusFilter !== 'all') return false;

            switch (statusFilter) {
                case 'not-delivered':
                    return !dailyOrder?.isDelivered;
                case 'not-paid':
                    return !dailyOrder?.isPaid;
                case 'all':
                default:
                    return true;
            }
        });
    }, [breadOrders, searchQuery, statusFilter]);

    const { totalOrdered, totalDelivered, totalRemaining, totalCollected, totalDue } = useMemo(() => {
        const price = companyProfile?.breadPrice ?? 0;
        return breadOrders.reduce((acc, order) => {
            const quantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
            acc.totalOrdered += quantity;

            if (order.todaysOrder?.isDelivered) {
                acc.totalDelivered += quantity;
            }
            if (order.todaysOrder?.isPaid) {
                acc.totalCollected += quantity * price;
            }
            if (!order.todaysOrder?.isPaid && quantity > 0) {
                 acc.totalDue += quantity * price;
            }
            
            return acc;
        }, { totalOrdered: 0, totalDelivered: 0, totalRemaining: 0, totalCollected: 0, totalDue: 0 });
    }, [breadOrders, companyProfile]);


    function handleAddCustomer() {
        setCustomerToEdit(null);
        setIsCustomerDialogOpen(true);
    }

    function handleEditCustomer(customer: BreadCustomer) {
        setCustomerToEdit(customer);
        setIsCustomerDialogOpen(true);
    }

    function handleSetOrder(order: BreadOrder) {
        setOrderToEdit(order);
        setIsSetOrderDialogOpen(true);
    }
    
    async function handleUpdateStatus(order: BreadOrder, field: 'isPaid' | 'isDelivered', value: boolean) {
        if (!firestore || !user) return;
        setIsProcessing(true);

        const orderId = order.todaysOrder?.id;
        try {
            if (orderId) {
                const orderRef = doc(firestore, 'users', user.uid, 'dailyBreadOrders', orderId);
                await updateDoc(orderRef, { [field]: value });
            } else {
                const newOrderRef = doc(collection(firestore, 'users', user.uid, 'dailyBreadOrders'));
                const newOrderData: Omit<DailyBreadOrder, 'id'> = {
                    breadCustomerId: order.id,
                    customerName: order.name,
                    date: dateKey,
                    quantity: order.defaultOrderQuantity,
                    isPaid: field === 'isPaid' ? value : false,
                    isDelivered: field === 'isDelivered' ? value : false,
                    createdAt: serverTimestamp(),
                };
                await setDoc(newOrderRef, newOrderData);
            }
            toast.success(`Statut pour ${order.name} mis à jour.`);
        } catch(e) {
            console.error("Failed to update status: ", e);
            toast.error("Erreur lors de la mise à jour du statut.");
        } finally {
            setIsProcessing(false);
        }
    }
    
    function handleMasterCheckboxChange(checked: boolean | 'indeterminate') {
        if (checked) {
            const allIds = filteredBreadOrders.reduce((acc, order) => {
                acc[order.id] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setSelectedOrders(allIds);
        } else {
            setSelectedOrders({});
        }
    }
    
    const selectedCount = Object.values(selectedOrders).filter(Boolean).length;
    const isAllSelected = filteredBreadOrders.length > 0 && selectedCount === filteredBreadOrders.length;
    const isPartiallySelected = selectedCount > 0 && !isAllSelected;

    async function handleBulkUpdate(field: 'isPaid' | 'isDelivered', value: boolean) {
        if (!firestore || !user || selectedCount === 0) return;
        setIsBulkProcessing(true);

        const batch = writeBatch(firestore);
        const selectedIds = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
        const ordersToUpdate = breadOrders.filter(order => selectedIds.includes(order.id));

        for (const order of ordersToUpdate) {
            if (order.todaysOrder?.id) {
                const orderRef = doc(firestore, 'users', user.uid, 'dailyBreadOrders', order.todaysOrder.id);
                batch.update(orderRef, { [field]: value });
            } else {
                const newOrderRef = doc(collection(firestore, 'users', user.uid, 'dailyBreadOrders'));
                const newOrderData: Omit<DailyBreadOrder, 'id'> = {
                    breadCustomerId: order.id,
                    customerName: order.name,
                    date: dateKey,
                    quantity: order.defaultOrderQuantity,
                    isPaid: field === 'isPaid' ? value : false,
                    isDelivered: field === 'isDelivered' ? value : false,
                    createdAt: serverTimestamp(),
                };
                batch.set(newOrderRef, newOrderData);
            }
        }

        try {
            await batch.commit();
            toast.success(`${selectedCount} commande(s) mise(s) à jour.`);
            setSelectedOrders({});
        } catch(e) {
            console.error('Bulk update failed', e);
            toast.error('Erreur lors de la mise à jour groupée.');
        } finally {
            setIsBulkProcessing(false);
        }
    }
    
    async function handleResetDay() {
        if (!firestore || !user || !dailyOrders || dailyOrders.length === 0) {
            toast.info("Aucune commande personnalisée à réinitialiser pour ce jour.");
            setIsResetDialogOpen(false);
            return;
        }
        setIsProcessing(true);
        const batch = writeBatch(firestore);

        dailyOrders.forEach(order => {
            const orderRef = doc(firestore, 'users', user.uid, 'dailyBreadOrders', order.id);
            batch.delete(orderRef);
        });

        try {
            await batch.commit();
            toast.success(`Les commandes du ${format(selectedDate, 'd MMMM')} ont été réinitialisées.`);
        } catch (e) {
            console.error('Reset failed', e);
            toast.error('Erreur lors de la réinitialisation.');
        } finally {
            setIsProcessing(false);
            setIsResetDialogOpen(false);
        }
    }

    const isLoading = isUserLoading || isLoadingCustomers || isLoadingOrders || isCompanyProfileLoading;

    if (!user && !isLoading) {
        return null;
    }

    return (
        <>
            {user && (
                <BreadCustomerDialog
                    isOpen={isCustomerDialogOpen}
                    onOpenChange={setIsCustomerDialogOpen}
                    customer={customerToEdit}
                    userId={user.uid}
                />
            )}
            {user && (
                <DeleteBreadCustomerDialog
                    isOpen={!!customerToDelete}
                    onOpenChange={() => setCustomerToDelete(null)}
                    customer={customerToDelete}
                    userId={user.uid}
                />
            )}
             {user && orderToEdit && (
                <SetOrderDialog
                    isOpen={isSetOrderDialogOpen}
                    onOpenChange={setIsSetOrderDialogOpen}
                    order={orderToEdit}
                    date={selectedDate}
                    userId={user.uid}
                />
            )}
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Réinitialiser les commandes du jour ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Toutes les quantités personnalisées, ainsi que les statuts "Payé" et "Livré" pour le {format(selectedDate, 'd MMMM yyyy', { locale: fr })} seront supprimés. Les commandes reviendront à leur quantité par défaut.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetDay} className={cn(buttonVariants({ variant: "destructive" }))}>
                            Confirmer et Réinitialiser
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Commandes de Pain du Jour</h1>
                        <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(selectedDate, 'eeee, d MMMM yyyy', { locale: fr })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={fr}/>
                            </PopoverContent>
                        </Popover>
                         <Button variant="outline" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center justify-between">
                                {totalOrdered} <Package className="h-5 w-5 text-muted-foreground"/>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Quantité Livrée</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center justify-between">
                               {totalDelivered} <Check className="h-5 w-5 text-muted-foreground"/>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Quantité Restante</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center justify-between">
                                {totalOrdered - totalDelivered} <AlertTriangle className="h-5 w-5 text-muted-foreground"/>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6 bg-green-500/10 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-base text-green-800 dark:text-green-300">Analyse Financière</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Encaissé</p>
                            <p className="text-2xl font-bold text-green-600">{totalCollected.toFixed(2)} DA</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Dû</p>
                            <p className="text-2xl font-bold text-destructive">{totalDue.toFixed(2)} DA</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher par nom..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <ListFilter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Trier par..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tout</SelectItem>
                                    <SelectItem value="not-delivered">Non Livré</SelectItem>
                                    <SelectItem value="not-paid">Non Payé</SelectItem>
                                </SelectContent>
                            </Select>
                             <Button variant="outline" disabled><Printer className="mr-2 h-4 w-4"/> Imprimer</Button>
                             <Button onClick={() => setIsResetDialogOpen(true)} variant="outline" disabled={dailyOrders?.length === 0}><RefreshCw className="mr-2 h-4 w-4"/> Réinitialiser</Button>
                             <Button onClick={handleAddCustomer}><PlusCircle className="mr-2 h-4 w-4"/> Ajouter</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <Checkbox 
                                id="select-all" 
                                checked={isAllSelected || (isPartiallySelected ? 'indeterminate' : false)}
                                onCheckedChange={handleMasterCheckboxChange}
                            />
                            <Label htmlFor="select-all" className="flex-grow">{selectedCount} / {filteredBreadOrders.length} sélectionné(s)</Label>
                             {selectedCount > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={isBulkProcessing}>
                                             {isBulkProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Actions <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleBulkUpdate('isDelivered', true)}>
                                            <Check className="mr-2 h-4 w-4" /> Marquer comme livré
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkUpdate('isDelivered', false)}>
                                            <X className="mr-2 h-4 w-4" /> Marquer comme non-livré
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleBulkUpdate('isPaid', true)}>
                                            <HandCoins className="mr-2 h-4 w-4" /> Marquer comme payé
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkUpdate('isPaid', false)}>
                                            <Ban className="mr-2 h-4 w-4" /> Marquer comme non-payé
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                         <div className="space-y-3">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <BreadOrderRowSkeleton key={i} />)
                            ) : filteredBreadOrders.length === 0 ? (
                                <div className="flex h-24 items-center justify-center">
                                    <p className="text-muted-foreground">Aucune commande pour ce jour.</p>
                                </div>
                            ) : (
                                filteredBreadOrders.map(order => (
                                    <BreadOrderRow 
                                        key={order.id}
                                        order={order}
                                        isSelected={!!selectedOrders[order.id]}
                                        onSelectionChange={(checked) => setSelectedOrders(prev => ({...prev, [order.id]: checked}))}
                                        onUpdateStatus={handleUpdateStatus}
                                        onEditOrder={handleSetOrder}
                                        onEditCustomer={handleEditCustomer}
                                        onDeleteCustomer={setCustomerToDelete}
                                        isProcessing={isProcessing || isBulkProcessing}
                                    />
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
