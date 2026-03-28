'use client';

import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

/**
 * @fileOverview Bulk Cancellation of Expenses (Sovereign Authority)
 */

interface DeleteMultipleExpensesDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expenseUuids: string[];
    onSuccess: () => void;
}

export function DeleteMultipleExpensesDialog({ isOpen, onOpenChange, expenseUuids, onSuccess }: DeleteMultipleExpensesDialogProps) {

    const handleBulkDelete = async () => {
        if (expenseUuids.length === 0) return;
        
        try {
            await api.post('expenses/bulk-delete', { uuids: expenseUuids });
            toast.success(`${expenseUuids.length} dépense(s) supprimée(s) avec succès.`, {
                description: "Les archives comptables ont été purgées du Cloud iPOS."
            });
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de la suppression collective.");
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title='Révocation Collective de Charges'
            description={`Êtes-vous absolument sûr de vouloir supprimer ces ${expenseUuids.length} lignes de dépenses ? Cette action est irréversible و impactera définitivement vos rapports financiers.`}
            onConfirm={handleBulkDelete}
            confirmText="Supprimer définitivement"
            cancelText="Annuler"
        />
    );
}
