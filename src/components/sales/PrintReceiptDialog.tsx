'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer } from 'lucide-react';
import { Separator } from '../ui/separator';

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
        }, 300); // Allow dialog to animate out
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

    if (!lastCompletedSale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Vente finalisée avec succès</DialogTitle>
                    <DialogDescription>
                        Vous pouvez maintenant imprimer le reçu pour le client.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[50vh] overflow-y-auto bg-muted/30 p-4 rounded-lg">
                    <div className="bg-white text-black p-2">
                         <Receipt 
                            ref={receiptRef} 
                            sale={lastCompletedSale.sale} 
                            customer={lastCompletedSale.customer} 
                            profile={profile} 
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">Fermer</Button>
                    <Separator orientation="vertical" className="h-auto hidden sm:block"/>
                    <div className="flex w-full sm:w-auto gap-2">
                        <Button onClick={() => handlePrint('thermal')} className="flex-1">
                            <Printer className="mr-2 h-4 w-4" /> Ticket (80mm)
                        </Button>
                        <Button onClick={() => handlePrint('a4')} className="flex-1">
                            <Printer className="mr-2 h-4 w-4" /> Facture A4
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
