'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import type { Product, PurchaseOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { StockReceptionFromPOForm } from '@/components/stock-intake/stock-reception-from-po-form';

export default function StockIntakePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);

    // Fetch products to pass to the reception form
    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);

    // Fetch purchase orders with status 'sent'
    const sentPOsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'purchaseOrders'), 
            where('status', '==', 'sent')
        );
    }, [user, firestore]);
    const { data: sentPurchaseOrders, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(sentPOsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const isLoading = isUserLoading || isLoadingPOs || isLoadingProducts;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des commandes en attente...</p></div>;
    }
    
    if (orderToReceive) {
        return (
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <StockReceptionFromPOForm 
                    userId={user.uid}
                    products={products || []}
                    purchaseOrder={orderToReceive}
                    onFinished={() => setOrderToReceive(null)}
                />
            </main>
        )
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex justify-end mb-4">
                <Button asChild variant="outline">
                    <Link href="/stock-intake/history">
                        <History className="mr-2 h-4 w-4" />
                        Voir l'historique des réceptions
                    </Link>
                </Button>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Réceptionner une Commande Fournisseur</CardTitle>
                    <CardDescription>
                        Sélectionnez un bon de commande marqué comme "Envoyé" pour réceptionner la marchandise et mettre à jour votre stock.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingPOs ? (
                        <p>Chargement...</p>
                    ) : sentPurchaseOrders && sentPurchaseOrders.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Commande</TableHead>
                                    <TableHead>Date d'envoi</TableHead>
                                    <TableHead>Fournisseur</TableHead>
                                    <TableHead className="text-right">Valeur Totale</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sentPurchaseOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono">{order.poNumber}</TableCell>
                                        <TableCell className="font-medium">
                                            {format(order.createdAt.toDate(), 'd LLL yyyy', { locale: fr })}
                                        </TableCell>
                                        <TableCell>{order.supplierName}</TableCell>
                                        <TableCell className="text-right font-medium">{order.totalValue.toFixed(2)} DA</TableCell>
                                        <TableCell className="text-right">
                                            <Button onClick={() => setOrderToReceive(order)}>Réceptionner</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground">Aucun bon de commande n'est en attente de réception.</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Vous devez d'abord créer un bon de commande et le marquer comme "Envoyé".
                            </p>
                            <Button asChild variant="link" className="mt-2">
                                <Link href="/purchase-orders">
                                    Aller aux bons de commande
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
