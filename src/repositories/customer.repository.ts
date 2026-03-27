import { createClient } from "@/utils/supabase/server";
import type { Customer } from "@/lib/types";

/**
 * @fileOverview Customer Repository (Data Authority)
 * Absolute truth for customer records and financial standing.
 */
export class CustomerRepository {
    private supabase = createClient();

    async getAll(): Promise<Customer[]> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .order('last_name');
        if (error) throw new Error(error.message);
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

    async findByName(searchName: string): Promise<Customer | null> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('search_name', searchName.toLowerCase().trim())
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async create(customer: Partial<Customer>): Promise<Customer> {
        const searchName = `${customer.firstName} ${customer.lastName}`.toLowerCase().trim();
        const { data, error } = await this.supabase
            .from('customers')
            .insert([{ ...this.mapToDb(customer), search_name: searchName }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return this.mapFromDb(data);
    }

    async update(uuid: string, customer: Partial<Customer>): Promise<Customer> {
        const { data, error } = await this.supabase
            .from('customers')
            .update(this.mapToDb(customer))
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().eq('uuid', uuid);
        if (error) throw new Error(error.message);
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
            notes: c.notes,
            category: c.category,
            creditLimit: c.credit_limit || 0,
            totalSpent: c.total_spent || 0,
            outstandingBalance: c.outstanding_balance || 0,
            lastActivityDate: c.last_activity_date,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
        };
    }

    private mapToDb(c: Partial<Customer>) {
        return {
            first_name: c.firstName,
            last_name: c.lastName,
            phone: c.phone,
            address: c.address,
            notes: c.notes,
            category: c.category,
            credit_limit: c.creditLimit,
        };
    }
}
