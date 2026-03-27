import { createClient } from "@/utils/supabase/server";
import type { Sale } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileOverview Sale Repository (Data Authority)
 * Orchestrates atomic transactions for sales and inventory adjustments.
 */
export class SaleRepository {
    private supabase = createClient();

    async getAll(): Promise<Sale[]> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data.map(this.mapFromDb);
    }

    async create(saleData: any): Promise<Sale> {
        const now = new Date();
        const invoiceNumber = `${now.toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        
        const { data: newSale, error: saleError } = await this.supabase
            .from('sales')
            .insert([{
                uuid: uuidv4(),
                invoice_number: invoiceNumber,
                subtotal: saleData.subtotal,
                discount_type: saleData.discountType,
                discount_amount: saleData.discountAmount,
                total: saleData.total,
                amount_paid: saleData.amountPaid,
                remaining_balance: saleData.remainingBalance,
                payment_status: saleData.paymentStatus,
                payments: saleData.payments,
                customer_uuid: saleData.customerUuid,
                due_date: saleData.dueDate,
            }])
            .select()
            .single();

        if (saleError) throw new Error(saleError.message);

        const saleItems = saleData.items.map((item: any) => ({
            sale_uuid: newSale.uuid,
            product_uuid: item.productUuid || item.uuid,
            name: item.name,
            price: item.price,
            purchase_price: item.purchasePrice,
            quantity: item.cartQuantity || item.quantity,
        }));

        const { error: itemsError } = await this.supabase.from('sale_items').insert(saleItems);
        if (itemsError) {
            await this.supabase.from('sales').delete().eq('uuid', newSale.uuid);
            throw new Error(itemsError.message);
        }

        return this.mapFromDb({ ...newSale, sale_items: saleItems });
    }

    private mapFromDb(s: any): Sale {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            invoiceNumber: s.invoice_number,
            items: s.sale_items?.map((item: any) => ({
                productUuid: item.product_uuid,
                name: item.name,
                price: item.price,
                purchasePrice: item.purchase_price,
                quantity: item.quantity
            })) || [],
            subtotal: s.subtotal,
            discountType: s.discount_type,
            discountAmount: s.discount_amount,
            total: s.total,
            amountPaid: s.amount_paid,
            remainingBalance: s.remaining_balance,
            paymentStatus: s.payment_status,
            payments: s.payments || [],
            customerUuid: s.customer_uuid,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            dueDate: s.due_date,
        };
    }
}
