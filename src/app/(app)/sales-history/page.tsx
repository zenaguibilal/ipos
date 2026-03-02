'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { Input } from '@/components/ui/input';
import { Search, Receipt } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 300);

    const sales = useLiveQuery(() => {
        const lowerQuery = debouncedSearch.toLowerCase();
        if (lowerQuery) {
            return db.sales.filter(s =>
                s.invoiceNumber.toLowerCase().includes(lowerQuery) ||
                (s.customerName && s.customerName.toLowerCase().includes(lowerQuery))
            ).reverse().sortBy('createdAt');
        }
        return db.sales.reverse().sortBy('createdAt');
    }, [debouncedSearch]);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handleCancelSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsCancelOpen(true);
    };

    const isLoading = sales === undefined;

    return (
        <>
            <div className="p-4 sm:p-6 h-full flex flex-col">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Historique des Ventes</h1>
                    <p className="text-muted-foreground">Consultez et gérez toutes les transactions passées.</p>
                </header>

                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="relative flex-grow min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par N° de facture ou nom de client..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto -mx-4 px-4 pb-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
                        </div>
                    ) : sales && sales.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sales.map(s => (
                                <SalesHistoryCard
                                    key={s.id}
                                    sale={s}
                                    onViewDetails={handleViewDetails}
                                    onCancelSale={handleCancelSale}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Receipt className="h-12 w-12 mb-4" />
                            <p className="text-lg font-semibold">Aucune vente trouvée</p>
                            <p>Les ventes que vous réalisez apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </div>

            <SaleDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={selectedSale} />
            <CancelSaleDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} sale={selectedSale} />
        </>
    );
}
