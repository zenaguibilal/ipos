
'use client';

import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteMultipleSuppliersDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    supplierUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleSuppliersDialog({ isOpen, onOpenChange, supplierUuids, onSuccess }: DeleteMultipleSuppliersDialogProps) {

    const handleDelete = async () => {
        if (supplierUuids.length === 0) return;
        
        try {
            await api.post('suppliers/bulk-delete', { uuids: supplierUuids });
            toast.success(`${supplierUuids.length} fournisseur(s) supprimé(s) avec succès.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de la suppression groupée.");
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Suppression massive'
            description={`Êtes-vous absolument sûr de vouloir supprimer ces ${supplierUuids.length} fournisseurs ? Cette action est irréversible و supprimera tout l'historique associé.`}
            onConfirm={handleDelete}
            confirmText="Oui, supprimer"
            cancelText="Annuler"
        />
    );
}
