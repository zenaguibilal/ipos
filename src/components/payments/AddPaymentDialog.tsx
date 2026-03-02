'use client';

import { useState, useEffect } from 'react';
import { dataService } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Customer, Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface AddPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer;
  outstandingBalance: number;
}

export function AddPaymentDialog({ isOpen, onOpenChange, customer, outstandingBalance }: AddPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(String(outstandingBalance > 0 ? outstandingBalance : ''));
    }
  }, [isOpen, outstandingBalance]);

  const handleAddPayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Veuillez entrer un montant valide.');
      return;
    }
    
    setIsLoading(true);
    try {
      const paymentData: Omit<Payment, 'id'> = {
        customerId: customer.id!,
        customerName: `${customer.firstName} ${customer.lastName}`,
        amount: paymentAmount,
      };
      await dataService.addPayment(paymentData);

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré pour ${customer.firstName} ${customer.lastName}.`);
      onOpenChange(false);
      setAmount('');
    } catch (error) {
      console.error('Error adding payment: ', error);
      toast.error("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement pour {customer.firstName}</DialogTitle>
          <DialogDescription>
             Le solde impayé actuel est de <span className="font-bold text-destructive">{formatCurrency(outstandingBalance)}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Montant du paiement (DA)</Label>
            <Input 
                id="payment-amount" 
                type="number"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                className="text-lg"
                autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
          <Button onClick={handleAddPayment} disabled={isLoading || parseFloat(amount) <= 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Enregistrement...' : 'Enregistrer le paiement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
