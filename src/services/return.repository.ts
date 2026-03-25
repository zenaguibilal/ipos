'use client';

import { createClient } from "@/utils/supabase/client";
import type { ProductReturn } from "@/lib/types";

const fromSupabase = (pr: any): ProductReturn => ({
    uuid: pr.uuid,
    user_id: pr.user_id,
    originalSaleUuid: pr.original_sale_uuid,
    originalInvoiceNumber: pr.original_invoice_number,
    totalReturnValue: pr.total_return_value,
    amountRefunded: pr.amount_refunded,
    customerUuid: pr.customer_uuid,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    notes: pr.notes,
    items: pr.return_items?.map((item: any) => ({
        productUuid: item.product_uuid,
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price,
        purchasePrice: item.purchase_price,
        wasRestocked: item.was_restocked,
    })) || []
});

class ReturnRepository {
    private supabase = createClient();
    
    private get baseQuery() {
        return this.supabase.from('product_returns').select(`
            *,
            return_items (
                product_uuid,
                product_name,
                quantity,
                price,
                purchase_price,
                was_restocked
            )
        `);
    }
    
    async getAll(): Promise<ProductReturn[]> {
        const { data, error } = await this.baseQuery;
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByUuid(uuid: string): Promise<ProductReturn | undefined> {
        const { data, error } = await this.baseQuery.eq('uuid', uuid).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }
    
    async findByCustomerUuid(customerUuid: string): Promise<ProductReturn[]> {
        const { data, error } = await this.baseQuery.eq('customer_uuid', customerUuid).order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async filter(filters: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
        let query = this.baseQuery.order('created_at', { ascending: false });

        if (filters.query) {
             query = query.ilike('original_invoice_number', `%${filters.query}%`);
        }
        if (filters.from) {
            query = query.gte('created_at', filters.from.toISOString());
        }
        if (filters.to) {
            query = query.lte('created_at', filters.to.toISOString());
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async add(productReturn: ProductReturn): Promise<ProductReturn> {
        const { items, ...returnData } = productReturn;

        const { data: newReturn, error: returnError } = await this.supabase.from('product_returns').insert({
            uuid: returnData.uuid,
            user_id: returnData.user_id,
            original_sale_uuid: returnData.originalSaleUuid,
            original_invoice_number: returnData.originalInvoiceNumber,
            total_return_value: returnData.totalReturnValue,
            amount_refunded: returnData.amountRefunded,
            customer_uuid: returnData.customerUuid,
            created_at: returnData.createdAt,
            updated_at: returnData.updatedAt,
            notes: returnData.notes,
        }).select().single();
        
        if (returnError) throw returnError;

        const returnItems = items.map(item => ({
            return_uuid: newReturn.uuid,
            product_uuid: item.productUuid,
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
            purchase_price: item.purchasePrice,
            was_restocked: item.wasRestocked,
        }));

        const { error: itemsError } = await this.supabase.from('return_items').insert(returnItems);
        if (itemsError) {
            await this.supabase.from('product_returns').delete().eq('uuid', newReturn.uuid);
            throw itemsError;
        }

        return fromSupabase({ ...newReturn, return_items: items });
    }
    
    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('product_returns').delete().eq('uuid', uuid);
        if (error) throw error;
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('product_returns').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(returns: ProductReturn[]): Promise<void> {
        const returnRecords = returns.map(({ items, ...returnData }) => ({
            uuid: returnData.uuid,
            user_id: returnData.user_id,
            original_sale_uuid: returnData.originalSaleUuid,
            original_invoice_number: returnData.originalInvoiceNumber,
            total_return_value: returnData.totalReturnValue,
            amount_refunded: returnData.amountRefunded,
            customer_uuid: returnData.customerUuid,
            created_at: returnData.createdAt,
            updated_at: returnData.updatedAt,
            notes: returnData.notes,
        }));

        const { error: returnError } = await this.supabase.from('product_returns').upsert(returnRecords);
        if (returnError) throw returnError;

        const allReturnItems = returns.flatMap(pr => 
            pr.items.map(item => ({
                return_uuid: pr.uuid,
                product_uuid: item.productUuid,
                product_name: item.productName,
                quantity: item.quantity,
                price: item.price,
                purchase_price: item.purchasePrice,
                was_restocked: item.wasRestocked,
            }))
        );

        if (allReturnItems.length > 0) {
            const { error: itemsError } = await this.supabase.from('return_items').upsert(allReturnItems);
            if (itemsError) throw itemsError;
        }
    }
}

export const returnRepository = new ReturnRepository();
