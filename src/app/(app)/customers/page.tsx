'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileDown } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { customerService } from '@/services/customer.service';

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit';

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [customers, setCustomers] = useState<Customer[] | undefined>(undefined);
    const isLoading = customers === undefined;

    const fetchCustomers = useCallback(async () => {
        setCustomers(undefined); // Set to loading state
        try {
            const data = await customerService.filterCustomers({ query: debouncedSearchQuery, status: filterStatus });
            setCustomers(data);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger les clients.");
            setCustomers([]); // Set to empty array on error
        }
    }, [debouncedSearchQuery, filterStatus]);
    
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleEditCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    }, []);

    const handleDeleteCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    }, []);
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (!customers || customers.length === 0) {
            return (
                <EmptyState
                    icon={Users}
                    title="Aucun client trouvé"
                    description="Commencez par ajouter votre premier client ou ajustez vos filtres."
                >
                     <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                    </Button>
                </EmptyState>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map(c => (
                    <CustomerCard 
                        key={c.uuid} 
                        customer={c} 
                        onEdit={handleEditCustomer} 
                        onDelete={handleDeleteCustomer}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion des Clients"
                description="Recherchez, ajoutez et gérez vos clients."
            >
                <Button asChild variant="outline" disabled>
                    <label htmlFor="csv-importer">
                        <FileDown className="mr-2 h-4 w-4" /> Importer (bientôt)
                        <input type="file" id="csv-importer" accept=".csv" className="sr-only" />
                    </label>
                </Button>
                <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </PageHeader>

            <CustomerStats onRefresh={fetchCustomers} />

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par nom ou téléphone..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            Filtrer
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Statut du Client</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Tous les clients</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'has_debt'} onCheckedChange={() => setFilterStatus('has_debt')}>Avec une dette</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'overdue'} onCheckedChange={() => setFilterStatus('overdue')}>En retard de paiement</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'over_limit'} onCheckedChange={() => setFilterStatus('over_limit')}>Plafond dépassé</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div>
               {renderContent()}
            </div>

            <CustomerDialog 
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />
            <DeleteCustomerDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />
        </div>
    );
}
