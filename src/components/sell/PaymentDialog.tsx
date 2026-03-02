'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Cart, SalePayment } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';
import { formatCurrency } from '@/lib/utils';
import { Receipt } from './Receipt';

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onSaleFinalized: () => void;
}

export function PaymentDialog({ isOpen, onOpenChange, cart, onSaleFinalized }: PaymentDialogProps) {
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
    const [isLoading, setIsLoading] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [lastSale, setLastSale] = useState<any>(null);

    const subtotal = useMemo(() => cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0), [cart.items]);
    
    const discountAmount = useMemo(() => {
        if (!cart.discount || cart.discount.value <= 0) return 0;
        return cart.discount.type === 'percentage'
            ? (subtotal * cart.discount.value) / 100
            : cart.discount.value;
    }, [cart.discount, subtotal]);

    const total = Math.max(0, subtotal - discountAmount);
    const amountPaidNum = parseFloat(amountPaid) || 0;
    const change = amountPaidNum - total;

    useEffect(() => {
        if (isOpen) {
            setAmountPaid(String(total));
            setLastSale(null);
        }
    }, [isOpen, total]);

    const handlePrint = (thermal: boolean) => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = receiptRef.current;
    
        if (!printableContent || !receiptElement) {
          toast.error("Erreur: Impossible de préparer le reçu pour l'impression.");
          return;
        }
    
        const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
        
        // Add appropriate class for styling
        document.documentElement.classList.toggle('thermal', thermal);
        receiptClone.classList.add(thermal ? 'thermal-receipt' : 'a4-receipt');
        
        printableContent.innerHTML = '';
        printableContent.appendChild(receiptClone);
        
        setTimeout(() => {
            window.print();
            document.documentElement.classList.remove('thermal');
        }, 100);
    };

    const handleFinalizeSale = async () => {
        setIsLoading(true);

        const payments: SalePayment[] = [{ method: paymentMethod, amount: amountPaidNum }];
        
        const saleData = {
            items: cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, purchasePrice: i.purchasePrice, quantity: i.cartQuantity })),
            subtotal,
            discountType: cart.discount.type,
            discountAmount: discountAmount,
            total,
            amountPaid: amountPaidNum,
            payments,
            customerId: cart.customerId ?? undefined,
            customerName: cart.customerName ?? undefined,
        };

        try {
            const newSaleId = await dataService.addSale(saleData);
            setLastSale({ ...saleData, id: newSaleId, invoiceNumber: `INV-${Date.now()}`, change: change > 0 ? change : 0, createdAt: new Date() });
            toast.success("Vente finalisée avec succès !");
            onSaleFinalized();
            // Don't close the dialog, show receipt instead
        } catch (error: any) {
            console.error("Failed to finalize sale:", error);
            toast.error(error.message || "Erreur lors de la finalisation de la vente.");
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    const closeAndReset = () => {
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeAndReset()}>
            <DialogContent className="sm:max-w-md">
                {!lastSale ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Finaliser la vente</DialogTitle>
                            <DialogDescription>
                                Confirmez le montant payé pour terminer la transaction.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                             <div className="text-center py-4 bg-muted rounded-lg">
                                <Label>TOTAL À PAYER</Label>
                                <p className="text-4xl font-bold text-primary">{formatCurrency(total)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amountPaid">Montant Payé (DA)</Label>
                                <Input 
                                    id="amountPaid" 
                                    type="number"
                                    value={amountPaid} 
                                    onChange={(e) => setAmountPaid(e.target.value)} 
                                    className="text-2xl h-14 text-center"
                                    autoFocus
                                />
                            </div>
                            {change >= 0 && (
                                <div className="text-center py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Label>MONNAIE À RENDRE</Label>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(change)}</p>
                                </div>
                            )}
                             {change < 0 && cart.customerId && (
                                <div className="text-center py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Label>SOLDE RESTANT (CRÉDIT)</Label>
                                    <p className="text-2xl font-bold text-yellow-700">{formatCurrency(Math.abs(change))}</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Annuler
                            </Button>
                            <Button type="submit" onClick={handleFinalizeSale} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Valider la vente
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                         <DialogHeader>
                            <DialogTitle>Vente Réussie</DialogTitle>
                            <DialogDescription>
                                Imprimez le reçu pour le client ou fermez pour commencer une nouvelle vente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 max-h-[50vh] overflow-y-auto">
                            <Receipt sale={lastSale} ref={receiptRef} />
                        </div>
                        <DialogFooter className="justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handlePrint(true)}>Imprimante thermique</Button>
                                <Button variant="outline" onClick={() => handlePrint(false)}>Imprimante A4</Button>
                            </div>
                            <Button onClick={closeAndReset}>Fermer</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
