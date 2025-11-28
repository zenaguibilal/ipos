
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Sale, CompanyProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Download } from 'lucide-react';
import { ThermalReceipt } from './thermal-receipt';
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';

interface SaleDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
    companyProfile?: CompanyProfile | null;
}

export function SaleDetailsDialog({ isOpen, onOpenChange, sale, companyProfile }: SaleDetailsDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        if (!printableContent || !receiptRef.current) return;

        // Clone the receipt content to the dedicated print container
        printableContent.innerHTML = ''; // Clear previous content
        printableContent.appendChild(receiptRef.current.cloneNode(true));
        
        window.print();
    };

    const handleDownloadPdf = () => {
        const element = receiptRef.current;
        if (!element) return;

        const opt = {
          margin:       0.5,
          filename:     `facture-${sale.invoiceNumber}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: [80, 297], orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    }


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md print-hide">
                <DialogHeader>
                    <DialogTitle>Aperçu de la Facture</DialogTitle>
                    <DialogDescription>
                        Ceci est un aperçu de la facture pour la vente <span className="font-mono">{sale.invoiceNumber}</span>.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md max-h-[60vh] overflow-y-auto">
                   <div ref={receiptRef}>
                     <ThermalReceipt sale={sale} companyProfile={companyProfile} />
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
