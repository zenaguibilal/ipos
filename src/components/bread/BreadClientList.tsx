
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Edit, UserPlus, Phone, MapPin, Tag } from 'lucide-react';
import { BreadClientForm } from './BreadClientForm';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BREAD_WEEK_DAY_LABELS, BREAD_WEEK_DAYS } from '@/lib/constants';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
            toast.error("Impossible de charger les clients.");
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const handleFormSuccess = () => {
        fetchClients();
        onListChange();
    }

    const isLoading = clients === undefined;

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const getRecurrenceBadge = (client: Customer) => {
        if (!client.isBreadClient) return <Badge variant="outline" className="opacity-50">Inactif</Badge>;
        
        switch (client.bread_type_recurrence) {
            case 'quotidien':
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase">Quotidien • {client.bread_quantite_defaut}p</Badge>;
            case 'jours_specifiques':
                const activeDays = client.bread_jours_semaine ? BREAD_WEEK_DAYS.filter(day => client.bread_jours_semaine![day]?.actif) : [];
                return <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black uppercase">{activeDays.length} j / sem</Badge>;
            case 'aucun':
                return <Badge variant="outline" className="text-[10px] font-black uppercase opacity-70">Manuel uniquement</Badge>;
            default:
                return null;
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <Card className="lg:col-span-2 flex flex-col h-full luxury-glass border-white/5">
                <CardHeader className="flex-row items-center justify-between border-b border-white/5 bg-white/5 px-6">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Registre des Clients Pain</CardTitle>
                        <CardDescription>Liste des abonnés avec leur configuration de récurence.</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/30 text-primary">
                        <Link href="/customers"><UserPlus className="mr-2 h-4 w-4" /> Nouveau Client</Link>
                    </Button>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-0">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-3">
                            {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                            
                            {!isLoading && clients?.map(client => (
                                <div key={client.uuid} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-white/5 hover:bg-muted/30 transition-colors group">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                                        {client.firstName[0]}{client.lastName[0]}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-base truncate">{client.firstName} {client.lastName}</p>
                                            {getRecurrenceBadge(client)}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                            {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phone}</span>}
                                            {client.address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {client.address}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(client)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                             {!isLoading && clients?.length === 0 && (
                                <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-3xl border-white/5 m-6">
                                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-semibold">Aucun client de pain configuré.</p>
                                    <p className="text-xs max-w-xs mx-auto mt-2">Activez l'option "Client Pain" dans la fiche d'un client pour le voir apparaître ici.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="luxury-glass border-white/5 bg-muted/10 h-fit">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Comment ça marche ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <div className="space-y-2">
                        <p className="font-bold text-foreground">1. Configurer l'abonnement</p>
                        <p>Éditez un client pour définir s'il reçoit du pain tous les jours ou seulement certains jours de la semaine.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-foreground">2. Génération quotidienne</p>
                        <p>Dans l'onglet "Distribution", cliquez sur "Générer". iPOS créera toutes les commandes selon vos réglages en une seconde.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-foreground">3. Facturation groupée</p>
                        <p>Sélectionnez les commandes livrées et cliquez sur "Facturer". Une vente est automatiquement créée et ajoutée au compte du client.</p>
                    </div>
                </CardContent>
            </Card>

            <BreadClientForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                customer={selectedCustomer}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
}
