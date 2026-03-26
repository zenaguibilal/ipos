'use client';

import { createClient } from "@/utils/supabase/client";
import type { Customer } from "@/lib/types";

// Helper to convert DB snake_case to app camelCase
const fromSupabase = (customer: any): Customer => customer ? ({
    uuid: customer.uuid,
    user_id: customer.user_id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    searchName: customer.search_name,
    phone: customer.phone,
    address: customer.address,
    settlementDay: customer.settlement_day,
    creditLimit: customer.credit_limit,
    totalSpent: customer.total_spent,
    outstandingBalance: customer.outstanding_balance,
    lastActivityDate: customer.last_activity_date,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
    debtStatus: customer.debt_status,
    isOverLimit: customer.is_over_limit,
    isBreadClient: customer.is_bread_client,
    bread_type_recurrence: customer.bread_type_recurrence,
    bread_quantite_defaut: customer.bread_quantite_defaut,
    bread_jours_semaine: customer.bread_jours_semaine,
}) : ({} as Customer);

// Helper to convert app camelCase to DB snake_case
const toSupabase = (customer: Partial<Customer>) => ({
    uuid: customer.uuid,
    user_id: customer.user_id,
    first_name: customer.firstName,
    last_name: customer.lastName,
    search_name: customer.searchName,
    phone: customer.phone,
    address: customer.address,
    settlement_day: customer.settlementDay,
    credit_limit: customer.creditLimit,
    total_spent: customer.totalSpent,
    outstanding_balance: customer.outstandingBalance,
    last_activity_date: customer.lastActivityDate,
    created_at: customer.createdAt,
    updated_at: customer.updated_at,
    debt_status: customer.debtStatus,
    is_over_limit: customer.isOverLimit,
    is_bread_client: customer.isBreadClient,
    bread_type_recurrence: customer.bread_type_recurrence,
    bread_quantite_defaut: customer.bread_quantite_defaut,
    bread_jours_semaine: customer.bread_jours_semaine,
});


class CustomerRepository {
    private supabase = createClient();

    async getAll(): Promise<Customer[]> {
        const { data, error } = await this.supabase.from('customers').select('*');
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async findByUuid(uuid: string): Promise<Customer | undefined> {
        const { data, error } = await this.supabase.from('customers').select('*').eq('uuid', uuid).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116: single row not found
        return data ? fromSupabase(data) : undefined;
    }

    async findByName(searchName: string): Promise<Customer | undefined> {
        const { data, error } = await this.supabase.from('customers').select('*').eq('search_name', searchName).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async filter(filters: { query?: string; status?: string }): Promise<Customer[]> {
        let query = this.supabase.from('customers').select('*').order('created_at', { ascending: false });

        if (filters.query) {
            query = query.ilike('search_name', `%${filters.query}%`);
        }
        if (filters.status) {
            if(filters.status === 'has_debt') query = query.gt('outstanding_balance', 0);
            if(filters.status === 'overdue') query = query.eq('debt_status', 'overdue');
            if(filters.status === 'over_limit') query = query.eq('is_over_limit', true);
            if(filters.status === 'is_bread_client') query = query.eq('is_bread_client', true);
            if(filters.status === 'is_manual_bread_client') query = query.eq('bread_type_recurrence', 'aucun');
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async add(customer: Customer): Promise<Customer> {
        const { data, error } = await this.supabase.from('customers').insert(toSupabase(customer)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async update(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        const { data, error } = await this.supabase.from('customers').update(toSupabase(customerData)).eq('uuid', uuid).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().eq('uuid', uuid);
        if (error) throw error;
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().in('uuid', uuids);
        if (error) throw error;
    }
    
    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(customers: Customer[]): Promise<void> {
        const { error } = await this.supabase.from('customers').upsert(customers.map(toSupabase));
        if (error) throw error;
    }

    async count(): Promise<number> {
        const { count, error } = await this.supabase.from('customers').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    }
}

export const customerRepository = new CustomerRepository();
