
import { createClient } from "@/utils/supabase/server";
import type { Sale } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from "./product.repository";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Sale Repository (Autonomous Sovereign Authority)
 * Fixed ARCH-01: Removed 'use client'.
 * Fixed QUAL-03: High-entropy invoice generation.
 */
export class SaleRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private customerRepo = new CustomerRepository();

    private generateInvoiceNumber(): string {
        const now = new Date();
        const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
        
        // QUAL-03: Cryptographically secure random values
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const randomPart = array[0].toString(16).toUpperCase().slice(-6);
        
        return `INV-${datePart}-${randomPart}`;
    }

    async getAll(): Promise<Sale[]> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false });
        if (error) throw new Error(`SALE_LEDGER_ACCESS_FAILED`);
        return data.map(this.mapFromDb);
    }

    async create(saleData: any): Promise<Sale> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const invoiceNumber = this.generateInvoiceNumber();
        const saleUuid = uuidv4();
        
        const { data: sale, error: sErr } = await this.supabase
            .from('sales')
            .insert([{
                uuid: saleUuid,
                user_id: user.id,
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

        if (sErr) throw new Error(`SALE_PERSISTENCE_FAILURE`);

        const saleItems = saleData.items.map((item: any) => ({
            user_id: user.id,
            sale_uuid: saleUuid,
            product_uuid: item.productUuid || null,
            name: item.name,
            price: item.price,
            purchase_price: item.purchasePrice || 0,
            quantity: item.cartQuantity || item.quantity,
        }));

        await this.supabase.from('sale_items').insert(saleItems);

        for (const item of saleItems) {
            if (item.product_uuid) {
                await this.productRepo.updateStock(item.product_uuid, -item.quantity, 'sale', saleUuid);
            }
        }

        if (saleData.customerUuid) {
            await this.customerRepo.recalculateBalance(saleData.customerUuid);
        }

        return this.mapFromDb({ ...sale, sale_items: saleItems });
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
