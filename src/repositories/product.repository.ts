import { createClient } from "@/utils/supabase/server";
import type { Product, InventoryLog } from "@/lib/types";
import { InventoryRepository } from "./inventory.repository";

/**
 * @fileOverview Product Repository (Absolute Data Authority)
 * المسؤول عن إدارة المنتجات وفرض التزامن مع سجلات حركة المخزون.
 */
export class ProductRepository {
    private supabase = createClient();

    private calculateStockStatus(quantity: number, minLevel: number): Product['stockStatus'] {
        if (quantity <= 0) return 'out_of_stock';
        if (quantity <= minLevel) return 'low_stock';
        return 'in_stock';
    }

    async getAll(filters?: { query?: string; category?: string; supplierUuid?: string }): Promise<Product[]> {
        let query = this.supabase.from('products').select('*');

        if (filters?.supplierUuid) {
            query = query.eq('supplier_uuid', filters.supplierUuid);
        }
        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters?.query) {
            query = query.ilike('name', `%${filters.query}%`);
        }

        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw new Error(`PRODUCT_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async getCategories(): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('products')
            .select('category')
            .not('category', 'is', null);
        
        if (error) throw new Error(`CATEGORIES_FETCH_ERROR: ${error.message}`);
        const cats = Array.from(new Set(data.map(i => i.category)));
        return cats.sort();
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
            .maybeSingle();
        
        if (error) throw new Error(`BARCODE_SEARCH_ERROR: ${error.message}`);
        return data ? this.mapFromDb(data) : null;
    }

    async updateStock(uuid: string, quantityChange: number, reason: InventoryLog['reason'], relatedUuid?: string): Promise<void> {
        const { data: product, error: fErr } = await this.supabase
            .from('products')
            .select('quantity, min_stock_level')
            .eq('uuid', uuid)
            .single();
        
        if (fErr || !product) throw new Error("PRODUCT_NOT_FOUND_FOR_STOCK_UPDATE");

        const newQuantity = product.quantity + quantityChange;
        const newStatus = this.calculateStockStatus(newQuantity, product.min_stock_level);

        const { error: uErr } = await this.supabase
            .from('products')
            .update({ 
                quantity: newQuantity, 
                stock_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid);
        
        if (uErr) throw new Error("STOCK_SYNC_FAILURE");

        // فرض التزامن: تسجيل الحركة في سجل المخزون
        const inventoryRepo = new InventoryRepository();
        await inventoryRepo.add({
            productUuid: uuid,
            change: quantityChange,
            newQuantity: newQuantity,
            reason: reason,
            relatedUuid: relatedUuid
        });
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('products').delete().in('uuid', uuids);
        if (error) throw new Error(`PRODUCT_BULK_DELETE_FAILURE: ${error.message}`);
    }

    async create(product: Partial<Product>): Promise<Product> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        const quantity = product.quantity || 0;
        const minLevel = product.minStockLevel || 10;
        const status = this.calculateStockStatus(quantity, minLevel);

        const { data, error } = await this.supabase
            .from('products')
            .insert([{
                ...this.mapToDb(product),
                user_id: user.id,
                stock_status: status
            }])
            .select()
            .single();
        
        if (error) throw new Error(`PRODUCT_CREATE_FAILURE: ${error.message}`);

        // إذا تم إنشاء المنتج برصيد مخزني، نسجل ذلك كحركة تعديل يدوي
        if (quantity > 0) {
            const inventoryRepo = new InventoryRepository();
            await inventoryRepo.add({
                productUuid: data.uuid,
                change: quantity,
                newQuantity: quantity,
                reason: 'manual_adjustment'
            });
        }

        return this.mapFromDb(data);
    }

    async update(uuid: string, product: Partial<Product>): Promise<Product> {
        const { data: existing } = await this.supabase.from('products').select('quantity, min_stock_level').eq('uuid', uuid).single();
        
        const updatedQty = product.quantity !== undefined ? product.quantity : existing.quantity;
        const updatedMin = product.minStockLevel !== undefined ? product.minStockLevel : existing.min_stock_level;
        const newStatus = this.calculateStockStatus(updatedQty, updatedMin);

        const { data, error } = await this.supabase
            .from('products')
            .update({
                ...this.mapToDb(product),
                stock_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw new Error(`PRODUCT_UPDATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('products').delete().eq('uuid', uuid);
        if (error) throw new Error(`PRODUCT_DELETE_FAILURE: ${error.message}`);
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
            min_stock_level: p.min_stock_level,
            barcodes: p.barcodes,
            image_url: p.imageUrl,
            unite: p.unite,
            date_expiration: p.dateExpiration,
            supplier_uuid: p.supplierUuid,
        };
    }
}
