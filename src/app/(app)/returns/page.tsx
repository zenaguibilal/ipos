
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Undo2, CircleDollarSign, Hash } from 'lucide-react';
import type { ProductReturn } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReturnsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');

    // --- Data Fetching ---
    const returnsQuery = useMemoFirebase(() => 
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'returns'), orderBy('createdAt', 'desc')) : null, 
    [user, firestore]);
    
    const { data: returns, isLoading: isLoadingReturns } = useCollection<ProductReturn>(returnsQuery);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { filteredReturns, totalReturnedValue, returnsCount } = useMemo(() => {
        if (!returns) {
            return { filteredReturns: [], totalReturnedValue: 0, returnsCount: 0 };
        }

        const filtered = returns.filter(r => 
            searchQuery ? (
                r.originalInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
            ) : true
        );

        const totalValue = filtered.reduce((sum, r) => sum + r.totalReturnValue, 0);

        return { 
            filteredReturns: filtered, 
            totalReturnedValue: totalValue,
            returnsCount: filtered.length
        };
    }, [returns, searchQuery]);

    const isLoading = isUserLoading || isLoadingReturns;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'historique des retours...</p></div>;
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des Retours</h1>
                    <p className="text-muted-foreground">
                        Consultez et gérez les retours de produits.
                    </p>
                </div>
                <Button onClick={() => {}} disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Enregistrer un retour
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nombre de retours</CardTitle>
                        <Undo2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{returnsCount}</div>
                        <p className="text-xs text-muted-foreground">Total des transactions de retour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valeur totale retournée</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{totalReturnedValue.toFixed(2)} DA</div>
                        <p className="text-xs text-muted-foreground">Valeur des produits retournés</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Articles retournés</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredReturns.reduce((acc, r) => acc + r.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Nombre total d'articles retournés</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher par N° facture ou client..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredReturns.length === 0 ? (
                         <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                            <p className="text-muted-foreground">
                                {returns && returns.length > 0 ? "Aucun retour ne correspond à votre recherche." : "Aucun retour enregistré pour le moment."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>N° Facture Originale</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="text-center">Articles</TableHead>
                                        <TableHead className="text-right">Valeur du Retour</TableHead>
                                        <TableHead className="text-right">Montant Remboursé</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReturns.map((r) => (
                                        <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>{safeToDate(r.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                                            <TableCell className="font-mono text-xs">{r.originalInvoiceNumber}</TableCell>
                                            <TableCell>{r.customerName || 'N/A'}</TableCell>
                                            <TableCell className="text-center">{r.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                            <TableCell className="text-right font-semibold">{r.totalReturnValue.toFixed(2)} DA</TableCell>
                                            <TableCell className="text-right text-destructive font-semibold">-{r.amountRefunded.toFixed(2)} DA</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
