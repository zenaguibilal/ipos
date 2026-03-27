import { createClient } from "@/utils/supabase/server";
import type { Customer } from "@/lib/types";

/**
 * @fileOverview Customer Repository (Absolute Data Authority)
 * المسؤول الوحيد عن صحة بيانات العملاء وحسابات مديونياتهم.
 */
export class CustomerRepository {
    private supabase = createClient();

    async getAll(): Promise<Customer[]> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .order('last_name', { ascending: true });
        if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async findByUuid(uuid: string): Promise<Customer | null> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async create(customer: Partial<Customer>): Promise<Customer> {
        const searchName = `${customer.firstName} ${customer.lastName}`.toLowerCase().trim();
        const { data, error } = await this.supabase
            .from('customers')
            .insert([{ 
                ...this.mapToDb(customer), 
                search_name: searchName,
                outstanding_balance: 0,
                total_spent: 0,
                debt_status: 'none'
            }])
            .select()
            .single();
        if (error) throw new Error(`CREATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    /**
     * إعادة حساب مديونية العميل بشكل حتمي بناءً على سجل العمليات فقط.
     */
    async recalculateBalance(uuid: string): Promise<void> {
        const { data: sales, error: sErr } = await this.supabase.from('sales').select('total, amount_paid').eq('customer_uuid', uuid);
        const { data: payments, error: pErr } = await this.supabase.from('payments').select('amount').eq('customer_uuid', uuid);
        const { data: returns, error: rErr } = await this.supabase.from('product_returns').select('total_return_value, amount_refunded').eq('customer_uuid', uuid);

        if (sErr || pErr || rErr) throw new Error("RECALCULATION_AUTHORITY_ERROR");

        const totalInvoiced = sales?.reduce((sum, s) => sum + s.total, 0) || 0;
        const totalPaidAtSales = sales?.reduce((sum, s) => sum + s.amount_paid, 0) || 0;
        const totalManualPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const totalReturnsValue = returns?.reduce((sum, r) => sum + r.total_return_value, 0) || 0;
        const totalRefunds = returns?.reduce((sum, r) => sum + r.amount_refunded, 0) || 0;

        const creditFromReturns = totalReturnsValue - totalRefunds;
        const currentBalance = totalInvoiced - totalPaidAtSales - totalManualPayments - creditFromReturns;

        await this.supabase.from('customers').update({
            outstanding_balance: Math.max(0, currentBalance),
            total_spent: totalInvoiced,
            last_activity_date: new Date().toISOString()
        }).eq('uuid', uuid);
    }

    async update(uuid: string, customer: Partial<Customer>): Promise<Customer> {
        const { data, error } = await this.supabase
            .from('customers')
            .update(this.mapToDb(customer))
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw new Error(`UPDATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().eq('uuid', uuid);
        if (error) throw new Error(`DELETE_FORBIDDEN: ${error.message}`);
    }

    private mapFromDb(c: any): Customer {
        return {
            uuid: c.uuid,
            user_id: c.user_id,
            firstName: c.first_name,
            lastName: c.last_name,
            searchName: c.search_name,
            phone: c.phone,
            address: c.address,
            category: c.category || 'Standard',
            creditLimit: c.credit_limit || 0,
            totalSpent: c.total_spent || 0,
            outstandingBalance: c.outstanding_balance || 0,
            lastActivityDate: c.last_activity_date,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            debtStatus: c.debt_status,
            isOverLimit: c.is_over_limit,
            isBreadClient: c.is_bread_client,
            bread_type_recurrence: c.bread_type_recurrence,
            bread_quantite_defaut: c.bread_quantite_defaut,
            bread_jours_semaine: c.bread_jours_semaine,
        };
    }

    private mapToDb(c: Partial<Customer>) {
        return {
            first_name: c.firstName,
            last_name: c.lastName,
            phone: c.phone,
            address: c.address,
            category: c.category,
            credit_limit: c.creditLimit,
            is_bread_client: c.isBreadClient,
            bread_type_recurrence: c.bread_type_recurrence,
            bread_quantite_defaut: c.bread_quantite_defaut,
            bread_jours_semaine: c.bread_jours_semaine,
        };
    }
}
