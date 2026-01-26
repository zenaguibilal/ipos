
'use client';

import { useState } from 'react';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
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

interface DeleteBreadCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: BreadCustomer | null;
    userId: string;
}

export function DeleteBreadCustomerDialog({ isOpen, onOpenChange, customer, userId }: DeleteBreadCustomerDialogProps) {
    const firestore = useFirestore();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!customer || !firestore) return;
        setIsDeleting(true);

        try {
            const batch = writeBatch(firestore);
            
            // 1. Delete the customer document
            const customerRef = doc(firestore, 'users', userId, 'breadCustomers', customer.id);
            batch.delete(customerRef);

            // 2. Find and delete all related daily orders
            const ordersRef = collection(firestore, 'users', userId, 'dailyBreadOrders');
            const q = query(ordersRef, where('breadCustomerId', '==', customer.id));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            toast.success(`Client "${customer.name}" et toutes ses commandes ont été supprimés.`);

        } catch (error) {
             console.error("Failed to delete bread customer and their orders:", error);
             toast.error("Échec de la suppression du client.");
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
                Cette action est irréversible. Le client "{customer?.name}" et toutes ses commandes de pain (passées et futures) seront définitivement supprimés.
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
