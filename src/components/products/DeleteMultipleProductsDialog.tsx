'use client';

import { toast } from 'sonner';
import { productService } from '@/services';
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
        await productService.deleteProducts(productUuids);
        toast.success(`${productUuids.length} produit(s) supprimé(s) avec succès.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. ${productUuids.length} produit(s) sélectionné(s) seront définitivement supprimé(s).`}
            onConfirm={handleDelete}
            confirmText="Continuer et supprimer"
        />
    );
}
