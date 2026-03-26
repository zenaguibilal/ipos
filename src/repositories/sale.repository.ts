'use client';

import { createClient } from "@/utils/supabase/client";
import type { Sale } from "@/lib/types";

const fromSupabase = (sale: any): Sale => sale ? ({
    uuid: sale.uuid,
    user_id: sale.user_id,
    invoiceNumber: sale.invoice_number,
    subtotal: sale.subtotal,
    discountType: sale.discount_type,
    discountAmount: sale.discount_amount,
    total: sale.total,
    amountPaid: sale.amount_paid,
    remainingBalance: sale.remaining_balance,
    paymentStatus: sale.payment_status,
    payments: sale.payments,
    customerUuid: sale.customer_uuid,
    createdAt: sale.created_at,
    updatedAt: sale.updated_at,
    dueDate: sale.due_date,
    items: sale.sale_items?.map((item: any) => ({
        productUuid: item.product_uuid,
        name: item.name,
        price: item.price,
        purchasePrice: item.purchase_price,
        quantity: item.quantity
    })) || []
}) : ({} as Sale);


class SaleRepository {
    private supabase = createClient();
    
    private get baseQuery() {
        return this.supabase.from('sales').select(`
            *,
            sale_items (
                product_uuid,
                name,
                price,
                purchase_price,
                quantity
            )
        `);
    }

    async getAll(): Promise<Sale[]> {
        const { data, error } = await this.baseQuery.order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async findByUuid(uuid: string): Promise<Sale | undefined> {
        const { data, error } = await this.baseQuery.eq('uuid', uuid).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async findByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        const { data, error } = await this.baseQuery.eq('invoice_number', invoiceNumber).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }

    async findByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        const { data, error } = await this.baseQuery.eq('customer_uuid', customerUuid).order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async findUnpaidByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        const { data, error } = await this.baseQuery
            .eq('customer_uuid', customerUuid)
            .neq('payment_status', 'paid')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async filter(filters: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        const { data, error } = await this.supabase.rpc('search_sales', {
            p_search_query: filters.query || null,
            p_from_date: filters.from?.toISOString() || null,
            p_to_date: filters.to?.toISOString() || null,
        });
        
        if (error) throw error;
        
        const saleUuids = data.map((s: any) => s.uuid);
        if (saleUuids.length === 0) return [];
        
        const { data: salesWithItems, error: itemsError } = await this.baseQuery.in('uuid', saleUuids);

        if (itemsError) throw itemsError;

        return salesWithItems.map(fromSupabase);
    }

    async add(sale: Sale): Promise<Sale> {
        const { items, ...saleData } = sale;
        const { data: newSale, error: saleError } = await this.supabase.from('sales').insert({
            uuid: saleData.uuid,
            user_id: saleData.user_id,
            invoice_number: saleData.invoiceNumber,
            subtotal: saleData.subtotal,
            discount_type: saleData.discountType,
            discount_amount: saleData.discountAmount,
            total: saleData.total,
            amount_paid: saleData.amountPaid,
            remaining_balance: saleData.remainingBalance,
            payment_status: saleData.paymentStatus,
            payments: saleData.payments,
            customer_uuid: saleData.customerUuid,
            created_at: saleData.createdAt,
            updated_at: saleData.updatedAt,
            due_date: saleData.dueDate,
        }).select().single();

        if (saleError) throw saleError;
        
        const saleItems = items.map(item => ({
            sale_uuid: newSale.uuid,
            product_uuid: item.productUuid,
            name: item.name,
            price: item.price,
            purchase_price: item.purchasePrice,
            quantity: item.quantity,
        }));

        const { error: itemsError } = await this.supabase.from('sale_items').insert(saleItems);
        if (itemsError) {
            // Attempt to roll back the sale if items fail to insert
            await this.supabase.from('sales').delete().eq('uuid', newSale.uuid);
            throw itemsError;
        }

        return fromSupabase({ ...newSale, sale_items: items });
    }

    async delete(uuid: string): Promise<void> {
        // Deleting the sale will also delete sale_items due to CASCADE constraint
        const { error } = await this.supabase.from('sales').delete().eq('uuid', uuid);
        if (error) throw error;
    }
    
    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('sales').delete().eq('user_id', userId);
        if (error) throw error;
    }
    
    async bulkUpsert(sales: Sale[]): Promise<void> {
        const saleRecords = sales.map(({ items, ...saleData }) => ({
            uuid: saleData.uuid,
            user_id: saleData.user_id,
            invoice_number: saleData.invoiceNumber,
            subtotal: saleData.subtotal,
            discount_type: saleData.discountType,
            discount_amount: saleData.discountAmount,
            total: saleData.total,
            amount_paid: saleData.amountPaid,
            remaining_balance: saleData.remainingBalance,
            payment_status: saleData.paymentStatus,
            payments: saleData.payments,
            customer_uuid: saleData.customerUuid,
            created_at: saleData.createdAt,
            updated_at: saleData.updatedAt,
            due_date: saleData.dueDate,
        }));
        
        const { error: saleError } = await this.supabase.from('sales').upsert(saleRecords);
        if (saleError) throw saleError;
        
        const allSaleItems = sales.flatMap(sale => 
            sale.items.map(item => ({
                sale_uuid: sale.uuid,
                product_uuid: item.productUuid,
                name: item.name,
                price: item.price,
                purchase_price: item.purchasePrice,
                quantity: item.quantity,
            }))
        );

        if (allSaleItems.length > 0) {
            const { error: itemsError } = await this.supabase.from('sale_items').upsert(allSaleItems);
            if (itemsError) throw itemsError;
        }
    }

    async count(): Promise<number> {
        const { count, error } = await this.supabase.from('sales').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    }
}

export const saleRepository = new SaleRepository();
