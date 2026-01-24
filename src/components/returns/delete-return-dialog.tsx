'use client';
import { useState } from 'react';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
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

        const returnRef = doc(firestore, 'users', userId, 'returns', productReturn.id);

        deleteDocumentNonBlocking(returnRef, {
            onSuccess: () => {
                toast.success("Retour annulé et supprimé.");
                onOpenChange(false);
                setIsDeleting(false);
            },
            onError: (error) => {
                console.error("Failed to delete return:", error);
                toast.error("Échec de l'annulation du retour.");
                setIsDeleting(false);
            }
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le retour pour la facture <span className="font-mono">{productReturn.originalInvoiceNumber}</span> sera définitivement supprimé.
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
