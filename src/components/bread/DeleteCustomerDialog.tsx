
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
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

        try {
            // 1. Find all associated daily orders
            const dailyOrdersRef = collection(firestore, 'users', userId, 'dailyBreadOrders');
            const q = query(dailyOrdersRef, where('breadCustomerId', '==', customer.id));
            const querySnapshot = await getDocs(q);

            // 2. Create a batch write
            const batch = writeBatch(firestore);

            // 3. Add daily orders to the batch for deletion
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 4. Add the customer document to the batch for deletion
            const customerDocRef = doc(firestore, 'users', userId, 'breadCustomers', customer.id);
            batch.delete(customerDocRef);

            // 5. Commit the batch
            await batch.commit();

            toast.success(`Client "${customer.name}" et ses commandes associées ont été supprimés.`);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to delete bread customer and associated orders:", error);
            toast.error("Échec de la suppression du client et de ses commandes.");
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
                Cette action est irréversible. Le client "{customer?.name}" et <span className="font-bold">toutes ses commandes de pain associées</span> seront définitivement supprimés.
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
