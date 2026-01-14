
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ResetOrdersDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    isProcessing: boolean;
}

export function ResetOrdersDialog({ isOpen, onOpenChange, onConfirm, isProcessing }: ResetOrdersDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réinitialiser la liste pour le lendemain ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action supprimera toutes les commandes non récurrentes. Les commandes récurrentes seront conservées et réinitialisées (non payées, non livrées) pour la journée suivante.
            <br/><br/>
            <strong>Cette action est irréversible.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isProcessing} variant="destructive">
             {isProcessing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réinitialisation...
                </>
            ) : "Confirmer et réinitialiser"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
