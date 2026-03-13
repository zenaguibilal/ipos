'use client';

import { toast } from 'sonner';
import type { Expense } from '@/lib/types';
import { dataService } from '@/services/data-service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface DeleteExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
}

export default function DeleteExpenseDialog({ isOpen, onOpenChange, expense }: DeleteExpenseDialogProps) {
    const handleDelete = async () => {
        if (!expense || !expense.id) return;
        await dataService.deleteExpense(expense.id);
        toast.success(`Dépense "${expense.description}" supprimée.`);
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
