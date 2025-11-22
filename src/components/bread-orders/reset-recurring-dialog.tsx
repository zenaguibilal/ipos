
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
    nonRecurringOrdersCount: number;
}

export function ResetRecurringDialog({ isOpen, onOpenChange, onConfirm, isResetting, recurringOrdersCount, nonRecurringOrdersCount }: ResetRecurringDialogProps) {
  const totalActions = recurringOrdersCount + nonRecurringOrdersCount;

  if (totalActions === 0) {
      return (
         <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Aucune action à effectuer</AlertDialogTitle>
                <AlertDialogDescription>
                    Il n'y a aucune commande à réinitialiser ou à supprimer.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Fermer</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Effectuer le nettoyage quotidien ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible.
            <ul className="list-disc pl-5 mt-2 space-y-1">
                {nonRecurringOrdersCount > 0 && (
                    <li className="text-destructive">
                        Les **{nonRecurringOrdersCount}** commandes non récurrentes seront **supprimées**.
                    </li>
                )}
                {recurringOrdersCount > 0 && (
                     <li>
                        Le statut de "Payé" et "Livré" des **{recurringOrdersCount}** commandes récurrentes sera réinitialisé.
                    </li>
                )}
            </ul>
             <br/>
            Êtes-vous sûr de vouloir continuer ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Annuler</AlertDialogCancel>
          <Button 
            onClick={onConfirm}
            disabled={isResetting}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isResetting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Nettoyage...
                </>
            ) : "Confirmer et nettoyer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
