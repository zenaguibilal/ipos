
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddOrderForm } from '@/components/bread-orders/add-order-form';
import { EditOrderForm } from '@/components/bread-orders/edit-order-form';
import { ResetOrdersDialog } from '@/components/bread-orders/reset-orders-dialog';
import { OrderCard } from '@/components/bread-orders/order-card';
import type { BreadOrder, CompanyProfile } from '@/lib/types';
import { PlusCircle, RotateCcw, Search, Cookie, CheckCheck, Truck, CircleDollarSign, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function BreadOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingOrder, setIsAddingOrder] = useState(false);
    const [editingOrder, setEditingOrder] = useState<BreadOrder | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isProcessingReset, setIsProcessingReset] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);


    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // The main sorting by creation date is done by Firestore
        return query(collection(firestore, 'users', user.uid, 'breadOrders'), orderBy('createdAt', 'asc'));
    }, [user, firestore]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<BreadOrder>(ordersQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { filteredOrders, totalQuantity, deliveredQuantity, undeliveredQuantity, totalPaid, totalOwed } = useMemo(() => {
        if (!orders) return { filteredOrders: [], totalQuantity: 0, deliveredQuantity: 0, undeliveredQuantity: 0, totalPaid: 0, totalOwed: 0 };
        
        const breadPrice = companyProfile?.breadPrice ?? 0;
        
        const totalQty = orders.reduce((sum, order) => sum + order.quantity, 0);
        const deliveredQty = orders.filter(o => o.isDelivered).reduce((sum, order) => sum + order.quantity, 0);

        const paid = orders
            .filter(o => o.isPaid)
            .reduce((sum, order) => sum + order.quantity * breadPrice, 0);
            
        const owed = orders
            .filter(o => o.isDelivered && !o.isPaid)
            .reduce((sum, order) => sum + order.quantity * breadPrice, 0);

        let processedOrders = [...orders].sort((a, b) => {
            // 1. Primary sort: Undelivered orders first
            if (a.isDelivered && !b.isDelivered) return 1;
            if (!a.isDelivered && b.isDelivered) return -1;

            // 2. Secondary sort (only for delivered orders): Unpaid first
            if (a.isDelivered && b.isDelivered) {
                if (a.isPaid && !b.isPaid) return 1;
                if (!a.isPaid && b.isPaid) return -1;
            }
            
            // 3. Tertiary sort: For orders with same status, use original creation order (already sorted by query)
            return 0;
        });

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            processedOrders = processedOrders.filter(order => order.name.toLowerCase().includes(lowercasedQuery));
        }

        return { 
            filteredOrders: processedOrders, 
            totalQuantity: totalQty, 
            deliveredQuantity: deliveredQty, 
            undeliveredQuantity: totalQty - deliveredQty,
            totalPaid: paid,
            totalOwed: owed,
        };
    }, [orders, searchQuery, companyProfile]);


    const handleAddOrder = (name: string, quantity: number, isRecurring: boolean) => {
        if (!firestore || !user) return;
        const ordersCollectionRef = collection(firestore, 'users', user.uid, 'breadOrders');
        
        addDocumentNonBlocking(ordersCollectionRef, {
            name,
            quantity,
            isPaid: false,
            isDelivered: false,
            isRecurring,
            createdAt: serverTimestamp()
        }, {
            onSuccess: () => {
                setIsAddingOrder(false);
                toast.success('Commande de pain ajoutée.');
            },
            onError: (err) => {
                toast.error("Erreur lors de l'ajout de la commande.");
                console.error(err);
            }
        });
    };

    const handleUpdateOrderToggles = (id: string, field: keyof Omit<BreadOrder, 'id' | 'name' | 'quantity' | 'createdAt' | 'isRecurring'>, value: boolean) => {
        if (!firestore || !user) return;
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
        updateDocumentNonBlocking(orderDocRef, { [field]: value }, {
            onSuccess: () => toast.info(`Commande marquée comme ${field === 'isPaid' ? (value ? 'payée' : 'non payée') : (value ? 'livrée' : 'non livrée')}.`),
            onError: (err) => {
                toast.error("Erreur lors de la mise à jour.");
                console.error(err);
            }
        });
    };
    
    const handleUpdateOrderDetails = (id: string, name: string, quantity: number, isRecurring: boolean) => {
        if (!firestore || !user) return;
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
         updateDocumentNonBlocking(orderDocRef, { name, quantity, isRecurring }, {
            onSuccess: () => {
                setEditingOrder(null);
                toast.success('Commande mise à jour.');
            },
            onError: (err) => {
                toast.error("Erreur lors de la mise à jour.");
                console.error(err);
            }
        });
    };

    const handleDeleteOrder = (id: string) => {
        if (!firestore || !user) return;
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', id);
        deleteDocumentNonBlocking(orderDocRef, {
            onSuccess: () => toast.success("Commande supprimée."),
            onError: (err) => {
                toast.error("Erreur lors de la suppression.");
                console.error(err);
            }
        });
    };

    const handleResetOrders = async () => {
        if (!firestore || !user || !orders) return;
        
        setIsProcessingReset(true);
        const batch = writeBatch(firestore);

        orders.forEach(order => {
            const orderRef = doc(firestore, 'users', user.uid, 'breadOrders', order.id);
            if (order.isRecurring) {
                // Reset recurring orders for the next day
                batch.update(orderRef, { isPaid: false, isDelivered: false });
            } else if (order.isDelivered) {
                 // Delete non-recurring orders ONLY if they were delivered
                batch.delete(orderRef);
            }
        });

        try {
            await batch.commit();
            toast.success("Liste réinitialisée pour le lendemain !");
        } catch (error) {
            toast.error("Erreur lors de la réinitialisation de la liste.");
            console.error(error);
        } finally {
            setIsProcessingReset(false);
            setIsResetting(false);
        }
    };

    const isLoading = isUserLoading || isLoadingOrders || isLoadingCompany;
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
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                     <div>
                        <h1 className="text-2xl font-bold">Commandes de Pain du Jour</h1>
                        <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes.</p>
                    </div>
                     <div className="flex gap-2 w-full sm:w-auto flex-wrap">
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
                
                {(breadPrice == null || breadPrice === 0) && !isLoadingCompany && (
                    <div className="mb-6 rounded-md border border-yellow-500 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
                        Le prix du pain n'est pas défini. Veuillez le configurer dans votre <Link href="/profile" className="font-bold underline">profil d'entreprise</Link> pour activer les calculs financiers.
                    </div>
                )}

                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                            <Cookie className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalQuantity}</div>
                            <p className="text-xs text-muted-foreground">unités de pain au total</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quantité Livrée</CardTitle>
                            <CheckCheck className="h-4 w-4 text-green-700 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{deliveredQuantity}</div>
                             <p className="text-xs text-muted-foreground">unités de pain livrées</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quantité Restante</CardTitle>
                            <Truck className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{undeliveredQuantity}</div>
                             <p className="text-xs text-muted-foreground">unités de pain à livrer</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/20 border-green-500/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-green-700 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPaid.toFixed(2)} DA</div>
                            <p className="text-xs text-muted-foreground">Montant des commandes payées</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500/20 border-red-500/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Dû</CardTitle>
                            <CreditCard className="h-4 w-4 text-red-700 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOwed.toFixed(2)} DA</div>
                            <p className="text-xs text-muted-foreground">Commandes livrées non payées</p>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="text-center p-8">Chargement des commandes...</div>
                ) : filteredOrders.length === 0 ? (
                     <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                        <div className="text-center">
                            <h3 className="text-xl font-bold tracking-tight">{searchQuery ? "Aucun résultat" : "Aucune commande aujourd'hui"}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {searchQuery ? "Aucune commande ne correspond à votre recherche." : "Ajoutez votre première commande de la journée."}
                            </p>
                             {!searchQuery && (
                                <Button onClick={() => setIsAddingOrder(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Ajouter une commande
                                </Button>
                             )}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                        {filteredOrders.map(order => (
                            <OrderCard 
                                key={order.id}
                                order={order}
                                onUpdateToggles={handleUpdateOrderToggles}
                                onEdit={() => setEditingOrder(order)}
                                onDelete={handleDeleteOrder}
                            />
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
