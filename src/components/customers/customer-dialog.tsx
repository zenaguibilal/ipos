'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';

interface CustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
}

const initialFormState = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    settlementDay: '',
    creditLimit: '',
};

export function CustomerDialog({ isOpen, onOpenChange, customer }: CustomerDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone || '',
                address: customer.address || '',
                settlementDay: String(customer.settlementDay || ''),
                creditLimit: String(customer.creditLimit || ''),
            });
        } else {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { firstName, lastName, phone, address, settlementDay, creditLimit } = formState;

        if (!firstName || !lastName) {
            setError("Le prénom et le nom sont requis.");
            setIsLoading(false);
            return;
        }

        const customerData: Partial<Customer> = {
            firstName,
            lastName,
            phone,
            address,
            settlementDay: settlementDay ? parseInt(settlementDay, 10) : undefined,
            creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        };

        try {
            if (customer && customer.id) { // Editing
                await dataService.updateCustomer(customer.id, customerData);
                toast.success(`Client ${firstName} ${lastName} mis à jour.`);
            } else { // Adding
                await dataService.addCustomer(customerData as any);
                toast.success(`Client ${firstName} ${lastName} ajouté.`);
            }
            onOpenChange(false);
        } catch (err) {
            setError("Une erreur est survenue.");
            toast.error("Échec de l'opération.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{customer ? 'Modifier le client' : 'Ajouter un nouveau client'}</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations pour {customer ? 'modifier' : 'créer'} un profil client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom</Label>
                                <Input id="firstName" value={formState.firstName} onChange={(e) => setFormState(s => ({...s, firstName: e.target.value}))} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="lastName">Nom</Label>
                                <Input id="lastName" value={formState.lastName} onChange={(e) => setFormState(s => ({...s, lastName: e.target.value}))} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input id="phone" type="tel" value={formState.phone} onChange={(e) => setFormState(s => ({...s, phone: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input id="address" value={formState.address} onChange={(e) => setFormState(s => ({...s, address: e.target.value}))} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settlementDay">Délai de paiement (jours)</Label>
                                <Input id="settlementDay" type="number" placeholder="Ex: 30" value={formState.settlementDay} onChange={(e) => setFormState(s => ({...s, settlementDay: e.target.value}))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="creditLimit">Limite de crédit (DA)</Label>
                                <Input id="creditLimit" type="number" placeholder="Ex: 10000" value={formState.creditLimit} onChange={(e) => setFormState(s => ({...s, creditLimit: e.target.value}))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
