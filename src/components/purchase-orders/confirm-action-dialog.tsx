
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

interface ConfirmActionDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    action: 'delete' | 'receive' | 'send';
    orderNumber: string;
    isSubmitting: boolean;
}

const actionDetails = {
    delete: {
        title: "Êtes-vous absolument sûr ?",
        description: "Cette action est irréversible. Le bon de commande sera définitivement supprimé.",
        confirmText: "Supprimer",
        variant: "destructive" as const,
    },
    receive: {
        title: "Confirmer la réception ?",
        description: "Cette action mettra à jour le stock des produits concernés et marquera la commande comme 'Reçue'. Cette action est irréversible.",
        confirmText: "Confirmer la réception",
        variant: "default" as const,
    },
    send: {
        title: "Marquer comme envoyé ?",
        description: "Cette action changera le statut de la commande à 'Envoyé'.",
        confirmText: "Confirmer l'envoi",
        variant: "default" as const,
    }
}

export function ConfirmActionDialog({ isOpen, onOpenChange, onConfirm, action, orderNumber, isSubmitting }: ConfirmActionDialogProps) {
  const details = actionDetails[action];

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{details.title}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-mono bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">{orderNumber}</span>: {details.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
          <Button 
            onClick={onConfirm} 
            disabled={isSubmitting}
            className={cn(buttonVariants({ variant: details.variant }))}
          >
             {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    En cours...
                </>
            ) : details.confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
