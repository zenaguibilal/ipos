
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'paid' | 'partial' | 'unpaid';

export default function SalesHistoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // --- Component State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // --- Data Fetching ---
    const salesQuery = useMemoFirebase(() => 
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'sales'), orderBy('createdAt', 'desc')) : null, 
    [user, firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    
    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const filteredSales = useMemo(() => {
        if (!sales) return [];
        return sales.filter(sale => {
            const matchesSearch = searchQuery ? 
                sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
                : true;
            
            const matchesStatus = statusFilter !== 'all' ? sale.paymentStatus === statusFilter : true;
            
            return matchesSearch && matchesStatus;
        });
    }, [sales, searchQuery, statusFilter]);

    const isLoading = isUserLoading || isLoadingSales || isLoadingCompany;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'historique...</p></div>;
    }

    return (
        <>
            {selectedSale && (
                <SaleDetailsDialog
                    isOpen={true}
                    onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}
                    sale={selectedSale}
                    companyProfile={companyProfile}
                />
            )}
             <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full bg-card">
                    <CardHeader>
                        <CardTitle>Historique des Ventes</CardTitle>
                        <CardDescription>
                            Consultez, recherchez et filtrez toutes vos transactions de vente.
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Rechercher par N° facture ou client..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full"
                                />
                            </div>
                             <div className="flex gap-2 rounded-lg bg-muted p-1">
                                <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')}>Tout</Button>
                                <Button variant={statusFilter === 'paid' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('paid')}>Payé</Button>
                                <Button variant={statusFilter === 'partial' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('partial')}>Partiel</Button>
                                <Button variant={statusFilter === 'unpaid' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('unpaid')}>Impayé</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredSales.length === 0 ? (
                             <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {sales && sales.length > 0 ? "Aucune vente ne correspond à votre recherche." : "Aucune vente enregistrée pour le moment."}
                                </p>
                            </div>
                        ) : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-muted-foreground">
                                        <tr className="border-b">
                                            <th className="p-3 font-medium">N° Facture</th>
                                            <th className="p-3 font-medium">Client</th>
                                            <th className="p-3 font-medium hidden sm:table-cell">Date</th>
                                            <th className="p-3 font-medium text-center">Statut</th>
                                            <th className="p-3 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.map(sale => (
                                            <tr key={sale.id} onClick={() => setSelectedSale(sale)} className="border-b transition-colors hover:bg-muted/50 cursor-pointer">
                                                <td className="p-3 font-mono text-xs">{sale.invoiceNumber}</td>
                                                <td className="p-3 font-medium">{sale.customerName}</td>
                                                <td className="p-3 text-muted-foreground hidden sm:table-cell">
                                                    {new Date(sale.createdAt.seconds * 1000).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="p-3 text-center">
                                                     <span className={cn(
                                                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                        sale.paymentStatus === 'paid' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                                                        sale.paymentStatus === 'partial' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                                                        sale.paymentStatus === 'unpaid' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                    )}>
                                                        {sale.paymentStatus === 'paid' ? 'Payé' : sale.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-semibold text-primary">{sale.total.toFixed(2)} DA</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    )
}
