
'use client';

import { useState } from 'react';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
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
import type { BreadCustomer } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DeleteCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: BreadCustomer | null;
    userId: string;
}

export default function DeleteCustomerDialog({ isOpen, onOpenChange, customer, userId }: DeleteCustomerDialogProps) {
    const firestore = useFirestore();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!customer || !firestore) return;
        setIsDeleting(true);

        const docRef = doc(firestore, 'users', userId, 'breadCustomers', customer.id);

        deleteDocumentNonBlocking(docRef, {
            onSuccess: () => {
                toast.success(`Client "${customer.name}" supprimé.`);
                onOpenChange(false);
                setIsDeleting(false);
            },
            onError: (error) => {
                console.error("Failed to delete bread customer:", error);
                toast.error("Échec de la suppression du client.");
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
                Cette action est irréversible. Le client "{customer?.name}" sera définitivement supprimé de la liste des commandes de pain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuer et supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
