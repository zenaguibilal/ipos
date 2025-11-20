
'use client';

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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ResetRecurringDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    isResetting: boolean;
    recurringOrdersCount: number;
}

export function ResetRecurringDialog({ isOpen, onOpenChange, onConfirm, isResetting, recurringOrdersCount }: ResetRecurringDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réinitialiser les commandes récurrentes ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action mettra à jour le statut de "Payé" et "Livré" à `false` pour les {recurringOrdersCount} commandes récurrentes.
            Ceci prépare la liste pour la nouvelle journée. Êtes-vous sûr de vouloir continuer ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Annuler</AlertDialogCancel>
          <Button 
            onClick={onConfirm}
            disabled={isResetting}
          >
            {isResetting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réinitialisation...
                </>
            ) : "Confirmer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
