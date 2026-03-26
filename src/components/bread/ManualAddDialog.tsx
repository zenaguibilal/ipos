
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { breadService } from '@/services/bread.service';
import { toast } from 'sonner';
import { Plus, User, Package } from 'lucide-react';

interface ManualAddDialogProps {
    currentDate: string;
    onSuccess: () => void;
}

export function ManualAddDialog({ currentDate, onSuccess }: ManualAddDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [orderName, setOrderName] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderName.trim()) {
            toast.error("Veuillez saisir un nom pour la commande.");
            return;
        }
        if (quantity <= 0) {
            toast.error("La quantité doit être supérieure à zéro.");
            return;
        }

        setIsLoading(true);
        try {
            await breadService.addOrder({
                orderName: orderName.trim(),
                quantite: quantity,
                date: currentDate,
            });
            toast.success("Commande ajoutée.");
            onSuccess();
            setIsOpen(false);
            setOrderName('');
            setQuantity(10);
        } catch(error: any) {
            toast.error("Erreur lors de l'ajout.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle Commande
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleAdd}>
                        <DialogHeader>
                            <DialogTitle>Ajouter une commande de pain</DialogTitle>
                            <DialogDescription>
                                Saisissez le nom du client ou du point de livraison et la quantité de pain.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="orderName" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Nom de la commande
                                </Label>
                                <Input 
                                    id="orderName" 
                                    placeholder="Ex: Restaurant Le Gourmet, Voisin Ahmed..."
                                    value={orderName} 
                                    onChange={e => setOrderName(e.target.value)} 
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual-quantity" className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    Quantité (pains)
                                </Label>
                                <Input 
                                    id="manual-quantity" 
                                    type="number" 
                                    value={quantity} 
                                    onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                                    min="1"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Ajout..." : "Ajouter au planning"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
