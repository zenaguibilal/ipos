'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Archive, FileText } from 'lucide-react';
import type { StockIntake } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StockPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');

    const stockIntakesQuery = useMemoFirebase(() =>
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'stockIntakes'), orderBy('createdAt', 'desc')) : null,
    [user, firestore]);
    
    const { data: stockIntakes, isLoading: isLoadingIntakes } = useCollection<StockIntake>(stockIntakesQuery);

     useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const filteredIntakes = useMemo(() => {
        if (!stockIntakes) return [];
        return stockIntakes.filter(i => 
            i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.supplier.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stockIntakes, searchQuery]);

    const isLoading = isUserLoading || isLoadingIntakes;

     if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'historique des stocks...</p></div>;
    }

    return (
         <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Réception de Stock</h1>
                    <p className="text-muted-foreground">Consultez l'historique des réceptions de marchandises.</p>
                </div>
                <Button asChild>
                    <Link href="/stock/intake">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nouvelle réception
                    </Link>
                </Button>
            </div>
             <Card>
                <CardHeader>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par N° facture ou fournisseur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                     {filteredIntakes.length === 0 ? (
                        <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                            <div className="text-center">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground"/>
                                <h3 className="mt-4 text-lg font-medium">Aucune réception de stock trouvée</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Commencez par enregistrer votre première réception de marchandises.</p>
                                <Button asChild className="mt-4">
                                     <Link href="/stock/intake">
                                        Enregistrer une réception
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date Réception</TableHead>
                                        <TableHead>Fournisseur</TableHead>
                                        <TableHead>N° Facture</TableHead>
                                        <TableHead>Date Facture</TableHead>
                                        <TableHead className="text-right">Valeur Totale</TableHead>
                                        <TableHead className="text-center">Articles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredIntakes.map((intake) => (
                                        <TableRow key={intake.id}>
                                            <TableCell className="font-medium">{format(safeToDate(intake.createdAt), 'd MMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell>{intake.supplier}</TableCell>
                                            <TableCell>{intake.invoiceNumber}</TableCell>
                                            <TableCell>{format(safeToDate(intake.invoiceDate), 'd MMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell className="text-right font-semibold">{intake.totalValue.toFixed(1)} DA</TableCell>
                                            <TableCell className="text-center">{intake.items.length}</TableCell>
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

    