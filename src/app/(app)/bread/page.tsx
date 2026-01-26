
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Printer, RefreshCw, ListFilter, X, PackageOpen, Check, ShieldAlert, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

// Dynamically import components
const BreadStatsCards = React.lazy(() => import('@/components/bread/BreadStatsCards'));
const BreadOrderCard = React.lazy(() => import('@/components/bread/BreadOrderCard'));
const BreadCustomerDialog = React.lazy(() => import('@/components/bread/BreadCustomerDialog'));
const EditOrderDialog = React.lazy(() => import('@/components/bread/EditOrderDialog'));
const DeleteCustomerDialog = React.lazy(() => import('@/components/bread/DeleteCustomerDialog'));

type StatusFilter = "all" | "not-delivered" | "not-paid";

export default function BreadOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Component State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

    // Dialogs State
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<BreadOrder | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<BreadCustomer | null>(null);

    // Loading State
    const [isUpdating, setIsUpdating] = useState(false); // For bulk actions
    const [updatingItems, setUpdatingItems] = useState<string[]>([]); // For individual card updates


    // Data Fetching
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const customersQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'breadCustomers'), orderBy('name', 'asc')) : null, [user, firestore]);
    const dailyOrdersQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'dailyBreadOrders'), where('date', '==', dateString)) : null, [user, firestore, dateString]);
    const companyProfileRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'companyProfile') : null, [user, firestore]);

    const { data: breadCustomers, isLoading: isLoadingCustomers } = useCollection<BreadCustomer>(customersQuery);
    const { data: dailyOrders, isLoading: isLoadingDailyOrders } = useCollection<DailyBreadOrder>(dailyOrdersQuery);
    const { data: companyProfileData, isLoading: isLoadingProfile } = useCollection<CompanyProfile>(companyProfileRef);
    const companyProfile = useMemo(() => (companyProfileData && companyProfileData.length > 0) ? companyProfileData[0] : null, [companyProfileData]);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Data Aggregation
    const breadOrders = useMemo<BreadOrder[]>(() => {
        if (!breadCustomers) return [];
        
        return breadCustomers.map(customer => {
            const dailyOrder = dailyOrders?.find(d => d.breadCustomerId === customer.id);
            return {
                ...customer,
                todaysOrder: dailyOrder ? {
                    id: dailyOrder.id,
                    quantity: dailyOrder.quantity,
                    isPaid: dailyOrder.isPaid,
                    isDelivered: dailyOrder.isDelivered,
                } : undefined,
            };
        }).filter(c => c.isActive);
    }, [breadCustomers, dailyOrders]);

    const filteredOrders = useMemo(() => {
        return breadOrders.filter(order => {
            const nameMatch = order.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!nameMatch) return false;
            
            switch (statusFilter) {
                case 'not-delivered':
                    return !(order.todaysOrder?.isDelivered ?? false);
                case 'not-paid':
                    return !(order.todaysOrder?.isPaid ?? false);
                default:
                    return true;
            }
        });
    }, [breadOrders, searchQuery, statusFilter]);
    
     // Helper function for selection
    function toggleOrderSelection(orderId: string) {
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

    function toggleSelectAll() {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    function handleUpdateStatus(order: BreadOrder, field: 'isPaid' | 'isDelivered', value: boolean) {
        if (!firestore || !user) return;

        setUpdatingItems(prev => [...prev, order.id]);

        const dailyOrdersRef = collection(firestore, 'users', user.uid, 'dailyBreadOrders');
        const todaysOrder = order.todaysOrder;

        let docRef;
        let data;

        if (todaysOrder?.id) {
            docRef = doc(dailyOrdersRef, todaysOrder.id);
            data = { [field]: value };
        } else {
            docRef = doc(dailyOrdersRef);
            data = {
                breadCustomerId: order.id,
                customerName: order.name,
                quantity: order.defaultOrderQuantity,
                date: dateString,
                isPaid: field === 'isPaid' ? value : false,
                isDelivered: field === 'isDelivered' ? value : false,
                createdAt: serverTimestamp(),
            };
        }

        setDocumentNonBlocking(docRef, data, { merge: true }, {
            onSuccess: () => {
                 setUpdatingItems(prev => prev.filter(id => id !== order.id));
            },
            onError: (err) => {
                console.error("Failed to update status:", err);
                toast.error("Échec de la mise à jour du statut.");
                setUpdatingItems(prev => prev.filter(id => id !== order.id));
            }
        });
    };

    async function handleResetDay() {
        if (!firestore || !user || !dailyOrders || dailyOrders.length === 0) {
            toast.info("Aucune modification à réinitialiser pour cette date.");
            setIsResetDialogOpen(false);
            return;
        }

        setIsUpdating(true);
        const batch = writeBatch(firestore);
        
        dailyOrders.forEach(order => {
            const docRef = doc(firestore, 'users', user.uid, 'dailyBreadOrders', order.id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
            toast.success("Les commandes du jour ont été réinitialisées.");
        } catch (error) {
            console.error("Error resetting day:", error);
            toast.error("Erreur lors de la réinitialisation.");
        } finally {
            setIsUpdating(false);
            setIsResetDialogOpen(false);
        }
    };
    
    async function handleBulkUpdate(field: 'isPaid' | 'isDelivered', value: boolean) {
        if (selectedOrders.size === 0 || !firestore || !user) {
            toast.info("Veuillez sélectionner au moins un client.");
            return;
        }

        setIsUpdating(true);
        
        const batch = writeBatch(firestore);
        const dailyOrdersRef = collection(firestore, 'users', user.uid, 'dailyBreadOrders');

        const selectedCustomers = breadOrders.filter(bo => selectedOrders.has(bo.id));

        for (const customer of selectedCustomers) {
            const todaysOrder = customer.todaysOrder;
            if (todaysOrder?.id) {
                const docRef = doc(dailyOrdersRef, todaysOrder.id);
                batch.update(docRef, { [field]: value });
            } else {
                const newDocRef = doc(dailyOrdersRef);
                const data = {
                    breadCustomerId: customer.id,
                    customerName: customer.name,
                    quantity: customer.defaultOrderQuantity,
                    date: dateString,
                    isPaid: field === 'isPaid' ? value : false,
                    isDelivered: field === 'isDelivered' ? value : false,
                    createdAt: serverTimestamp(),
                };
                batch.set(newDocRef, data);
            }
        }
        
        try {
            await batch.commit();
            toast.success(`${selectedOrders.size} commande(s) mise(s) à jour.`);
            setSelectedOrders(new Set()); // Clear selection
        } catch (error) {
            console.error("Error in bulk update:", error);
            toast.error("Erreur lors de la mise à jour groupée.");
        } finally {
            setIsUpdating(false);
        }
    };


    const isLoading = isLoadingCustomers || isLoadingDailyOrders || isLoadingProfile;
    const breadPrice = companyProfile?.breadPrice ?? 0;
    const isPriceSet = breadPrice > 0;

    return (
        <React.Suspense fallback={<div className="p-6">Chargement...</div>}>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Commandes de Pain du Jour</h1>
                        <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes.</p>
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <DatePicker date={selectedDate} setDate={setSelectedDate} />
                         <Button variant="outline" onClick={() => {}} disabled={true}><Printer className="mr-2 h-4 w-4" />Imprimer</Button>
                         <Button variant="outline" onClick={() => setIsResetDialogOpen(true)} disabled={isUpdating}><RefreshCw className="mr-2 h-4 w-4" />Réinitialiser</Button>
                         <Button onClick={() => setIsCustomerDialogOpen(true)} disabled={isUpdating}><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button>
                    </div>
                </div>

                {!isPriceSet && !isLoading && (
                     <Card className="mb-6 border-destructive bg-destructive/10">
                        <div className="p-4 flex items-center gap-4">
                            <ShieldAlert className="h-8 w-8 text-destructive flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-destructive">Prix du pain non défini !</h3>
                                <p className="text-sm text-destructive/80">
                                    Veuillez définir un prix de vente pour le pain dans votre profil d'entreprise pour activer le suivi financier.
                                </p>
                            </div>
                            <Button asChild variant="destructive" className="ml-auto">
                                <a href="/profile">Définir le prix</a>
                            </Button>
                        </div>
                    </Card>
                )}
                
                <BreadStatsCards orders={filteredOrders} breadPrice={breadPrice} isLoading={isLoading} />
                
                <div className="my-6">
                    <Card>
                        <div className="p-4 border-b">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher par nom..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full md:w-auto">
                                            <ListFilter className="mr-2 h-4 w-4" />
                                            Par Statut
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>Tout</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatusFilter("not-delivered")}>Non Livré</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatusFilter("not-paid")}>Non Payé</DropdownMenuItem>
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
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-6 w-6" />
                                </div>
                                <Skeleton className="h-8 w-1/3" />
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-5 w-12" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-5 w-12" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
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
                                onUpdateStatus={(field, value) => handleUpdateStatus(order, field, value)}
                                isUpdating={updatingItems.includes(order.id)}
                            />
                        ))}
                    </div>
                )}


            </main>
            
            {/* Dialogs */}
            {user && (
                <BreadCustomerDialog 
                    isOpen={isCustomerDialogOpen} 
                    onOpenChange={setIsCustomerDialogOpen} 
                    userId={user.uid}
                />
            )}
             {user && editingOrder && (
                <EditOrderDialog
                    isOpen={!!editingOrder}
                    onOpenChange={() => setEditingOrder(null)}
                    order={editingOrder}
                    userId={user.uid}
                    dateString={dateString}
                />
            )}
            {user && deletingCustomer && (
                <DeleteCustomerDialog
                    isOpen={!!deletingCustomer}
                    onOpenChange={() => setDeletingCustomer(null)}
                    customer={deletingCustomer}
                    userId={user.uid}
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
        </React.Suspense>
    );
}

    