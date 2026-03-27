
'use client';

import { toast } from 'sonner';
import type { Supplier } from '@/lib/types';
import { api } from '@/lib/api-client';
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
            // Updated to use direct API Wall
            await api.delete(`suppliers/${supplier.uuid}`);
            toast.success(`Fournisseur "${supplier.name}" supprimé.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de la suppression.");
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
