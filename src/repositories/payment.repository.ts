
import { createClient } from "@/utils/supabase/server";
import type { Payment } from "@/lib/types";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Référentiel de Paiement (Autorité de Données Absolue)
 * Gère la réception des paiements des clients et garantit la mise à jour immédiate des soldes.
 */
export class PaymentRepository {
    private supabase = createClient();
    private customerRepo = new CustomerRepository();

    async create(payment: any): Promise<Payment> {
        const { data, error } = await this.supabase
            .from('payments')
            .insert([{
                customer_uuid: payment.customerUuid,
                amount: payment.amount,
                payment_date: payment.paymentDate || new Date().toISOString(),
                notes: payment.notes,
            }])
            .select()
            .single();

        if (error) throw new Error(`ÉCHEC_ENREGISTREMENT_PAIEMENT : ${error.message}`);

        // Automatisation de l'autorité : Recalcul immédiat du solde du client
        await this.customerRepo.recalculateBalance(payment.customerUuid);

        return this.mapFromDb(data);
    }

    private mapFromDb(p: any): Payment {
        return {
            uuid: p.uuid,
            user_id: p.user_id,
            customerUuid: p.customer_uuid,
            amount: p.amount,
            paymentDate: p.payment_date,
            notes: p.notes,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        };
    }
}
