
'use client';

import { toast } from 'sonner';
import type { ProductReturn } from '@/lib/types';
import { api } from '@/lib/api-client';
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
        
        try {
            // Updated to use direct API Wall
            await api.delete(`returns/${productReturn.uuid}`);
            toast.success(`Retour sur facture #${productReturn.originalInvoiceNumber} annulé.`);
            onSuccess();
        } catch (error: any) {
            toast.error("Échec de l'annulation.");
        }
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
