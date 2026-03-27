import { createClient } from "@/utils/supabase/server";
import type { Supplier } from "@/lib/types";

/**
 * @fileOverview Supplier Repository (Absolute Data Authority)
 * المصدر السيادي لبيانات الموردين وموازينهم المالية.
 */
export class SupplierRepository {
    private supabase = createClient();

    async getAll(): Promise<Supplier[]> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw new Error(`SUPPLIER_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async findByUuid(uuid: string): Promise<Supplier | null> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .select('*')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async create(supplier: Partial<Supplier>): Promise<Supplier> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .insert([{
                name: supplier.name,
                contact_person: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                balance: 0
            }])
            .select()
            .single();
        if (error) throw new Error(`SUPPLIER_CREATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    /**
     * إعادة حساب مديونية المورد بشكل حتمي بناءً على المشتريات والمدفوعات.
     */
    async recalculateBalance(uuid: string): Promise<void> {
        const { data: intakes, error: iErr } = await this.supabase.from('stock_intakes').select('total_value').eq('supplier_uuid', uuid);
        const { data: payments, error: pErr } = await this.supabase.from('supplier_payments').select('amount').eq('supplier_uuid', uuid);

        if (iErr || pErr) throw new Error("SUPPLIER_BALANCE_AUTHORITY_ERROR");

        const totalBought = intakes?.reduce((sum, i) => sum + i.total_value, 0) || 0;
        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        await this.supabase.from('suppliers').update({
            balance: Math.max(0, totalBought - totalPaid),
            updated_at: new Date().toISOString()
        }).eq('uuid', uuid);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('suppliers').delete().eq('uuid', uuid);
        if (error) throw new Error(`SUPPLIER_DELETE_FAILURE: ${error.message}`);
    }

    private mapFromDb(s: any): Supplier {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            name: s.name,
            contactPerson: s.contact_person,
            phone: s.phone,
            email: s.email,
            address: s.address,
            balance: s.balance || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        };
    }
}
