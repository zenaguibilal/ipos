
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, ArrowLeft, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { StockIntake } from '@/lib/types';
import { cn, safeToDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function StockIntakeHistoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    
    const intakesCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'stockIntakes');
    }, [user, firestore]);
    const { data: stockIntakes, isLoading: isLoadingIntakes } = useCollection<StockIntake>(intakesCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const sortedAndFilteredIntakes = useMemo(() => {
        if (!stockIntakes) return [];
        let filtered = [...stockIntakes].sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(intake =>
                intake.invoiceNumber.toLowerCase().includes(lowercasedQuery)
            );
        }
        return filtered;
    }, [stockIntakes, searchQuery]);

    const isLoading = isUserLoading || isLoadingIntakes;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/stock-intake">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à la réception
                        </Link>
                    </Button>
                </div>
                <Card className="w-full bg-card">
                    <CardHeader>
                         <CardTitle>Historique des réceptions de stock</CardTitle>
                         <CardDescription>
                           Consultez toutes les réceptions de stock que vous avez enregistrées.
                         </CardDescription>
                        <Input
                            placeholder="Rechercher par N° de facture..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm mt-2"
                        />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : sortedAndFilteredIntakes.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>N° Facture</TableHead>
                                            <TableHead>Date d'enregistrement</TableHead>
                                            <TableHead>Date Facture</TableHead>
                                            <TableHead>Articles</TableHead>
                                            <TableHead className="text-right">Valeur Totale</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedAndFilteredIntakes.map(intake => (
                                            <TableRow key={intake.id}>
                                                <TableCell className="font-mono text-xs">{intake.invoiceNumber}</TableCell>
                                                <TableCell>{safeToDate(intake.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell>{safeToDate(intake.invoiceDate).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell>{intake.items.length}</TableCell>
                                                <TableCell className="text-right font-medium">{intake.totalValue.toFixed(2)} DA</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Aucun historique de réception trouvé.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
