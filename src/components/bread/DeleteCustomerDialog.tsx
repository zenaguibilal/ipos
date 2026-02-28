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
import type { BreadCustomer } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DeleteCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: BreadCustomer | null;
}

export default function DeleteCustomerDialog({ isOpen, onOpenChange, customer }: DeleteCustomerDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!customer || !customer.id) return;
        setIsDeleting(true);

        try {
            await dataService.deleteBreadCustomer(customer.id);
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
                onClick={handleDelete} disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }))}>
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuer et supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
