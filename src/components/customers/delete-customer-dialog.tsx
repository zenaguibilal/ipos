'use client';

import { useState } from 'react';
import { dataService } from '@/services/data-service';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DeleteCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
}

export function DeleteCustomerDialog({ isOpen, onOpenChange, customer }: DeleteCustomerDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!customer || !customer.id) return;
        setIsDeleting(true);

        try {
            await dataService.deleteCustomer(customer.id);
            toast.success(`Client "${customer.firstName} ${customer.lastName}" supprimé.`);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to delete customer:", error);
            toast.error("Échec de la suppression du client.");
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
                Cette action est irréversible. Le client "{customer?.firstName} {customer?.lastName}" sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete} disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }))} >
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuer et supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
