'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Cart, SalePayment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FinalizeSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onConfirm: (payments: SalePayment[]) => void;
    isSaving: boolean;
}

export function FinalizeSaleDialog({ isOpen, onOpenChange, cart, onConfirm, isSaving }: FinalizeSaleDialogProps) {
    const [paidAmountStr, setPaidAmountStr] = useState('');
    
    const totalToPay = useMemo(() => {
        const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
        const discountAmount = cart.discount.type === 'fixed' ? cart.discount.value : (subtotal * cart.discount.value) / 100;
        return subtotal - discountAmount;
    }, [cart.items, cart.discount]);

    const paidAmount = useMemo(() => {
        const parsed = parseFloat(paidAmountStr);
        return isNaN(parsed) ? 0 : parsed;
    }, [paidAmountStr]);

    const change = useMemo(() => (paidAmount > totalToPay ? paidAmount - totalToPay : 0), [paidAmount, totalToPay]);
    const remainingBalance = useMemo(() => (totalToPay > paidAmount ? totalToPay - paidAmount : 0), [paidAmount, totalToPay]);

    useEffect(() => {
        if (isOpen) {
            setPaidAmountStr(totalToPay > 0 ? totalToPay.toFixed(1) : '0');
        } else {
            setPaidAmountStr('');
        }
    }, [isOpen, totalToPay]);
    
    const handleSubmit = useCallback(() => {
        if (isSaving) return;
        
        const finalPayments: SalePayment[] = [{ method: 'cash' as const, amount: paidAmount }];
        onConfirm(finalPayments);
    }, [isSaving, paidAmount, onConfirm]);

    const handleDialogChange = (open: boolean) => {
        if (!isSaving) {
            onOpenChange(open);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'F8') {
                e.preventDefault();
                setPaidAmountStr(totalToPay.toFixed(1));
            }
            if (e.key === 'F9') {
                e.preventDefault();
                setPaidAmountStr('');
                const input = document.getElementById('paidAmount');
                if (input) input.focus();
            }
            if (e.key === 'F10') {
                e.preventDefault();
                setPaidAmountStr('0');
            }
            if (e.key === 'Enter' && !isSaving) {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isSaving, totalToPay, handleSubmit]);

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Finaliser la vente</DialogTitle>
                    <DialogDescription>Confirmez le montant reçu. Utilisez les raccourcis pour accélérer.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                        <span className="text-lg font-bold">Total à Payer</span>
                        <span className="text-3xl font-black text-primary">{totalToPay.toFixed(1)} DA</span>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="paidAmount" className="text-base font-semibold">Montant Reçu</Label>
                        <Input 
                            id="paidAmount" 
                            type="number" 
                            className="h-16 text-3xl font-bold text-center tracking-wider"
                            placeholder="0.00"
                            value={paidAmountStr}
                            onChange={(e) => setPaidAmountStr(e.target.value)}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                        />
                         <div className="grid grid-cols-3 gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setPaidAmountStr(totalToPay.toFixed(1))}>
                                Complet <kbd className="hidden lg:inline-block pointer-events-none ml-2 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">F8</kbd>
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => {
                                setPaidAmountStr('');
                                const input = document.getElementById('paidAmount');
                                if (input) input.focus();
                            }}>
                                Partiel <kbd className="hidden lg:inline-block pointer-events-none ml-2 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">F9</kbd>
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => setPaidAmountStr('0')}>
                                Crédit <kbd className="hidden lg:inline-block pointer-events-none ml-2 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">F10</kbd>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm pt-4 border-t">
                        {remainingBalance > 0 && (
                            <div className="flex justify-between items-center text-destructive p-3 rounded-lg bg-destructive/10">
                                <span className="font-semibold">Montant Restant :</span>
                                <span className="text-lg font-bold">{remainingBalance.toFixed(1)} DA</span>
                            </div>
                        )}
                        {change > 0 && (
                            <div className="flex justify-between items-center text-green-700 dark:text-green-300 p-3 rounded-lg bg-green-500/10">
                                <span className="font-semibold">Montant à Rendre :</span>
                                <span className="text-lg font-bold">{change.toFixed(1)} DA</span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-6">
                    <Button type="button" variant="secondary" onClick={() => handleDialogChange(false)} disabled={isSaving}>Annuler</Button>
                    <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSaving ? 'Finalisation...' : (
                            <>
                                Confirmer la Vente
                                <kbd className="hidden lg:inline-block pointer-events-none ml-2 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Entrée</kbd>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}