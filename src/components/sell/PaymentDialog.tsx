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
import type { Cart, CartItem, Customer, SalePayment } from '@/lib/types';
import { Loader2, Banknote, AlertTriangle, ShieldCheck, Wallet, HandCoins, ArrowRight } from 'lucide-react';
import { formatCurrency, calculateCartTotals, cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { useAppActions } from '@/stores/appStore';

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    cart: Cart | undefined;
    cartCustomer: Customer | null;
}

type PaymentMode = 'cash' | 'credit';

export function PaymentDialog({ isOpen, onOpenChange, cart, cartCustomer }: PaymentDialogProps) {
    const { finalizeSale } = useAppActions();

    const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
    const [cashAmountStr, setCashAmountStr] = useState('');
    const [creditAmountStr, setCreditAmountStr] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    
    const [isLoading, setIsLoading] = useState(false);

    const [showLossAlert, setShowLossAlert] = useState(false);
    const [lossItems, setLossItems] = useState<CartItem[]>([]);

    const { total } = cart ? calculateCartTotals(cart) : { total: 0 };

    const cashAmountNum = parseFloat(cashAmountStr) || 0;
    
    let change = 0;
    if (paymentMode === 'cash') {
        change = cashAmountNum - total;
    }

    const debtFromThisSale = paymentMode === 'credit' ? total : 0;
    const newTotalOutstanding = (cartCustomer?.outstandingBalance ?? 0) + debtFromThisSale;
    const isOverLimit = cartCustomer?.creditLimit && cartCustomer.creditLimit > 0 && newTotalOutstanding > cartCustomer.creditLimit;

    const initializePayment = useCallback(() => {
        setPaymentMode('cash');
        setCashAmountStr(String(total));
        setCreditAmountStr('0');
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
        }
    }, [isOpen, cart, initializePayment]);
    
    const handlePaymentModeChange = (mode: PaymentMode) => {
        setPaymentMode(mode);
        if (mode === 'cash') {
            setCashAmountStr(String(total));
            setCreditAmountStr('0');
        } else if (mode === 'credit') {
            setCashAmountStr('0');
            setCreditAmountStr(String(total));
        }
    }

    const handleLossAlertConfirm = () => {
        setShowLossAlert(false);
        initializePayment();
    };

    const handleFinalize = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!cart) return;

        const cashVal = parseFloat(cashAmountStr) || 0;

        let amountPaid = 0;
        const payments: SalePayment[] = [];
        let debtAmount = 0;
        
        if (paymentMode === 'cash') {
            if (cashVal < total && !cartCustomer) {
                toast.error("Paiement insuffisant pour un client de passage."); return;
            }
            amountPaid = cashVal;
            payments.push({ method: 'cash', amount: total });
        } else {
            if (!cartCustomer) {
                toast.error("Vente à crédit impossible sans client."); return;
            }
            if (isOverLimit) {
                toast.error("Plafond de crédit dépassé.");
                return;
            }
            debtAmount = total;
        }
        
        setIsLoading(true);
        try {
            const success = await finalizeSale({
                amountPaid: amountPaid,
                payments,
                remainingBalance: debtAmount,
                paymentStatus: debtAmount > 0 ? 'unpaid' : 'paid',
                dueDate: debtAmount > 0 ? dueDate?.toISOString() : undefined,
            });
            if (success) {
                onOpenChange(false);
                initializePayment();
            }
        } catch (error) {
            // Error handled by store
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <>
            <AlertDialog open={showLossAlert} onOpenChange={setShowLossAlert}>
                <AlertDialogContent className="luxury-glass border-destructive/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-6 w-6"/>
                            Vente à perte détectée
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Certains articles sont vendus en dessous de leur prix d'achat. Voulez-vous vraiment continuer ?
                            <ul className="mt-4 space-y-1">
                                {lossItems.map(item => (
                                    <li key={item.uuid} className="text-xs font-bold text-destructive/80 p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                                        {item.name} (Revient: {formatCurrency(item.purchasePrice)} | Vente: {formatCurrency(item.price)})
                                    </li>
                                ))}
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => onOpenChange(false)}>Modifier la vente</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLossAlertConfirm} className="bg-destructive hover:bg-destructive/90">Autoriser & Continuer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isOpen && !showLossAlert} onOpenChange={(open) => !open && onOpenChange(false)}>
                <DialogContent className="sm:max-w-xl luxury-glass border-white/10 p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleFinalize}>
                        <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Finalisation</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Transaction Terminal iPOS</DialogDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Total Net</p>
                                    <p className="text-4xl font-black tracking-tighter text-primary">{formatCurrency(total)}</p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-8 space-y-8">
                            {cartCustomer && (
                                <div className={cn(
                                    "p-4 rounded-2xl border-2 transition-all duration-500 flex items-center justify-between",
                                    isOverLimit ? "bg-destructive/10 border-destructive animate-pulse" : "bg-primary/5 border-primary/20"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-xl", isOverLimit ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary")}>
                                            <Wallet className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Solde {cartCustomer.firstName}</p>
                                            <p className="text-xl font-black">{formatCurrency(cartCustomer.outstandingBalance)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Disponibilité</p>
                                        <p className={cn("text-xl font-black", isOverLimit ? "text-destructive" : "text-chart-quaternary")}>
                                            {formatCurrency((cartCustomer.creditLimit || 0) - cartCustomer.outstandingBalance)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <Label className="text-[11px] font-black uppercase tracking-widest opacity-70">Architecture du Paiement</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button 
                                        type="button" 
                                        variant={paymentMode === 'cash' ? 'secondary' : 'outline'} 
                                        onClick={() => handlePaymentModeChange('cash')}
                                        className={cn(
                                            "h-20 flex-col gap-2 rounded-2xl border-white/5 text-lg font-black",
                                            paymentMode === 'cash' && "bg-primary/10 text-primary border-primary/30 shadow-xl"
                                        )}
                                    >
                                        <Banknote className="h-6 w-6" />
                                        <span className="uppercase tracking-[0.1em]">Espèces</span>
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant={paymentMode === 'credit' ? 'secondary' : 'outline'} 
                                        onClick={() => handlePaymentModeChange('credit')}
                                        disabled={!cartCustomer}
                                        className={cn(
                                            "h-20 flex-col gap-2 rounded-2xl border-white/5 text-lg font-black",
                                            paymentMode === 'credit' && "bg-destructive/10 text-destructive border-destructive/30 shadow-xl"
                                        )}
                                    >
                                        <HandCoins className="h-6 w-6" />
                                        <span className="uppercase tracking-[0.1em]">Crédit</span>
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="grid grid-cols-1 gap-8">
                                {paymentMode === 'cash' ? (
                                    <div className="flex flex-col sm:flex-row gap-8 items-center">
                                        <div className="space-y-4 flex-1 w-full">
                                            <Label className="text-[11px] font-black uppercase tracking-widest opacity-70">Montant Encaissé (DA)</Label>
                                            <div className="relative group">
                                                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                                <Input 
                                                    type="number" 
                                                    value={cashAmountStr} 
                                                    onChange={(e) => setCashAmountStr(e.target.value)} 
                                                    className="pl-12 h-16 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-black text-2xl" 
                                                    placeholder="0.00"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center text-center p-6 rounded-2xl bg-chart-quaternary/5 border border-chart-quaternary/10 flex-1 w-full">
                                            <p className="text-[10px] font-black uppercase text-chart-quaternary mb-1">Monnaie à rendre</p>
                                            <p className="text-4xl font-black text-chart-quaternary">
                                                {formatCurrency(Math.max(0, change))}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShieldCheck className="h-4 w-4 text-destructive" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-destructive">Garanties & Échéances</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold opacity-50 uppercase ml-1">Date d'échéance du paiement</Label>
                                                <DatePicker date={dueDate} setDate={setDueDate} />
                                            </div>
                                            <div className="flex justify-between items-center p-3 rounded-xl bg-background/40 border border-white/5">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Nouveau Solde Total</p>
                                                <p className={cn("font-black", isOverLimit ? "text-destructive" : "text-primary")}>
                                                    {formatCurrency(newTotalOutstanding)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-white/5 border-t border-white/5 gap-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-black uppercase text-[11px] tracking-widest h-14 flex-1">Annuler</Button>
                            <Button 
                                type="submit" 
                                disabled={isLoading || (paymentMode === 'credit' && isOverLimit)} 
                                className="bg-primary hover:bg-primary/90 px-12 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-[11px] tracking-[0.2em] h-14 flex-[2] gap-3 group overflow-hidden relative"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {isLoading ? <Loader2 className="animate-spin h-5 w-5"/> : <ShieldCheck className="h-5 w-5" />}
                                    Graver la Vente
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform duration-500" />
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
