
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { StockIntake } from '@/lib/types';
import { StockIntakeDetailsDialog } from '@/components/stock-intake/stock-intake-details-dialog';
import { safeToDate } from '@/lib/utils';

export default function StockIntakeHistoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);

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

    const sortedIntakes = useMemo(() => {
        if (!stockIntakes) return [];
        return [...stockIntakes].sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
    }, [stockIntakes]);

    const isLoading = isUserLoading || isLoadingIntakes;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'historique...</p></div>;
    }

    return (
        <>
            {selectedIntake && (
                <StockIntakeDetailsDialog
                    isOpen={!!selectedIntake}
                    onOpenChange={() => setSelectedIntake(null)}
                    stockIntake={selectedIntake}
                />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/stock-intake">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à la réception
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Historique des réceptions de stock</CardTitle>
                        <CardDescription>Liste de toutes les réceptions de stock enregistrées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingIntakes ? (
                            <p>Chargement...</p>
                        ) : sortedIntakes.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">Aucune réception de stock n'a été enregistrée.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date de réception</TableHead>
                                        <TableHead>N° de Facture</TableHead>
                                        <TableHead className="text-right">Valeur totale</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedIntakes.map((intake) => (
                                        <TableRow key={intake.id} onClick={() => setSelectedIntake(intake)} className="cursor-pointer">
                                            <TableCell className="font-medium">
                                                {format(safeToDate(intake.createdAt), 'd LLL yyyy, HH:mm', { locale: fr })}
                                            </TableCell>
                                            <TableCell>{intake.invoiceNumber}</TableCell>
                                            <TableCell className="text-right font-medium">{intake.totalValue.toFixed(2)} DA</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
