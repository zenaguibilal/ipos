'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';

interface CancelReturnDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productReturn: ProductReturn | null;
}

export function CancelReturnDialog({ isOpen, onOpenChange, productReturn }: CancelReturnDialogProps) {
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = async () => {
        if (!productReturn || !productReturn.id) return;
        setIsCancelling(true);

        try {
            await dataService.deleteReturn(productReturn.id);
            toast.success(`Retour sur facture #${productReturn.originalInvoiceNumber} annulé.`);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to cancel return:", error);
            toast.error(error.message || "Échec de l'annulation du retour.");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isCancelling && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler le retour sur facture #{productReturn?.originalInvoiceNumber} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le stock et le solde client seront mis à jour en conséquence.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel} disabled={isCancelling}
                className={cn(buttonVariants({ variant: "destructive" }))}>
                 {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer l'annulation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
