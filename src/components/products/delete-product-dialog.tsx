'use client';

import type { Product } from '@/lib/types';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    onConfirmDelete: (product: Product) => Promise<void>;
}

export function DeleteProductDialog({ isOpen, onOpenChange, product, onConfirmDelete }: DeleteProductDialogProps) {
    
    const handleConfirm = async () => {
        if (!product) return;
        await onConfirmDelete(product);
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. Le produit "${product?.name}" sera définitivement supprimé.`}
            onConfirm={handleConfirm}
            confirmText="Continuer et supprimer"
        />
    );
}

    