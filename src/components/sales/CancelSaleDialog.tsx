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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type { Sale } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';

interface CancelSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale | null;
}

export function CancelSaleDialog({ isOpen, onOpenChange, sale }: CancelSaleDialogProps) {
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = async () => {
        if (!sale || !sale.id) return;
        setIsCancelling(true);

        try {
            await dataService.deleteSale(sale.id);
            toast.success(`Vente #${sale.invoiceNumber} annulée.`);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to cancel sale:", error);
            toast.error(error.message || "Échec de l'annulation de la vente.");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isCancelling && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler la vente #{sale?.invoiceNumber} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Les produits de cette vente seront
                réintégrés au stock et le solde du client sera mis à jour.
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
