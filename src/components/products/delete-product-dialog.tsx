'use client';

import type { Product } from '@/lib/types';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { productService } from '@/services/product.service';

interface DeleteProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    onConfirmDelete: (product: Product) => Promise<void>;
}

export function DeleteProductDialog({ isOpen, onOpenChange, product, onConfirmDelete }: DeleteProductDialogProps) {
    
    const handleConfirm = async () => {
        if (!product) return;
        
        // Orchestration: Check for dependencies before deleting
        const hasLogs = await productService.hasInventoryLogs(product.uuid);
        if (hasLogs) {
            throw new Error("Suppression impossible: ce produit a un historique de transactions (ventes, stocks...).");
        }

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
