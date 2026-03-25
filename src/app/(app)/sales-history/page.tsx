'use client';

import { useState, useEffect, useCallback } from 'react';
import { salesService } from '@/services';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, History } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const [sales, setSales] = useState<Sale[] | undefined>(undefined);
    const isLoading = sales === undefined;

    const fetchSales = useCallback(async () => {
        if (!isMounted || !dateRange) return;
        try {
            const data = await salesService.filterSales({
                query: debouncedSearchQuery,
                from: dateRange.from,
                to: dateRange.to
            });
            setSales(data);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger l'historique des ventes.");
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handleCancelSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsCancelOpen(true);
    };
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (!sales || sales.length === 0) {
            return (
                <EmptyState
                    icon={History}
                    title="Aucune vente trouvée"
                    description="Essayez d'ajuster votre recherche ou vos filtres."
                />
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sales.map(s => (
                    <SalesHistoryCard 
                        key={s.uuid} 
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
            <PageHeader
                title="Historique des Ventes"
                description="Recherchez et consultez toutes les transactions."
            />

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
                <DateRangePicker date={dateRange} setDate={setDate} />
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
                onSuccess={fetchSales}
            />
        </div>
    );
}
