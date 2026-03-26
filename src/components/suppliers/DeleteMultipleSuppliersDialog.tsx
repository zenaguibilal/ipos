
'use client';

import { toast } from 'sonner';
import { supplierService } from '@/services/supplier.service';
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
        await supplierService.bulkDelete(supplierUuids);
        toast.success(`${supplierUuids.length} مورد(ين) تم حذفهم بنجاح.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Suppression groupée'
            description={`Êtes-vous sûr de vouloir supprimer les ${supplierUuids.length} fournisseurs sélectionnés ? Cette action est irréversible.`}
            onConfirm={handleDelete}
            confirmText="Oui, supprimer"
        />
    );
}
