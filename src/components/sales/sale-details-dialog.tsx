
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Sale, CompanyProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Download } from 'lucide-react';
import { ThermalReceipt } from './thermal-receipt';
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import { toast } from 'sonner';

interface SaleDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
    companyProfile?: CompanyProfile | null;
}

export function SaleDetailsDialog({ isOpen, onOpenChange, sale, companyProfile }: SaleDetailsDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print-details');
        if (!printableContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Veuillez autoriser les popups pour imprimer.");
            return;
        }

        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                } catch (e) {
                     console.warn("Could not read stylesheet rules", e);
                    return '';
                }
            }).join('\n');

        printWindow.document.write('<html><head><title>Facture</title>');
        printWindow.document.write(`<style>${styles}</style></head><body>`);
        printWindow.document.write('<div class="print-container">');
        printWindow.document.write(printableContent.innerHTML);
        printWindow.document.write('</div></body></html>');
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleDownloadPdf = () => {
        const element = receiptRef.current;
        if (!element) return;

        const opt = {
          margin:       0,
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
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-h-[60vh] overflow-y-auto">
                   <div ref={receiptRef}>
                     <ThermalReceipt sale={sale} companyProfile={companyProfile} />
                   </div>
                </div>

                {/* Conteneur caché optimisé pour l'impression */}
                 <div className="hidden">
                    <div id="receipt-for-print-details">
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
