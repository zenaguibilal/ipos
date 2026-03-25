'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { BreadClientForm } from './BreadClientForm';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BREAD_WEEK_DAY_LABELS, BREAD_WEEK_DAYS } from '@/lib/constants';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';

interface BreadClientListProps {
    onListChange: () => void;
}

export function BreadClientList({ onListChange }: BreadClientListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [clients, setClients] = useState<Customer[] | undefined>(undefined);

    const fetchClients = useCallback(async () => {
        try {
            const data = await customerService.filterCustomers({ status: 'is_bread_client' });
            setClients(data);
        } catch (error: any) {
            toast.error("Impossible de charger les clients de pain.", { description: error.message });
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const handleFormSuccess = () => {
        fetchClients();
        onListChange(); // Notify parent to refresh orders
    }

    const isLoading = clients === undefined;

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const getRecurrenceBadge = (client: Customer) => {
        if (!client.isBreadClient) return null;
        
        switch (client.bread_type_recurrence) {
            case 'quotidien':
                return <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-500/30">Quotidien</Badge>;
            case 'jours_specifiques':
                const activeDays = client.bread_jours_semaine ? BREAD_WEEK_DAYS.filter(day => client.bread_jours_semaine![day]?.actif) : [];
                const label = activeDays.length > 0 ? `${activeDays.map(d => BREAD_WEEK_DAY_LABELS[d]).join(', ')} (×${activeDays.length})` : 'Aucun jour';
                return <Badge variant="secondary" className="bg-orange-900/50 text-orange-300 border-orange-500/30">{label}</Badge>;
            case 'aucun':
                return <Badge variant="outline">Manuel</Badge>;
            default:
                return null;
        }
    }

    return (
        <>
            <Card className="flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                    <CardTitle>Clients de Pain</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow min-h-0">
                    <ScrollArea className="h-full">
                        <div className="space-y-2">
                            {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                            
                            {!isLoading && clients?.map(client => (
                                <div key={client.uuid} className="flex items-center p-2 rounded-md hover:bg-accent">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{client.firstName} {client.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{client.isBreadClient ? 'Actif' : 'Inactif'}</p>
                                    </div>
                                    {getRecurrenceBadge(client)}
                                    <Button variant="ghost" size="icon" className="ml-2" onClick={() => handleEdit(client)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                             {!isLoading && clients?.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">Aucun client de pain configuré.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <BreadClientForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                customer={selectedCustomer}
                onSuccess={handleFormSuccess}
            />
        </>
    );
}
