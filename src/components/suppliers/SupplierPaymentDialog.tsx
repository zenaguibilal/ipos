
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Banknote } from 'lucide-react';
import type { Supplier, SupplierPayment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '@/lib/api-client';

interface SupplierPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  supplier: Supplier;
  onSuccess: () => void;
}

export function SupplierPaymentDialog({ isOpen, onOpenChange, supplier, onSuccess }: SupplierPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [method, setMethod] = useState<SupplierPayment['method']>('cash');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(String(supplier.balance > 0 ? supplier.balance : ''));
      setPaymentDate(new Date());
      setMethod('cash');
      setNotes('');
    }
  }, [isOpen, supplier.balance]);

  const handleAddPayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Veuillez entrer un montant valide.');
      return;
    }
    if (!paymentDate) {
        toast.error('Veuillez sélectionner une date de paiement.');
        return;
    }
    
    setIsLoading(true);
    try {
      // Updated to use direct API Wall
      await api.post('suppliers/payments', {
        supplierUuid: supplier.uuid,
        amount: paymentAmount,
        paymentDate: paymentDate.toISOString(),
        method,
        notes: notes || undefined,
      });

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré.`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="luxury-glass">
        <DialogHeader>
          <DialogTitle className="font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-chart-quaternary" />
            Régler le fournisseur
          </DialogTitle>
          <DialogDescription>
             Solde dû actuel : <span className="font-black text-destructive">{formatCurrency(supplier.balance)}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Montant (DA)</Label>
              <Input 
                  type="number"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00"
                  className="h-12 text-xl font-black rounded-xl border-primary/10 bg-background/50 focus:border-chart-quaternary/30"
                  autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Mode de paiement</Label>
              <Select value={method} onValueChange={(val: any) => setMethod(val)}>
                <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-background/50">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="luxury-glass">
                    <SelectItem value="cash">💵 Espèces</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Virement / Chèque</SelectItem>
                    <SelectItem value="card">💳 Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Date du règlement</Label>
              <DatePicker date={paymentDate} setDate={setPaymentDate} />
          </div>
           <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Notes / Référence</Label>
            <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: N° de chèque, acompte pour commande..."
                className="rounded-xl border-primary/10 bg-background/50 min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter className="pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
          <Button onClick={handleAddPayment} disabled={isLoading || parseFloat(amount) <= 0} className="bg-chart-quaternary hover:bg-chart-quaternary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-chart-quaternary/20">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Traitement...' : 'Enregistrer le règlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
