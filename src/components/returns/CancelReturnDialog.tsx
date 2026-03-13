'use client';

import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { dataService } from '@/services/data-service';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

interface CancelReturnDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productReturn: ProductReturn | null;
}

export function CancelReturnDialog({ isOpen, onOpenChange, productReturn }: CancelReturnDialogProps) {
    
    const handleCancel = async () => {
        if (!productReturn || !productReturn.id) return;
        await dataService.deleteReturn(productReturn.id);
        toast.success(`Retour sur facture #${productReturn.originalInvoiceNumber} annulé.`);
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
