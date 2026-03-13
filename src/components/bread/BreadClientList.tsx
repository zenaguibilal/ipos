'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { BreadClient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Edit } from 'lucide-react';
import { BreadClientForm } from './BreadClientForm';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const RecurrenceBadge = ({ type }: { type: BreadClient['type_recurrence'] }) => {
    switch (type) {
        case 'quotidien':
            return <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-500/30">Quotidien</Badge>;
        case 'jours_specifiques':
            return <Badge variant="secondary" className="bg-orange-900/50 text-orange-300 border-orange-500/30">Spécifique</Badge>;
        case 'aucun':
            return <Badge variant="outline">Manuel</Badge>;
        default:
            return null;
    }
}

export function BreadClientList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<BreadClient | null>(null);

    const clients = useLiveQuery(() => dataService.getBreadClients(), []);

    const handleEdit = (client: BreadClient) => {
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedClient(null);
        setIsFormOpen(true);
    };
    
    const isLoading = clients === undefined;

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Clients de Pain</CardTitle>
                    <Button size="icon" variant="ghost" onClick={handleAddNew}>
                        <Plus className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                            
                            {!isLoading && clients?.map(client => (
                                <div key={client.id} className="flex items-center p-2 rounded-md hover:bg-accent">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{client.nom}</p>
                                        <p className="text-sm text-muted-foreground">{client.actif ? 'Actif' : 'Inactif'}</p>
                                    </div>
                                    <RecurrenceBadge type={client.type_recurrence} />
                                    <Button variant="ghost" size="icon" className="ml-2" onClick={() => handleEdit(client)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                             {!isLoading && clients?.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">Aucun client de pain ajouté.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <BreadClientForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                client={selectedClient}
            />
        </>
    );
}
