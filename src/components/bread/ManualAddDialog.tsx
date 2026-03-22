'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dataService } from '@/services/data-service';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { BreadClient } from '@/lib/types';

interface ManualAddDialogProps {
    currentDate: string;
    onAdd: () => void;
}

export function ManualAddDialog({ currentDate, onAdd }: ManualAddDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [quantity, setQuantity] = useState(10);
    const [manualClients, setManualClients] = useState<BreadClient[]>([]);

    useEffect(() => {
        if(isOpen) {
            dataService.getManualBreadClients().then(setManualClients);
        }
    }, [isOpen]);
    

    const handleAdd = async () => {
        if (!selectedClientId) {
            toast.error("Veuillez sélectionner un client.");
            return;
        }
        if (quantity <= 0) {
            toast.error("La quantité doit être supérieure à zéro.");
            return;
        }

        try {
            await dataService.addManualBreadOrder(parseInt(selectedClientId, 10), currentDate, quantity);
            toast.success("Commande manuelle ajoutée.");
            setIsOpen(false);
            setSelectedClientId('');
            setQuantity(10);
            onAdd();
        } catch(error: any) {
            toast.error("Erreur lors de l'ajout.", { description: error.message });
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter manuellement
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter une commande manuelle</DialogTitle>
                        <DialogDescription>
                            Sélectionnez un client et une quantité à ajouter pour aujourd'hui.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="manual-client">Client</Label>
                            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                <SelectTrigger id="manual-client"><SelectValue placeholder="Sélectionnez un client..."/></SelectTrigger>
                                <SelectContent>
                                    {manualClients?.map(client => (
                                        <SelectItem key={client.id} value={String(client.id)}>{client.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-quantity">Quantité</Label>
                            <Input id="manual-quantity" type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                        <Button onClick={handleAdd}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
