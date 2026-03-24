'use client';

import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { customerService } from '@/services';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
}

export function DeleteCustomerDialog({ isOpen, onOpenChange, customer }: DeleteCustomerDialogProps) {
    const handleDelete = async () => {
        if (!customer || !customer.id) return;
        await customerService.deleteCustomer(customer.id);
        toast.success(`Client "${customer.firstName} ${customer.lastName}" supprimé.`);
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
