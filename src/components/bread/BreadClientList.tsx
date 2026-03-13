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

const joursSemaineLabels: Record<keyof NonNullable<BreadClient['jours_semaine']>, string> = {
    lundi: 'Lun',
    mardi: 'Mar',
    mercredi: 'Mer',
    jeudi: 'Jeu',
    vendredi: 'Ven',
    samedi: 'Sam',
    dimanche: 'Dim',
};
const joursSemaineOrder: (keyof typeof joursSemaineLabels)[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];


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

    const getRecurrenceBadge = (client: BreadClient) => {
        switch (client.type_recurrence) {
            case 'quotidien':
                return <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-500/30">Quotidien</Badge>;
            case 'jours_specifiques':
                const activeDays = client.jours_semaine ? joursSemaineOrder.filter(day => client.jours_semaine![day]?.actif) : [];
                const label = activeDays.length > 0 ? `${activeDays.map(d => joursSemaineLabels[d]).join(', ')} (×${activeDays.length})` : 'Aucun jour';
                return <Badge variant="secondary" className="bg-orange-900/50 text-orange-300 border-orange-500/30">{label}</Badge>;
            case 'aucun':
                return <Badge variant="outline">Manuel</Badge>;
            default:
                return null;
        }
    }

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
                                    {getRecurrenceBadge(client)}
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
