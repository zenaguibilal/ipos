
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
import type { Sale, CustomerWithSalesData, CompanyProfile } from "@/lib/types";
import { CheckCircle, MessageSquare } from "lucide-react";

interface SaleCompleteDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
    customer: CustomerWithSalesData | null;
    companyProfile: CompanyProfile | null;
}

export function SaleCompleteDialog({ isOpen, onOpenChange, sale, customer, companyProfile }: SaleCompleteDialogProps) {
    
    const handleWhatsAppClick = () => {
        if (!customer || !customer.phone) return;

        const companyName = companyProfile?.companyName || 'notre magasin';
        const message = `Bonjour ${customer.firstName}, merci pour votre achat chez ${companyName}. Le total de votre facture N°${sale.invoiceNumber} est de ${sale.total.toFixed(2)} DA. Montant payé : ${sale.amountPaid.toFixed(2)} DA. Solde restant : ${sale.remainingBalance.toFixed(2)} DA.`;
        
        const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        onOpenChange(false); // Close dialog after opening whatsapp
    };
    
    const canSendWhatsApp = customer && customer.phone;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <div className="flex flex-col items-center text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <DialogTitle className="text-2xl">Vente finalisée avec succès !</DialogTitle>
                    <DialogDescription>
                        La vente a été enregistrée.
                    </DialogDescription>
                </div>
            </DialogHeader>

            <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">Facture N°: <span className="font-mono">{sale.invoiceNumber}</span></p>
                <p className="text-lg font-bold">Total: {sale.total.toFixed(2)} DA</p>
                {sale.paymentStatus !== 'paid' && (
                    <p className="text-destructive font-semibold">
                        Solde restant : {sale.remainingBalance.toFixed(2)} DA
                    </p>
                )}
            </div>

            <DialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
                {canSendWhatsApp && (
                    <Button onClick={handleWhatsAppClick}>
                         <MessageSquare className="mr-2 h-4 w-4" />
                        Envoyer reçu WhatsApp
                    </Button>
                )}
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    Nouvelle Vente
                </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    )
}
