'use client';

import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ConfirmAlertDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmAlertDialog({ 
    isOpen, 
    onOpenChange, 
    title, 
    description,
    onConfirm,
    confirmText = "Continuer",
    cancelText = "Annuler"
}: ConfirmAlertDialogProps) {
    const [isMutating, setIsMutating] = useState(false);

    const handleConfirm = async () => {
        setIsMutating(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Confirmation action failed:", error);
            toast.error(error.message || "L'opération a échoué.");
        } finally {
            setIsMutating(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isMutating && onOpenChange(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMutating}>{cancelText}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm} disabled={isMutating}
                className={cn(buttonVariants({ variant: "destructive" }))} >
                 {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
}
