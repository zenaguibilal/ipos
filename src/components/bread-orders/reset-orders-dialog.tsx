
'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface ResetOrdersDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    isProcessing: boolean;
    summary: {
        toArchive: number;
        toReset: number;
        toDelete: number;
        problematic: number;
    };
}

export function ResetOrdersDialog({ isOpen, onOpenChange, onConfirm, isProcessing, summary }: ResetOrdersDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réinitialiser la liste pour la journée ?</AlertDialogTitle>
           <AlertDialogDescription asChild>
             <div className="space-y-4">
                <p>
                    Ceci préparera la liste pour le jour suivant. Voici un résumé de ce qui va se passer :
                </p>
                 <ul className="list-disc pl-5 my-2 text-sm text-muted-foreground space-y-1">
                    <li><span className="font-semibold">{summary.toArchive} commande(s)</span> impayée(s) sera/seront archivée(s) comme dette.</li>
                    <li><span className="font-semibold">{summary.toReset} commande(s)</span> récurrente(s) sera/seront réinitialisée(s).</li>
                    <li><span className="font-semibold">{summary.toDelete} commande(s)</span> unique(s) sera/seront supprimée(s).</li>
                </ul>

                {summary.problematic > 0 && (
                    <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold">ATTENTION !</h4>
                                <p className="text-xs">
                                    {summary.problematic} commande(s) unique(s) non marquées comme "livrées" seront supprimées. Si elles ont été livrées mais non payées, la dette sera perdue.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                <p className="font-bold pt-2">Cette action est irréversible.</p>
             </div>
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
