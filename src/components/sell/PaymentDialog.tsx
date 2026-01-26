
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { SalePayment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    totalAmount: number;
    onConfirm: (payments: SalePayment[], totalPaid: number) => Promise<boolean>;
}

export function PaymentDialog({ isOpen, onOpenChange, totalAmount, onConfirm }: PaymentDialogProps) {
    const [cashAmount, setCashAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const totalPaid = useMemo(() => {
        const cash = parseFloat(cashAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        return cash + card;
    }, [cashAmount, cardAmount]);

    const changeDue = useMemo(() => {
        const cash = parseFloat(cashAmount) || 0;
        const paid = totalPaid;
        // Calculate change only based on cash if total paid exceeds total amount
        if (paid > totalAmount) {
            return cash - (totalAmount - (parseFloat(cardAmount) || 0));
        }
        return 0;
    }, [cashAmount, cardAmount, totalAmount, totalPaid]);

    const remainingBalance = useMemo(() => Math.max(0, totalAmount - totalPaid), [totalAmount, totalPaid]);

    useEffect(() => {
        if (isOpen) {
            setCashAmount(totalAmount > 0 ? totalAmount.toFixed(1) : '');
            setCardAmount('');
            setIsSaving(false);
        }
    }, [isOpen, totalAmount]);
    
    const handleConfirm = async () => {
        if (totalPaid <= 0) {
            toast.error("Le montant payé doit être supérieur à zéro.");
            return;
        }

        setIsSaving(true);
        const payments: SalePayment[] = [];
        const cash = parseFloat(cashAmount) || 0;
        const card = parseFloat(cardAmount) || 0;

        if (cash > 0) payments.push({ method: 'cash', amount: cash });
        if (card > 0) payments.push({ method: 'card', amount: card });

        const success = await onConfirm(payments, totalPaid);
        setIsSaving(false);
        if (success) {
            onOpenChange(false);
        }
    };
    
    const setFullAmountCash = () => {
        setCashAmount(totalAmount.toFixed(1));
        setCardAmount('');
    }
    const setFullAmountCard = () => {
        setCardAmount(totalAmount.toFixed(1));
        setCashAmount('');
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finaliser la vente</DialogTitle>
                    <DialogDescription>Entrez le montant payé par le client.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="bg-primary/10 text-primary p-4 rounded-lg text-center">
                        <p className="text-sm font-semibold">MONTANT TOTAL À PAYER</p>
                        <p className="text-4xl font-bold">{totalAmount.toFixed(1)} DA</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cash-amount">Montant en espèces (DA)</Label>
                            <Input id="cash-amount" type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="0.0" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="card-amount">Montant par carte (DA)</Label>
                            <Input id="card-amount" type="number" value={cardAmount} onChange={e => setCardAmount(e.target.value)} placeholder="0.0" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={setFullAmountCash}>Total en espèces</Button>
                        <Button variant="outline" onClick={setFullAmountCard}>Total par carte</Button>
                    </div>


                    <div className="space-y-2 text-center">
                        {changeDue > 0 && (
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-300">À rendre</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{changeDue.toFixed(1)} DA</p>
                            </div>
                        )}
                         {remainingBalance > 0 && (
                            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Solde restant</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{remainingBalance.toFixed(1)} DA</p>
                            </div>
                        )}
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
                    <Button onClick={handleConfirm} disabled={isSaving || totalPaid < 0}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirmer la vente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
