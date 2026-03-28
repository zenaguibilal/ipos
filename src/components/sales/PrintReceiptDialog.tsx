
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { safeToDate } from '@/lib/utils';

/**
 * @fileOverview Post-Sale Success Dialog (WhatsApp Integrated)
 */

export function PrintReceiptDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const { lastCompletedSale, profile } = useAppStore(state => ({
        lastCompletedSale: state.lastCompletedSale,
        profile: state.profile
    }));
    const { clearLastCompletedSale } = useAppActions();
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (lastCompletedSale) {
            setIsOpen(true);
        }
    }, [lastCompletedSale]);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            clearLastCompletedSale();
        }, 300); 
    };

    const handlePrint = (format: 'thermal' | 'a4') => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = receiptRef.current;

        if (!printableContent || !receiptElement) return;

        const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
        
        document.documentElement.classList.toggle('thermal', format === 'thermal');
        receiptClone.classList.add(format === 'thermal' ? 'thermal-receipt' : 'a4-receipt');

        printableContent.innerHTML = '';
        printableContent.appendChild(receiptClone);

        setTimeout(() => {
            window.print();
            document.documentElement.classList.remove('thermal');
        }, 100);
    };

    const handleWhatsAppShare = () => {
        if (!lastCompletedSale) return;
        const { sale, customer } = lastCompletedSale;
        const phone = customer?.phone;
        if (!phone) return;

        const storeName = profile?.companyName || "iPOS Authority";
        const dateStr = format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm');
        
        const itemsList = sale.items.map(i => `• ${i.name}\n  (${i.quantity} x ${i.price.toFixed(1)} DA)`).join('\n');
        
        const message = `*${storeName} - FACTURE NUMÉRIQUE*\n` +
                        `------------------------------\n` +
                        `🧾 Réf: #${sale.invoiceNumber}\n` +
                        `📅 Date: ${dateStr}\n` +
                        `------------------------------\n` +
                        `${itemsList}\n` +
                        `------------------------------\n` +
                        `*TOTAL À PAYER: ${sale.total.toFixed(1)} DA*\n` +
                        `💰 Payé: ${sale.amountPaid.toFixed(1)} DA\n` +
                        `💳 Reste: ${sale.remainingBalance.toFixed(1)} DA\n\n` +
                        `_Merci de votre fidélité à ${storeName}_`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!lastCompletedSale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md luxury-glass border-primary/20 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Vente Validée</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Flux gravé dans le Cloud iPOS</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-8 space-y-6">
                    <div className="py-4 max-h-[35vh] overflow-y-auto bg-muted/30 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                        <div className="bg-white text-black p-6 rounded-2xl shadow-2xl">
                             <Receipt 
                                ref={receiptRef} 
                                sale={lastCompletedSale.sale} 
                                customer={lastCompletedSale.customer || null} 
                                profile={profile} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => handlePrint('thermal')} className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest gap-3 border-primary/20 hover:bg-primary/5">
                            <Printer className="h-5 w-5" /> 80mm
                        </Button>
                        <Button variant="outline" onClick={() => handlePrint('a4')} className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest gap-3 border-primary/20 hover:bg-primary/5">
                            <Printer className="h-5 w-5" /> A4 PDF
                        </Button>
                    </div>

                    {lastCompletedSale.customer?.phone && (
                        <Button onClick={handleWhatsAppShare} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl h-16 font-black uppercase text-[11px] tracking-[0.2em] gap-4 shadow-2xl shadow-green-600/30 group transition-all active:scale-95">
                            <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" /> 
                            Partager via WhatsApp
                        </Button>
                    )}
                </div>

                <DialogFooter className="p-6 bg-white/5 border-t border-white/5">
                    <Button variant="ghost" onClick={handleClose} className="w-full rounded-xl h-12 font-black uppercase text-[10px] tracking-widest">Fermer le Terminal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
