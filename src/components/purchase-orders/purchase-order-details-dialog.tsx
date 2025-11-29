
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { PurchaseOrder, CompanyProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import { PurchaseOrderReceipt } from './purchase-order-receipt';

interface PurchaseOrderDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    purchaseOrder: PurchaseOrder;
    companyProfile: CompanyProfile;
}

export function PurchaseOrderDetailsDialog({ isOpen, onOpenChange, purchaseOrder, companyProfile }: PurchaseOrderDetailsDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        if (!printableContent || !receiptRef.current) return;

        const receiptClone = receiptRef.current.cloneNode(true);
        printableContent.innerHTML = '';
        printableContent.appendChild(receiptClone);
        
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleDownloadPdf = () => {
        const element = receiptRef.current;
        if (!element) return;

        const opt = {
          margin:       [5, 5, 5, 5],
          filename:     `bon-de-commande-${purchaseOrder.poNumber}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    }

    if (!purchaseOrder) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl print-hide">
                <DialogHeader>
                    <DialogTitle>Aperçu du Bon de Commande</DialogTitle>
                    <DialogDescription>
                        Ceci est un aperçu du bon de commande <span className="font-mono">{purchaseOrder.poNumber}</span>.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="bg-white p-4 rounded-md max-h-[70vh] overflow-y-auto">
                   <div ref={receiptRef} className="bg-white text-black p-8">
                     <PurchaseOrderReceipt purchaseOrder={purchaseOrder} companyProfile={companyProfile} />
                   </div>
                </div>

                <DialogFooter className="print-hide">
                    <Button type="button" variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                     <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger PDF
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

    