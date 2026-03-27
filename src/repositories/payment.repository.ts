import { createClient } from "@/utils/supabase/server";
import type { Payment } from "@/lib/types";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Payment Repository (Absolute Data Authority)
 * يدير استلام دفعات العملاء ويضمن التحديث الفوري للأرصدة.
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

        if (error) throw new Error(`PAYMENT_RECORD_FAILED: ${error.message}`);

        // أتمتة السلطة: إعادة حساب رصيد العميل فوراً
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
