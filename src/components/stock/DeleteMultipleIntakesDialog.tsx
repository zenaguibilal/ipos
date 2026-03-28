
'use client';

import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

/**
 * @fileOverview Bulk Cancellation of Stock Intakes (Sovereign Authority)
 */

interface DeleteMultipleIntakesDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    intakeUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleIntakesDialog({ isOpen, onOpenChange, intakeUuids, onSuccess }: DeleteMultipleIntakesDialogProps) {

    const handleBulkCancel = async () => {
        if (intakeUuids.length === 0) return;
        
        try {
            await api.post('stock/bulk-delete', { uuids: intakeUuids });
            toast.success(`${intakeUuids.length} réceptions annulées avec succès.`, {
                description: "Le stock et les balances fournisseurs ont été synchronisés."
            });
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de l'annulation groupée.");
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Annulation Groupée de Réceptions'
            description={`Êtes-vous absolument sûr de vouloir annuler ces ${intakeUuids.length} réceptions ? Cette opération déduira les quantités du stock actuel et restaurera les anciens soldes des fournisseurs.`}
            onConfirm={handleBulkCancel}
            confirmText="Confirmer l'annulation massive"
            cancelText="Retour"
        />
    );
}
