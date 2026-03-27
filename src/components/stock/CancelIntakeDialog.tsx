'use client';

import { toast } from 'sonner';
import type { StockIntake } from '@/lib/types';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelIntakeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    intake: StockIntake | null;
    onSuccess: () => void;
}

export function CancelIntakeDialog({ isOpen, onOpenChange, intake, onSuccess }: CancelIntakeDialogProps) {
    const handleCancel = async () => {
        if (!intake) return;
        
        try {
            await api.delete(`stock/${intake.uuid}`);
            toast.success("Réception annulée avec succès.", {
                description: "Le stock des produits a été restauré et le solde fournisseur mis à jour."
            });
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de l'annulation de la réception.");
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Annuler la réception ${intake?.invoiceNumber || 'SANS_REF'} ?`}
            description="Cette action est irréversible. Les quantités reçues seront déduites du stock actuel et le solde du fournisseur sera restauré à son état précédent."
            onConfirm={handleCancel}
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
        />
    );
}
