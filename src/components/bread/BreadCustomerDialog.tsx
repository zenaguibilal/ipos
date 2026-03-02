'use client';

import { useState } from 'react';
import { dataService } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { BreadCustomer } from '@/lib/types';

interface BreadCustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function BreadCustomerDialog({ isOpen, onOpenChange }: BreadCustomerDialogProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCustomer = async () => {
    if (!name || !quantity) {
      toast.error('Le nom et la quantité sont requis.');
      return;
    }
    
    setIsLoading(true);
    try {
      const customerData: Omit<BreadCustomer, 'id'> = {
        name,
        defaultOrderQuantity: parseInt(quantity),
        isActive: true,
      };
      await dataService.addBreadCustomer(customerData);

      toast.success(`Client "${name}" ajouté avec succès.`);
      onOpenChange(false);
      setName('');
      setQuantity('');
    } catch (error) {
      console.error('Error adding bread customer: ', error);
      toast.error("Erreur lors de l'ajout du client.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un client de pain</DialogTitle>
          <DialogDescription>Ajoutez un nouveau client avec sa commande de pain quotidienne par défaut.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nom du client</Label>
            <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Boulangerie Omar" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-quantity">Quantité par défaut</Label>
            <Input id="default-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex: 50" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
          <Button onClick={handleAddCustomer} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Ajout...' : 'Ajouter le client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
