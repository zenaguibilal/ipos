'use client';

import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { returnService } from '@/services/return.service';
import { customerService } from '@/services/customer.service';
import { inventoryService } from '@/services/inventory.service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelReturnDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productReturn: ProductReturn | null;
    onSuccess: () => void;
}

export function CancelReturnDialog({ isOpen, onOpenChange, productReturn, onSuccess }: CancelReturnDialogProps) {
    
    const handleCancel = async () => {
        if (!productReturn) return;
        
        // Orchestration:
        // 1. Delete the return record
        const cancelledReturn = await returnService.deleteReturn(productReturn.uuid);

        // 2. Reverse stock adjustment for restocked items
        for (const item of cancelledReturn.items) {
            if (item.wasRestocked && item.productUuid) {
                await inventoryService.adjustStock(item.productUuid, -item.quantity, 'cancellation', cancelledReturn.uuid);
            }
        }
        
        // 3. Recalculate customer status
        if (cancelledReturn.customerUuid) {
            await customerService.recalculateCustomerStatus(cancelledReturn.customerUuid);
        }

        toast.success(`Retour sur facture #${productReturn.originalInvoiceNumber} annulé.`);
        onSuccess();
    };

    return (
        <ConfirmAlertDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Annuler le retour sur facture #${productReturn?.originalInvoiceNumber} ?`}
            description="Cette action est irréversible. Le stock et le solde client seront mis à jour en conséquence."
            onConfirm={handleCancel}
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
        />
    );
}
