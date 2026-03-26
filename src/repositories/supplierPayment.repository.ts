
'use client';

import { createClient } from "@/utils/supabase/client";
import type { SupplierPayment } from "@/lib/types";

const fromSupabase = (p: any): SupplierPayment => ({
    uuid: p.uuid,
    user_id: p.user_id,
    supplierUuid: p.supplier_uuid,
    amount: p.amount,
    paymentDate: p.payment_date,
    method: p.method,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
});

const toSupabase = (p: Partial<SupplierPayment>) => ({
    uuid: p.uuid,
    user_id: p.user_id,
    supplier_uuid: p.supplierUuid,
    amount: p.amount,
    payment_date: p.paymentDate,
    method: p.method,
    notes: p.notes,
    created_at: p.createdAt,
    updated_at: p.updated_at,
});

class SupplierPaymentRepository {
    private supabase = createClient();

    async getAll(): Promise<SupplierPayment[]> {
        const { data, error } = await this.supabase.from('supplier_payments').select('*').order('payment_date', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findBySupplierUuid(supplierUuid: string): Promise<SupplierPayment[]> {
        const { data, error } = await this.supabase
            .from('supplier_payments')
            .select('*')
            .eq('supplier_uuid', supplierUuid)
            .order('payment_date', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async add(payment: SupplierPayment): Promise<SupplierPayment> {
        const { data, error } = await this.supabase.from('supplier_payments').insert(toSupabase(payment)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('supplier_payments').delete().eq('uuid', uuid);
        if (error) throw error;
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('supplier_payments').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(payments: SupplierPayment[]): Promise<void> {
        const { error } = await this.supabase.from('supplier_payments').upsert(payments.map(toSupabase));
        if (error) throw error;
    }
}

export const supplierPaymentRepository = new SupplierPaymentRepository();
