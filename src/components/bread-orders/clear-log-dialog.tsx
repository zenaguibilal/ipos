'use client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ClearLogDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    isProcessing: boolean;
}

export function ClearLogDialog({ isOpen, onOpenChange, onConfirm, isProcessing }: ClearLogDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Vider le journal des dettes ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action supprimera définitivement tous les enregistrements de dettes de pain archivées.
                        <br/><br/>
                        <strong>Cette action est irréversible.</strong>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                    <Button onClick={onConfirm} disabled={isProcessing} variant="destructive">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirmer et vider
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

    