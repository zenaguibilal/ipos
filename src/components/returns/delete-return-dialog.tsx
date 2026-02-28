'use client';
import { useState } from 'react';
import { dataService } from '@/services/data-service';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DeleteReturnDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productReturn: ProductReturn;
}

export function DeleteReturnDialog({ isOpen, onOpenChange, productReturn }: DeleteReturnDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!productReturn.id) {
            toast.error("ID de retour manquant.");
            return;
        }
        setIsDeleting(true);
        toast.info("Annulation du retour en cours... Le stock est en cours d'ajustement.");

        try {
            await dataService.cancelReturn(productReturn.id);
            toast.success("Retour annulé et stock ajusté.");
        } catch (error) {
            console.error("Failed to delete return and adjust stock:", error);
            toast.error("Échec de l'annulation du retour. Le stock n'a pas été modifié.");
        } finally {
            setIsDeleting(false);
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le retour pour la facture <span className="font-mono">{productReturn.originalInvoiceNumber}</span> sera définitivement supprimé et le stock sera ajusté en conséquence.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <Button 
                onClick={handleDelete} disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }))}>
                 {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuer et supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
