
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Trash2, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { PurchaseOrder } from '@/lib/types';
import { cn, safeToDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PurchaseOrderDetailsDialog } from '@/components/products/purchase-order-details-dialog';
import { DeletePurchaseOrderDialog } from '@/components/products/delete-po-dialog';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [deletingPO, setDeletingPO] = useState<PurchaseOrder | null>(null);

    const poCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'purchaseOrders');
    }, [user, firestore]);
    const { data: purchaseOrders, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(poCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const sortedAndFilteredPOs = useMemo(() => {
        if (!purchaseOrders) return [];
        let filtered = [...purchaseOrders].sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(po =>
                po.poNumber.toLowerCase().includes(lowercasedQuery) ||
                po.supplier.toLowerCase().includes(lowercasedQuery)
            );
        }
        return filtered;
    }, [purchaseOrders, searchQuery]);
    
    const handleDeletePO = () => {
        if (!deletingPO || !firestore || !user) return;

        if (deletingPO.status === 'received') {
            toast.error("Impossible de supprimer un bon de commande qui a déjà été réceptionné.");
            setDeletingPO(null);
            return;
        }

        const poDocRef = doc(firestore, 'users', user.uid, 'purchaseOrders', deletingPO.id);
        deleteDocumentNonBlocking(poDocRef, {
            onSuccess: () => {
                toast.success(`Le bon de commande "${deletingPO.poNumber}" a été supprimé.`);
                setDeletingPO(null);
            },
            onError: (err) => {
                console.error("Failed to delete PO:", err);
                toast.error("Échec de la suppression du bon de commande.");
            }
        });
    };

    const isLoading = isUserLoading || isLoadingPOs;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            {selectedPO && (
                <PurchaseOrderDetailsDialog
                    isOpen={!!selectedPO}
                    onOpenChange={() => setSelectedPO(null)}
                    purchaseOrder={selectedPO}
                />
            )}
            {deletingPO && (
                 <DeletePurchaseOrderDialog
                    isOpen={!!deletingPO}
                    onOpenChange={() => setDeletingPO(null)}
                    onConfirm={handleDeletePO}
                    poNumber={deletingPO.poNumber}
                />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/products">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux produits
                        </Link>
                    </Button>
                </div>
                <Card className="w-full bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pt-4">
                        <Input
                            placeholder="Rechercher par N° ou fournisseur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm"
                        />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : sortedAndFilteredPOs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>N° BC</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Fournisseur</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Valeur Totale</TableHead>
                                            <TableHead className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedAndFilteredPOs.map(po => (
                                            <TableRow key={po.id} onClick={() => setSelectedPO(po)} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-mono text-xs">{po.poNumber}</TableCell>
                                                <TableCell>{safeToDate(po.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell className="font-medium">{po.supplier}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        'rounded-full px-2 py-1 text-xs font-semibold',
                                                        po.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                                                        po.status === 'received' && 'bg-green-500/20 text-green-400'
                                                    )}>
                                                        {po.status === 'pending' ? 'En attente' : 'Réceptionné'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{po.totalValue.toFixed(2)} DA</TableCell>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setDeletingPO(po)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive" disabled={po.status === 'received'}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Supprimer</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Vous n'avez pas encore de bons de commande.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
