
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Landmark, CircleDollarSign, Loader2, Wallet, Plus, Trash2 } from 'lucide-react';
import type { Cart, SalePayment } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface FinalizeSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onConfirm: (payments: SalePayment[], settleDebt: boolean) => void;
    isSaving: boolean;
    customerBalance?: number | null;
}

export function FinalizeSaleDialog({ isOpen, onOpenChange, cart, onConfirm, isSaving, customerBalance }: FinalizeSaleDialogProps) {
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [currentAmount, setCurrentAmount] = useState('');
    const [currentMethod, setCurrentMethod] = useState<'cash' | 'card' | 'other'>('cash');
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

    const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
    const remainingToPay = useMemo(() => totalToPay - totalPaid, [totalToPay, totalPaid]);

    useEffect(() => {
        if (isOpen) {
            setPayments([]);
            setCurrentAmount(remainingToPay > 0 ? remainingToPay.toFixed(1) : '');
            setSettleDebt(!!(customerBalance && customerBalance > 0));
        }
    }, [isOpen, customerBalance]);
    
    useEffect(() => {
        setCurrentAmount(remainingToPay > 0 ? remainingToPay.toFixed(1) : '');
    }, [remainingToPay]);


    const handleAddPayment = () => {
        const amount = parseFloat(currentAmount);
        if (isNaN(amount) || amount <= 0) {
            return;
        }
        setPayments(prev => [...prev, { method: currentMethod, amount }]);
    };

    const handleRemovePayment = (index: number) => {
        setPayments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (payments.length === 0) {
            // If no payments added but there's an amount, add it first.
            const amount = parseFloat(currentAmount);
            if (!isNaN(amount) && amount > 0) {
                 const finalPayments = [...payments, { method: currentMethod, amount }];
                 if (finalPayments.reduce((acc,p) => acc + p.amount, 0) >= totalToPay) {
                    onConfirm(finalPayments, settleDebt);
                    return;
                 }
            }
            alert("Veuillez ajouter au moins un paiement.");
            return;
        }
        onConfirm(payments, settleDebt);
    };

    const handleDialogChange = (open: boolean) => {
        if (!isSaving) {
            onOpenChange(open);
        }
    };

    const hasDebt = customerBalance && customerBalance > 0;
    const isConfirmDisabled = isSaving || totalPaid < totalToPay;
    const change = totalPaid - totalToPay;

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Finaliser la vente</DialogTitle>
                    <DialogDescription>Confirmez les détails du paiement.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">

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
                                <Label htmlFor="settle-debt" className="text-sm font-medium">Solder la dette avec ce paiement</Label>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                        <span className="text-lg font-bold">Total à Payer</span>
                        <span className="text-3xl font-black text-primary">{totalToPay.toFixed(1)} DA</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Paiements</Label>
                        <div className="space-y-2">
                            {payments.map((p, i) => (
                                <div key={i} className="flex items-center gap-2 bg-secondary/50 p-2 rounded-md">
                                    <Badge variant="secondary" className="capitalize">{p.method}</Badge>
                                    <span className="font-semibold flex-grow">{p.amount.toFixed(1)} DA</span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemovePayment(i)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {remainingToPay > 0 && (
                            <div className="flex gap-2 items-end border-t pt-4">
                                <div className="grid gap-1.5 flex-grow">
                                    <Label htmlFor="currentAmount" className="text-xs">Montant à ajouter</Label>
                                    <Input id="currentAmount" type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder={`Restant: ${remainingToPay.toFixed(1)} DA`} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Méthode</Label>
                                    <Tabs value={currentMethod} onValueChange={(v) => setCurrentMethod(v as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 h-10">
                                            <TabsTrigger value="cash" className="h-full"><CircleDollarSign className="h-4 w-4"/></TabsTrigger>
                                            <TabsTrigger value="card" className="h-full"><CreditCard className="h-4 w-4"/></TabsTrigger>
                                            <TabsTrigger value="other" className="h-full"><Landmark className="h-4 w-4"/></TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <Button size="icon" onClick={handleAddPayment} className="h-10 w-10 flex-shrink-0"><Plus className="h-4 w-4"/></Button>
                            </div>
                        )}
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
                    <Button type="button" onClick={handleSubmit} disabled={isConfirmDisabled}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSaving ? 'Finalisation...' : 'Confirmer la vente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
