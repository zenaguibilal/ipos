'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { LigneCommandePain, PainClient, CommandePain, CompanyProfile, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, Printer, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { PainStatsCartes } from '@/components/bread/BreadStatsCards';
import { PainClientDialog } from '@/components/bread/BreadCustomerDialog';
import { PainCommandeCarte } from '@/components/bread/BreadOrderCard';
import { ListePainImprimable } from '@/components/bread/PrintableBreadList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from 'sonner';
import { db } from '@/lib/database';

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export default function BreadPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [selectedClient, setSelectedClient] = useState<PainClient | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [isGeneratingSales, setIsGeneratingSales] = useState(false);
    
    const dateString = formatDate(selectedDate);
    
    const { data, isLoading } = useLiveQuery(async () => {
        await dataService.creerCommandesDuJourSiNecessaire(dateString);
        const [clients, commandes, ventes, profile] = await Promise.all([
            dataService.getPainClients({ actifs: true }),
            dataService.getCommandesPainDuJour(dateString),
            db.sales.where('date_commande_pain').equals(dateString).toArray(),
            db.companyProfile.get(1)
        ]);
        return { clients, commandes, ventes, profile: profile ?? null };
    }, [dateString], { data: { clients: [], commandes: [], ventes: [], profile: null }, isLoading: true });

    const { clients, commandes, ventes, profile } = data;

    const combinedOrders: LigneCommandePain[] = useMemo(() => {
        if (isLoading || !clients || !commandes || !ventes) return [];

        const commandeMap = new Map(commandes.map(c => [c.client_pain_id, c]));
        const venteMap = new Map(ventes.filter(v => v.id).map(v => [v.id!, v]));
        
        commandes.forEach(cmd => {
            if(cmd.vente_id && venteMap.has(cmd.vente_id) && cmd.statut !== 'paye') {
                dataService.updateCommandePainStatut(cmd.id!, 'paye');
            }
        });

        return clients
            .filter(c => c.actif)
            .map(client => {
                const commandeDuJour = commandeMap.get(client.id!);
                const defaultQuantity = dataService.getQuantitePainParDefautPourJour(client, selectedDate);
                const estModifie = commandeDuJour ? commandeDuJour.quantite !== defaultQuantity : false;
                
                return {
                    ...client,
                    id: client.id!,
                    commandeDuJour,
                    estModifie
                };
            })
            .sort((a,b) => a.nom.localeCompare(b.nom));
    }, [clients, commandes, ventes, selectedDate, isLoading]);
    
    const unassignedCustomers = useMemo(() => {
        if (!clients || !commandes) return [];
        const assignedCustomerIds = new Set(commandes.map(o => o.client_pain_id));
        return clients.filter(c => c.actif && !assignedCustomerIds.has(c.id!));
    }, [clients, commandes]);


    const handleEditCustomer = (client: PainClient) => {
        setSelectedClient(client);
        setIsCustomerDialogOpen(true);
    };

    const handleAddManualOrder = async (clientId: number, quantite: number) => {
        try {
            await dataService.addCommandePainManuelle(clientId, dateString, quantite);
            toast.success("Commande manuelle ajoutée.");
        } catch (e: any) {
            toast.error("Erreur", { description: e.message });
        }
    };

    const handleSelectOrder = (orderId: number) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const allSelectableOrders = combinedOrders
            .filter(o => o.commandeDuJour && o.commandeDuJour.statut !== 'paye')
            .map(o => o.commandeDuJour!.id!);
            
        if (selectedOrders.size === allSelectableOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(allSelectableOrders));
        }
    };

    const handleGenerateSales = async () => {
        if (selectedOrders.size === 0) {
            toast.info("Veuillez sélectionner au moins une commande à facturer.");
            return;
        }
        setIsGeneratingSales(true);
        try {
            const result = await dataService.genererVentesPain(Array.from(selectedOrders), dateString);
            toast.success(`${result.count} vente(s) générée(s) avec succès !`);
            setSelectedOrders(new Set());
        } catch (e: any) {
            toast.error("Erreur lors de la génération des ventes", { description: e.message });
        } finally {
            setIsGeneratingSales(false);
        }
    };

    useEffect(() => {
        if (isPrintMode) {
            setTimeout(() => {
                window.print();
                setIsPrintMode(false);
            }, 100);
        }
    }, [isPrintMode]);

    return (
        <>
        <div className="p-4 sm:p-6 space-y-6 print-hide">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 luxury-glass p-1 rounded-full">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}><ChevronLeft className="h-5 w-5"/></Button>
                        <Button variant="ghost" className="w-48 hidden sm:block" onClick={() => setSelectedDate(new Date())}>{format(selectedDate, "'Aujourd'hui,' d MMMM", { locale: fr })}</Button>
                        <Button variant="ghost" className="w-28 sm:hidden" onClick={() => setSelectedDate(new Date())}>{format(selectedDate, "d MMM", { locale: fr })}</Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight className="h-5 w-5"/></Button>
                    </div>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsPrintMode(true)}><Printer className="mr-2 h-4 w-4"/> Imprimer</Button>
                    <Button className="w-full sm:w-auto" onClick={() => { setSelectedClient(null); setIsCustomerDialogOpen(true); }}>
                        <Users className="mr-2 h-4 w-4" /> Gérer les clients
                    </Button>
                </div>
            </header>

            {!profile?.prix_pain && !isLoading && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Prix du pain non configuré !</AlertTitle>
                    <AlertDescription>
                        La génération de factures est désactivée. Veuillez définir un "Prix de vente du pain" dans la page <Link href="/profile" className="font-bold underline">Profil & Paramètres</Link>.
                    </AlertDescription>
                </Alert>
            )}

            <PainStatsCartes commandes={commandes} />

             <div className="p-3 luxury-glass flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="select-all" 
                        checked={combinedOrders.filter(o => o.commandeDuJour && o.commandeDuJour.statut !== 'paye').length > 0 && selectedOrders.size === combinedOrders.filter(o => o.commandeDuJour && o.commandeDuJour.statut !== 'paye').length}
                        onChange={handleSelectAll}
                        className="h-5 w-5 rounded border-primary text-primary focus:ring-primary"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                        {selectedOrders.size > 0 ? `${selectedOrders.size} sélectionné(s)` : 'Tout sélectionner'}
                    </label>
                </div>
                <Button 
                    onClick={handleGenerateSales} 
                    disabled={isGeneratingSales || selectedOrders.size === 0 || !profile?.prix_pain}
                >
                    {isGeneratingSales ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                    Facturer la sélection
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                </div>
            ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {combinedOrders.map(ligne => (
                        <PainCommandeCarte
                            key={ligne.id} 
                            ligne={ligne} 
                            date={dateString}
                            isSelected={ligne.commandeDuJour ? selectedOrders.has(ligne.commandeDuJour.id!) : false}
                            onSelect={ligne.commandeDuJour ? () => handleSelectOrder(ligne.commandeDuJour!.id!) : undefined}
                        />
                    ))}
                </div>
            )}
            
            <PainClientDialog
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                selectedClient={selectedClient}
                clientsNonAssignes={unassignedCustomers}
                onAddCommandeManuelle={handleAddManualOrder}
            />
        </div>
        
        {isPrintMode && <ListePainImprimable lignes={combinedOrders} date={selectedDate} />}
        </>
    );
}
