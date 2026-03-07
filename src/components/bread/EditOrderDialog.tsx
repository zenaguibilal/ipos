'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CommandePain } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';

interface ModifierPainCommandeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    commande: CommandePain;
}

export function ModifierPainCommandeDialog({ isOpen, onOpenChange, commande }: ModifierPainCommandeDialogProps) {
    const [quantity, setQuantity] = useState(commande.quantite);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if(isOpen) {
            setQuantity(commande.quantite);
        }
    }, [isOpen, commande.quantite]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await dataService.updateCommandePainQuantite(commande.id!, quantity);
            toast.success("Quantité mise à jour.");
            onOpenChange(false);
        } catch (e: any) {
            toast.error("Erreur", { description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Modifier la quantité pour {commande.nom_client}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="quantity">Nouvelle quantité</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)} autoFocus/>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
