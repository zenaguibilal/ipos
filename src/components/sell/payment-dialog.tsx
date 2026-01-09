'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    total: number;
    isProcessing: boolean;
    onConfirm: (amountPaid: number) => void;
}

export function PaymentDialog({ isOpen, onOpenChange, total, isProcessing, onConfirm }: PaymentDialogProps) {
    const [amount, setAmount] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setAmount(total.toFixed(2));
        }
    }, [isOpen, total]);

    const handleConfirm = () => {
        const amountPaid = parseFloat(amount);
        if (!isNaN(amountPaid) && amountPaid >= 0) {
            onConfirm(amountPaid);
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (isProcessing) return;
        onOpenChange(open);
    }
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleConfirm();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Finaliser la vente</DialogTitle>
                        <DialogDescription>
                            Confirmez le montant payé par le client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total à payer :</span>
                            <span>{total.toFixed(2)} DA</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount-paid" className="text-right col-span-1">
                                Montant Payé
                            </Label>
                            <Input
                                id="amount-paid"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="col-span-3"
                                step="0.01"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing ? 'Traitement...' : 'Confirmer le paiement'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
