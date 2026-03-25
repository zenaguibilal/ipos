'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BREAD_WEEK_DAY_LABELS_FULL } from '@/lib/constants';

const initialFormState: Partial<Customer> = {
    isBreadClient: true,
    bread_type_recurrence: 'quotidien',
    bread_quantite_defaut: 10,
    bread_jours_semaine: {
        lundi:    { actif: true, quantite: 10 },
        mardi:    { actif: true, quantite: 10 },
        mercredi: { actif: true, quantite: 10 },
        jeudi:    { actif: true, quantite: 10 },
        vendredi: { actif: false, quantite: 0 },
        samedi:   { actif: true, quantite: 10 },
        dimanche: { actif: true, quantite: 10 }
    }
};

interface BreadClientFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: () => void;
}

export function BreadClientForm({ isOpen, onOpenChange, customer, onSuccess }: BreadClientFormProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                isBreadClient: customer.isBreadClient ?? true,
                bread_type_recurrence: customer.bread_type_recurrence || 'aucun',
                bread_quantite_defaut: customer.bread_quantite_defaut || 10,
                bread_jours_semaine: customer.bread_jours_semaine || initialFormState.bread_jours_semaine!
            });
        } else {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer?.uuid) return;

        setIsLoading(true);
        try {
            const dataToSave: Partial<Customer> = {
                isBreadClient: formState.isBreadClient,
                bread_type_recurrence: formState.bread_type_recurrence,
            };

            if (formState.bread_type_recurrence === 'quotidien') {
                dataToSave.bread_quantite_defaut = formState.bread_quantite_defaut;
            } else if (formState.bread_type_recurrence === 'jours_specifiques') {
                dataToSave.bread_jours_semaine = formState.bread_jours_semaine;
            }

            await customerService.updateCustomer(customer.uuid, dataToSave);
            toast.success(`Paramètres de pain pour "${customer.firstName} ${customer.lastName}" mis à jour.`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Une erreur est survenue.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [formState, customer, onOpenChange, onSuccess]);
    
    const handleDayToggle = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL) => {
        setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], actif: !prev.bread_jours_semaine![day].actif }
            }
        }));
    };

    const handleDayQuantityChange = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL, value: string) => {
         const quantite = parseInt(value, 10) || 0;
         setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], quantite }
            }
        }));
    };

    if (!customer) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Client de Pain: {customer.firstName} {customer.lastName}</DialogTitle>
                            <DialogDescription>
                                Gérez les commandes récurrentes du client.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isBreadClient" className="text-base">Activer les commandes de pain</Label>
                                <Switch id="isBreadClient" checked={formState.isBreadClient} onCheckedChange={(checked) => setFormState(s => ({ ...s, isBreadClient: checked }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bread_type_recurrence">Type de Récurence</Label>
                                <Select value={formState.bread_type_recurrence} onValueChange={(value) => setFormState(s => ({ ...s, bread_type_recurrence: value as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quotidien">Quotidien</SelectItem>
                                        <SelectItem value="jours_specifiques">Jours Spécifiques</SelectItem>
                                        <SelectItem value="aucun">Manuel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formState.bread_type_recurrence === 'quotidien' && (
                                <div className="space-y-2">
                                    <Label htmlFor="bread_quantite_defaut">Quantité par défaut</Label>
                                    <Input id="bread_quantite_defaut" type="number" value={formState.bread_quantite_defaut} onChange={(e) => setFormState(s => ({ ...s, bread_quantite_defaut: parseInt(e.target.value) || 0 }))} />
                                </div>
                            )}
                            {formState.bread_type_recurrence === 'jours_specifiques' && (
                                <div className="space-y-3">
                                    <Label>Quantités par jour</Label>
                                    <div className="space-y-2 rounded-md border p-4">
                                        {Object.entries(BREAD_WEEK_DAY_LABELS_FULL).map(([key, label]) => (
                                            <div key={key} className="flex items-center justify-between gap-4">
                                                <Switch id={key} checked={formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif} onCheckedChange={() => handleDayToggle(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL)} />
                                                <Label htmlFor={key} className="flex-grow">{label}</Label>
                                                <Input type="number" className="w-24" 
                                                    value={formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].quantite}
                                                    onChange={e => handleDayQuantityChange(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL, e.target.value)}
                                                    disabled={!formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
