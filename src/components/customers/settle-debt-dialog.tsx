
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettleDebtDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customerName: string;
    outstandingBalance: number;
    onConfirm: (amount: number) => void;
}

export function SettleDebtDialog({ isOpen, onOpenChange, customerName, outstandingBalance, onConfirm }: SettleDebtDialogProps) {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmount(outstandingBalance.toFixed(2));
            setError('');
            setIsProcessing(false);
        }
    }, [isOpen, outstandingBalance]);

    const handleConfirm = () => {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            setError("Veuillez entrer un montant valide.");
            return;
        }
        if (paymentAmount > outstandingBalance) {
            setError(`Le paiement ne peut pas dépasser le solde de ${outstandingBalance.toFixed(2)} €.`);
            return;
        }
        
        setError('');
        setIsProcessing(true);
        onConfirm(paymentAmount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Régler la dette de {customerName}</DialogTitle>
                    <DialogDescription>
                        Entrez le montant que le client a payé.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Solde impayé :</span>
                        <span>{outstandingBalance.toFixed(2)} €</span>
                    </div>
                     {error && <p className="text-sm text-red-500 text-center -mt-2">{error}</p>}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment-amount" className="text-right col-span-1">
                            Montant Payé
                        </Label>
                        <Input
                            id="payment-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            step="0.01"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirm} disabled={isProcessing}>
                        {isProcessing ? 'Enregistrement...' : 'Confirmer le règlement'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
