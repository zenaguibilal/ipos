
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import type { Product, PurchaseOrder, CompanyProfile } from '@/lib/types';
import { HistoryTable } from '@/components/purchase-orders/history-table';
import { PurchaseOrderDetailsDialog } from '@/components/purchase-orders/purchase-order-details-dialog';


export default function PurchaseOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

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
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}
