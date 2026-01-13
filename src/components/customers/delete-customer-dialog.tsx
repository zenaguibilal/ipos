
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface DeleteCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    customerName: string;
    customerId: string;
    userId: string;
}

export function DeleteCustomerDialog({ isOpen, onOpenChange, customerName, customerId, userId }: DeleteCustomerDialogProps) {
    const firestore = useFirestore();
    const router = useRouter();

    const handleDelete = () => {
        if (!firestore) return;
        const docRef = doc(firestore, 'users', userId, 'customers', customerId);
        
        deleteDocumentNonBlocking(docRef, {
            onSuccess: () => {
                toast.success(`Le client "${customerName}" a été supprimé.`);
                onOpenChange(false);
                router.push('/customers');
            },
            onError: (err) => {
                toast.error("Échec de la suppression du client.");
                console.error("Failed to delete customer:", err);
            }
        })
    }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le client "{customerName}" sera définitivement supprimé.
            Cela ne supprimera pas ses ventes ou paiements passés de l'historique général, mais ils ne seront plus liés à ce client.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            Continuer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
