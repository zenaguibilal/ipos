
'use client';

import { useState } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AddCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    onCustomerAdded?: (customer: Customer) => void;
}

export function AddCustomerDialog({ isOpen, onOpenChange, userId, onCustomerAdded }: AddCustomerDialogProps) {
    const firestore = useFirestore();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [settlementDay, setSettlementDay] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhone('');
        setSettlementDay('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!firstName || !lastName) {
            setError("Le prénom et le nom sont requis.");
            return;
        }

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const customersCollectionRef = collection(firestore, 'users', userId, 'customers');
        const newCustomerDocRef = doc(customersCollectionRef);
        
        const newCustomerData = {
            id: newCustomerDocRef.id,
            firstName,
            lastName,
            phone,
            settlementDay: settlementDay ? parseInt(settlementDay) : undefined,
            createdAt: serverTimestamp(),
        };

        try {
            await addDocumentNonBlocking(customersCollectionRef, newCustomerData);
            setIsLoading(false);
            onOpenChange(false);
            toast.success(`Client ${firstName} ${lastName} ajouté avec succès.`);
            onCustomerAdded?.(newCustomerData as unknown as Customer);
            resetForm();
        } catch (err) {
            setIsLoading(false);
            setError("Une erreur est survenue lors de l'ajout du client.");
            toast.error("Échec de l'ajout du client.");
            console.error(err);
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ajouter un nouveau client</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations pour créer un nouveau profil client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom</Label>
                                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="lastName">Nom</Label>
                                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settlementDay">Jour de règlement</Label>
                            <Input id="settlementDay" type="number" min="1" max="31" value={settlementDay} onChange={(e) => setSettlementDay(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Le jour du mois où le client paie habituellement ses dettes.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Ajout...' : 'Ajouter le client'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

    