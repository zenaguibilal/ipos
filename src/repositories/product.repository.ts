
'use client';

import { createClient } from "@/utils/supabase/client";
import type { Product } from "@/lib/types";

// Helper to convert DB snake_case to app camelCase
const fromSupabase = (product: any): Product => product ? ({
    uuid: product.uuid,
    user_id: product.user_id,
    name: product.name,
    category: product.category,
    price: product.price,
    purchasePrice: product.purchase_price,
    quantity: product.quantity,
    minStockLevel: product.min_stock_level,
    barcodes: product.barcodes,
    imageUrl: product.image_url,
    unite: product.unite,
    dateExpiration: product.date_expiration,
    supplierUuid: product.supplier_uuid,
    dateMajPrix: product.date_maj_prix,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    stockStatus: product.stock_status,
}) : ({} as Product);

// Helper to convert app camelCase to DB snake_case
const toSupabase = (product: Partial<Product>) => ({
    uuid: product.uuid,
    user_id: product.user_id,
    name: product.name,
    category: product.category,
    price: product.price,
    purchase_price: product.purchasePrice,
    quantity: product.quantity,
    min_stock_level: product.minStockLevel,
    barcodes: product.barcodes,
    image_url: product.imageUrl,
    unite: product.unite,
    date_expiration: product.dateExpiration,
    supplier_uuid: product.supplierUuid,
    date_maj_prix: product.dateMajPrix,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    stock_status: product.stockStatus,
});


class ProductRepository {
    private supabase = createClient();

    async getAll(options?: { sortBy?: string }): Promise<Product[]> {
        let query = this.supabase.from('products').select('*');
        if (options?.sortBy) {
             const [field, order] = options.sortBy.split('_');
             query = query.order(field, { ascending: order === 'asc' });
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByUuid(uuid: string): Promise<Product | undefined> {
        const { data, error } = await this.supabase.from('products').select('*').eq('uuid', uuid).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async findByBarcode(barcode: string): Promise<Product | undefined> {
        const { data, error } = await this.supabase.from('products').select('*').contains('barcodes', [barcode]).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async filter(filters: any): Promise<Product[]> {
        let query = this.supabase.from('products').select('*');

        if (filters.query) {
            query = query.or(`name.ilike.%${filters.query}%,barcodes.cs.{${filters.query}}`);
        }
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters.supplierUuid && filters.supplierUuid !== 'all') {
            query = query.eq('supplier_uuid', filters.supplierUuid);
        }
        
        if (filters.stockStatus && filters.stockStatus !== 'all') {
            const status = filters.stockStatus;
            if (['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
                query = query.eq('stock_status', status);
            } else if (status === 'expired') {
                query = query.lt('date_expiration', new Date().toISOString()).not('date_expiration', 'is', null);
            } else if (status === 'expiring_soon') {
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                query = query.gte('date_expiration', now.toISOString());
                query = query.lte('date_expiration', thirtyDaysFromNow.toISOString());
            }
        }

        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split('_');
            const isAsc = order === 'asc';
            
            const columnMap: { [key: string]: string } = {
                name: 'name',
                price: 'price',
                quantity: 'quantity',
                createdAt: 'created_at',
                dateExpiration: 'date_expiration',
            };
            const dbField = columnMap[field] || 'created_at';
            
            if (dbField === 'date_expiration') {
                 query = query.order(dbField, { ascending: isAsc, nullsFirst: false });
            } else {
                query = query.order(dbField, { ascending: isAsc });
            }
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async getUniqueCategories(): Promise<string[]> {
        const { data, error } = await this.supabase.rpc('get_unique_product_categories');
        if (error) throw error;
        return data || [];
    }
    
    async add(product: Product): Promise<Product> {
        const { data, error } = await this.supabase.from('products').insert(toSupabase(product)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async update(uuid: string, data: Partial<Product>): Promise<Product> {
        const { data: updatedData, error } = await this.supabase.from('products').update(toSupabase(data)).eq('uuid', uuid).select().single();
        if (error) throw error;
        return fromSupabase(updatedData);
    }
    
    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('products').delete().eq('uuid', uuid);
        if (error) throw error;
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('products').delete().in('uuid', uuids);
        if (error) throw error;
    }
    
    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('products').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async getManyByUuids(uuids: string[]): Promise<Product[]> {
        const { data, error } = await this.supabase.from('products').select('*').in('uuid', uuids);
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async bulkUpsert(products: Product[]): Promise<void> {
        const { error } = await this.supabase.from('products').upsert(products.map(toSupabase));
        if (error) throw error;
    }

    async count(): Promise<number> {
         const { count, error } = await this.supabase.from('products').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    }
}

export const productRepository = new ProductRepository();
