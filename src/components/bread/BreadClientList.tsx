
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Edit, UserPlus, Phone, MapPin, Tag, Wheat, Sparkles, Search, X, UserCheck, CalendarDays } from 'lucide-react';
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
            const data = await api.get<Customer[]>('customers?status=is_bread_client');
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <Card className="lg:col-span-2 flex flex-col h-full luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-white/5 p-8 gap-6">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Wheat className="h-6 w-6 text-primary animate-pulse" />
                            Abonnés au Pain
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Gestion des flux récurrents de boulangerie</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-grow sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <Input 
                                placeholder="Chercher un abonné..." 
                                className="pl-9 h-11 rounded-xl bg-background/40 border-white/10 focus:border-primary/40 font-bold text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <Button asChild variant="outline" className="rounded-xl h-11 px-6 border-primary/30 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest gap-2">
                            <Link href="/customers"><UserPlus className="h-4 w-4" /> Client</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-0">
                    <ScrollArea className="h-full">
                        <div className="p-8 space-y-4">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[1.5rem]" />)
                            ) : filteredClients.length === 0 ? (
                                <div className="text-center py-32 text-muted-foreground border-2 border-dashed rounded-[3rem] border-white/5 bg-white/5 space-y-6">
                                    <div className="h-20 w-20 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center mx-auto">
                                        <Wheat className="h-10 w-10 text-primary opacity-20" />
                                    </div>
                                    <div className="space-y-2 px-8">
                                        <p className="font-black uppercase text-lg tracking-widest">Aucun abonné détecté</p>
                                        <p className="text-xs font-bold uppercase tracking-tighter italic opacity-60">
                                            {searchQuery ? "La recherche n'a retourné aucun résultat." : "Configurez l'option 'Client Pain' dans la fiche d'un client pour l'ajouter ici."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredClients.map(client => (
                                    <div key={client.uuid} className="flex items-center gap-6 p-5 rounded-[1.5rem] bg-background/40 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-[0.03] transition-opacity">
                                            <Wheat className="h-16 w-16 text-primary" />
                                        </div>
                                        
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            {client.firstName[0].toUpperCase()}{client.lastName[0].toUpperCase()}
                                        </div>
                                        
                                        <div className="flex-grow min-w-0 space-y-2 relative z-10">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="font-black text-lg uppercase tracking-tight truncate group-hover:text-primary transition-colors">{client.firstName} {client.lastName}</p>
                                                {getRecurrenceBadge(client)}
                                            </div>
                                            <div className="flex items-center gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                                {client.phone && <span className="flex items-center gap-2"><Phone className="h-3 w-3 text-primary/40" /> {client.phone}</span>}
                                                {client.address && <span className="flex items-center gap-2 truncate max-w-[200px]"><MapPin className="h-3 w-3 text-primary/40" /> {client.address}</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 shrink-0 relative z-10">
                                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm" onClick={() => handleEdit(client)}>
                                                <Edit className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild className="h-11 w-11 rounded-2xl hover:bg-white/10 transition-all shadow-sm">
                                                <Link href={`/customers/${client.uuid}`}><Search className="h-5 w-5 opacity-40" /></Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <Card className="luxury-glass border-white/5 bg-primary/5 h-fit shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                        <Sparkles className="h-32 w-32 text-primary" />
                    </div>
                    <CardHeader className="p-8 border-b border-white/5">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <UserCheck className="h-5 w-5 text-primary" />
                            Guide Souverain
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 text-[11px] font-bold leading-relaxed text-muted-foreground uppercase tracking-widest">
                        <div className="space-y-3 relative pl-8 border-l border-primary/20 group/step">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] group-hover/step:scale-125 transition-transform" />
                            <p className="text-foreground font-black text-xs">Configuration initial</p>
                            <p className="opacity-60 italic">Activez le statut "Client Pain" dans le registre général des clients iPOS.</p>
                        </div>
                        <div className="space-y-3 relative pl-8 border-l border-primary/20 group/step">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] group-hover/step:scale-125 transition-transform" />
                            <p className="text-foreground font-black text-xs">Planification des flux</p>
                            <p className="opacity-60 italic">Définissez les fréquences (Quotidien ou spécifique) et les quantités par défaut.</p>
                        </div>
                        <div className="space-y-3 relative pl-8 border-l border-primary/20 group/step">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] group-hover/step:scale-125 transition-transform" />
                            <p className="text-foreground font-black text-xs">Audit de distribution</p>
                            <p className="opacity-60 italic">Chaque matin, générez les bons du jour et validez les livraisons en temps réel.</p>
                        </div>
                        
                        <div className="pt-6 border-t border-white/5">
                            <div className="bg-background/40 p-5 rounded-2xl border border-primary/10 shadow-inner">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="h-3 w-3 text-primary" />
                                    <p className="text-[10px] font-black uppercase text-primary">Note iPOS Core</p>
                                </div>
                                <p className="text-[10px] italic leading-snug opacity-80">
                                    "Le terminal utilise le prix déterministe défini dans vos paramètres de profil pour automatiser la facturation."
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="p-8 rounded-[2.5rem] bg-muted/10 border border-white/5 flex flex-col items-center text-center space-y-4 shadow-inner">
                    <div className="p-4 bg-background/40 rounded-2xl border border-white/10">
                        <CalendarDays className="h-8 w-8 text-primary opacity-40" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 mb-1">Total Abonnés Actifs</p>
                        <p className="text-3xl font-black uppercase italic tracking-tighter">
                            {isLoading ? '...' : clients?.length || 0} Clients
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
