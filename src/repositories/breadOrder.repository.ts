import { createClient } from "@/utils/supabase/server";
import type { BreadOrder } from "@/lib/types";

/**
 * @fileOverview BreadOrder Repository (Absolute Data Authority)
 * يدير طلبيات الخبز اليومية وتزامنها مع المبيعات.
 */
export class BreadOrderRepository {
    private supabase = createClient();

    async getForDate(date: string): Promise<BreadOrder[]> {
        const { data, error } = await this.supabase
            .from('bread_orders')
            .select('*')
            .eq('date', date)
            .order('created_at', { ascending: true });
        if (error) throw new Error(`BREAD_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async create(order: Partial<BreadOrder>): Promise<BreadOrder> {
        const { data, error } = await this.supabase
            .from('bread_orders')
            .insert([{
                order_name: order.orderName,
                customer_uuid: order.customerUuid,
                date: order.date,
                quantite: order.quantite || 0,
                quantite_origine: order.quantite,
                est_paye: false,
                est_livre: false,
            }])
            .select()
            .single();
        if (error) throw new Error(`BREAD_CREATE_FAILED: ${error.message}`);
        return this.mapFromDb(data);
    }

    async update(uuid: string, data: Partial<BreadOrder>): Promise<void> {
        const { error } = await this.supabase
            .from('bread_orders')
            .update({
                quantite: data.quantite,
                est_paye: data.est_paye,
                est_livre: data.est_livre,
                vente_uuid: data.venteUuid,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid);
        if (error) throw new Error(`BREAD_UPDATE_FAILED: ${error.message}`);
    }

    private mapFromDb(o: any): BreadOrder {
        return {
            uuid: o.uuid,
            user_id: o.user_id,
            customerUuid: o.customer_uuid,
            orderName: o.order_name,
            date: o.date,
            quantite: o.quantite,
            quantite_origine: o.quantite_origine,
            est_paye: o.est_paye,
            est_livre: o.est_livre,
            venteUuid: o.vente_uuid,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
        };
    }
}
