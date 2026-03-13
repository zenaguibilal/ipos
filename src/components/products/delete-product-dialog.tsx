'use client';

import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { dataService } from '@/services/data-service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
}

export function DeleteProductDialog({ isOpen, onOpenChange, product }: DeleteProductDialogProps) {
    const handleDelete = async () => {
        if (!product || !product.id || typeof product.id !== 'number') return;
        await dataService.deleteProduct(product.id as number);
        toast.success(`Produit "${product.name}" supprimé.`);
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. Le produit "${product?.name}" sera définitivement supprimé.`}
            onConfirm={handleDelete}
            confirmText="Continuer et supprimer"
        />
    );
}
