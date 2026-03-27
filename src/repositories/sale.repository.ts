import { createClient } from "@/utils/supabase/server";
import type { Sale } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from "./product.repository";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Sale Repository (Absolute Data Authority)
 * المسؤول الحصري عن إنشاء المبيعات وضمان اتساق العمليات المالية والمخزنية.
 */
export class SaleRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private customerRepo = new CustomerRepository();

    async getAll(): Promise<Sale[]> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false });
        if (error) throw new Error(`SALE_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async create(saleData: any): Promise<Sale> {
        const now = new Date();
        const datePrefix = now.toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceNumber = `${datePrefix}-${randomSuffix}`;
        
        const saleUuid = uuidv4();
        
        const { data: sale, error: sErr } = await this.supabase
            .from('sales')
            .insert([{
                uuid: saleUuid,
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

        if (sErr) throw new Error(`SALE_CREATION_FAILED: ${sErr.message}`);

        const saleItems = saleData.items.map((item: any) => ({
            sale_uuid: saleUuid,
            product_uuid: item.productUuid || item.uuid,
            name: item.name,
            price: item.price,
            purchase_price: item.purchasePrice || 0,
            quantity: item.cartQuantity || item.quantity,
        }));

        const { error: iErr } = await this.supabase.from('sale_items').insert(saleItems);
        if (iErr) {
            await this.supabase.from('sales').delete().eq('uuid', saleUuid);
            throw new Error(`SALE_ITEMS_SYNC_FAILED: ${iErr.message}`);
        }

        return this.mapFromDb({ ...sale, sale_items: saleItems });
    }

    async findByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('customer_uuid', customerUuid)
            .order('created_at', { ascending: false });
        if (error) throw new Error(`SALE_FETCH_CUSTOMER_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async delete(uuid: string): Promise<void> {
        // 1. Fetch sale data before deletion
        const { data: sale, error: sErr } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('uuid', uuid)
            .single();
        
        if (sErr || !sale) throw new Error("SALE_NOT_FOUND_FOR_DELETION");

        // 2. Restore stock for each item
        for (const item of sale.sale_items) {
            if (item.product_uuid) {
                await this.productRepo.updateStock(item.product_uuid, item.quantity);
            }
        }

        // 3. Delete sale (cascades to items in DB)
        const { error: dErr } = await this.supabase.from('sales').delete().eq('uuid', uuid);
        if (dErr) throw new Error(`SALE_DELETE_FAILED: ${dErr.message}`);

        // 4. Recalculate customer balance
        if (sale.customer_uuid) {
            await this.customerRepo.recalculateBalance(sale.customer_uuid);
        }
    }

    private mapFromDb(s: any): Sale {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            invoiceNumber: s.invoice_number,
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
            items: s.sale_items?.map((item: any) => ({
                productUuid: item.product_uuid,
                name: item.name,
                price: item.price,
                purchasePrice: item.purchase_price,
                quantity: item.quantity
            })) || [],
        };
    }
}
