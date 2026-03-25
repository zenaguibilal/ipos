'use client';

import { toast } from 'sonner';
import type { Sale } from '@/lib/types';
import { salesService, customerService } from '@/services';
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
        const cancelledSale = await salesService.deleteSale(sale.uuid);
        
        // After sale is cancelled and stock restored, recalculate customer status
        if (cancelledSale.customerUuid) {
            await customerService.recalculateCustomerStatus(cancelledSale.customerUuid);
        }

        toast.success(`Vente #${sale.invoiceNumber} annulée.`);
        onSuccess();
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
