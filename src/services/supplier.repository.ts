'use client';

import { createClient } from "@/utils/supabase/client";
import type { Supplier } from "@/lib/types";

const fromSupabase = (supplier: any): Supplier => supplier ? ({
    uuid: supplier.uuid,
    user_id: supplier.user_id,
    name: supplier.name,
    contactPerson: supplier.contact_person,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    balance: supplier.balance,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
}) : ({} as Supplier);

const toSupabase = (supplier: Partial<Supplier>) => ({
    uuid: supplier.uuid,
    user_id: supplier.user_id,
    name: supplier.name,
    contact_person: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    balance: supplier.balance,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
});


class SupplierRepository {
    private supabase = createClient();

    async getAll(): Promise<Supplier[]> {
        const { data, error } = await this.supabase.from('suppliers').select('*');
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByUuid(uuid: string): Promise<Supplier | undefined> {
        const { data, error } = await this.supabase.from('suppliers').select('*').eq('uuid', uuid).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async findByName(name: string): Promise<Supplier | undefined> {
        const { data, error } = await this.supabase.from('suppliers').select('*').eq('name', name).single();
         if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async filterByName(query: string): Promise<Supplier[]> {
        const { data, error } = await this.supabase.from('suppliers').select('*').ilike('name', `%${query}%`);
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async add(supplier: Supplier): Promise<Supplier> {
        const { data, error } = await this.supabase.from('suppliers').insert(toSupabase(supplier)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async update(uuid: string, supplierData: Partial<Supplier>): Promise<Supplier> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .update(toSupabase(supplierData))
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('suppliers').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(suppliers: Supplier[]): Promise<void> {
        const { error } = await this.supabase.from('suppliers').upsert(suppliers.map(toSupabase));
        if (error) throw error;
    }
}

export const supplierRepository = new SupplierRepository();
