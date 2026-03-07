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
import type { PainClient } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';

interface SupprimerPainClientDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    client: PainClient | null;
}

export function SupprimerPainClientDialog({ isOpen, onOpenChange, client }: SupprimerPainClientDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!client || !client.id) return;
        setIsDeleting(true);

        try {
            await dataService.deletePainClient(client.id);
            toast.success(`Client "${client.nom}" supprimé.`);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to delete bread client:", error);
            toast.error(error.message || "Échec de la suppression du client.");
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
                Cette action est irréversible. Le client "{client?.nom}" et toutes ses commandes de pain seront définitivement supprimés.
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
