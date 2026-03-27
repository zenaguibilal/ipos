
'use client';

import { toast } from 'sonner';
import type { Expense } from '@/lib/types';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
    onSuccess: () => void;
}

export default function DeleteExpenseDialog({ isOpen, onOpenChange, expense, onSuccess }: DeleteExpenseDialogProps) {
    const handleDelete = async () => {
        if (!expense?.uuid) return;
        
        // Updated to use direct API Wall
        await api.delete(`expenses/${expense.uuid}`);
        toast.success(`Dépense "${expense.description}" supprimée.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Êtes-vous absolument sûr ?'
            description={`Cette action est irréversible. La dépense "${expense?.description}" sera définitivement supprimée.`}
            onConfirm={handleDelete}
            confirmText="Continuer et supprimer"
        />
    );
}
