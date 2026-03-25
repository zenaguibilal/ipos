'use client';

import { createClient } from "@/utils/supabase/client";
import type { StockIntake, Supplier } from "@/lib/types";

const fromSupabase = (intake: any): StockIntake => ({
    uuid: intake.uuid,
    user_id: intake.user_id,
    supplierUuid: intake.supplier_uuid,
    invoiceNumber: intake.invoice_number,
    invoiceDate: intake.invoice_date,
    totalValue: intake.total_value,
    createdAt: intake.created_at,
    updatedAt: intake.updated_at,
    items: intake.stock_intake_items?.map((item: any) => ({
        productUuid: item.product_uuid,
        productName: item.product_name,
        quantityReceived: item.quantity_received,
        quantityDamaged: item.quantity_damaged,
        purchasePrice: item.purchase_price,
    })) || []
});


class StockRepository {
    private supabase = createClient();

    private get baseQuery() {
        return this.supabase.from('stock_intakes').select(`
            *,
            stock_intake_items (
                product_uuid,
                product_name,
                quantity_received,
                quantity_damaged,
                purchase_price
            )
        `);
    }

    async getAll(): Promise<StockIntake[]> {
        const { data, error } = await this.baseQuery;
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async filter(filters: { invoiceNumberQuery?: string; supplierUuids?: string[]; from?: Date; to?: Date }): Promise<StockIntake[]> {
        let query = this.baseQuery.order('created_at', { ascending: false });

        if (filters.invoiceNumberQuery || filters.supplierUuids) {
            const orConditions = [];
            if (filters.invoiceNumberQuery) {
                orConditions.push(`invoice_number.ilike.%${filters.invoiceNumberQuery}%`);
            }
            if (filters.supplierUuids && filters.supplierUuids.length > 0) {
                orConditions.push(`supplier_uuid.in.("${filters.supplierUuids.join('","')}")`);
            }
            if (orConditions.length > 0) {
                query = query.or(orConditions.join(','));
            }
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
    
    async add(intake: StockIntake): Promise<StockIntake> {
        const { items, ...intakeData } = intake;

        const { data: newIntake, error: intakeError } = await this.supabase.from('stock_intakes').insert({
            uuid: intakeData.uuid,
            user_id: intakeData.user_id,
            supplier_uuid: intakeData.supplierUuid,
            invoice_number: intakeData.invoiceNumber,
            invoice_date: intakeData.invoiceDate,
            total_value: intakeData.totalValue,
            created_at: intakeData.createdAt,
            updated_at: intakeData.updatedAt,
        }).select().single();

        if (intakeError) throw intakeError;
        
        const intakeItems = items.map(item => ({
            intake_uuid: newIntake.uuid,
            product_uuid: item.productUuid,
            product_name: item.productName,
            quantity_received: item.quantityReceived,
            quantity_damaged: item.quantityDamaged,
            purchase_price: item.purchasePrice,
        }));

        const { error: itemsError } = await this.supabase.from('stock_intake_items').insert(intakeItems);
        if (itemsError) {
            await this.supabase.from('stock_intakes').delete().eq('uuid', newIntake.uuid);
            throw itemsError;
        }

        return fromSupabase({ ...newIntake, stock_intake_items: items });
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('stock_intakes').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(intakes: StockIntake[]): Promise<void> {
        const intakeRecords = intakes.map(({ items, ...intakeData }) => ({
            uuid: intakeData.uuid,
            user_id: intakeData.user_id,
            supplier_uuid: intakeData.supplierUuid,
            invoice_number: intakeData.invoiceNumber,
            invoice_date: intakeData.invoiceDate,
            total_value: intakeData.totalValue,
            created_at: intakeData.createdAt,
            updated_at: intakeData.updatedAt,
        }));

        const { error: intakeError } = await this.supabase.from('stock_intakes').upsert(intakeRecords);
        if (intakeError) throw intakeError;

        const allIntakeItems = intakes.flatMap(intake => 
            intake.items.map(item => ({
                intake_uuid: intake.uuid,
                product_uuid: item.productUuid,
                product_name: item.productName,
                quantity_received: item.quantityReceived,
                quantity_damaged: item.quantityDamaged,
                purchase_price: item.purchasePrice,
            }))
        );
        
        if (allIntakeItems.length > 0) {
            const { error: itemsError } = await this.supabase.from('stock_intake_items').upsert(allIntakeItems);
            if (itemsError) throw itemsError;
        }
    }
}

export const stockRepository = new StockRepository();
