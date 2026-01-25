
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Cart, SalePayment } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface FinalizeSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onConfirm: (payments: SalePayment[]) => void;
    isSaving: boolean;
    customerBalance?: number | null;
}

export function FinalizeSaleDialog({ isOpen, onOpenChange, cart, onConfirm, isSaving, customerBalance }: FinalizeSaleDialogProps) {
    const [paidAmountStr, setPaidAmountStr] = useState('');
    const [settleDebt, setSettleDebt] = useState(true);

    const cartTotal = useMemo(() => {
        const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
        const discountAmount = cart.discount.type === 'fixed' ? cart.discount.value : (subtotal * cart.discount.value) / 100;
        return subtotal - discountAmount;
    }, [cart.items, cart.discount]);

    const totalToPay = useMemo(() => {
        if (settleDebt && customerBalance && customerBalance > 0) {
            return cartTotal + customerBalance;
        }
        return cartTotal;
    }, [cartTotal, customerBalance, settleDebt]);

    const paidAmount = useMemo(() => {
        const parsed = parseFloat(paidAmountStr);
        return isNaN(parsed) ? 0 : parsed;
    }, [paidAmountStr]);

    const change = useMemo(() => (paidAmount > totalToPay ? paidAmount - totalToPay : 0), [paidAmount, totalToPay]);
    const remainingBalance = useMemo(() => (totalToPay > paidAmount ? totalToPay - paidAmount : 0), [paidAmount, totalToPay]);

    useEffect(() => {
        if (isOpen) {
            const shouldSettleDebt = !!(customerBalance && customerBalance > 0);
            setSettleDebt(shouldSettleDebt);
            const initialTotal = cartTotal + (shouldSettleDebt && customerBalance ? customerBalance : 0);
            setPaidAmountStr(initialTotal > 0 ? initialTotal.toFixed(1) : '0');
        } else {
            // Reset on close
            setPaidAmountStr('');
        }
    }, [isOpen, cartTotal, customerBalance]);
    
    const handleSubmit = () => {
        if (isSaving) return;
        
        const finalPayments: SalePayment[] = paidAmount > 0 ? [{ method: 'cash', amount: paidAmount }] : [];
        onConfirm(finalPayments);
    };

    const handleDialogChange = (open: boolean) => {
        if (!isSaving) {
            onOpenChange(open);
        }
    };

    const hasDebt = customerBalance && customerBalance > 0;
    
    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Finaliser la vente</DialogTitle>
                    <DialogDescription>Confirmez les détails du paiement.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Calculation Summary Section */}
                    <div className="space-y-2 text-sm border-b pb-4">
                        <div className="flex justify-between">
                            <span>Total des articles :</span>
                            <span className="font-medium">{cartTotal.toFixed(1)} DA</span>
                        </div>
                        {hasDebt && (
                             <div className={cn("flex justify-between items-center transition-colors", settleDebt ? "text-destructive" : "text-muted-foreground")}>
                                <span>Dette précédente :</span>
                                <span className="font-medium">{customerBalance.toFixed(1)} DA</span>
                            </div>
                        )}
                        {hasDebt && (
                             <div className="flex items-center space-x-2 pt-2">
                                <Switch id="settle-debt" checked={settleDebt} onCheckedChange={setSettleDebt} disabled={!hasDebt} />
                                <Label htmlFor="settle-debt" className="text-sm font-medium">Régler la dette avec ce paiement</Label>
                            </div>
                        )}
                    </div>
                    
                    {/* Total Display */}
                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                        <span className="text-lg font-bold">Total à Payer</span>
                        <span className="text-3xl font-black text-primary">{totalToPay.toFixed(1)} DA</span>
                    </div>

                    {/* Payment Input Section */}
                    <div className="space-y-3">
                        <Label htmlFor="paidAmount" className="text-base">Montant Encaissé</Label>
                        <Input 
                            id="paidAmount" 
                            type="number" 
                            className="h-14 text-2xl font-bold text-center"
                            placeholder="0.00"
                            value={paidAmountStr}
                            onChange={(e) => setPaidAmountStr(e.target.value)}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                        />
                         <div className="grid grid-cols-3 gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setPaidAmountStr(totalToPay.toFixed(1))}>
                                Complet
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => {
                                setPaidAmountStr('');
                                document.getElementById('paidAmount')?.focus();
                            }}>
                                Partiel
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => setPaidAmountStr('0')}>
                                Crédit
                            </Button>
                        </div>
                    </div>
                    
                    {/* Feedback Section (Change/Remaining) */}
                    <div className="space-y-2 text-sm pt-4 border-t">
                        {remainingBalance > 0 && (
                            <div className="flex justify-between items-center text-destructive p-3 rounded-lg bg-destructive/10">
                                <span className="font-semibold">Solde à payer :</span>
                                <span className="text-lg font-bold">{remainingBalance.toFixed(1)} DA</span>
                            </div>
                        )}
                        {change > 0 && (
                            <div className="flex justify-between items-center text-green-700 dark:text-green-300 p-3 rounded-lg bg-green-500/10">
                                <span className="font-semibold">Monnaie à rendre :</span>
                                <span className="text-lg font-bold">{change.toFixed(1)} DA</span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-6">
                    <Button type="button" variant="secondary" onClick={() => handleDialogChange(false)} disabled={isSaving}>Annuler</Button>
                    <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSaving ? 'Finalisation...' : 'Confirmer la Vente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
