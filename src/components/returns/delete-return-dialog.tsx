
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
        if (!firestore || !productReturn) {
            toast.error("Service de base de données non disponible.");
            return;
        }
        setIsDeleting(true);
        toast.info("Annulation du retour en cours... Le stock est en cours d'ajustement.");

        try {
            await runTransaction(firestore, async (transaction) => {
                const returnRef = doc(firestore, 'users', userId, 'returns', productReturn.id);

                // Adjust stock for items that were restocked during this return
                for (const item of productReturn.items) {
                    if (item.wasRestocked && item.productId) {
                        const productRef = doc(firestore, 'users', userId, 'products', item.productId);
                        const productDoc = await transaction.get(productRef);
                        
                        if (productDoc.exists()) {
                            const currentQuantity = productDoc.data().quantity;
                            // Decrement the stock since we are cancelling the return
                            transaction.update(productRef, {
                                quantity: Math.max(0, currentQuantity - item.quantity)
                            });
                        }
                    }
                }
                
                // Finally, delete the return document
                transaction.delete(returnRef);
            });

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
