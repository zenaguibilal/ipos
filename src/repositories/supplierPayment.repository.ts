
import { createClient } from "@/utils/supabase/server";
import type { SupplierPayment } from "@/lib/types";
import { SupplierRepository } from "./supplier.repository";

/**
 * @fileOverview Référentiel de Paiement Fournisseur (Autorité Serveur Absolue)
 * Responsable de l'enregistrement des paiements aux fournisseurs et de la correction de leurs balances de manière déterministe.
 */
export class SupplierPaymentRepository {
    private supabase = createClient();
    private supplierRepo = new SupplierRepository();

    async create(payment: any): Promise<SupplierPayment> {
        const { data, error } = await this.supabase
            .from('supplier_payments')
            .insert([{
                supplier_uuid: payment.supplierUuid,
                amount: payment.amount,
                payment_date: payment.paymentDate || new Date().toISOString(),
                method: payment.method,
                notes: payment.notes,
            }])
            .select()
            .single();

        if (error) throw new Error(`ÉCHEC_PAIEMENT_FOURNISSEUR : ${error.message}`);

        // Automatisation de l'autorité : Recalculer immédiatement le solde du fournisseur
        await this.supplierRepo.recalculateBalance(payment.supplierUuid);

        return this.mapFromDb(data);
    }

    private mapFromDb(p: any): SupplierPayment {
        return {
            uuid: p.uuid,
            user_id: p.user_id,
            supplierUuid: p.supplier_uuid,
            amount: p.amount,
            paymentDate: p.payment_date,
            method: p.method,
            notes: p.notes,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        };
    }
}
