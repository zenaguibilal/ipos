'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CartItem } from '@/lib/types';
import { Loader2, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { formatCurrency, calculateCartTotals } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { useAppStore, useAppActions } from '@/stores/appStore';

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

type PaymentMode = 'cash' | 'card' | 'other' | 'credit' | 'mixed';

export function PaymentDialog({ isOpen, onOpenChange }: PaymentDialogProps) {
    const { cart, cartCustomer } = useAppStore();
    const { finalizeSale } = useAppActions();

    const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
    const [cashAmount, setCashAmount] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    
    const [isLoading, setIsLoading] = useState(false);

    const [showLossAlert, setShowLossAlert] = useState(false);
    const [lossItems, setLossItems] = useState<CartItem[]>([]);

    const { total } = cart ? calculateCartTotals(cart) : { total: 0 };

    const cashAmountNum = parseFloat(cashAmount) || 0;
    const creditAmountNum = parseFloat(creditAmount) || 0;
    const amountPaidNum = paymentMode === 'mixed' ? cashAmountNum : (paymentMode === 'credit' ? 0 : parseFloat(cashAmount) || 0);

    const change = (paymentMode === 'cash' || paymentMode === 'card' || paymentMode === 'other') ? cashAmountNum - total : 0;
    const debtFromThisSale = paymentMode === 'credit' ? total : (paymentMode === 'mixed' ? creditAmountNum : 0);
    const newTotalOutstanding = (cartCustomer?.outstandingBalance ?? 0) + debtFromThisSale;
    const creditAvailable = (cartCustomer?.creditLimit ?? 0) - (cartCustomer?.outstandingBalance ?? 0);
    const creditUsage = cartCustomer?.creditLimit && cartCustomer.creditLimit > 0 ? (newTotalOutstanding / cartCustomer.creditLimit) * 100 : 0;

    const initializePayment = useCallback(() => {
        setPaymentMode('cash');
        setCashAmount(String(total));
        setCreditAmount('0');
        setDueDate(undefined);
        setShowLossAlert(false);
    }, [total]);

    useEffect(() => {
        if (isOpen && cart) {
            const itemsSoldAtLoss = cart.items.filter(item => item.purchasePrice > 0 && item.price < item.purchasePrice);
            if (itemsSoldAtLoss.length > 0) {
                setLossItems(itemsSoldAtLoss);
                setShowLossAlert(true);
            } else {
                initializePayment();
            }
        } else if (!isOpen) {
            setIsLoading(false);
            initializePayment(); // Reset state on close
        }
    }, [isOpen, cart, initializePayment]);


    const handlePaymentModeChange = (mode: PaymentMode) => {
        setPaymentMode(mode);
        if (mode === 'cash' || mode === 'card' || mode === 'other') {
            setCashAmount(String(total));
        }
        if (mode === 'credit') {
            setCashAmount('0');
        }
    }

    const handleFinalize = async () => {
        if (!cart) return;

        if (paymentMode === 'mixed' && (cashAmountNum + creditAmountNum !== total)) {
            toast.error("Le montant en espèces et le montant à crédit doivent correspondre au total.");
            return;
        }

        if (cartCustomer && cartCustomer.creditLimit && newTotalOutstanding > cartCustomer.creditLimit) {
            toast.error("La limite de crédit du client est dépassée.", {
                description: `Le nouveau solde (${formatCurrency(newTotalOutstanding)}) dépasse la limite (${formatCurrency(cartCustomer.creditLimit)}).`
            });
            return;
        }

        setIsLoading(true);

        const payments: { method: 'cash' | 'card' | 'other', amount: number }[] = [];
        if (amountPaidNum > 0) {
            payments.push({ method: paymentMode === 'card' ? 'card' : (paymentMode === 'other' ? 'other' : 'cash'), amount: amountPaidNum });
        }
        
        try {
            await finalizeSale({
                amountPaid: amountPaidNum,
                payments,
                dueDate: debtFromThisSale > 0 ? dueDate : undefined,
            });
            onOpenChange(false);
            // The finalizeSale action in the store handles success toast and redirection.
        } catch (error: any) {
            // Error is already toasted by the finalizeSale action in the store
        } finally {
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
                                {lossItems.map(item => <li key={item.uuid}>{item.name}</li>)}
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
                    <>
                        <DialogHeader>
                            <DialogTitle>Finaliser la vente</DialogTitle>
                            {cartCustomer && (
                                <DialogDescription>
                                    Client: <span className="font-bold">{cartCustomer.firstName} {cartCustomer.lastName}</span>
                                </DialogDescription>
                            )}
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="text-center py-4 luxury-glass">
                                <Label>TOTAL À PAYER</Label>
                                <p className="text-4xl font-bold text-primary">{formatCurrency(total)}</p>
                            </div>
                            
                            {cartCustomer && (
                                <div className={cn("grid grid-cols-2 gap-2 text-center p-2 rounded-lg text-sm", creditUsage > 90 ? "bg-destructive/10 text-destructive" : "bg-muted")}>
                                    <div>
                                        <p className="font-semibold">{formatCurrency(cartCustomer.outstandingBalance)}</p>
                                        <p className="text-xs">Solde actuel</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{cartCustomer.creditLimit ? formatCurrency(cartCustomer.creditLimit) : 'N/A'}</p>
                                        <p className="text-xs">Plafond de crédit</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label>Méthode de Paiement</Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    <Button type="button" variant={paymentMode === 'cash' ? 'secondary' : 'outline'} onClick={() => handlePaymentModeChange('cash')}><Banknote className="mr-2 h-4 w-4"/>Espèces</Button>
                                    <Button type="button" variant={paymentMode === 'card' ? 'secondary' : 'outline'} onClick={() => handlePaymentModeChange('card')}><CreditCard className="mr-2 h-4 w-4"/>Carte</Button>
                                    {cartCustomer && <Button type="button" variant={paymentMode === 'credit' ? 'secondary' : 'outline'} onClick={() => handlePaymentModeChange('credit')}>Crédit</Button>}
                                    {cartCustomer && <Button type="button" variant={paymentMode === 'mixed' ? 'secondary' : 'outline'} onClick={() => handlePaymentModeChange('mixed')}>Mixte</Button>}
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

                            {(paymentMode === 'credit' || paymentMode === 'mixed') && cartCustomer && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label>Date d'échéance (optionnel)</Label>
                                        <DatePicker date={dueDate} setDate={setDueDate}/>
                                    </div>
                                     <div className={cn("text-center py-2 luxury-glass border", creditUsage > 90 ? "border-destructive/30" : "border-chart-secondary/20")}>
                                        <Label>NOUVEAU SOLDE CLIENT</Label>
                                        <p className={cn("text-2xl font-bold", creditUsage > 90 ? "text-destructive" : "text-chart-secondary")}>{formatCurrency(newTotalOutstanding)}</p>
                                        <p className="text-xs text-muted-foreground">
                                           (Disponible: {formatCurrency(creditAvailable - debtFromThisSale)})
                                        </p>
                                    </div>
                                </>
                            )}

                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={closeAndReset} disabled={isLoading}>Annuler</Button>
                            <Button type="submit" onClick={handleFinalize} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Valider la vente
                            </Button>
                        </DialogFooter>
                    </>
                </DialogContent>
            </Dialog>
        </>
    );
}
