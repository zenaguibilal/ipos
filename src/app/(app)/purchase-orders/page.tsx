
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import type { Product, PurchaseOrder, CompanyProfile, PurchaseOrderStatus } from '@/lib/types';
import { HistoryTable } from '@/components/purchase-orders/history-table';
import { PurchaseOrderDetailsDialog } from '@/components/purchase-orders/purchase-order-details-dialog';
import { ConfirmActionDialog } from '@/components/purchase-orders/confirm-action-dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [actionToConfirm, setActionToConfirm] = useState<{ action: 'delete' | 'receive' | 'send', order: PurchaseOrder } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Fetching ---
    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);

    const purchaseOrdersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'purchaseOrders'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);
    const { data: purchaseOrders, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(purchaseOrdersQuery);

    const companyDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid, 'companyProfile', 'main');
    }, [user, firestore]);
    const { data: companyProfile } = useDoc<CompanyProfile>(companyDocRef);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    // --- Actions Handling ---

    const handleChangeStatus = (order: PurchaseOrder, status: PurchaseOrderStatus) => {
        if (!firestore || !user) return;
        setIsSubmitting(true);
        const orderRef = doc(firestore, 'users', user.uid, 'purchaseOrders', order.id);
        updateDocumentNonBlocking(orderRef, { status }, {
            onSuccess: () => {
                toast.success(`Le bon de commande ${order.poNumber} a été marqué comme "${status}".`);
                setIsSubmitting(false);
                setActionToConfirm(null);
            },
            onError: (err) => {
                toast.error("Erreur lors de la mise à jour du statut.");
                console.error(err);
                setIsSubmitting(false);
            }
        });
    };

    const handleReceiveOrder = async (order: PurchaseOrder) => {
        if (!firestore || !user || !products) return;

        setIsSubmitting(true);
        const batch = writeBatch(firestore);

        // Update product quantities
        for (const item of order.items) {
            const productDoc = products.find(p => p.id === item.productId);
            if (productDoc) {
                const productRef = doc(firestore, 'users', user.uid, 'products', item.productId);
                const newQuantity = (productDoc.quantity || 0) + item.quantity;
                batch.update(productRef, { quantity: newQuantity });
            }
        }
        
        // Update PO status
        const orderRef = doc(firestore, 'users', user.uid, 'purchaseOrders', order.id);
        batch.update(orderRef, { status: 'received' });

        try {
            await batch.commit();
            toast.success(`Stock mis à jour et commande ${order.poNumber} marquée comme reçue.`);
        } catch (error) {
            toast.error("Une erreur est survenue lors de la réception de la commande.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setActionToConfirm(null);
        }
    };
    
    const handleDeleteOrder = (order: PurchaseOrder) => {
        if (!firestore || !user) return;
        setIsSubmitting(true);
        const orderRef = doc(firestore, 'users', user.uid, 'purchaseOrders', order.id);
        deleteDocumentNonBlocking(orderRef, {
            onSuccess: () => {
                toast.success(`Le bon de commande ${order.poNumber} a été supprimé.`);
                setIsSubmitting(false);
                setActionToConfirm(null);
            },
            onError: (err) => {
                toast.error("Erreur lors de la suppression.");
                console.error(err);
                setIsSubmitting(false);
            }
        });
    };
    
    const handleConfirmAction = () => {
        if (!actionToConfirm) return;
        const { action, order } = actionToConfirm;
        if (action === 'delete') {
            handleDeleteOrder(order);
        } else if (action === 'receive') {
            handleReceiveOrder(order);
        } else if (action === 'send') {
            handleChangeStatus(order, 'sent');
        }
    };


    const isLoading = isUserLoading || isLoadingProducts || isLoadingPOs;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            {selectedOrder && companyProfile && (
                <PurchaseOrderDetailsDialog
                    isOpen={!!selectedOrder}
                    onOpenChange={() => setSelectedOrder(null)}
                    purchaseOrder={selectedOrder}
                    companyProfile={companyProfile}
                />
            )}
            {actionToConfirm && (
                <ConfirmActionDialog
                    isOpen={!!actionToConfirm}
                    onOpenChange={() => setActionToConfirm(null)}
                    action={actionToConfirm.action}
                    orderNumber={actionToConfirm.order.poNumber}
                    onConfirm={handleConfirmAction}
                    isSubmitting={isSubmitting}
                />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Tabs defaultValue="create-po" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create-po">Créer un bon de commande</TabsTrigger>
                        <TabsTrigger value="history">Historique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="create-po">
                         <PurchaseOrderForm 
                            userId={user.uid}
                            products={products || []}
                        />
                    </TabsContent>
                    <TabsContent value="history">
                       <Card>
                            <CardHeader>
                                <CardTitle>Historique des bons de commande</CardTitle>
                                <CardDescription>Consultez et gérez vos bons de commande précédents.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <HistoryTable
                                    purchaseOrders={purchaseOrders || []}
                                    onViewOrder={setSelectedOrder}
                                    onChangeStatus={(order, status) => {
                                        if (status === 'receive') {
                                            setActionToConfirm({action: 'receive', order});
                                        } else if (status === 'send') {
                                            setActionToConfirm({action: 'send', order});
                                        }
                                    }}
                                    onDeleteOrder={(order) => setActionToConfirm({ action: 'delete', order })}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}

    