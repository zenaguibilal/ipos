'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { PainClient, Weekday } from '@/lib/types';
import { Loader2, Plus, Users, Trash2 } from 'lucide-react';
import { dataService } from '@/services/data-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useLiveQuery } from 'dexie-react-hooks';
import { SupprimerPainClientDialog } from './DeleteCustomerDialog';
import { ScrollArea } from '../ui/scroll-area';

interface PainClientDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    selectedClient: PainClient | null;
    manualOrderCustomers: PainClient[];
    onAddCommandeManuelle: (clientId: number, quantite: number) => void;
}

const initialFormState: Omit<PainClient, 'id' | 'createdAt' | 'updatedAt'> = {
    nom: '',
    actif: true,
    type_recurrence: 'quotidien',
    quantite_defaut: 1,
    jours_semaine: {
        lundi: { actif: true, quantite: 1 },
        mardi: { actif: true, quantite: 1 },
        mercredi: { actif: true, quantite: 1 },
        jeudi: { actif: true, quantite: 1 },
        vendredi: { actif: true, quantite: 1 },
        samedi: { actif: false, quantite: 1 },
        dimanche: { actif: false, quantite: 1 },
    },
};

const weekdays: Weekday[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export function PainClientDialog({ isOpen, onOpenChange, selectedClient, manualOrderCustomers, onAddCommandeManuelle }: PainClientDialogProps) {
    const [clientToEdit, setClientToEdit] = useState<PainClient | null>(selectedClient);
    const [clientToDelete, setClientToDelete] = useState<PainClient | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        setClientToEdit(selectedClient);
    }, [selectedClient]);

    const clients = useLiveQuery(() => dataService.getPainClients({}), []);

    const handleEdit = (c: PainClient) => {
        setClientToEdit(c);
    };

    const handleDelete = (c: PainClient) => {
        setClientToDelete(c);
        setIsDeleteDialogOpen(true);
    };

    const handleClose = () => {
        setClientToEdit(null);
        onOpenChange(false);
    }

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Gestion des Clients de Pain</DialogTitle>
                        <DialogDescription>
                            Ajoutez, modifiez ou supprimez les clients récurrents pour le service de pain.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-8 max-h-[70vh] py-4">
                        <ClientForm client={clientToEdit} onDone={() => setClientToEdit(null)} />
                        
                        <div className="flex flex-col gap-4">
                             <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Liste des clients</h3>
                                <ScrollArea className="h-[250px] pr-4">
                                <div className="space-y-2">
                                    {clients?.map(c => (
                                        <div key={c.id} className="flex items-center p-2 bg-muted/50 rounded-lg">
                                            <p className="flex-grow font-medium">{c.nom}</p>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>Modifier</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                </ScrollArea>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <h3 className="font-semibold text-lg">Ajouter une commande manuelle</h3>
                                <FormulaireCommandeManuelle clients={manualOrderCustomers} onAdd={onAddCommandeManuelle} onDone={handleClose} />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
             <SupprimerPainClientDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                client={clientToDelete}
            />
        </>
    );
}

function ClientForm({ client, onDone }: { client: PainClient | null, onDone: () => void }) {
    const [formState, setFormState] = useState(client || initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setFormState(client || initialFormState);
    }, [client]);

    const handleInputChange = (field: keyof Omit<PainClient, 'id' | 'jours_semaine' | 'actif'>, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleWeekdayChange = (day: Weekday, field: 'actif' | 'quantite', value: any) => {
        setFormState(prev => ({
            ...prev,
            jours_semaine: {
                ...prev.jours_semaine,
                [day]: {
                    ...prev.jours_semaine[day],
                    [field]: value
                }
            }
        }));
    };

    const validateForm = (): boolean => {
        if (!formState.nom.trim()) {
            toast.error("Le nom du client est requis.");
            return false;
        }

        if (formState.type_recurrence === 'quotidien' && formState.quantite_defaut <= 0) {
            toast.error("La quantité par défaut doit être supérieure à zéro.");
            return false;
        }

        if (formState.type_recurrence === 'jours_specifiques') {
            const activeDays = Object.values(formState.jours_semaine).filter(d => d.actif);
            if (activeDays.length === 0) {
                toast.error("Veuillez sélectionner au moins un jour actif.");
                return false;
            }
            if (activeDays.some(d => d.quantite <= 0)) {
                toast.error("La quantité pour chaque jour actif doit être supérieure à zéro.");
                return false;
            }
        }
        return true;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            if(formState.id) {
                await dataService.updatePainClient(formState.id, formState);
                toast.success("Client mis à jour.");
            } else {
                await dataService.addPainClient(formState);
                toast.success("Client ajouté.");
            }
            onDone();
        } catch (error: any) {
            toast.error("Erreur", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pr-4 border-r">
            <h3 className="font-semibold text-lg">{client ? 'Modifier le Client' : 'Nouveau Client'}</h3>
            <div className="space-y-2">
                <Label htmlFor="nom">Nom du client</Label>
                <Input id="nom" value={formState.nom} onChange={e => handleInputChange('nom', e.target.value)} required autoFocus />
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="actif" checked={formState.actif} onCheckedChange={checked => setFormState(p => ({...p, actif: checked}))} />
                <Label htmlFor="actif">Client Actif</Label>
            </div>
            <div className="space-y-2">
                <Label htmlFor="type_recurrence">Type de récurrence</Label>
                <Select value={formState.type_recurrence} onValueChange={(v: any) => handleInputChange('type_recurrence', v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quotidien">Quotidien</SelectItem>
                        <SelectItem value="jours_specifiques">Jours Spécifiques</SelectItem>
                        <SelectItem value="aucun">Manuel (aucun)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {formState.type_recurrence === 'quotidien' && (
                 <div className="space-y-2">
                    <Label htmlFor="quantite_defaut">Quantité par défaut</Label>
                    <Input id="quantite_defaut" type="number" value={formState.quantite_defaut} onChange={e => handleInputChange('quantite_defaut', parseInt(e.target.value) || 0)} min="1" />
                </div>
            )}
             {formState.type_recurrence === 'jours_specifiques' && (
                 <div className="space-y-2">
                    <Label>Quantités par jour</Label>
                    <div className="space-y-2">
                        {weekdays.map(day => (
                            <div key={day} className="flex items-center gap-3">
                                <Switch id={`switch-${day}`} checked={formState.jours_semaine[day].actif} onCheckedChange={c => handleWeekdayChange(day, 'actif', c)}/>
                                <Label htmlFor={`switch-${day}`} className="w-20 capitalize">{day}</Label>
                                <Input type="number" disabled={!formState.jours_semaine[day].actif} value={formState.jours_semaine[day].quantite} onChange={e => handleWeekdayChange(day, 'quantite', parseInt(e.target.value) || 0)} min="1"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Enregistrer
                </Button>
            </DialogFooter>
        </form>
    )
}

function FormulaireCommandeManuelle({ clients, onAdd, onDone }: { clients: PainClient[], onAdd: (id: number, qty: number) => void, onDone: () => void }) {
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    
    const handleAdd = () => {
        if (!selectedClientId) {
            toast.error("Veuillez sélectionner un client.");
            return;
        }
        onAdd(parseInt(selectedClientId), quantity);
        onDone();
    }
    
    return (
        <div className="space-y-3">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client..." /></SelectTrigger>
                <SelectContent>
                    {clients.map(c => (
                        <SelectItem key={c.id} value={String(c.id!)}>{c.nom}</SelectItem>
                    ))}
                     {clients.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">Aucun client manuel trouvé.</p>}
                </SelectContent>
            </Select>
            <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} placeholder="Quantité" min="1"/>
            <Button onClick={handleAdd} className="w-full" disabled={!selectedClientId}>
                <Plus className="mr-2 h-4 w-4"/> Ajouter
            </Button>
        </div>
    )
}
