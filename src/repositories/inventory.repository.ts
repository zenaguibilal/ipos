import { createClient } from "@/utils/supabase/server";
import type { InventoryLog } from "@/lib/types";

/**
 * @fileOverview Inventory Repository (Absolute Server Authority)
 */
export class InventoryRepository {
    private supabase = createClient();

    async getByProductUuid(productUuid: string): Promise<InventoryLog[]> {
        const { data, error } = await this.supabase
            .from('inventory_logs')
            .select('*')
            .eq('product_uuid', productUuid)
            .order('created_at', { ascending: false });
        
        if (error) throw new Error(`INVENTORY_FETCH_FAILED: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async add(log: Partial<InventoryLog>): Promise<void> {
        const { error } = await this.supabase
            .from('inventory_logs')
            .insert([{
                product_uuid: log.productUuid,
                change: log.change,
                new_quantity: log.newQuantity,
                reason: log.reason,
                related_uuid: log.relatedUuid,
            }]);
        
        if (error) throw new Error(`INVENTORY_LOG_FAILED: ${error.message}`);
    }

    private mapFromDb(l: any): InventoryLog {
        return {
            uuid: l.uuid,
            user_id: l.user_id,
            productUuid: l.product_uuid,
            change: l.change,
            newQuantity: l.new_quantity,
            reason: l.reason,
            relatedUuid: l.related_uuid,
            createdAt: l.created_at,
        };
    }
}
