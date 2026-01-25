'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Landmark, CircleDollarSign, Loader2 } from 'lucide-react';
import type { Cart } from '@/lib/types';

interface FinalizeSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onConfirm: (amountPaid: number, paymentMethod: 'cash' | 'card' | 'other') => void;
    isSaving: boolean;
}

export function FinalizeSaleDialog({ isOpen, onOpenChange, cart, onConfirm, isSaving }: FinalizeSaleDialogProps) {
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
    
    const subtotal = useMemo(() => cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0), [cart.items]);
    const discountAmount = useMemo(() => cart.discount.type === 'fixed' ? cart.discount.value : (subtotal * cart.discount.value) / 100, [cart.discount, subtotal]);
    const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
    const change = useMemo(() => {
        const paid = parseFloat(amountPaid);
        if (isNaN(paid) || paid < total) return 0;
        return paid - total;
    }, [amountPaid, total]);

    useEffect(() => {
        if (isOpen) {
            setAmountPaid(total.toFixed(1));
        }
    }, [isOpen, total]);

    const handleSubmit = () => {
        const paid = parseFloat(amountPaid);
        if (isNaN(paid) || paid < 0) {
            alert("Montant payé invalide.");
            return;
        }
        onConfirm(paid, paymentMethod);
    };

    const handleDialogChange = (open: boolean) => {
        if (!isSaving) {
            onOpenChange(open);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finaliser la vente</DialogTitle>
                    <DialogDescription>Confirmez les détails du paiement.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                        <span className="text-lg font-bold">Total à Payer</span>
                        <span className="text-3xl font-black text-primary">{total.toFixed(1)} DA</span>
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
