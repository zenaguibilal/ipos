
'use client';

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer } from 'lucide-react';
import { Separator } from '../ui/separator';
import type { Sale, Customer } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';

interface PrintSaleReceiptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customer: Customer | null;
}

export function PrintSaleReceiptDialog({ isOpen, onOpenChange, sale, customer }: PrintSaleReceiptDialogProps) {
    const profile = useAppStore(state => state.profile);
    const receiptRef = useRef<HTMLDivElement>(null);

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

    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Réimpression de Reçu</DialogTitle>
                    <DialogDescription>
                        Facture n°: <span className="font-bold">{sale.invoiceNumber}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[50vh] overflow-y-auto bg-muted/30 p-4 rounded-lg">
                    <div className="bg-white text-black p-2 shadow-sm rounded">
                         <Receipt 
                            ref={receiptRef} 
                            sale={sale} 
                            customer={customer} 
                            profile={profile} 
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Fermer</Button>
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
