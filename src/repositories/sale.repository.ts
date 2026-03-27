import { createClient } from "@/utils/supabase/server";
import type { Sale } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileOverview Sale Repository (Absolute Data Authority)
 * المسؤول الحصري عن إنشاء المبيعات وضمان اتساق العمليات المالية والمخزنية.
 */
export class SaleRepository {
    private supabase = createClient();

    async create(saleData: any): Promise<Sale> {
        // حتمية رقم الفاتورة: يتم إنشاؤه في الخادم لضمان عدم التكرار
        const now = new Date();
        const invoiceNumber = `${now.toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const saleUuid = uuidv4();
        
        // 1. تسجيل الفاتورة
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

        // 2. تسجيل العناصر (Atomic batch)
        const saleItems = saleData.items.map((item: any) => ({
            sale_uuid: saleUuid,
            product_uuid: item.productUuid || item.uuid,
            name: item.name,
            price: item.price,
            purchase_price: item.purchasePrice,
            quantity: item.cartQuantity || item.quantity,
        }));

        const { error: iErr } = await this.supabase.from('sale_items').insert(saleItems);
        if (iErr) {
            // Rollback (Manual since we are not in a full DB transaction block here)
            await this.supabase.from('sales').delete().eq('uuid', saleUuid);
            throw new Error(`SALE_ITEMS_SYNC_FAILED: ${iErr.message}`);
        }

        return this.mapFromDb({ ...sale, sale_items: saleItems });
    }

    async getByUuid(uuid: string): Promise<Sale | null> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
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
