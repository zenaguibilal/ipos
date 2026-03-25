'use client';

import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';
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

        // Orchestration: Check for dependencies before deleting
        const sales = await salesService.findSalesByCustomerUuid(customer.uuid);
        if (sales.length > 0) {
            throw new Error("Impossible de supprimer un client avec un historique de ventes.");
        }
        
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
