
'use client';

import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

/**
 * @fileOverview Bulk Cancellation of Returns (Sovereign Authority)
 */

interface DeleteMultipleReturnsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    returnUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleReturnsDialog({ isOpen, onOpenChange, returnUuids, onSuccess }: DeleteMultipleReturnsDialogProps) {

    const handleBulkCancel = async () => {
        if (returnUuids.length === 0) return;
        
        try {
            await api.post('returns/bulk-delete', { uuids: returnUuids });
            toast.success(`${returnUuids.length} retour(s) annulé(s) avec succès.`, {
                description: "Le stock a été réajusté et les soldes clients ont été synchronisés."
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
            title='Annulation Groupée de Retours'
            description={`Êtes-vous absolument sûr de vouloir annuler ces ${returnUuids.length} opérations de retour ? Cette action va déduire les quantités du stock et restaurer les dettes originales des clients.`}
            onConfirm={handleBulkCancel}
            confirmText="Confirmer l'annulation massive"
            cancelText="Retour"
        />
    );
}
