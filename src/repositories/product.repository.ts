/**
 * @fileOverview Product Repository - DATA AUTHORITY
 */
import { createClient } from '@/utils/supabase/client';
import type { Product } from '@/lib/types';

export const productRepository = {
    async getAll() {
        const supabase = createClient();
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) throw error;
        return data;
    },
    async create(product: Partial<Product>) {
        const supabase = createClient();
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (error) throw error;
        return data;
    },
    async update(uuid: string, product: Partial<Product>) {
        const supabase = createClient();
        const { data, error } = await supabase.from('products').update(product).eq('uuid', uuid).select().single();
        if (error) throw error;
        return data;
    },
    async delete(uuid: string) {
        const supabase = createClient();
        const { error } = await supabase.from('products').delete().eq('uuid', uuid);
        if (error) throw error;
    }
};
