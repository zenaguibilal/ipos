
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Sale, CompanyProfile, Customer } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Download, Undo2 } from 'lucide-react';
import { ThermalReceipt } from './thermal-receipt';
import { A4Receipt } from './a4-receipt';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

interface SaleDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
    companyProfile?: CompanyProfile | null;
    customer?: Customer | null;
}

export function SaleDetailsDialog({ isOpen, onOpenChange, sale, companyProfile, customer }: SaleDetailsDialogProps) {
    const thermalReceiptRef = useRef<HTMLDivElement>(null);
    const a4ReceiptRef = useRef<HTMLDivElement>(null);
    const [html2pdf, setHtml2pdf] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            import('html2pdf.js').then(module => {
                setHtml2pdf(() => module.default);
            });
        }
    }, [isOpen]);

    const handlePrint = (format: 'thermal' | 'a4') => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = format === 'thermal' ? thermalReceiptRef.current : a4ReceiptRef.current;
        if (!printableContent || !receiptElement) return;

        if (format === 'thermal') {
            document.documentElement.classList.add('thermal');
        } else {
            document.documentElement.classList.remove('thermal');
        }
        
        const receiptClone = receiptElement.cloneNode(true) as HTMLElement;
        if (format === 'thermal') {
            receiptClone.classList.add('thermal-receipt');
        } else {
            receiptClone.classList.add('a4-receipt');
        }
        
        printableContent.innerHTML = '';
        printableContent.appendChild(receiptClone);
        
        setTimeout(() => {
            window.print();
            if (format === 'thermal') {
                document.documentElement.classList.remove('thermal');
            }
        }, 300);
    };

    const handleDownloadPdf = () => {
        const element = a4ReceiptRef.current;
        if (!element || !html2pdf) return;

        const opt = {
          margin:       0,
          filename:     `facture-${sale.invoiceNumber}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
                   <div ref={thermalReceiptRef}>
                     <ThermalReceipt sale={sale} companyProfile={companyProfile} />
                   </div>
                </div>

                {/* Hidden container for A4 receipt */}
                <div className="hidden">
                    <div ref={a4ReceiptRef}>
                        <A4Receipt sale={sale} companyProfile={companyProfile} customer={customer} />
                    </div>
                </div>

                <DialogFooter className="print-hide sm:flex-col sm:space-x-0 gap-2">
                     <div className="flex gap-2 w-full">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => handlePrint('thermal')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Ticket 80mm
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" onClick={() => handlePrint('a4')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Facture A4
                        </Button>
                     </div>
                     <Button type="button" variant="outline" onClick={handleDownloadPdf} disabled={!html2pdf} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger PDF (A4)
                    </Button>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href={`/returns/new?invoiceNumber=${sale.invoiceNumber}`}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Créer un retour pour cette vente
                        </Link>
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)} className="w-full">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
