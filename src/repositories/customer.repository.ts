import { createClient } from "@/utils/supabase/server";
import type { Customer } from "@/lib/types";

const fromSupabase = (c: any): Customer => ({
    uuid: c.uuid,
    user_id: c.user_id,
    firstName: c.first_name,
    lastName: c.last_name,
    searchName: c.search_name,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
    category: c.category,
    creditLimit: c.credit_limit || 0,
    totalSpent: c.total_spent || 0,
    outstandingBalance: c.outstanding_balance || 0,
    lastActivityDate: c.last_activity_date,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    debtStatus: c.debt_status || 'none',
    isOverLimit: c.is_over_limit || false,
    isBreadClient: c.is_bread_client || false,
    bread_type_recurrence: c.bread_type_recurrence,
    bread_quantite_defaut: c.bread_quantite_defaut,
    bread_jours_semaine: c.bread_jours_semaine,
});

const toSupabase = (c: Partial<Customer>) => ({
    uuid: c.uuid,
    user_id: c.user_id,
    first_name: c.firstName,
    last_name: c.lastName,
    search_name: c.searchName,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
    category: c.category,
    credit_limit: c.creditLimit,
    total_spent: c.totalSpent,
    outstanding_balance: c.outstandingBalance,
    last_activity_date: c.lastActivityDate,
    debt_status: c.debtStatus,
    is_over_limit: c.isOverLimit,
    is_bread_client: c.isBreadClient,
    bread_type_recurrence: c.bread_type_recurrence,
    bread_quantite_defaut: c.bread_quantite_defaut,
    bread_jours_semaine: c.bread_jours_semaine,
});

export class CustomerRepository {
    private supabase = createClient();

    async getAll(): Promise<Customer[]> {
        const { data, error } = await this.supabase.from('customers').select('*').order('last_name');
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByUuid(uuid: string): Promise<Customer | null> {
        const { data, error } = await this.supabase.from('customers').select('*').eq('uuid', uuid).single();
        if (error) return null;
        return fromSupabase(data);
    }

    async create(customer: Partial<Customer>): Promise<Customer> {
        const { data, error } = await this.supabase.from('customers').insert([toSupabase(customer)]).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async update(uuid: string, customer: Partial<Customer>): Promise<Customer> {
        const { data, error } = await this.supabase.from('customers').update(toSupabase(customer)).eq('uuid', uuid).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().eq('uuid', uuid);
        if (error) throw error;
    }
}
