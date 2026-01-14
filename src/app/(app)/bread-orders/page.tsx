
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { AddOrderForm } from '@/components/bread-orders/add-order-form';
import { ResetOrdersDialog } from '@/components/bread-orders/reset-orders-dialog';
import { OrderCard } from '@/components/bread-orders/order-card';
import type { BreadOrder } from '@/lib/types';
import { PlusCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function BreadOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingOrder, setIsAddingOrder] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isProcessingReset, setIsProcessingReset] = useState(false);

    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'breadOrders'), orderBy('createdAt', 'asc'));
    }, [user, firestore]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<BreadOrder>(ordersQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

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

    const handleUpdateOrder = (id: string, field: keyof Omit<BreadOrder, 'id' | 'name' | 'quantity' | 'createdAt'>, value: boolean) => {
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
            } else {
                 // Delete non-recurring orders
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

    const isLoading = isUserLoading || isLoadingOrders;

    return (
        <>
            <AddOrderForm 
                isOpen={isAddingOrder}
                onOpenChange={setIsAddingOrder}
                onConfirm={handleAddOrder}
            />
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
                    <div className="flex gap-2 w-full sm:w-auto">
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

                {isLoading ? (
                    <div className="text-center p-8">Chargement des commandes...</div>
                ) : !orders || orders.length === 0 ? (
                     <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                        <div className="text-center">
                            <h3 className="text-xl font-bold tracking-tight">Aucune commande aujourd'hui</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Ajoutez votre première commande de la journée.
                            </p>
                            <Button onClick={() => setIsAddingOrder(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter une commande
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {orders.map(order => (
                            <OrderCard 
                                key={order.id}
                                order={order}
                                onUpdate={handleUpdateOrder}
                                onDelete={handleDeleteOrder}
                            />
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
