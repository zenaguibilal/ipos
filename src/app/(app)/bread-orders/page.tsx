
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { collection, query, orderBy, serverTimestamp, doc, writeBatch, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderCard } from '@/components/bread-orders/order-card';
import type { BreadOrder, CompanyProfile, UnpaidBreadOrder, Customer } from '@/lib/types';
import { PlusCircle, RotateCcw, Search, Cookie, CheckCheck, Truck, CircleDollarSign, CreditCard, ListFilter, Trash2, Printer, HandCoins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn, safeToDate } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { isSameDay } from 'date-fns';
import { UnpaidOrdersLog } from '@/components/bread-orders/unpaid-orders-log';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PrintableBreadList } from '@/components/bread-orders/printable-bread-list';
import dynamic from 'next/dynamic';
import { OrderCardSkeleton } from '@/components/bread-orders/order-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

const AddOrderForm = dynamic(() => import('@/components/bread-orders/add-order-form').then(mod => mod.AddOrderForm));
const EditOrderForm = dynamic(() => import('@/components/bread-orders/edit-order-form').then(mod => mod.EditOrderForm));
const ResetOrdersDialog = dynamic(() => import('@/components/bread-orders/reset-orders-dialog').then(mod => mod.ResetOrdersDialog));
const BulkDeleteOrdersDialog = dynamic(() => import('@/components/bread-orders/bulk-delete-orders-dialog').then(mod => mod.BulkDeleteOrdersDialog));
const ClearLogDialog = dynamic(() => import('@/components/bread-orders/clear-log-dialog').then(mod => mod.ClearLogDialog));


