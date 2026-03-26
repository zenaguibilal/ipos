'use client';

import { createClient } from "@/utils/supabase/client";
import type { InventoryLog } from "@/lib/types";

const fromSupabase = (log: any): InventoryLog => ({
    uuid: log.uuid,
    user_id: log.user_id,
    productUuid: log.product_uuid,
    change: log.change,
    newQuantity: log.new_quantity,
    reason: log.reason,
    relatedUuid: log.related_uuid,
    createdAt: log.created_at,
});

const toSupabase = (log: InventoryLog) => ({
    uuid: log.uuid,
    user_id: log.user_id,
    product_uuid: log.productUuid,
    change: log.change,
    new_quantity: log.newQuantity,
    reason: log.reason,
    related_uuid: log.relatedUuid,
    created_at: log.createdAt,
});


class InventoryRepository {
    private supabase = createClient();

    async add(log: InventoryLog): Promise<InventoryLog> {
        const { data, error } = await this.supabase.from('inventory_logs').insert(toSupabase(log)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async getByProductUuid(productUuid: string): Promise<InventoryLog[]> {
        const { data, error } = await this.supabase
            .from('inventory_logs')
            .select('*')
            .eq('product_uuid', productUuid)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async hasLogs(productUuid: string): Promise<boolean> {
        const { count, error } = await this.supabase
            .from('inventory_logs')
            .select('*', { count: 'exact', head: true })
            .eq('product_uuid', productUuid);
        if (error) throw error;
        return (count ?? 0) > 0;
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('inventory_logs').delete().eq('user_id', userId);
        if (error) throw error;
    }
}

export const inventoryRepository = new InventoryRepository();
