'use client';

import { toast } from 'sonner';
import type { Sale } from '@/lib/types';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { inventoryService } from '@/services/inventory.service';
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

        // --- Orchestration Logic ---
        // 1. Delete the sale record. The service returns the deleted sale object.
        const cancelledSale = await salesService.deleteSale(sale.uuid);
        
        // 2. Restore stock for each item in the cancelled sale.
        for (const item of cancelledSale.items) {
             await inventoryService.adjustStock(item.productUuid, item.quantity, 'cancellation', cancelledSale.uuid);
        }

        // 3. Recalculate customer status if a customer was associated with the sale.
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
