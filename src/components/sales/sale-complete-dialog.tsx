'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import type { Sale, Customer, CompanyProfile } from "@/lib/types";
import { CheckCircle, MessageSquare, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { ThermalReceipt } from "../sales/thermal-receipt";
import { A4Receipt } from "./a4-receipt"; // Import A4 receipt
import { useRef, useState, useEffect } from 'react';


interface SaleCompleteDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
    customer: Customer | null;
    companyProfile: CompanyProfile | null;
}

export function SaleCompleteDialog({ isOpen, onOpenChange, sale, customer, companyProfile }: SaleCompleteDialogProps) {
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
    
    const handleWhatsAppClick = () => {
        if (!customer || !customer.phone) {
            toast.error("Le numéro de téléphone du client n'est pas disponible.");
            return;
        }

        const companyName = companyProfile?.companyName || 'notre magasin';
        const message = `Bonjour ${customer.firstName} ${customer.lastName}, merci pour votre achat chez ${companyName}. Le total de votre facture N°${sale.invoiceNumber} est de ${sale.total.toFixed(2)} DA. Montant payé : ${sale.amountPaid.toFixed(2)} DA. Solde restant : ${sale.remainingBalance.toFixed(2)} DA.`;
        
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        onOpenChange(false); // Close dialog after opening whatsapp
    };
    
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
    };

    const canSendWhatsApp = customer && customer.phone;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} className="print-hide sm:max-w-md">
                <DialogHeader>
                    <div className="flex flex-col items-center text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <DialogTitle className="text-2xl">Vente finalisée avec succès !</DialogTitle>
                        <DialogDescription>
                            La vente a été enregistrée.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                 
                 {/* Container visible for preview */}
                 <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md max-h-[50vh] overflow-y-auto">
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

                <DialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
                     <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => handlePrint('thermal')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Ticket 80mm
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => handlePrint('a4')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Facture A4
                        </Button>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleDownloadPdf} disabled={!html2pdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger PDF (A4)
                    </Button>
                    {canSendWhatsApp && (
                        <Button onClick={handleWhatsAppClick} className="w-full bg-green-600 hover:bg-green-700">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Envoyer reçu WhatsApp
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full">
                        Nouvelle Vente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
