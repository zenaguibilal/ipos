'use client';

import { toast } from 'sonner';
import type { Sale } from '@/lib/types';
import { salesService } from '@/services';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelSaleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale | null;
}

export function CancelSaleDialog({ isOpen, onOpenChange, sale }: CancelSaleDialogProps) {
    const handleCancel = async () => {
        if (!sale || !sale.id) return;
        await salesService.deleteSale(sale.id);
        toast.success(`Vente #${sale.invoiceNumber} annulée.`);
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
