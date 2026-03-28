'use client';

import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteMultipleProductsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleProductsDialog({ isOpen, onOpenChange, productUuids, onSuccess }: DeleteMultipleProductsDialogProps) {

    const handleDelete = async () => {
        if (productUuids.length === 0) return;
        
        try {
            await api.post('products/bulk-delete', { uuids: productUuids });
            toast.success(`${productUuids.length} produits supprimés avec succès.`);
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
            description={`Êtes-vous absolument sûr de vouloir supprimer ces ${productUuids.length} produits ? Cette action est irréversible et supprimera tout l'historique associé.`}
            onConfirm={handleDelete}
            confirmText="Supprimer la sélection"
            cancelText="Annuler"
        />
    );
}
