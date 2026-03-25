'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { DatePicker } from '../ui/date-picker';
import { paymentService } from '@/services/payment.service';
import { customerService } from '@/services/customer.service';

interface AddPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer;
  onPaymentSuccess: () => void;
}

export function AddPaymentDialog({ isOpen, onOpenChange, customer, onPaymentSuccess }: AddPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(String(customer.outstandingBalance > 0 ? customer.outstandingBalance : ''));
      setPaymentDate(new Date());
      setNotes('');
    }
  }, [isOpen, customer.outstandingBalance]);

  const handleAddPayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Veuillez entrer un montant valide.');
      return;
    }
    if (paymentAmount > customer.outstandingBalance) {
        toast.error('Le montant du paiement ne peut pas dépasser le solde impayé.');
        return;
    }
    if (!paymentDate) {
        toast.error('Veuillez sélectionner une date de paiement.');
        return;
    }
    
    setIsLoading(true);
    try {
      await paymentService.addPayment({
        customerUuid: customer.uuid,
        amount: paymentAmount,
        paymentDate: paymentDate,
        notes: notes || undefined,
      });

      // After adding the payment, recalculate the customer's status
      await customerService.recalculateCustomerStatus(customer.uuid);

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré pour ${customer.firstName} ${customer.lastName}.`);
      onPaymentSuccess();
      onOpenChange(false);
      setAmount('');
    } catch (error) {
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
             Le solde impayé actuel est de <span className="font-bold text-destructive">{formatCurrency(customer.outstandingBalance)}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Montant (DA)</Label>
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
            <div className="space-y-2">
              <Label>Date du paiement</Label>
              <DatePicker date={paymentDate} setDate={setPaymentDate} />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes (facultatif)</Label>
            <Textarea
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Paiement partiel, numéro de chèque..."
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