export default function BreadOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingOrder, setIsAddingOrder] = useState(false);
    const [editingOrder, setEditingOrder] = useState<BreadOrder | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isProcessingReset, setIsProcessingReset] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewFilter, setViewFilter] = useState<'all' | 'undelivered' | 'unpaid'>('all');
    const [sortOption, setSortOption] = useState('status');
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isClearingLog, setIsClearingLog] = useState(false);
    const [isClearLogDialogOpen, setIsClearLogDialogOpen] = useState(false);
    const [deletingUnpaidOrder, setDeletingUnpaidOrder] = useState<UnpaidBreadOrder | null>(null);
    const [settlingUnpaidOrder, setSettlingUnpaidOrder] = useState<UnpaidBreadOrder | null>(null);
    const [isSettlingDebt, setIsSettlingDebt] = useState(false);
    const [isDeletingUnpaid, setIsDeletingUnpaid] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
    const isAutoResettingRef = useRef(false);


    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);


    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'breadOrders'), orderBy('createdAt', 'asc'));
    }, [user, firestore]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<BreadOrder>(ordersQuery);

    const unpaidOrdersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'unpaidBreadOrders'), orderBy('archivedAt', 'desc'));
    }, [user, firestore]);
    const { data: unpaidOrders, isLoading: isLoadingUnpaid } = useCollection<UnpaidBreadOrder>(unpaidOrdersQuery);

    const customersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'customers')) : null, [user, firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const autoReset = useCallback(async () => {
        if (!firestore || !user || !orders || !companyProfile) return;

        const breadPrice = companyProfile?.breadPrice ?? 0;
        if (breadPrice === 0 && orders.some(o => o.isDelivered && !o.isPaid)) {
            console.warn("Automatic reset skipped: Bread price is not set, and there are unpaid orders to archive. Please set the bread price in company profile.");
            // We do NOT update the lastBreadOrderReset timestamp here.
            // This allows the auto-reset logic to try again on the next page load
            // after the user has hopefully set the price.
            return;
        }

        const batch = writeBatch(firestore);
        
        const unpaidOnes = orders.filter(o => o.isDelivered && !o.isPaid);
        if (breadPrice > 0) {
            unpaidOnes.forEach(order => {
                const unpaidOrderRef = doc(collection(firestore, 'users', user.uid, 'unpaidBreadOrders'));
                batch.set(unpaidOrderRef, {
                    name: order.name,
                    quantity: order.quantity,
                    pricePerUnit: breadPrice,
                    totalOwed: order.quantity * breadPrice,
                    originalOrderDate: order.createdAt,
                    archivedAt: serverTimestamp()
                });
            });
        }

        orders.forEach(order => {
            const orderRef = doc(firestore, 'users', user.uid, 'breadOrders', order.id);
            if (order.isRecurring) {
                batch.update(orderRef, { isPaid: false, isDelivered: false, createdAt: serverTimestamp() });
            } else {
                batch.delete(orderRef);
            }
        });

        const companyRef = doc(firestore, 'users', user.uid, 'companyProfile', 'main');
        batch.update(companyRef, { lastBreadOrderReset: serverTimestamp() });

        try {
            await batch.commit();
             if (unpaidOnes.length > 0 && breadPrice > 0) {
                toast.info(`${unpaidOnes.length} dette(s) de pain ont été archivées.`);
            }
            toast.info("La liste des commandes de pain a été automatiquement réinitialisée.");
        } catch (error) {
            console.error("Automatic bread order reset failed:", error);
            toast.error("La réinitialisation automatique des commandes de pain a échoué.");
        }
    }, [firestore, user, orders, companyProfile]);

    // Automatic daily reset effect
    useEffect(() => {
        if (isUserLoading || isLoadingOrders || isLoadingCompany || !companyProfile || !orders || isLoadingCustomers) {
            return;
        }

        const today = new Date();
        const lastReset = companyProfile.lastBreadOrderReset ? safeToDate(companyProfile.lastBreadOrderReset) : null;

        if ((!lastReset || !isSameDay(today, lastReset)) && !isAutoResettingRef.current) {
            isAutoResettingRef.current = true;
            autoReset().finally(() => {
                isAutoResettingRef.current = false;
            });
        }
    }, [companyProfile, orders, isUserLoading, isLoadingOrders, isLoadingCompany, autoReset, isLoadingCustomers]);

    const isLoading = isUserLoading || isLoadingOrders || isLoadingCompany || isLoadingUnpaid || isLoadingCustomers;

    const { filteredOrders, totalQuantity, deliveredQuantity, undeliveredQuantity, totalPaid, totalOwed } = useMemo(() => {
        if (!orders || isLoading) return { filteredOrders: [], totalQuantity: 0, deliveredQuantity: 0, undeliveredQuantity: 0, totalPaid: 0, totalOwed: 0 };
        
        const breadPrice = companyProfile?.breadPrice ?? 0;
        
        const totalQty = orders.reduce((sum, order) => sum + order.quantity, 0);
        const deliveredQty = orders.filter(o => o.isDelivered).reduce((sum, order) => sum + order.quantity, 0);

        const paid = orders
            .filter(o => o.isPaid)
            .reduce((sum, order) => sum + (order.quantity * breadPrice), 0);
            
        const owed = orders
            .filter(o => o.isDelivered && !o.isPaid)
            .reduce((sum, order) => sum + (order.quantity * breadPrice), 0);

        let processedOrders = [...orders];

        // 1. Filter by view
        if (viewFilter === 'undelivered') {
            processedOrders = processedOrders.filter(o => !o.isDelivered);
        } else if (viewFilter === 'unpaid') {
            processedOrders = processedOrders.filter(o => o.isDelivered && !o.isPaid);
        }

        // 2. Filter by search
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            processedOrders = processedOrders.filter(order => order.name.toLowerCase().includes(lowercasedQuery));
        }

        // 3. Sort
        processedOrders.sort((a, b) => {
            switch (sortOption) {
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'quantity_desc':
                    return b.quantity - a.quantity;
                case 'createdAt_desc':
                    const timeB_desc = b.createdAt ? safeToDate(b.createdAt).getTime() : Number.MIN_SAFE_INTEGER;
                    const timeA_desc = a.createdAt ? safeToDate(a.createdAt).getTime() : Number.MIN_SAFE_INTEGER;
                    return timeB_desc - timeA_desc;
                case 'status':
                default:
                    if (a.isDelivered && !b.isDelivered) return 1;
                    if (!a.isDelivered && b.isDelivered) return -1;

                    if (a.isDelivered && b.isDelivered) {
                        if (a.isPaid && !b.isPaid) return 1;
                        if (!a.isPaid && b.isPaid) return -1;
                    }
                    const timeA = a.createdAt ? safeToDate(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
                    const timeB = b.createdAt ? safeToDate(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
                    return timeA - timeB;
            }
        });

        return { 
            filteredOrders: processedOrders, 
            totalQuantity: totalQty, 
            deliveredQuantity: deliveredQty, 
            undeliveredQuantity: totalQty - deliveredQty,
            totalPaid: paid,
            totalOwed: owed,
        };
    }, [orders, searchQuery, companyProfile, viewFilter, sortOption, isLoading]);

    const selectedOrderIds = useMemo(() => Object.keys(selectedOrders).filter(id => selectedOrders[id]), [selectedOrders]);


    const handleAddOrder = async (name: string, quantity: number, isRecurring: boolean) => {
        if (!firestore || !user) throw new Error("Non authentifié");
        const ordersCollectionRef = collection(firestore, 'users', user.uid, 'breadOrders');
        
        setUpdatingItems(prev => ({ ...prev, new: true }));
        try {
            await addDoc(ordersCollectionRef, {
                name,
                quantity,
                isPaid: false,
                isDelivered: false,
                isRecurring,
                createdAt: serverTimestamp()
            });
            toast.success('Commande de pain ajoutée.');
        } catch (err) {
            toast.error("Erreur lors de l'ajout de la commande.");
            console.error(err);
            throw err;
        } finally {
            setUpdatingItems(prev => ({ ...prev, new: false }));
        }
    };

    const handleUpdateOrderToggles = async (id: string, field: keyof Omit<BreadOrder, 'id' | 'name' | 'quantity' | 'createdAt' | 'isRecurring'>, value: boolean) => {
        if (!firestore || !user) return;
        setUpdatingItems(prev => ({ ...prev, [id]: true }));
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
        
        try {
            await updateDoc(orderDocRef, { [field]: value });
            toast.info(`Commande marquée comme ${field === 'isPaid' ? (value ? 'payée' : 'non payée') : (value ? 'livrée' : 'non livrée')}.`);
        } catch (err) {
            toast.error("Erreur lors de la mise à jour.");
            console.error(err);
        } finally {
            setUpdatingItems(prev => ({ ...prev, [id]: false }));
        }
    };
    
    const handleUpdateOrderDetails = async (id: string, name: string, quantity: number, isRecurring: boolean) => {
        if (!firestore || !user) throw new Error("Non authentifié");
        setUpdatingItems(prev => ({ ...prev, [id]: true }));
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
         
        try {
            await updateDoc(orderDocRef, { 
                name,
                quantity, 
                isRecurring 
            });
            toast.success('Commande mise à jour.');
        } catch(err) {
            toast.error("Erreur lors de la mise à jour.");
            console.error(err);
            throw err;
        } finally {
            setUpdatingItems(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!firestore || !user) return;
        setUpdatingItems(prev => ({ ...prev, [id]: true }));
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
        try {
            await deleteDoc(orderDocRef);
            toast.success("Commande supprimée.");
        } catch (err) {
            toast.error("Erreur lors de la suppression.");
            console.error(err);
            setUpdatingItems(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleResetOrders = async () => {
        if (!firestore || !user || !orders) return;
        
        setIsProcessingReset(true);

        const breadPrice = companyProfile?.breadPrice ?? 0;
        if (breadPrice === 0 && orders.some(o => o.isDelivered && !o.isPaid)) {
            toast.error("Le prix du pain n'est pas défini. Impossible d'archiver les dettes.", {
                description: "Veuillez le configurer dans votre profil d'entreprise avant de réinitialiser."
            });
            setIsProcessingReset(false);
            setIsResetting(false);
            return;
        }

        const batch = writeBatch(firestore);
        
        const unpaidOnes = orders.filter(o => o.isDelivered && !o.isPaid);
        if (breadPrice > 0) {
            unpaidOnes.forEach(order => {
                const unpaidOrderRef = doc(collection(firestore, 'users', user.uid, 'unpaidBreadOrders'));
                batch.set(unpaidOrderRef, {
                    name: order.name,
                    quantity: order.quantity,
                    pricePerUnit: breadPrice,
                    totalOwed: order.quantity * breadPrice,
                    originalOrderDate: order.createdAt,
                    archivedAt: serverTimestamp()
                });
            });
        }

        orders.forEach(order => {
            const orderRef = doc(firestore, 'users', user.uid, 'breadOrders', order.id);
            if (order.isRecurring) {
                batch.update(orderRef, { isPaid: false, isDelivered: false, createdAt: serverTimestamp() });
            } else {
                batch.delete(orderRef);
            }
        });

        const companyRef = doc(firestore, 'users', user.uid, 'companyProfile', 'main');
        batch.update(companyRef, { lastBreadOrderReset: serverTimestamp() });

        try {
            await batch.commit();
            if (unpaidOnes.length > 0) {
                 toast.success(`${unpaidOnes.length} dette(s) de pain ont été archivées dans le journal.`);
            }
            toast.success("Liste réinitialisée pour la nouvelle journée !");
        } catch (error) {
            toast.error("Erreur lors de la réinitialisation de la liste.");
            console.error(error);
        } finally {
            setIsProcessingReset(false);
            setIsResetting(false);
        }
    };
    
    const handleBulkUpdate = async (field: 'isPaid' | 'isDelivered', value: boolean) => {
        if (!firestore || !user || selectedOrderIds.length === 0) return;

        const batch = writeBatch(firestore);
        selectedOrderIds.forEach(id => {
            const orderRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
            batch.update(orderRef, { [field]: value });
        });

        try {
            await batch.commit();
            toast.success(`${selectedOrderIds.length} commande(s) mise(s) à jour.`);
            setSelectedOrders({});
        } catch (error) {
            toast.error("Erreur lors de la mise à jour en masse.");
            console.error(error);
        }
    };

    const handleBulkDelete = async () => {
        if (!firestore || !user || selectedOrderIds.length === 0) return;

        const batch = writeBatch(firestore);
        selectedOrderIds.forEach(id => {
            const orderRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
            batch.delete(orderRef);
        });

        try {
            await batch.commit();
            toast.success(`${selectedOrderIds.length} commande(s) supprimée(s).`);
            setSelectedOrders({});
        } catch (error) {
            toast.error("Erreur lors de la suppression en masse.");
            console.error(error);
        } finally {
            setIsBulkDeleting(false);
        }
    };
    
    const handleClearLog = async () => {
        if (!firestore || !user || !unpaidOrders || unpaidOrders.length === 0) return;
        
        setIsClearingLog(true);
        const batch = writeBatch(firestore);
        
        unpaidOrders.forEach(order => {
            const docRef = doc(firestore, 'users', user.uid, 'unpaidBreadOrders', order.id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
            toast.success("Le journal des dettes de pain a été vidé.");
        } catch (error) {
            toast.error("Erreur lors du vidage du journal.");
            console.error(error);
        } finally {
            setIsClearingLog(false);
            setIsClearLogDialogOpen(false);
        }
    };

    const confirmDeleteUnpaidOrder = async () => {
        if (!firestore || !user || !deletingUnpaidOrder) return;
        setIsDeletingUnpaid(true);
        const docRef = doc(firestore, 'users', user.uid, 'unpaidBreadOrders', deletingUnpaidOrder.id);
        
        try {
            await deleteDoc(docRef);
            toast.success(`La dette de ${deletingUnpaidOrder.name} a été supprimée.`);
            setDeletingUnpaidOrder(null);
        } catch (err) {
            toast.error("Erreur lors de la suppression de la dette.");
            console.error(err);
        } finally {
            setIsDeletingUnpaid(false);
        }
    };

    const confirmSettleUnpaidOrder = async () => {
        if (!firestore || !user || !settlingUnpaidOrder || !customers) return;

        setIsSettlingDebt(true);

        const batch = writeBatch(firestore);

        // Find customer by name to link the sale
        const customerName = settlingUnpaidOrder.name;
        const customerMatch = customers.find(c => 
            `${c.firstName} ${c.lastName}`.trim().toLowerCase() === customerName.trim().toLowerCase()
        );

        // Create a Sale document to record the income
        const salesCollectionRef = collection(firestore, 'users', user.uid, 'sales');
        const newSaleRef = doc(salesCollectionRef);
        
        const saleData = {
            invoiceNumber: `DEBT-${Date.now()}`,
            items: [{
                id: `bread-debt-${settlingUnpaidOrder.id}`,
                name: `Règlement dette pain (${settlingUnpaidOrder.name})`,
                price: settlingUnpaidOrder.totalOwed,
                purchasePrice: 0,
                quantity: 1,
            }],
            subtotal: settlingUnpaidOrder.totalOwed,
            total: settlingUnpaidOrder.totalOwed,
            amountPaid: settlingUnpaidOrder.totalOwed,
            remainingBalance: 0,
            paymentStatus: 'paid' as const,
            paymentMethod: 'cash' as const,
            customerId: customerMatch ? customerMatch.id : undefined,
            customerName: settlingUnpaidOrder.name,
            createdAt: serverTimestamp()
        };
        batch.set(newSaleRef, saleData);

        // Delete the unpaid order log entry
        const unpaidOrderRef = doc(firestore, 'users', user.uid, 'unpaidBreadOrders', settlingUnpaidOrder.id);
        batch.delete(unpaidOrderRef);

        try {
            await batch.commit();
            toast.success(`La dette de ${settlingUnpaidOrder.name} a été réglée et enregistrée comme une vente.`);
        } catch (error) {
            console.error("Failed to settle bread debt:", error);
            toast.error("Erreur lors du règlement de la dette.");
        } finally {
            setIsSettlingDebt(false);
            setSettlingUnpaidOrder(null);
        }
    };

    const handlePrint = () => {
        const printContainer = document.getElementById('receipt-for-print');
        const listElement = printRef.current;
        if (!printContainer || !listElement) return;

        document.documentElement.classList.remove('thermal');

        const contentToPrint = listElement.cloneNode(true);

        printContainer.innerHTML = '';
        printContainer.appendChild(contentToPrint);
        
        window.print();
    };


    
    const breadPrice = companyProfile?.breadPrice;

    return (
        <>
            <AddOrderForm 
                isOpen={isAddingOrder}
                onOpenChange={setIsAddingOrder}
                onConfirm={handleAddOrder}
            />
            {editingOrder && (
                 <EditOrderForm
                    isOpen={!!editingOrder}
                    onOpenChange={() => setEditingOrder(null)}
                    onConfirm={handleUpdateOrderDetails}
                    order={editingOrder}
                />
            )}
            <ResetOrdersDialog
                isOpen={isResetting}
                onOpenChange={setIsResetting}
                onConfirm={handleResetOrders}
                isProcessing={isProcessingReset}
            />
            <BulkDeleteOrdersDialog
                isOpen={isBulkDeleting}
                onOpenChange={setIsBulkDeleting}
                onConfirm={handleBulkDelete}
                orderCount={selectedOrderIds.length}
            />
             <ClearLogDialog
                isOpen={isClearLogDialogOpen}
                onOpenChange={setIsClearLogDialogOpen}
                onConfirm={handleClearLog}
                isProcessing={isClearingLog}
            />
            <AlertDialog open={!!deletingUnpaidOrder} onOpenChange={(isOpen) => !isOpen && !isDeletingUnpaid && setDeletingUnpaidOrder(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la dette de <span className="font-bold">{deletingUnpaidOrder?.name}</span> d'un montant de <span className="font-bold">{deletingUnpaidOrder?.totalOwed.toFixed(1)} DA</span>? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingUnpaid}>Annuler</AlertDialogCancel>
                        <Button
                            onClick={confirmDeleteUnpaidOrder}
                            disabled={isDeletingUnpaid}
                            variant="destructive"
                        >
                            {isDeletingUnpaid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!settlingUnpaidOrder} onOpenChange={(isOpen) => !isOpen && setSettlingUnpaidOrder(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer le règlement de la dette?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir régler la dette de <span className="font-bold">{settlingUnpaidOrder?.name}</span> d'un montant de <span className="font-bold">{settlingUnpaidOrder?.totalOwed.toFixed(1)} DA</span>?
                            <br/><br/>
                            Cette action créera une nouvelle transaction de vente marquée comme payée et supprimera cette entrée du journal des dettes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSettlingDebt}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSettleUnpaidOrder} disabled={isSettlingDebt} className={cn(buttonVariants({ variant: "default" }), "bg-green-600 hover:bg-green-700")}>
                             {isSettlingDebt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandCoins className="mr-2 h-4 w-4" />}
                             Régler la dette
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="hidden">
                <div ref={printRef}>
                    <PrintableBreadList orders={filteredOrders} totalQuantity={totalQuantity} />
                </div>
            </div>

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                     <div>
                        <h1 className="text-2xl font-bold">Commandes de Pain du Jour</h1>
                        <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes.</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
                        <div className="flex gap-2 flex-grow">
                            <div className="relative flex-grow sm:flex-grow-0">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input
                                    type="search"
                                    placeholder="Rechercher par nom..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <ListFilter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Trier par..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="status">Par Statut</SelectItem>
                                    <SelectItem value="name_asc">Par Nom</SelectItem>
                                    <SelectItem value="quantity_desc">Par Quantité</SelectItem>
                                    <SelectItem value="createdAt_desc">Plus Récent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handlePrint} disabled={filteredOrders.length === 0}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer
                            </Button>
                            <Button variant="outline" onClick={() => setIsResetting(true)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Réinitialiser
                            </Button>
                            <Button onClick={() => setIsAddingOrder(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter
                            </Button>
                        </div>
                    </div>
                </div>
                
                 <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {filteredOrders && filteredOrders.length > 0 && (
                            <div className="border rounded-lg p-2 flex flex-col sm:flex-row items-center gap-4 bg-card">
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <Checkbox
                                        id="select-all"
                                        checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                                        onCheckedChange={(checked) => {
                                            const newSelected: Record<string, boolean> = {};
                                            if (checked) {
                                                filteredOrders.forEach(o => newSelected[o.id] = true);
                                            }
                                            setSelectedOrders(newSelected);
                                        }}
                                    />
                                    <label htmlFor="select-all" className="text-sm font-medium">
                                        {selectedOrderIds.length} / {filteredOrders.length} sélectionné(s)
                                    </label>
                                </div>
                                
                                {selectedOrderIds.length > 0 && (
                                    <div className="flex items-center gap-2 border-l pl-4 flex-wrap">
                                        <Button size="sm" variant="outline" onClick={() => handleBulkUpdate('isDelivered', true)}>
                                            <CheckCheck className="mr-2 h-4 w-4" />
                                            Marquer comme livré
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleBulkUpdate('isPaid', true)}>
                                            <CircleDollarSign className="mr-2 h-4 w-4" />
                                            Marquer comme payé
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleting(true)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </div>
                                )}
                                
                                <div className="sm:ml-auto flex gap-2 rounded-lg bg-muted p-1">
                                    <Button variant={viewFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('all')}>Tout</Button>
                                    <Button variant={viewFilter === 'undelivered' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('undelivered')}>
                                        <Truck className="mr-2 h-4 w-4"/>
                                        Non Livré
                                    </Button>
                                    <Button variant={viewFilter === 'unpaid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('unpaid')}>
                                        <CreditCard className="mr-2 h-4 w-4"/>
                                        Non Payé
                                    </Button>
                                </div>
                            </div>
                        )}

                        
                        {(breadPrice == null || breadPrice === 0) && !isLoadingCompany && (
                            <div className="rounded-md border border-yellow-500 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
                                Le prix du pain n'est pas défini. Veuillez le configurer dans votre <Link href="/profile" className="font-bold underline">profil d'entreprise</Link> pour activer les calculs financiers et l'archivage des dettes.
                            </div>
                        )}

                         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                                    <Cookie className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalQuantity}</div>}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Quantité Livrée</CardTitle>
                                    <CheckCheck className="h-4 w-4 text-green-700 dark:text-green-400" />
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{deliveredQuantity}</div>}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Quantité Restante</CardTitle>
                                    <Truck className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{undeliveredQuantity}</div>}
                                </CardContent>
                            </Card>
                            <Card className="bg-green-500/20 border-green-500/50 sm:col-span-2 lg:col-span-3">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Analyse Financière</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-around items-center">
                                     {isLoading ? (
                                        <>
                                            <div className="flex flex-col items-center gap-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-24" /></div>
                                            <div className="flex flex-col items-center gap-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-8 w-24" /></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Total Encaissé</p>
                                                <p className="text-2xl font-bold">{totalPaid.toFixed(1)} DA</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Total Dû</p>
                                                <p className="text-2xl font-bold text-destructive">{totalOwed.toFixed(1)} DA</p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {isLoading ? (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {Array.from({ length: 8 }).map((_, i) => <OrderCardSkeleton key={i} />)}
                            </div>
                        ) : filteredOrders.length === 0 ? (
                             <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold tracking-tight">{searchQuery ? "Aucun résultat" : "Aucune commande"}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {searchQuery ? "Aucune commande ne correspond à votre recherche." : `Aucune commande ne correspond au filtre "${viewFilter}".`}
                                    </p>
                                     {!searchQuery && viewFilter === 'all' && (
                                        <Button onClick={() => setIsAddingOrder(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Ajouter une commande
                                        </Button>
                                     )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {filteredOrders.map(order => (
                                    <OrderCard 
                                        key={order.id}
                                        order={order}
                                        onUpdateToggles={handleUpdateOrderToggles}
                                        onEdit={() => setEditingOrder(order)}
                                        onDelete={() => handleDeleteOrder(order.id)}
                                        isSelected={!!selectedOrders[order.id]}
                                        onSelectChange={(checked) => {
                                            setSelectedOrders(prev => ({ ...prev, [order.id]: checked }));
                                        }}
                                        isUpdating={!!updatingItems[order.id] || !!updatingItems['new']}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="lg:col-span-1">
                        <UnpaidOrdersLog
                            unpaidOrders={unpaidOrders || []}
                            isLoading={isLoadingUnpaid}
                            onClearLog={() => setIsClearLogDialogOpen(true)}
                            onDeleteOrder={(order) => setDeletingUnpaidOrder(order)}
                            onSettleOrder={(order) => setSettlingUnpaidOrder(order)}
                        />
                    </div>
                </div>
            </main>
        </>
    )
}
