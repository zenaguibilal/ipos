'use client';

import { useState, useEffect } from 'react';
import { dataService } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { BreadOrder } from '@/lib/types';

interface EditOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: BreadOrder;
  dateString: string;
}

export default function EditOrderDialog({ isOpen, onOpenChange, order, dateString }: EditOrderDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentQuantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
      setQuantity(String(currentQuantity));
    }
  }, [isOpen, order]);

  const handleUpdate = async () => {
    if (!quantity) {
      toast.error('La quantité est requise.');
      return;
    }
    
    setIsLoading(true);
    try {
        await dataService.updateDailyBreadOrderQuantity(order, parseInt(quantity, 10), dateString);
        toast.success(`Commande pour ${order.name} mise à jour.`);
        onOpenChange(false);
    } catch (error) {
      console.error('Error updating order: ', error);
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la commande pour {order.name}</DialogTitle>
          <DialogDescription>La quantité par défaut est de {order.defaultOrderQuantity}. Cette modification ne s'appliquera qu'à aujourd'hui.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="quantity">Nouvelle quantité</Label>
          <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-2 text-lg" autoFocus/>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre à jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
