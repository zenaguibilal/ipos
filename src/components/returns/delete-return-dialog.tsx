'use client';
import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
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
    userId: string;
}

export function DeleteReturnDialog({ isOpen, onOpenChange, productReturn, userId }: DeleteReturnDialogProps) {
    const firestore = useFirestore();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!firestore) {
            toast.error("Service de base de données non disponible.");
            return;
        }
        setIsDeleting(true);

        try {
            await runTransaction(firestore, async (transaction) => {
                const returnRef = doc(firestore, 'users', userId, 'returns', productReturn.id);

                // 1. For each item in the return, subtract the quantity from the product stock.
                for (const item of productReturn.items) {
                    if (item.productId) {
                        const productRef = doc(firestore, 'users', userId, 'products', item.productId);
                        const productDoc = await transaction.get(productRef);
                        if (productDoc.exists()) {
                            const currentQuantity = productDoc.data().quantity || 0;
                            const newQuantity = currentQuantity - item.quantity;
                            transaction.update(productRef, { quantity: Math.max(0, newQuantity) }); // Don't go below zero
                        }
                    }
                }

                // 2. Delete the return document itself.
                transaction.delete(returnRef);
            });

            toast.success("Retour annulé et supprimé. Le stock a été ajusté.");
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to delete return and adjust stock:", error);
            toast.error("Échec de l'annulation du retour.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le retour pour la facture <span className="font-mono">{productReturn.originalInvoiceNumber}</span> sera définitivement supprimé.
                <br/><br/>
                <strong>Le stock des articles retournés sera diminué en conséquence.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <Button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                 {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuer et supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
