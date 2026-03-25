'use client';

import { createClient } from "@/utils/supabase/client";
import type { Payment } from "@/lib/types";

const fromSupabase = (payment: any): Payment => ({
    uuid: payment.uuid,
    user_id: payment.user_id,
    customerUuid: payment.customer_uuid,
    amount: payment.amount,
    paymentDate: payment.payment_date,
    notes: payment.notes,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
});

const toSupabase = (payment: Payment) => ({
    uuid: payment.uuid,
    user_id: payment.user_id,
    customer_uuid: payment.customerUuid,
    amount: payment.amount,
    payment_date: payment.paymentDate,
    notes: payment.notes,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
});


class PaymentRepository {
    private supabase = createClient();

    async getAll(): Promise<Payment[]> {
        const { data, error } = await this.supabase.from('payments').select('*');
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        const { data, error } = await this.supabase.from('payments').select('*').eq('customer_uuid', customerUuid).order('payment_date', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async add(payment: Payment): Promise<Payment> {
        const { data, error } = await this.supabase.from('payments').insert(toSupabase(payment)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('payments').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(payments: Payment[]): Promise<void> {
        const { error } = await this.supabase.from('payments').upsert(payments.map(toSupabase));
        if (error) throw error;
    }
}

export const paymentRepository = new PaymentRepository();
