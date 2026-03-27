import { createClient } from "@/utils/supabase/server";
import type { Sale } from "@/lib/types";

const fromSupabase = (s: any): Sale => ({
    uuid: s.uuid,
    user_id: s.user_id,
    invoiceNumber: s.invoice_number,
    items: s.sale_items || [],
    subtotal: s.subtotal,
    discountType: s.discount_type,
    discountAmount: s.discount_amount,
    total: s.total,
    amountPaid: s.amount_paid,
    remainingBalance: s.remaining_balance,
    paymentStatus: s.payment_status,
    payments: s.payments || [],
    customerUuid: s.customer_uuid,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    dueDate: s.due_date,
});

export class SaleRepository {
    private supabase = createClient();

    async getAll(): Promise<Sale[]> {
        const { data, error } = await this.supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async create(sale: Partial<Sale>): Promise<Sale> {
        const { data, error } = await this.supabase.from('sales').insert([sale]).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
}
