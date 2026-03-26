
'use client';

import { createClient } from "@/utils/supabase/client";
import type { BreadOrder } from "@/lib/types";

const fromSupabase = (order: any): BreadOrder => ({
    uuid: order.uuid,
    user_id: order.user_id,
    orderName: order.order_name || 'Commande sans nom',
    date: order.date,
    quantite: order.quantite,
    quantite_origine: order.quantite_origine,
    est_paye: order.est_paye,
    est_livre: order.est_livre,
    venteUuid: order.vente_uuid,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
});

const toSupabase = (order: Partial<BreadOrder>) => ({
    uuid: order.uuid,
    user_id: order.user_id,
    order_name: order.orderName,
    date: order.date,
    quantite: order.quantite,
    quantite_origine: order.quantite_origine,
    est_paye: order.est_paye,
    est_livre: order.est_livre,
    vente_uuid: order.venteUuid,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
});


class BreadOrderRepository {
    private supabase = createClient();

    async getAllForUser(): Promise<BreadOrder[]> {
        const { data, error } = await this.supabase.from('bread_orders').select('*');
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async getOrdersForDate(date: string): Promise<BreadOrder[]> {
        const { data, error } = await this.supabase.from('bread_orders')
            .select(`*`)
            .eq('date', date)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async addOrder(order: BreadOrder): Promise<BreadOrder> {
        const { data, error } = await this.supabase.from('bread_orders').insert(toSupabase(order)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async updateOrder(uuid: string, data: Partial<BreadOrder>): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').update(toSupabase(data)).eq('uuid', uuid);
        if (error) throw error;
    }

    async bulkUpdateSaleRelation(orderUuids: string[], saleUuid: string): Promise<void> {
        const { error } = await this.supabase.from('bread_orders')
            .update({ vente_uuid: saleUuid, est_paye: true })
            .in('uuid', orderUuids);
        if (error) throw error;
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').delete().in('uuid', uuids);
        if (error) throw error;
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async getOrdersByUuids(uuids: string[]): Promise<BreadOrder[]> {
        const { data, error } = await this.supabase.from('bread_orders').select('*').in('uuid', uuids);
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async bulkUpsert(orders: BreadOrder[]): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').upsert(orders.map(toSupabase));
        if (error) throw error;
    }
}

export const breadOrderRepository = new BreadOrderRepository();
