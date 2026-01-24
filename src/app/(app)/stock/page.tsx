
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Archive, FileText, Download, ChevronDown, CircleDollarSign, Hash } from 'lucide-react';
import type { StockIntake } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeCardSkeleton } from '@/components/stock/stock-intake-card-skeleton';

// Details Dialog Component defined inside the page
function StockIntakeDetailsDialog({ isOpen, onOpenChange, intake }: { isOpen: boolean, onOpenChange: (open: boolean) => void, intake: StockIntake | null }) {
    if (!intake) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Détails de la réception</DialogTitle>
                    <DialogDescription>
                        Fournisseur: <span className="font-semibold">{intake.supplier}</span> | Facture n°: <span className="font-mono">{intake.invoiceNumber}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Quantité Reçue</TableHead>
                                <TableHead className="text-right">Prix d'achat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {intake.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-center">{item.quantityReceived}</TableCell>
                                    <TableCell className="text-right">{item.purchasePrice.toFixed(1)} DA</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function StockPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });

    const stockIntakesQuery = useMemoFirebase(() =>
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'stockIntakes'), orderBy('createdAt', 'desc')) : null,
    [user, firestore]);
    
    const { data: stockIntakes, isLoading: isLoadingIntakes } = useCollection<StockIntake>(stockIntakesQuery);

     useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { filteredIntakes, totalIntakeValue, intakesCount, totalItemsReceived } = useMemo(() => {
        if (!stockIntakes) {
            return { filteredIntakes: [], totalIntakeValue: 0, intakesCount: 0, totalItemsReceived: 0 };
        }

        const fromDate = dateRange?.from;
        const toDate = dateRange?.to;

        const filtered = stockIntakes.filter(i => {
            const intakeDate = safeToDate(i.createdAt);
            if (fromDate && intakeDate < fromDate) return false;
            if (toDate && intakeDate > toDate) return false;

            if (searchQuery) {
                return i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       i.supplier.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
        });

        const totalValue = filtered.reduce((sum, intake) => sum + intake.totalValue, 0);
        const totalItems = filtered.reduce((acc, intake) => acc + intake.items.reduce((itemAcc, item) => itemAcc + item.quantityReceived, 0), 0);

        return { 
            filteredIntakes: filtered, 
            totalIntakeValue: totalValue,
            intakesCount: filtered.length,
            totalItemsReceived: totalItems
        };
    }, [stockIntakes, searchQuery, dateRange]);
    
    const handleExport = () => {
        if (filteredIntakes.length === 0) {
            toast.info("Aucune donnée à exporter.");
            return;
        }

        const dataToExport = filteredIntakes.flatMap(intake => 
            intake.items.map(item => ({
                'Date Réception': format(safeToDate(intake.createdAt), 'yyyy-MM-dd'),
                'Fournisseur': intake.supplier,
                'N° Facture': intake.invoiceNumber,
                'Nom Produit': item.productName,
                'Quantité Reçue': item.quantityReceived,
                'Prix Achat Unitaire': item.purchasePrice,
                'Sous-total': item.quantityReceived * item.purchasePrice,
            }))
        );

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'historique_receptions.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Historique des réceptions exporté avec succès.");
    };

    const isLoading = isUserLoading || isLoadingIntakes;

     if (!user && !isLoading) {
        return null;
    }

    return (
        <>
            <StockIntakeDetailsDialog 
                isOpen={!!selectedIntake}
                onOpenChange={() => setSelectedIntake(null)}
                intake={selectedIntake}
            />
             <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Réception de Stock</h1>
                        <p className="text-muted-foreground">Consultez l'historique des réceptions de marchandises.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                         <DateRangePicker onUpdate={setDateRange} />
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter en CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button asChild>
                            <Link href="/stock/intake">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nouvelle réception
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Réceptions (filtrées)</CardTitle>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{intakesCount}</div>
                            <p className="text-xs text-muted-foreground">Transactions de réception sur la période</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valeur Reçue (filtrée)</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalIntakeValue.toFixed(1)} DA</div>
                            <p className="text-xs text-muted-foreground">Valeur d'achat des marchandises</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Articles Reçus (filtrés)</CardTitle>
                            <Hash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalItemsReceived}
                            </div>
                            <p className="text-xs text-muted-foreground">Nombre d'articles reçus</p>
                        </CardContent>
                    </Card>
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
                         {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <StockIntakeCardSkeleton key={i} />)}
                            </div>
                         ) : filteredIntakes.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <div className="text-center">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground"/>
                                    <h3 className="mt-4 text-lg font-medium">Aucune réception trouvée</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {stockIntakes && stockIntakes.length > 0 ? "Aucune réception ne correspond à vos filtres." : "Commencez par enregistrer votre première réception."}
                                    </p>
                                     {(!stockIntakes || stockIntakes.length === 0) && (
                                        <Button asChild className="mt-4">
                                            <Link href="/stock/intake">
                                                Enregistrer une réception
                                            </Link>
                                        </Button>
                                     )}
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredIntakes.map((intake) => (
                                    <StockIntakeCard 
                                        key={intake.id}
                                        intake={intake}
                                        onViewDetails={setSelectedIntake}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
