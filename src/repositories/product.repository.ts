import { createClient } from "@/utils/supabase/server";
import type { Product } from "@/lib/types";
import { calculateStockStatus } from "@/lib/utils";

const fromSupabase = (p: any): Product => ({
    uuid: p.uuid,
    user_id: p.user_id,
    name: p.name,
    category: p.category,
    price: p.price,
    purchasePrice: p.purchase_price,
    quantity: p.quantity,
    minStockLevel: p.min_stock_level,
    barcodes: p.barcodes || [],
    imageUrl: p.image_url,
    unite: p.unite,
    dateExpiration: p.date_expiration,
    supplierUuid: p.supplier_uuid,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    stockStatus: p.stock_status,
});

const toSupabase = (p: Partial<Product>) => ({
    uuid: p.uuid,
    user_id: p.user_id,
    name: p.name,
    category: p.category,
    price: p.price,
    purchase_price: p.purchasePrice,
    quantity: p.quantity,
    min_stock_level: p.minStockLevel,
    barcodes: p.barcodes,
    image_url: p.imageUrl,
    unite: p.unite,
    date_expiration: p.dateExpiration,
    supplier_uuid: p.supplierUuid,
    stock_status: p.stockStatus,
});

export class ProductRepository {
    private supabase = createClient();

    async getAll(): Promise<Product[]> {
        const { data, error } = await this.supabase.from('products').select('*').order('name');
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByUuid(uuid: string): Promise<Product | null> {
        const { data, error } = await this.supabase.from('products').select('*').eq('uuid', uuid).single();
        if (error) return null;
        return fromSupabase(data);
    }

    async create(product: Partial<Product>): Promise<Product> {
        const { data, error } = await this.supabase.from('products').insert([toSupabase(product)]).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async update(uuid: string, product: Partial<Product>): Promise<Product> {
        const status = product.quantity !== undefined ? calculateStockStatus(product.quantity, product.minStockLevel || 0) : undefined;
        const { data, error } = await this.supabase.from('products').update({ ...toSupabase(product), stock_status: status }).eq('uuid', uuid).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('products').delete().eq('uuid', uuid);
        if (error) throw error;
    }
}
