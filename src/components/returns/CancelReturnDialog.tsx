'use client';

import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { returnService, customerService } from '@/services';
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
        
        const cancelledReturn = await returnService.deleteReturn(productReturn.uuid);
        
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
