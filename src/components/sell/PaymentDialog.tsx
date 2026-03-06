

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Cart, SalePayment, Customer, Product } from '@/lib/types';
import { Loader2, Printer, CreditCard, Banknote, Landmark, AlertTriangle } from 'lucide-react';
import { dataService } from '@/services/data-service';
import { formatCurrency } from '@/lib/utils';
import { Receipt } from './Receipt';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart;
    onSaleFinalized: () => void;
}

type PaymentMode = 'cash' | 'card' | 'other' | 'credit' | 'mixed';

export function PaymentDialog({ isOpen, onOpenChange, cart, onSaleFinalized }: PaymentDialogProps) {
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
    const [cashAmount, setCashAmount] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    
    const [isLoading, setIsLoading] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [lastSale, setLastSale] = useState<any>(null);

    const [showLossAlert, setShowLossAlert] = useState(false);
    const [lossItems, setLossItems] = useState<Product[]>([]);

    const customer = useLiveQuery(() => 
        cart.customerId ? db.customers.get(cart.customerId) : Promise.resolve(undefined), 
        [cart.customerId]
    );

    const subtotal = useMemo(() => cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0), [cart.items]);
    const discountAmount = useMemo(() => {
        if (!cart.discount || cart.discount.value <= 0) return 0;
        return cart.discount.type === 'percentage' ? (subtotal * cart.discount.value) / 100 : cart.discount.value;
    }, [cart.discount, subtotal]);
    const total = Math.max(0, subtotal - discountAmount);

    const cashAmountNum = parseFloat(cashAmount) || 0;
    const creditAmountNum = parseFloat(creditAmount) || 0;
    const amountPaidNum = paymentMode === 'mixed' ? cashAmountNum : (paymentMode === 'credit' ? 0 : parseFloat(cashAmount) || 0);

    const change = (paymentMode === 'cash' || paymentMode === 'card' || paymentMode === 'other') ? cashAmountNum - total : 0;
    const debtFromThisSale = paymentMode === 'credit' ? total : (paymentMode === 'mixed' ? creditAmountNum : 0);
    const newTotalOutstanding = (customer?.outstandingBalance ?? 0) + debtFromThisSale;
    const creditAvailable = (customer?.creditLimit ?? 0) - (customer?.outstandingBalance ?? 0);
    const creditUsage = customer?.creditLimit && customer.creditLimit > 0 ? (newTotalOutstanding / customer.creditLimit) * 100 : 0;

    useEffect(() => {
        if (isOpen) {
            const itemsSoldAtLoss = cart.items.filter(item => item.price < item.purchasePrice);
            if (itemsSoldAtLoss.length > 0) {
                setLossItems(itemsSoldAtLoss);
                setShowLossAlert(true);
            } else {
                initializePayment();
            }
        } else {
            // Reset state on close
            setLastSale(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const initializePayment = () => {
        setPaymentMode('cash');
        setCashAmount(String(total));
        setCreditAmount('0');
        setDueDate(undefined);
        setShowLossAlert(false);
    };

    useEffect(() => {
        if (paymentMode === 'cash' || paymentMode === 'card' || paymentMode === 'other') setCashAmount(String(total));
        if (paymentMode === 'credit') setCashAmount('0');
    }, [paymentMode, total]);
    
    const handlePrint = (thermal: boolean) => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = receiptRef.current;
    
        if (!printableContent || !receiptElement) {
          toast.error("Erreur: Impossible de préparer le reçu pour l'impression.");
          return;
        }
    
        const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
        
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
        if (paymentMode === 'mixed' && (cashAmountNum + creditAmountNum !== total)) {
            toast.error("Le montant en espèces et le montant à crédit doivent correspondre au total.");
            return;
        }

        if (customer && customer.creditLimit && newTotalOutstanding > customer.creditLimit) {
            toast.error("La limite de crédit du client est dépassée.", {
                description: `Le nouveau solde (${formatCurrency(newTotalOutstanding)}) dépasse la limite (${formatCurrency(customer.creditLimit)}).`
            });
            return;
        }

        setIsLoading(true);

        const payments: SalePayment[] = [];
        if (amountPaidNum > 0) {
            payments.push({ method: paymentMode === 'card' ? 'card' : (paymentMode === 'other' ? 'other' : 'cash'), amount: amountPaidNum });
        }
        
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
            dueDate: debtFromThisSale > 0 ? dueDate : undefined,
        };

        try {
            const newSaleId = await dataService.addSale(saleData);
            const saleFromDb = await dataService.getById('sales', newSaleId);
            setLastSale({ ...saleFromDb, change: change > 0 ? change : 0 });
            toast.success("Vente finalisée avec succès !");
            onSaleFinalized();
        } catch (error: any) {
            console.error("Failed to finalize sale:", error);
            toast.error(error.message || "Erreur lors de la finalisation de la vente.");
            setIsLoading(false);
        }
    };
    
    const closeAndReset = () => {
        onOpenChange(false);
    }
    
    const handleLossAlertConfirm = () => {
        setShowLossAlert(false);
        initializePayment();
    };

    if (!isOpen) return null;

    return (
        <>
            <AlertDialog open={showLossAlert} onOpenChange={setShowLossAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Vente à perte détectée</AlertDialogTitle>
                        <AlertDialogDescription>
                            Les produits suivants ont un prix de vente inférieur à leur prix d'achat. Êtes-vous sûr de vouloir continuer ?
                            <ul className="list-disc pl-5 mt-2 text-destructive/80 font-medium">
                                {lossItems.map(item => <li key={item.id}>{item.name}</li>)}
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => onOpenChange(false)}>Modifier la vente</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLossAlertConfirm} className={cn("bg-destructive hover:bg-destructive/80")}>Continuer quand même</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isOpen && !showLossAlert} onOpenChange={(open) => !open && closeAndReset()}>
                <DialogContent className="sm:max-w-lg">
                    {!lastSale ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Finaliser la vente</DialogTitle>
                                {customer && (
                                    <DialogDescription>
                                        Client: <span className="font-bold">{customer.firstName} {customer.lastName}</span>
                                    </DialogDescription>
                                )}
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="text-center py-4 luxury-glass">
                                    <Label>TOTAL À PAYER</Label>
                                    <p className="text-4xl font-bold text-primary">{formatCurrency(total)}</p>
                                </div>
                                
                                {customer && (
                                    <div className={cn("grid grid-cols-2 gap-2 text-center p-2 rounded-lg text-sm", creditUsage > 90 ? "bg-destructive/10 text-destructive" : "bg-muted")}>
                                        <div>
                                            <p className="font-semibold">{formatCurrency(customer.outstandingBalance)}</p>
                                            <p className="text-xs">Solde actuel</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{customer.creditLimit ? formatCurrency(customer.creditLimit) : 'N/A'}</p>
                                            <p className="text-xs">Plafond de crédit</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <Label>Méthode de Paiement</Label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                        <Button type="button" variant={paymentMode === 'cash' ? 'secondary' : 'outline'} onClick={() => setPaymentMode('cash')}><Banknote className="mr-2 h-4 w-4"/>Espèces</Button>
                                        <Button type="button" variant={paymentMode === 'card' ? 'secondary' : 'outline'} onClick={() => setPaymentMode('card')}><CreditCard className="mr-2 h-4 w-4"/>Carte</Button>
                                        {customer && <Button type="button" variant={paymentMode === 'credit' ? 'secondary' : 'outline'} onClick={() => setPaymentMode('credit')}>Crédit</Button>}
                                        {customer && <Button type="button" variant={paymentMode === 'mixed' ? 'secondary' : 'outline'} onClick={() => setPaymentMode('mixed')}>Mixte</Button>}
                                    </div>
                                </div>

                                {(paymentMode === 'cash' || paymentMode === 'card' || paymentMode === 'other') && (
                                    <div className="space-y-2">
                                        <Label htmlFor="amountPaid">Montant Payé</Label>
                                        <Input id="amountPaid" type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="text-lg" autoFocus />
                                        {change > 0 && (
                                            <div className="text-center p-2 bg-green-500/10 rounded-lg">
                                                <Label className="text-green-300">Monnaie à rendre</Label>
                                                <p className="text-lg font-bold text-green-400">{formatCurrency(change)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentMode === 'mixed' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cashAmount">Montant Espèces</Label>
                                            <Input id="cashAmount" type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} autoFocus />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="creditAmount">Montant Crédit</Label>
                                            <Input id="creditAmount" type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {(paymentMode === 'credit' || paymentMode === 'mixed') && customer && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label>Date d'échéance (optionnel)</Label>
                                            <DatePicker date={dueDate} setDate={setDueDate}/>
                                        </div>
                                         <div className={cn("text-center py-2 luxury-glass border", creditUsage > 90 ? "border-destructive/30" : "border-amber-500/20")}>
                                            <Label>NOUVEAU SOLDE CLIENT</Label>
                                            <p className={cn("text-2xl font-bold", creditUsage > 90 ? "text-destructive" : "text-amber-400")}>{formatCurrency(newTotalOutstanding)}</p>
                                            <p className="text-xs text-muted-foreground">
                                               (Disponible: {formatCurrency(creditAvailable - debtFromThisSale)})
                                            </p>
                                        </div>
                                    </>
                                )}

                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary" disabled={isLoading}>Annuler</Button></DialogClose>
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
                            <div className="py-4 my-4 max-h-[50vh] overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Receipt sale={lastSale} ref={receiptRef} />
                            </div>
                            <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => handlePrint(true)}>
                                        <Printer className="mr-2 h-4 w-4"/> Thermique
                                    </Button>
                                    <Button variant="outline" onClick={() => handlePrint(false)}>
                                        <Printer className="mr-2 h-4 w-4"/> A4
                                    </Button>
                                </div>
                                <Button onClick={closeAndReset}>Fermer</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
