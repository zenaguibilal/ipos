
'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDateRange, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const sales = useLiveQuery(
        () => dataService.getSales({ 
            query: debouncedSearchQuery,
            from: dateRange?.from,
            to: dateRange?.to
        }),
        [debouncedSearchQuery, dateRange],
        []
    );

    const isLoading = sales === undefined || !isMounted;

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handleCancelSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsCancelOpen(true);
    };
    
    const renderSkeletons = () => (
        [...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderSkeletons()}
                </div>
            );
        }

        if (sales.length === 0) {
            return (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucune vente trouvée</h3>
                    <p className="text-muted-foreground mt-2">Essayez d'ajuster votre recherche ou vos filtres.</p>
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sales.map(s => (
                    <SalesHistoryCard 
                        key={s.id} 
                        sale={s}
                        onViewDetails={handleViewDetails}
                        onCancelSale={handleCancelSale}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Historique des Ventes</h1>
                    <p className="text-muted-foreground">Recherchez et consultez toutes les transactions.</p>
                </div>
            </header>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par N° Facture ou Nom Client..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>
            
            <div>
               {renderContent()}
            </div>

            <SaleDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                sale={selectedSale}
            />
            <CancelSaleDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                sale={selectedSale}
            />
        </div>
    );
}
