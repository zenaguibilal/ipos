'use client';

import { useState, useEffect, useCallback } from 'react';
import { returnService } from '@/services/return.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Undo2 } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export default function ReturnsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const [returns, setReturns] = useState<ProductReturn[] | undefined>(undefined);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const isLoading = returns === undefined;
    
    const fetchReturnsAndCustomers = useCallback(async () => {
        if (!isMounted || !dateRange) return;
        try {
            const [returnsData, customersData] = await Promise.all([
                returnService.filterReturns({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                }),
                customerService.getCustomers()
            ]);
            setReturns(returnsData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger l'historique des retours ou les clients.");
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

    useEffect(() => {
        fetchReturnsAndCustomers();
    }, [fetchReturnsAndCustomers]);


    const handleViewDetails = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsDetailsOpen(true);
    };

    const handleCancelReturn = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsCancelOpen(true);
    };
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg" />)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (!returns || returns.length === 0) {
            return (
                <EmptyState
                    icon={Undo2}
                    title="Aucun retour de produit trouvé"
                    description="Commencez par créer un nouveau retour."
                >
                     <Button asChild>
                        <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link>
                    </Button>
                </EmptyState>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {returns.map(r => {
                    const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : undefined;
                    return (
                        <ReturnHistoryCard 
                            key={r.uuid} 
                            productReturn={r}
                            customerName={customerName}
                            onViewDetails={handleViewDetails}
                            onCancelReturn={handleCancelReturn}
                        />
                    )
                })}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Historique des Retours"
                description="Recherchez et consultez tous les retours de produits."
            >
                 <Button asChild>
                    <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link>
                </Button>
            </PageHeader>

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
            
            <div>{renderContent()}</div>

            <ReturnDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                productReturn={selectedReturn}
            />
            <CancelReturnDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                productReturn={selectedReturn}
                onSuccess={fetchReturnsAndCustomers}
            />
        </div>
    );
}
