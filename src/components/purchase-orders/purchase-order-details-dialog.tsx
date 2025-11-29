
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { PurchaseOrder, CompanyProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import { PurchaseOrderReceipt } from './purchase-order-receipt';
import { ThermalReceiptPO } from './thermal-receipt-po';

interface PurchaseOrderDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    purchaseOrder: PurchaseOrder;
    companyProfile: CompanyProfile;
}

export function PurchaseOrderDetailsDialog({ isOpen, onOpenChange, purchaseOrder, companyProfile }: PurchaseOrderDetailsDialogProps) {
    const a4ReceiptRef = useRef<HTMLDivElement>(null);
    const thermalReceiptRef = useRef<HTMLDivElement>(null);


    const handlePrint = (thermal=false) => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptRef = thermal ? thermalReceiptRef : a4ReceiptRef;
        if (!printableContent || !receiptRef.current) return;

        // Add class to html/body to trigger correct @page rule
        document.documentElement.classList.toggle('thermal', thermal);
        
        const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;
        if(thermal) {
            receiptClone.classList.add('thermal-receipt');
        } else {
            receiptClone.classList.add('a4-receipt');
        }

        printableContent.innerHTML = '';
        printableContent.appendChild(receiptClone);
        
        setTimeout(() => {
            window.print();
            document.documentElement.classList.remove('thermal');
        }, 300);
    };

    const handleDownloadPdf = () => {
        const element = a4ReceiptRef.current;
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
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-h-[70vh] overflow-y-auto">
                   <div ref={a4ReceiptRef}>
                     <PurchaseOrderReceipt purchaseOrder={purchaseOrder} companyProfile={companyProfile} />
                   </div>
                </div>

                {/* Hidden container for thermal receipt clone */}
                <div className="hidden">
                    <div ref={thermalReceiptRef}>
                        <ThermalReceiptPO purchaseOrder={purchaseOrder} companyProfile={companyProfile} />
                    </div>
                </div>

                <DialogFooter className="print-hide sm:justify-start gap-2">
                    <Button type="button" variant="outline" onClick={() => handlePrint(true)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer (Thermique)
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handlePrint(false)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer (A4)
                    </Button>
                     <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger PDF (A4)
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)} className="sm:ml-auto">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
