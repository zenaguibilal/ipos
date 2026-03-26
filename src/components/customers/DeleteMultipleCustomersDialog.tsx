'use client';

import { toast } from 'sonner';
import { customerService } from '@/services/customer.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteMultipleCustomersDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customerUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleCustomersDialog({ isOpen, onOpenChange, customerUuids, onSuccess }: DeleteMultipleCustomersDialogProps) {

    const handleDelete = async () => {
        if (customerUuids.length === 0) return;

        await customerService.bulkDelete(customerUuids);
        toast.success(`${customerUuids.length} client(s) supprimé(s) avec succès.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. ${customerUuids.length} client(s) sélectionné(s) seront définitivement supprimé(s).`}
            onConfirm={handleDelete}
            confirmText="Continuer et supprimer"
        />
    );
}
