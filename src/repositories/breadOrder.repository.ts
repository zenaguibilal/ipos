'use client';

import { createClient } from "@/utils/supabase/client";
import type { BreadOrder, BreadOrderWithCustomer, Customer } from "@/lib/types";

const fromSupabase = (order: any): BreadOrder => ({
    uuid: order.uuid,
    user_id: order.user_id,
    customerUuid: order.customer_uuid,
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
    customer_uuid: order.customerUuid,
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
    
    async getOrdersForDate(date: string): Promise<BreadOrderWithCustomer[]> {
        const { data, error } = await this.supabase.from('bread_orders')
            .select(`*, customer:customers(uuid, first_name, last_name)`)
            .eq('date', date)
            .order('created_at', { ascending: true });
        
        if (error) throw error;

        return data.map(item => ({
            ...fromSupabase(item),
            customer: {
                uuid: item.customer.uuid,
                firstName: item.customer.first_name,
                lastName: item.customer.last_name,
            }
        }));
    }
    
    async ordersExistForDate(date: string): Promise<boolean> {
        const { count, error } = await this.supabase.from('bread_orders')
            .select('*', { count: 'exact', head: true })
            .eq('date', date);
        if (error) throw error;
        return (count ?? 0) > 0;
    }
    
    async findClientOrderForDate(customerUuid: string, date: string): Promise<BreadOrder | undefined> {
        const { data, error } = await this.supabase.from('bread_orders')
            .select('*')
            .eq('customer_uuid', customerUuid)
            .eq('date', date)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }
    
    async addOrder(order: BreadOrder): Promise<BreadOrder> {
        const { data, error } = await this.supabase.from('bread_orders').insert(toSupabase(order)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async bulkAddOrders(orders: BreadOrder[]): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').insert(orders.map(toSupabase));
        if (error) throw error;
    }
    
    async findOrderByUuid(uuid: string): Promise<BreadOrder | undefined> {
        const { data, error } = await this.supabase.from('bread_orders').select('*').eq('uuid', uuid).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : undefined;
    }
    
    async getOrdersByUuids(uuids: string[]): Promise<BreadOrder[]> {
        const { data, error } = await this.supabase.from('bread_orders').select('*').in('uuid', uuids);
        if (error) throw error;
        return data.map(fromSupabase);
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

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(orders: BreadOrder[]): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').upsert(orders.map(toSupabase));
        if (error) throw error;
    }
}

export const breadOrderRepository = new BreadOrderRepository();
