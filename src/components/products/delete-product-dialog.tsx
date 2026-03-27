
'use client';

import type { Product } from '@/lib/types';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { api } from '@/lib/api-client';

interface DeleteProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    onSuccess: () => void;
}

export function DeleteProductDialog({ isOpen, onOpenChange, product, onSuccess }: DeleteProductDialogProps) {
    
    const handleConfirm = async () => {
        if (!product) return;
        // Updated to use direct API Wall
        await api.delete(`products/${product.uuid}`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolutely sûr ?'
            description={`Cette action est irréversible. Le produit "${product?.name}" sera définitivement supprimé.`}
            onConfirm={handleConfirm}
            confirmText="Continuer et supprimer"
        />
    );
}
