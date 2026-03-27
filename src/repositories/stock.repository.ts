import { createClient } from "@/utils/supabase/server";
import type { StockIntake } from "@/lib/types";
import { ProductRepository } from "./product.repository";
import { SupplierRepository } from "./supplier.repository";

/**
 * @fileOverview Stock Repository (Absolute Data Authority)
 * المسؤول عن توريد المخزون مع فرض التحقق الصارم من هوية المستخدم (RLS).
 */
export class StockRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private supplierRepo = new SupplierRepository();

    async create(intakeData: any): Promise<StockIntake> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        const { data: intake, error: sErr } = await this.supabase
            .from('stock_intakes')
            .insert([{
                user_id: user.id,
                supplier_uuid: intakeData.supplierUuid,
                invoice_number: intakeData.invoiceNumber,
                invoice_date: intakeData.invoiceDate,
                total_value: intakeData.totalValue,
                transport_fees: intakeData.transportFees || 0,
            }])
            .select()
            .single();

        if (sErr) throw new Error(`STOCK_INTAKE_FAILED: ${sErr.message}`);

        const intakeItems = intakeData.items.map((item: any) => ({
            user_id: user.id,
            intake_uuid: intake.uuid,
            product_uuid: item.productUuid,
            product_name: item.productName,
            quantity_received: item.quantityReceived,
            quantity_damaged: item.quantityDamaged || 0,
            purchase_price: item.purchasePrice,
            cost_price: item.costPrice,
        }));

        const { error: iErr } = await this.supabase.from('stock_intake_items').insert(intakeItems);
        if (iErr) throw new Error("STOCK_ITEMS_SYNC_FAILED");

        for (const item of intakeItems) {
            if (item.product_uuid) {
                const netQuantity = item.quantity_received - item.quantity_damaged;
                await this.productRepo.updateStock(item.product_uuid, netQuantity);
                
                await this.supabase.from('products').update({
                    purchase_price: item.purchase_price,
                    updated_at: new Date().toISOString()
                }).eq('uuid', item.product_uuid);
            }
        }

        if (intake.supplier_uuid) {
            await this.supplierRepo.recalculateBalance(intake.supplier_uuid);
        }

        return this.mapFromDb({ ...intake, stock_intake_items: intakeItems });
    }

    private mapFromDb(s: any): StockIntake {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            supplierUuid: s.supplier_uuid,
            invoiceNumber: s.invoice_number,
            invoiceDate: s.invoice_date,
            totalValue: s.total_value,
            transportFees: s.transport_fees || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            items: s.stock_intake_items?.map((i: any) => ({
                productUuid: i.product_uuid,
                productName: i.product_name,
                quantityReceived: i.quantity_received,
                quantityDamaged: i.quantity_damaged,
                purchasePrice: i.purchase_price,
                costPrice: i.cost_price,
            })) || [],
        };
    }
}
