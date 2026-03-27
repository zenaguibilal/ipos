import { createClient } from "@/utils/supabase/server";
import type { Product } from "@/lib/types";
import { calculateStockStatus } from "@/lib/utils";

/**
 * @fileOverview Product Repository (Data Authority)
 * Enforces strict server-side logic for product management.
 */
export class ProductRepository {
    private supabase = createClient();

    async getAll(): Promise<Product[]> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .order('name');
        if (error) throw new Error(error.message);
        return data.map(this.mapFromDb);
    }

    async findByUuid(uuid: string): Promise<Product | null> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async findByBarcode(barcode: string): Promise<Product | null> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .contains('barcodes', [barcode])
            .limit(1)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async create(product: Partial<Product>): Promise<Product> {
        const { data, error } = await this.supabase
            .from('products')
            .insert([this.mapToDb(product)])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return this.mapFromDb(data);
    }

    async update(uuid: string, product: Partial<Product>): Promise<Product> {
        const current = await this.findByUuid(uuid);
        if (!current) throw new Error("PRODUCT_NOT_FOUND");

        const nextQuantity = product.quantity !== undefined ? product.quantity : current.quantity;
        const nextMinStock = product.minStockLevel !== undefined ? product.minStockLevel : current.minStockLevel;
        const status = calculateStockStatus(nextQuantity, nextMinStock);

        const { data, error } = await this.supabase
            .from('products')
            .update({ ...this.mapToDb(product), stock_status: status })
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('products').delete().eq('uuid', uuid);
        if (error) throw new Error(error.message);
    }

    private mapFromDb(p: any): Product {
        return {
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
        };
    }

    private mapToDb(p: Partial<Product>) {
        return {
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
        };
    }
}
