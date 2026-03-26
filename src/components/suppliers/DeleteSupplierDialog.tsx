
'use client';

import { toast } from 'sonner';
import type { Supplier } from '@/lib/types';
import { supplierService } from '@/services/supplier.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteSupplierDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    supplier: Supplier | null;
    onSuccess: () => void;
}

export function DeleteSupplierDialog({ isOpen, onOpenChange, supplier, onSuccess }: DeleteSupplierDialogProps) {
    const handleDelete = async () => {
        if (!supplier?.uuid) return;
        
        try {
            // Business rule: check if supplier has history or products before deleting
            // For now we use a generic delete through a service that should handle this
            await supplierService.deleteSupplier(supplier.uuid);
            toast.success(`Fournisseur "${supplier.name}" supprimé.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de la suppression.", { description: error.message });
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Supprimer le fournisseur ?'
            description={`Cette action est irréversible. Toutes les données associées au fournisseur "${supplier?.name}" seront définitivement supprimées.`}
            onConfirm={handleDelete}
            confirmText="Supprimer définitivement"
        />
    );
}
