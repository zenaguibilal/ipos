'use client';

import { useState, useEffect } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AdjustStockDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  product: Product;
}

export function AdjustStockDialog({ isOpen, onOpenChange, userId, product }: AdjustStockDialogProps) {
  const firestore = useFirestore();
  const [newQuantity, setNewQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setNewQuantity(String(product.quantity));
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const quantityNumber = parseInt(newQuantity, 10);
    if (isNaN(quantityNumber) || quantityNumber < 0) {
      toast.error('Veuillez entrer une quantité valide.');
      return;
    }

    if (!firestore) {
      toast.error("Le service de base de données n'est pas disponible.");
      return;
    }

    setIsLoading(true);
    const productDocRef = doc(firestore, 'users', userId, 'products', product.id);

    updateDocumentNonBlocking(
      productDocRef,
      { quantity: quantityNumber },
      {
        onSuccess: () => {
          setIsLoading(false);
          onOpenChange(false);
          toast.success(`Stock de "${product.name}" mis à jour.`);
        },
        onError: (err) => {
          setIsLoading(false);
          toast.error("Échec de la mise à jour du stock.");
          console.error(err);
        },
      }
    );
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
            <DialogDescription>
              Mettez à jour la quantité en stock pour <span className="font-bold">{product.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-quantity" className="text-right">
                Actuel
              </Label>
              <Input
                id="current-quantity"
                value={product.quantity}
                className="col-span-3 bg-muted"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-quantity" className="text-right">
                Nouveau
              </Label>
              <Input
                id="new-quantity"
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="col-span-3"
                required
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour le stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
