import { createClient } from "@/utils/supabase/server";
import type { ProductReturn } from "@/lib/types";
import { ProductRepository } from "./product.repository";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Return Repository (Absolute Data Authority)
 * يدير عمليات المرتجعات ويفرض تزامن المخزون ومديونية العميل.
 */
export class ReturnRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private customerRepo = new CustomerRepository();

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

        if (rErr) throw new Error(`RETURN_CREATION_FAILED: ${rErr.message}`);

        // تسجيل العناصر المرتجعة وتحديث المخزون
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
        if (iErr) throw new Error("RETURN_ITEMS_SYNC_FAILED");

        // أتمتة السلطة: تحديث المخزون وحساب مديونية العميل فوراً
        for (const item of returnItems) {
            if (item.was_restocked && item.product_uuid) {
                await this.productRepo.updateStock(item.product_uuid, item.quantity);
            }
        }

        if (ret.customer_uuid) {
            await this.customerRepo.recalculateBalance(ret.customer_uuid);
        }

        return this.mapFromDb({ ...ret, return_items: returnItems });
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
