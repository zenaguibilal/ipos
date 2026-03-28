
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import { safeToDate } from '@/lib/utils';

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

        const storeName = profile?.companyName || "iPOS Store";
        const itemsList = sale.items.map(i => `- ${i.name} (${i.quantity} x ${i.price} DA)`).join('\n');
        const message = `*FACTURE iPOS - ${storeName}*\n` +
                        `--------------------------\n` +
                        `Réf: #${sale.invoiceNumber}\n` +
                        `Date: ${format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm')}\n` +
                        `--------------------------\n` +
                        `${itemsList}\n` +
                        `--------------------------\n` +
                        `*TOTAL: ${sale.total.toFixed(1)} DA*\n` +
                        `Payé: ${sale.amountPaid.toFixed(1)} DA\n` +
                        `Reste: ${sale.remainingBalance.toFixed(1)} DA\n\n` +
                        `Merci de votre confiance !`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!lastCompletedSale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md luxury-glass border-primary/20">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Vente Finalisée</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase opacity-60">Flux enregistré dans le Cloud iPOS</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4 max-h-[40vh] overflow-y-auto bg-muted/30 p-4 rounded-2xl border border-white/5">
                    <div className="bg-white text-black p-4 rounded-xl shadow-inner">
                         <Receipt 
                            ref={receiptRef} 
                            sale={lastCompletedSale.sale} 
                            customer={lastCompletedSale.customer || null} 
                            profile={profile} 
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col gap-3 sm:flex-row mt-4">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => handlePrint('thermal')} className="rounded-xl h-12 font-black uppercase text-[9px] tracking-widest gap-2">
                            <Printer className="h-4 w-4" /> 80mm
                        </Button>
                        <Button variant="outline" onClick={() => handlePrint('a4')} className="rounded-xl h-12 font-black uppercase text-[9px] tracking-widest gap-2">
                            <Printer className="h-4 w-4" /> A4 PDF
                        </Button>
                    </div>
                    {lastCompletedSale.customer?.phone && (
                        <Button onClick={handleWhatsAppShare} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 font-black uppercase text-[9px] tracking-[0.2em] gap-2 shadow-lg shadow-green-600/20">
                            <MessageSquare className="h-4 w-4" /> WhatsApp
                        </Button>
                    )}
                    <Button variant="ghost" onClick={handleClose} className="w-full rounded-xl h-12 font-black uppercase text-[9px] tracking-widest">Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
