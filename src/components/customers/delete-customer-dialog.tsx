'use client';

import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { customerService } from '@/services/customer.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: () => void;
}

export function DeleteCustomerDialog({ isOpen, onOpenChange, customer, onSuccess }: DeleteCustomerDialogProps) {
    const handleDelete = async () => {
        if (!customer) return;
        
        // The business rule is now enforced in the service layer.
        // ConfirmAlertDialog will catch and display any errors thrown by the service.
        await customerService.deleteCustomer(customer.uuid);
        toast.success(`Client "${customer.firstName} ${customer.lastName}" supprimé.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. Le client "${customer?.firstName} ${customer?.lastName}" sera définitivement supprimé.`}
            onConfirm={handleDelete}
            confirmText="Continuer et supprimer"
        />
    );
}
