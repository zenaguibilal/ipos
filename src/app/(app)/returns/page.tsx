'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Undo2, CircleDollarSign, Hash, MoreHorizontal, FileText, Trash2, Download, ChevronDown } from 'lucide-react';
import type { ProductReturn } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { toast } from 'sonner';
import Papa from 'papaparse';
import dynamic from 'next/dynamic';
import { ReturnCard } from '@/components/returns/return-card';

const ReturnDetailsDialog = dynamic(() => import('@/components/returns/return-details-dialog').then(mod => mod.ReturnDetailsDialog));
const DeleteReturnDialog = dynamic(() => import('@/components/returns/delete-return-dialog').then(mod => mod.DeleteReturnDialog));


export default function ReturnsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [deletingReturn, setDeletingReturn] = useState<ProductReturn | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });

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

    const { filteredReturns, totalReturnedValue, returnsCount, totalItemsReturned } = useMemo(() => {
        if (!returns) {
            return { filteredReturns: [], totalReturnedValue: 0, returnsCount: 0, totalItemsReturned: 0 };
        }

        const fromDate = dateRange?.from;
        const toDate = dateRange?.to;

        const filtered = returns.filter(r => {
            const returnDate = safeToDate(r.createdAt);
            if (fromDate && returnDate < fromDate) return false;
            if (toDate && returnDate > toDate) return false;
            
            return searchQuery ? (
                r.originalInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
            ) : true;
        });

        const totalValue = filtered.reduce((sum, r) => sum + r.totalReturnValue, 0);
        const totalItems = filtered.reduce((acc, r) => acc + r.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);

        return { 
            filteredReturns: filtered, 
            totalReturnedValue: totalValue,
            returnsCount: filtered.length,
            totalItemsReturned: totalItems
        };
    }, [returns, searchQuery, dateRange]);

    const handleExportToCSV = () => {
        if (filteredReturns.length === 0) {
            toast.info("Aucun retour à exporter.");
            return;
        }

        const csvData = filteredReturns.map(r => {
            const returnDate = safeToDate(r.createdAt);
            const itemsSummary = r.items.map(item => `${item.quantity} x ${item.productName}`).join('; ');

            return {
                "Date": format(returnDate, 'yyyy-MM-dd HH:mm:ss'),
                "Facture Originale": r.originalInvoiceNumber,
                "Client": r.customerName || 'N/A',
                "Valeur Retour": r.totalReturnValue,
                "Montant Remboursé": r.amountRefunded,
                "Articles": itemsSummary,
                "Notes": r.notes || '',
            };
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const fromDateStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
        const toDateStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'end';
        link.setAttribute('download', `retours_${fromDateStr}_a_${toDateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Historique des retours exporté avec succès.");
    };

    const isLoading = isUserLoading || isLoadingReturns;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'historique des retours...</p></div>;
    }

    return (
        <>
            {selectedReturn && (
                <ReturnDetailsDialog
                    isOpen={!!selectedReturn}
                    onOpenChange={(isOpen) => !isOpen && setSelectedReturn(null)}
                    productReturn={selectedReturn}
                />
            )}
             {deletingReturn && user && (
                <DeleteReturnDialog
                    isOpen={!!deletingReturn}
                    onOpenChange={(isOpen) => !isOpen && setDeletingReturn(null)}
                    productReturn={deletingReturn}
                    userId={user.uid}
                />
            )}

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Retours</h1>
                        <p className="text-muted-foreground">
                            Consultez et gérez les retours de produits.
                        </p>
                    </div>
                     <div className="flex items-center gap-2">
                        <DateRangePicker onUpdate={setDateRange} />
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportToCSV}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter en CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button asChild>
                            <Link href="/returns/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Enregistrer un retour
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Retours (filtrés)</CardTitle>
                            <Undo2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{returnsCount}</div>
                            <p className="text-xs text-muted-foreground">Transactions de retour sur la période</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valeur retournée (filtrée)</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{totalReturnedValue.toFixed(1)} DA</div>
                            <p className="text-xs text-muted-foreground">Valeur des produits retournés</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Articles retournés (filtrés)</CardTitle>
                            <Hash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalItemsReturned}
                            </div>
                            <p className="text-xs text-muted-foreground">Nombre d'articles retournés</p>
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
                                    {returns && returns.length > 0 ? "Aucun retour ne correspond à vos filtres." : "Aucun retour enregistré pour le moment."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredReturns.map((r) => (
                                    <ReturnCard 
                                        key={r.id}
                                        productReturn={r}
                                        onViewDetails={setSelectedReturn}
                                        onDelete={setDeletingReturn}
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
