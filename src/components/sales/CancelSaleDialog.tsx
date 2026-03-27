
'use client';

import { toast } from 'sonner';
import type { Sale } from '@/lib/types';
import { api } from '@/lib/api-client';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale | null;
    onSuccess: () => void;
}

export function CancelSaleDialog({ isOpen, onOpenChange, sale, onSuccess }: CancelSaleDialogProps) {
    const handleCancel = async () => {
        if (!sale) return;

        try {
            // Updated to use direct API Wall
            await api.delete(`sales/${sale.uuid}`);
            toast.success(`Vente #${sale.invoiceNumber} annulée.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de l'annulation.");
        }
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Annuler la vente #${sale?.invoiceNumber} ?`}
            description="Cette action est irréversible. Les produits de cette vente seront réintégrés au stock et le solde du client sera mis à jour."
            onConfirm={handleCancel}
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
        />
    );
}
