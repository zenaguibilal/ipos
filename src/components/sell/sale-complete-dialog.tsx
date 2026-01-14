
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
import { useRef, useState, useEffect } from 'react';


interface SaleCompleteDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
    customer: Customer | null;
    companyProfile: CompanyProfile | null;
}

export function SaleCompleteDialog({ isOpen, onOpenChange, sale, customer, companyProfile }: SaleCompleteDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
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
    
    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        if (!printableContent || !receiptRef.current) return;
        
        // Add class to html/body to trigger correct @page rule
        document.documentElement.classList.add('thermal');

        // Clone the receipt content to the dedicated print container
        const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;
        receiptClone.classList.add('thermal-receipt');

        printableContent.innerHTML = ''; // Clear previous content
        printableContent.appendChild(receiptClone);
        
        // Allow images to load before printing
        setTimeout(() => {
            window.print();
            // Clean up class after printing
            document.documentElement.classList.remove('thermal');
        }, 300);
    };
    
    const handleDownloadPdf = () => {
        const element = receiptRef.current;
        if (!element || !html2pdf) return;

        const opt = {
          margin:       [5, 0, 5, 0], // top, left, bottom, right in mm
          filename:     `facture-${sale.invoiceNumber}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 3, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: [80, 297], orientation: 'portrait' }
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
                    <div ref={receiptRef}>
                       <ThermalReceipt sale={sale} companyProfile={companyProfile} />
                    </div>
                 </div>

                <DialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
                     <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={handleDownloadPdf} disabled={!html2pdf}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
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
