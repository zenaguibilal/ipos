'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { BreadCustomer, Weekday } from '@/lib/types';
import { Loader2, Plus, Users, Trash2 } from 'lucide-react';
import { dataService } from '@/services/data-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useLiveQuery } from 'dexie-react-hooks';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';

interface BreadCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: BreadCustomer | null;
    unassignedCustomers: BreadCustomer[];
    onAddManualOrder: (customerId: number, quantity: number) => void;
}

const initialFormState: Omit<BreadCustomer, 'id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    isActive: true,
    type_recurrence: 'quotidien',
    quantite_defaut: 10,
    jours_semaine: {
        lundi: { actif: true, quantite: 10 },
        mardi: { actif: true, quantite: 10 },
        mercredi: { actif: true, quantite: 10 },
        jeudi: { actif: true, quantite: 10 },
        vendredi: { actif: true, quantite: 10 },
        samedi: { actif: false, quantite: 10 },
        dimanche: { actif: false, quantite: 10 },
    },
};

const weekdays: Weekday[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export function BreadCustomerDialog({ isOpen, onOpenChange, customer, unassignedCustomers, onAddManualOrder }: BreadCustomerDialogProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomerToDelete, setSelectedCustomerToDelete] = useState<BreadCustomer | null>(null);

    const customers = useLiveQuery(() => dataService.getBreadCustomers(), []);

    const handleEdit = (c: BreadCustomer) => {
        onOpenChange(true);
        // This is a bit of a workaround to ensure the dialog re-renders with the new customer
        setTimeout(() => customer = c, 0);
    }
    const handleDelete = (c: BreadCustomer) => {
        setSelectedCustomerToDelete(c);
        setIsDeleteDialogOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Gestion des Clients de Pain</DialogTitle>
                        <DialogDescription>
                            Ajoutez, modifiez ou supprimez les clients récurrents pour le service de pain.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-8 max-h-[70vh] py-4">
                        <CustomerForm customer={customer} onDone={() => onOpenChange(false)} />
                        
                        <div className="flex flex-col gap-4">
                             <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Liste des clients</h3>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                    {customers?.map(c => (
                                        <div key={c.id} className="flex items-center p-2 bg-muted/50 rounded-lg">
                                            <p className="flex-grow font-medium">{c.name}</p>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>Modifier</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <h3 className="font-semibold text-lg">Ajouter une commande manuelle</h3>
                                <ManualOrderForm customers={unassignedCustomers} onAdd={onAddManualOrder} onDone={() => onOpenChange(false)} />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
             <DeleteCustomerDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                customer={selectedCustomerToDelete}
            />
        </>
    );
}

function CustomerForm({ customer, onDone }: { customer: BreadCustomer | null, onDone: () => void }) {
    const [formState, setFormState] = useState(customer || initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setFormState(customer || initialFormState);
    }, [customer]);

    const handleInputChange = (field: keyof Omit<BreadCustomer, 'id' | 'jours_semaine' | 'isActive'>, value: any) => {
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
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formState.name) {
            toast.error("Le nom du client est requis.");
            return;
        }
        setIsLoading(true);
        try {
            if(formState.id) {
                await dataService.updateBreadCustomer(formState.id, formState);
                toast.success("Client mis à jour.");
            } else {
                await dataService.addBreadCustomer(formState);
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
            <h3 className="font-semibold text-lg">{customer ? 'Modifier le Client' : 'Nouveau Client'}</h3>
            <div className="space-y-2">
                <Label htmlFor="name">Nom du client</Label>
                <Input id="name" value={formState.name} onChange={e => handleInputChange('name', e.target.value)} required autoFocus />
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={formState.isActive} onCheckedChange={checked => setFormState(p => ({...p, isActive: checked}))} />
                <Label htmlFor="isActive">Client Actif</Label>
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
                    <Input id="quantite_defaut" type="number" value={formState.quantite_defaut} onChange={e => handleInputChange('quantite_defaut', parseInt(e.target.value) || 0)} />
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
                                <Input type="number" disabled={!formState.jours_semaine[day].actif} value={formState.jours_semaine[day].quantite} onChange={e => handleWeekdayChange(day, 'quantite', parseInt(e.target.value) || 0)} />
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

function ManualOrderForm({ customers, onAdd, onDone }: { customers: BreadCustomer[], onAdd: (id: number, qty: number) => void, onDone: () => void }) {
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    
    const handleAdd = () => {
        if (!selectedCustomerId) {
            toast.error("Veuillez sélectionner un client.");
            return;
        }
        onAdd(parseInt(selectedCustomerId), quantity);
        onDone();
    }
    
    return (
        <div className="space-y-3">
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client..." /></SelectTrigger>
                <SelectContent>
                    {customers.map(c => (
                        <SelectItem key={c.id} value={String(c.id!)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} placeholder="Quantité" />
            <Button onClick={handleAdd} className="w-full">
                <Plus className="mr-2 h-4 w-4"/> Ajouter
            </Button>
        </div>
    )
}
