
'use client';

import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

/**
 * @fileOverview Bulk Cancellation of Customer Accounts (Sovereign Authority)
 */

interface DeleteMultipleCustomersDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customerUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleCustomersDialog({ isOpen, onOpenChange, customerUuids, onSuccess }: DeleteMultipleCustomersDialogProps) {

    const handleBulkDelete = async () => {
        if (customerUuids.length === 0) return;
        
        try {
            await api.post('customers/bulk-delete', { uuids: customerUuids });
            toast.success(`${customerUuids.length} client(s) révoqué(s) avec succès.`, {
                description: "Les comptes et l'historique associé ont été purgés du Cloud iPOS."
            });
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de la révocation collective.");
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Révocation Collective de Comptes'
            description={`Êtes-vous absolument sûr de vouloir supprimer ces ${customerUuids.length} comptes clients ? Cette action est irréversible et supprimera définitivement tout leur historique de dettes et de paiements.`}
            onConfirm={handleBulkDelete}
            confirmText="Révoquer définitivement"
            cancelText="Annuler"
        />
    );
}
