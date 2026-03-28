import { createClient } from "@/utils/supabase/server";
import type { StockIntake } from "@/lib/types";
import { ProductRepository } from "./product.repository";
import { SupplierRepository } from "./supplier.repository";

/**
 * @fileOverview Stock Repository (Absolute Data Authority)
 * المسؤول عن توريد المخزون مع فرض التحقق الصارم من هوية المستخدم (RLS).
 * تم تحديثه ليدعم إنشاء المنتجات الجديدة تلقائياً أثناء التوريد.
 */
export class StockRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private supplierRepo = new SupplierRepository();

    async getAll(filters?: { from?: string; to?: string; query?: string; supplierUuid?: string }): Promise<StockIntake[]> {
        let query = this.supabase.from('stock_intakes').select('*, stock_intake_items(*)');

        if (filters?.from) query = query.gte('invoice_date', filters.from);
        if (filters?.to) query = query.lte('invoice_date', filters.to);
        if (filters?.supplierUuid && filters.supplierUuid !== 'all') query = query.eq('supplier_uuid', filters.supplierUuid);

        const { data, error } = await query.order('invoice_date', { ascending: false });
        if (error) throw new Error(`STOCK_FETCH_ERROR: ${error.message}`);
        
        let result = data.map(this.mapFromDb);

        if (filters?.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(i => 
                (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q))
            );
        }

        return result;
    }

    async create(intakeData: any): Promise<StockIntake> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        // 1. Create Intake Record
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

        const finalItems = [];

        // 2. Process Items (Create products if new, update stock if existing)
        for (const item of intakeData.items) {
            let productUuid = item.productUuid;

            if (!productUuid) {
                // Determine unit and category for new product
                const unit = item.unite || 'Pièce';
                const category = item.category || 'Non classé';
                const sellingPrice = item.price || (item.purchasePrice * 1.2);

                const newProd = await this.productRepo.create({
                    name: item.productName,
                    purchasePrice: item.purchasePrice,
                    price: sellingPrice,
                    quantity: item.quantityReceived - (item.quantityDamaged || 0),
                    unite: unit as any,
                    category: category,
                    supplierUuid: intake.supplier_uuid
                });
                productUuid = newProd.uuid;
            } else {
                const netQuantity = item.quantityReceived - (item.quantityDamaged || 0);
                await this.productRepo.updateStock(productUuid, netQuantity);
                
                await this.supabase.from('products').update({
                    purchase_price: item.purchasePrice,
                    updated_at: new Date().toISOString()
                }).eq('uuid', productUuid);
            }

            finalItems.push({
                user_id: user.id,
                intake_uuid: intake.uuid,
                product_uuid: productUuid,
                product_name: item.productName,
                quantity_received: item.quantityReceived,
                quantity_damaged: item.quantityDamaged || 0,
                purchase_price: item.purchasePrice,
                cost_price: item.costPrice,
            });
        }

        // 3. Insert Intake Items
        const { error: iErr } = await this.supabase.from('stock_intake_items').insert(finalItems);
        if (iErr) throw new Error("STOCK_ITEMS_SYNC_FAILED");

        // 4. Update Supplier Balance
        if (intake.supplier_uuid) {
            await this.supplierRepo.recalculateBalance(intake.supplier_uuid);
        }

        return this.mapFromDb({ ...intake, stock_intake_items: finalItems });
    }

    async delete(uuid: string): Promise<void> {
        const { data: intake, error: iErr } = await this.supabase
            .from('stock_intakes')
            .select('*, stock_intake_items(*)')
            .eq('uuid', uuid)
            .single();
        
        if (iErr || !intake) throw new Error("INTAKE_NOT_FOUND");

        for (const item of intake.stock_intake_items) {
            if (item.product_uuid) {
                const netReceived = item.quantity_received - item.quantity_damaged;
                await this.productRepo.updateStock(item.product_uuid, -netReceived);
            }
        }

        const { error: dErr } = await this.supabase.from('stock_intakes').delete().eq('uuid', uuid);
        if (dErr) throw new Error(`STOCK_INTAKE_DELETE_FAILED: ${dErr.message}`);

        if (intake.supplier_uuid) {
            await this.supplierRepo.recalculateBalance(intake.supplier_uuid);
        }
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
