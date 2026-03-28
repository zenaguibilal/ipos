import { createClient } from "@/utils/supabase/server";
import type { ProductReturn } from "@/lib/types";
import { ProductRepository } from "./product.repository";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Return Repository (Autonomous Authority)
 * Enforces transactional reliability for stock reversals and ledger sync.
 */
export class ReturnRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private customerRepo = new CustomerRepository();

    async getAll(filters?: { query?: string; from?: string; to?: string }): Promise<ProductReturn[]> {
        let query = this.supabase
            .from('product_returns')
            .select('*, return_items(*)');

        if (filters?.from) query = query.gte('created_at', filters.from);
        if (filters?.to) query = query.lte('created_at', filters.to);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(`RETURNS_FETCH_FAILED`);
        
        let results = data.map(r => this.mapFromDb(r));

        if (filters?.query) {
            const q = filters.query.toLowerCase();
            results = results.filter(r => 
                r.originalInvoiceNumber.toLowerCase().includes(q) ||
                r.notes?.toLowerCase().includes(q)
            );
        }

        return results;
    }

    async create(returnData: any): Promise<ProductReturn> {
        const { data: ret, error: rErr } = await this.supabase
            .from('product_returns')
            .insert([{
                original_sale_uuid: returnData.originalSaleUuid,
                original_invoice_number: returnData.originalInvoiceNumber,
                total_return_value: returnData.totalReturnValue,
                amount_refunded: returnData.amountRefunded,
                customer_uuid: returnData.customerUuid,
                notes: returnData.notes,
            }])
            .select()
            .single();

        if (rErr) throw new Error(`RETURN_CREATION_FAILED`);

        const returnItems = returnData.items.map((item: any) => ({
            return_uuid: ret.uuid,
            product_uuid: item.productUuid,
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
            purchase_price: item.purchasePrice,
            was_restocked: item.wasRestocked,
        }));

        const { error: iErr } = await this.supabase.from('return_items').insert(returnItems);
        if (iErr) {
            await this.supabase.from('product_returns').delete().eq('uuid', ret.uuid);
            throw new Error("RETURN_ITEMS_PERSISTENCE_FAILED");
        }

        for (const item of returnItems) {
            if (item.was_restocked && item.product_uuid) {
                const productExists = await this.productRepo.findByUuid(item.product_uuid);
                if (productExists) {
                    await this.productRepo.updateStock(item.product_uuid, item.quantity, 'return', ret.uuid);
                }
            }
        }

        if (ret.customer_uuid) {
            await this.customerRepo.recalculateBalance(ret.customer_uuid);
        }

        return this.mapFromDb({ ...ret, return_items: returnItems });
    }

    async delete(uuid: string): Promise<void> {
        const { data: ret, error: fErr } = await this.supabase
            .from('product_returns')
            .select('*, return_items(*)')
            .eq('uuid', uuid)
            .single();
        
        if (fErr || !ret) throw new Error("RETURN_NOT_FOUND");

        for (const item of ret.return_items) {
            if (item.was_restocked && item.product_uuid) {
                const productExists = await this.productRepo.findByUuid(item.product_uuid);
                if (productExists) {
                    await this.productRepo.updateStock(item.product_uuid, -item.quantity, 'cancellation', uuid);
                }
            }
        }

        const { error: dErr } = await this.supabase.from('product_returns').delete().eq('uuid', uuid);
        if (dErr) throw new Error(`RETURN_DELETE_FAILED`);

        if (ret.customer_uuid) {
            await this.customerRepo.recalculateBalance(ret.customer_uuid);
        }
    }

    private mapFromDb(r: any): ProductReturn {
        return {
            uuid: r.uuid,
            user_id: r.user_id,
            originalSaleUuid: r.original_sale_uuid,
            originalInvoiceNumber: r.original_invoice_number,
            totalReturnValue: r.total_return_value,
            amountRefunded: r.amount_refunded,
            customerUuid: r.customer_uuid,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            notes: r.notes,
            items: r.return_items?.map((i: any) => ({
                productUuid: i.product_uuid,
                productName: i.product_name,
                quantity: i.quantity,
                price: i.price,
                purchasePrice: i.purchase_price,
                wasRestocked: i.was_restocked,
            })) || [],
        };
    }
}
