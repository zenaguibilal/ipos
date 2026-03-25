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
        if (!customer || !customer.id) return;
        try {
            await customerService.deleteCustomer(customer.id);
            toast.success(`Client "${customer.firstName} ${customer.lastName}" supprimé.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Erreur lors de la suppression", { description: error.message });
            throw error; // Re-throw to keep the dialog open on failure
        }
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
