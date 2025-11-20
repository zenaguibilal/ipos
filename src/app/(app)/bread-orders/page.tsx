
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, writeBatch, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddOrderForm } from '@/components/bread-orders/add-order-form';
import { EditOrderForm } from '@/components/bread-orders/edit-order-form';
import { DeleteOrderDialog } from '@/components/bread-orders/delete-order-dialog';
import { ResetRecurringDialog } from '@/components/bread-orders/reset-recurring-dialog';
import { MoreHorizontal, Pencil, Trash2, Repeat, RefreshCw, Cookie, CheckCircle, PackageMinus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StatusToggle } from '@/components/bread-orders/status-toggle';
import type { BreadOrder } from '@/lib/types';


export default function BreadOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingOrder, setIsAddingOrder] = useState(false);
    const [editingOrder, setEditingOrder] = useState<BreadOrder | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<BreadOrder | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const ordersCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'breadOrders');
    }, [user, firestore]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<BreadOrder>(ordersCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { recurringOrdersCount, totalOrdered, totalDelivered, totalRemaining } = useMemo(() => {
        if (!orders) {
            return { recurringOrdersCount: 0, totalOrdered: 0, totalDelivered: 0, totalRemaining: 0 };
        }
        const recurring = orders.filter(o => o.isRecurring).length;
        const ordered = orders.reduce((sum, order) => sum + order.quantity, 0);
        const delivered = orders
            .filter(order => order.isDelivered)
            .reduce((sum, order) => sum + order.quantity, 0);

        return {
            recurringOrdersCount: recurring,
            totalOrdered: ordered,
            totalDelivered: delivered,
            totalRemaining: ordered - delivered
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        const sortedOrders = [...orders].sort((a, b) => (a.name > b.name) ? 1 : -1);
        if (!searchQuery) return sortedOrders;
        
        const lowercasedQuery = searchQuery.toLowerCase();
        
        return sortedOrders.filter(order => 
            order.name.toLowerCase().includes(lowercasedQuery)
        );
    }, [orders, searchQuery]);
    
    const handleDeleteOrder = () => {
        if (!deletingOrder || !firestore || !user) return;
        const orderDocRef = doc(firestore, 'users', user.uid, 'breadOrders', deletingOrder.id);
        deleteDocumentNonBlocking(orderDocRef, {
            onSuccess: () => {
                setDeletingOrder(null);
                toast.success(`La commande "${deletingOrder.name}" a été supprimée.`);
            },
            onError: (err) => {
                 toast.error("Échec de la suppression de la commande.");
                 console.error("Failed to delete order:", err)
            }
        });
    }

    const handleResetRecurringOrders = async () => {
        if (!firestore || !user || !orders) return;

        setIsResetting(true);
        const recurringOrders = orders.filter(o => o.isRecurring);

        if (recurringOrders.length === 0) {
            toast.info("Aucune commande récurrente à réinitialiser.");
            setIsResetting(false);
            setIsResetDialogOpen(false);
            return;
        }

        const batch = writeBatch(firestore);

        recurringOrders.forEach(order => {
            const orderRef = doc(firestore, 'users', user.uid, 'breadOrders', order.id);
            batch.update(orderRef, { isPaid: false, isDelivered: false });
        });

        try {
            await batch.commit();
            toast.success(`${recurringOrders.length} commande(s) récurrente(s) ont été réinitialisées.`);
        } catch (error) {
            console.error("Failed to reset recurring orders:", error);
            toast.error("Une erreur est survenue lors de la réinitialisation.");
        } finally {
            setIsResetting(false);
            setIsResetDialogOpen(false);
        }
    };


    const isLoading = isUserLoading || isLoadingOrders;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <AddOrderForm 
                isOpen={isAddingOrder}
                onOpenChange={setIsAddingOrder}
                userId={user.uid}
            />
            {editingOrder && (
                 <EditOrderForm
                    isOpen={!!editingOrder}
                    onOpenChange={(isOpen) => !isOpen && setEditingOrder(null)}
                    userId={user.uid}
                    order={editingOrder}
                />
            )}
            {deletingOrder && (
                <DeleteOrderDialog
                    isOpen={!!deletingOrder}
                    onOpenChange={(isOpen) => !isOpen && setDeletingOrder(null)}
                    onConfirm={handleDeleteOrder}
                    orderName={deletingOrder.name}
                />
            )}
             <ResetRecurringDialog
                isOpen={isResetDialogOpen}
                onOpenChange={setIsResetDialogOpen}
                onConfirm={handleResetRecurringOrders}
                isResetting={isResetting}
                recurringOrdersCount={recurringOrdersCount}
            />
           
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4">
                         <Input 
                            placeholder="Rechercher par nom..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full max-w-sm order-2 sm:order-1"
                        />
                        <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => setIsResetDialogOpen(true)} disabled={recurringOrdersCount === 0 || isLoading}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Réinitialiser les récurrences
                            </Button>
                            <Button onClick={() => setIsAddingOrder(true)} className="flex-grow sm:flex-grow-0">Ajouter une commande</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3 mb-4">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                                    <Cookie className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalOrdered}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Livré</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalDelivered}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Restant à Livrer</CardTitle>
                                    <PackageMinus className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalRemaining}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : filteredOrders && filteredOrders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom de la commande</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Quantité</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Récurrence</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Payé</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Livré</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredOrders.map(order => (
                                            <tr key={order.id}>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">{order.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{order.quantity}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    {order.isRecurring && <Repeat className="h-5 w-5 text-muted-foreground mx-auto" />}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <StatusToggle 
                                                        userId={user.uid}
                                                        orderId={order.id}
                                                        field="isPaid"
                                                        currentStatus={order.isPaid}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                     <StatusToggle 
                                                        userId={user.uid}
                                                        orderId={order.id}
                                                        field="isDelivered"
                                                        currentStatus={order.isDelivered}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setEditingOrder(order)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                <span>Modifier</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeletingOrder(order)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Supprimer</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : orders && orders.length > 0 && searchQuery ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">Aucune commande ne correspond à votre recherche.</p>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Vous n'avez pas encore de commandes de pain.</p>
                                    <Button variant="link" onClick={() => setIsAddingOrder(true)}>Ajouter votre première commande</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
