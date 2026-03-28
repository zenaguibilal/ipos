'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Edit, UserPlus, Phone, MapPin, Tag, Wheat, Sparkles, Search, X, UserCheck, CalendarDays, Activity, ChevronRight } from 'lucide-react';
import { BreadClientForm } from './BreadClientForm';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Bread Client List (Sovereign Authority - Completed)
 * إدارة المشتركين: بطاقات فاخرة، محرك بحث فوري، وربط حتمي بالملفات الشخصية.
 */

interface BreadClientListProps {
    onListChange: () => void;
}

export function BreadClientList({ onListChange }: BreadClientListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [clients, setClients] = useState<Customer[] | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchClients = useCallback(async () => {
        try {
            // Fetching all customers and filtering for bread clients
            const data = await api.get<Customer[]>('customers');
            setClients(data.filter(c => c.isBreadClient));
        } catch (error: any) {
            toast.error("Impossible de charger les abonnés.");
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const handleFormSuccess = () => {
        fetchClients();
        onListChange();
    }

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        return clients.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(searchQuery))
        );
    }, [clients, searchQuery]);

    const isLoading = clients === undefined;

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const getRecurrenceBadge = (client: Customer) => {
        if (!client.isBreadClient) return <Badge variant="outline" className="opacity-50">Inactif</Badge>;
        
        switch (client.bread_type_recurrence) {
            case 'quotidien':
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-black uppercase px-3">Quotidien • {client.bread_quantite_defaut}p</Badge>;
            case 'jours_specifiques':
                const activeDays = client.bread_jours_semaine ? BREAD_WEEK_DAYS.filter(day => client.bread_jours_semaine![day]?.actif) : [];
                return <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-black uppercase px-3">{activeDays.length} j / sem</Badge>;
            case 'aucun':
                return <Badge variant="outline" className="text-[9px] font-black uppercase opacity-70 px-3">Manuel</Badge>;
            default:
                return null;
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-full pb-20">
            <Card className="lg:col-span-2 flex flex-col h-full luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-white/5 p-10 gap-8">
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 italic">
                            <Wheat className="h-8 w-8 text-primary animate-pulse" />
                            Abonnés au Pain
                        </CardTitle>
                        <CardDescription className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Souveraineté des flux récurrents de distribution</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-grow sm:w-72 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <Input 
                                placeholder="Rechercher un abonné..." 
                                className="pl-11 h-12 rounded-[1.2rem] bg-background/40 border-white/10 focus:border-primary/40 font-bold text-xs shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button asChild variant="outline" className="rounded-xl h-12 px-8 border-primary/30 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm">
                            <Link href="/customers"><UserPlus className="h-4 w-4" /> Activer un Client</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-0">
                    <ScrollArea className="h-full">
                        <div className="p-10 space-y-5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />)
                            ) : filteredClients.length === 0 ? (
                                <div className="text-center py-40 text-muted-foreground border-2 border-dashed rounded-[3rem] border-white/5 bg-white/5 space-y-8 opacity-40">
                                    <div className="h-24 w-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center mx-auto">
                                        <Wheat className="h-12 w-12 text-primary" />
                                    </div>
                                    <div className="space-y-3 px-10">
                                        <p className="font-black uppercase text-2xl tracking-widest">Registre Vierge</p>
                                        <p className="text-xs font-bold uppercase tracking-widest italic leading-relaxed">
                                            {searchQuery ? "Aucun résultat pour cette recherche." : "Configurez le statut 'Client Pain' dans le registre général pour peupler cette liste."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredClients.map(client => (
                                    <div key={client.uuid} className="flex items-center gap-8 p-6 rounded-[2.2rem] bg-background/40 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 duration-500">
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-1000">
                                            <Wheat className="h-24 w-24 text-primary" />
                                        </div>
                                        
                                        <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shrink-0 shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700">
                                            {client.firstName[0].toUpperCase()}{client.lastName[0].toUpperCase()}
                                        </div>
                                        
                                        <div className="flex-grow min-w-0 space-y-2 relative z-10">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <p className="font-black text-xl uppercase tracking-tight truncate group-hover:text-primary transition-colors">{client.firstName} {client.lastName}</p>
                                                {getRecurrenceBadge(client)}
                                            </div>
                                            <div className="flex items-center gap-8 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                                                {client.phone && <span className="flex items-center gap-2.5"><Phone className="h-3.5 w-3.5 text-primary/40" /> {client.phone}</span>}
                                                {client.address && <span className="flex items-center gap-2.5 truncate max-w-[250px]"><MapPin className="h-3.5 w-3.5 text-primary/40" /> {client.address}</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 shrink-0 relative z-10">
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm" onClick={() => handleEdit(client)} title="Configurer l'abonnement">
                                                <Edit className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl hover:bg-white/10 transition-all shadow-sm">
                                                <Link href={`/customers/${client.uuid}`} title="Dossier client"><ChevronRight className="h-6 w-6 opacity-40" /></Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="space-y-10 animate-in slide-in-from-right-4 duration-1000">
                <Card className="luxury-glass border-white/5 bg-primary/5 h-fit shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                        <Sparkles className="h-40 w-40 text-primary" />
                    </div>
                    <CardHeader className="p-10 border-b border-white/5">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                            <UserCheck className="h-6 w-6 text-primary" />
                            Guide Stratégique
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10 text-[11px] font-bold leading-relaxed text-muted-foreground uppercase tracking-[0.2em]">
                        <div className="space-y-3 relative pl-10 border-l-2 border-primary/20 group/step">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] group-hover/step:scale-150 transition-transform duration-500" />
                            <p className="text-foreground font-black text-xs">Activation Souveraine</p>
                            <p className="opacity-60 italic">Basculez le commutateur "Client Pain" dans le profil du zéboun pour débloquer l'automatisation.</p>
                        </div>
                        <div className="space-y-3 relative pl-10 border-l-2 border-primary/20 group/step">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] group-hover/step:scale-150 transition-transform duration-500" />
                            <p className="text-foreground font-black text-xs">Architecture des Flux</p>
                            <p className="opacity-60 italic">Définissez les fréquences précises (Quotidien ou Grille hebdomadaire) et les quotas par défaut.</p>
                        </div>
                        <div className="space-y-3 relative pl-10 border-l-2 border-primary/20 group/step">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] group-hover/step:scale-150 transition-transform duration-500" />
                            <p className="text-foreground font-black text-xs">Exécution Terminal</p>
                            <p className="opacity-60 italic">Générez les bons en un clic, validez les livraisons و transformez-les en factures MAC.</p>
                        </div>
                        
                        <div className="pt-8 border-t border-white/5">
                            <div className="bg-background/40 p-6 rounded-[1.5rem] border border-primary/10 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Activity className="h-12 w-12" />
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Activity className="h-4 w-4 text-primary animate-pulse" />
                                    <p className="text-[11px] font-black uppercase text-primary tracking-widest">Note Core iPOS</p>
                                </div>
                                <p className="text-[10px] italic leading-relaxed opacity-80 normal-case">
                                    "La conversion en facture s'appuie sur le prix déterministe fixé dans vos paramètres métiers pour une intégrité financière absolue."
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="p-10 rounded-[3rem] bg-muted/10 border border-white/5 flex flex-col items-center text-center space-y-6 shadow-inner group">
                    <div className="p-5 bg-background/40 rounded-3xl border border-white/10 group-hover:scale-110 transition-transform duration-700 shadow-xl">
                        <CalendarDays className="h-10 w-10 text-primary opacity-40" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em] opacity-60 mb-2">Total Abonnés Actifs</p>
                        <p className="text-4xl font-black uppercase italic tracking-tighter text-foreground">
                            {isLoading ? '...' : clients?.length || 0} <span className="text-primary">Clients</span>
                        </p>
                    </div>
                </div>
            </div>

            <BreadClientForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                customer={selectedCustomer}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
}
