'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Landmark, CircleDollarSign, Loader2, Wallet } from 'lucide-react';
import type { Cart } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface FinalizeSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onConfirm: (amountPaid: number, paymentMethod: 'cash' | 'card' | 'other', settleDebt: boolean) => void;
    isSaving: boolean;
    customerBalance?: number | null;
}

export function FinalizeSaleDialog({ isOpen, onOpenChange, cart, onConfirm, isSaving, customerBalance }: FinalizeSaleDialogProps) {
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
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

    const change = useMemo(() => {
        const paid = parseFloat(amountPaid);
        if (isNaN(paid) || paid < totalToPay) return 0;
        return paid - totalToPay;
    }, [amountPaid, totalToPay]);

    useEffect(() => {
        if (isOpen) {
            setAmountPaid(totalToPay.toFixed(1));
            setSettleDebt(!!(customerBalance && customerBalance > 0));
        }
    }, [isOpen, totalToPay, customerBalance]);

    const quickCashSuggestions = useMemo(() => {
        if (totalToPay <= 0) return [];
        const suggestions = new Set<number>();
    
        suggestions.add(Math.ceil(totalToPay));
    
        const nextFifty = Math.ceil(totalToPay / 50) * 50;
        if (nextFifty > totalToPay) suggestions.add(nextFifty);

        const nextHundred = Math.ceil(totalToPay / 100) * 100;
        if (nextHundred > totalToPay) suggestions.add(nextHundred);
    
        const banknotes = [500, 1000, 2000, 5000];
        banknotes.forEach(note => {
            if (note >= totalToPay) {
                suggestions.add(note);
            }
        });
    
        return Array.from(suggestions)
            .sort((a, b) => a - b)
            .slice(0, 4);
    }, [totalToPay]);

    const handleSubmit = () => {
        const paid = parseFloat(amountPaid);
        if (isNaN(paid) || paid < 0) {
            alert("Montant payé invalide.");
            return;
        }
        onConfirm(paid, paymentMethod, settleDebt);
    };

    const handleDialogChange = (open: boolean) => {
        if (!isSaving) {
            onOpenChange(open);
        }
    };

    const hasDebt = customerBalance && customerBalance > 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finaliser la vente</DialogTitle>
                    <DialogDescription>Confirmez les détails du paiement.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">

                    <div className="space-y-2 text-sm">
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
                             <div className="flex items-center space-x-2 pt-2 border-t mt-2">
                                <Switch
                                    id="settle-debt"
                                    checked={settleDebt}
                                    onCheckedChange={setSettleDebt}
                                    disabled={!hasDebt}
                                />
                                <Label htmlFor="settle-debt" className="text-sm font-medium">
                                    Solder la dette avec ce paiement
                                </Label>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                        <span className="text-lg font-bold">Total à Payer</span>
                        <span className="text-3xl font-black text-primary">{totalToPay.toFixed(1)} DA</span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                         <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="cash" disabled={isSaving}><CircleDollarSign className="mr-2 h-4 w-4"/>Espèces</TabsTrigger>
                                <TabsTrigger value="card" disabled={isSaving}><CreditCard className="mr-2 h-4 w-4"/>Carte</TabsTrigger>
                                <TabsTrigger value="other" disabled={isSaving}><Landmark className="mr-2 h-4 w-4"/>Autre</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amountPaid">Montant payé par le client (DA)</Label>
                        {paymentMethod === 'cash' && quickCashSuggestions.length > 0 && (
                             <div className="flex flex-wrap gap-2 mb-2">
                                {quickCashSuggestions.map(value => (
                                    <Button key={value} type="button" variant="outline" size="sm" className="flex-grow" onClick={() => setAmountPaid(String(value))}>
                                        {value} DA
                                    </Button>
                                ))}
                            </div>
                        )}
                        <Input 
                            id="amountPaid" 
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="h-12 text-xl text-center"
                            disabled={isSaving}
                        />
                    </div>
                    
                    {change > 0 && (
                        <div className="flex justify-between items-center bg-green-500/10 text-green-700 dark:text-green-300 p-4 rounded-lg">
                            <span className="text-lg font-bold">Monnaie à rendre</span>
                            <span className="text-2xl font-bold">{change.toFixed(1)} DA</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => handleDialogChange(false)} disabled={isSaving}>Annuler</Button>
                    <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? 'Finalisation...' : 'Confirmer la vente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}