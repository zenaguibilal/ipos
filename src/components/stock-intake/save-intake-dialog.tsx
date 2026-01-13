
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

interface SaveIntakeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    isSaving: boolean;
    totalItems: number;
    totalValue: number;
}

export function SaveIntakeDialog({ isOpen, onOpenChange, onConfirm, isSaving, totalItems, totalValue }: SaveIntakeDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la réception du stock ?</AlertDialogTitle>
          <AlertDialogDescription>
            <p>
                Vous êtes sur le point de finaliser cette réception. Cette action mettra à jour votre inventaire.
            </p>
             <div className="mt-4 space-y-1 rounded-md border bg-muted/50 p-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre d'articles uniques:</span>
                    <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Valeur totale de la réception:</span>
                    <span className="font-semibold">{totalValue.toFixed(2)} DA</span>
                </div>
            </div>
            <p className="mt-2 text-destructive">
                Cette action est irréversible. Assurez-vous que toutes les informations sont correctes.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
          <Button 
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                </>
            ) : "Confirmer et mettre à jour"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
