'use client';

import { useState } from 'react';
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
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';

interface DeleteProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
}

export function DeleteProductDialog({ isOpen, onOpenChange, product }: DeleteProductDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!product || !product.id || typeof product.id !== 'number') return;
        setIsDeleting(true);

        try {
            await dataService.deleteProduct(product.id as number);
            toast.success(`Produit "${product.name}" supprimé.`);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast.error("Échec de la suppression du produit.");
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
                Cette action est irréversible. Le produit "{product?.name}" sera définitivement supprimé.
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
