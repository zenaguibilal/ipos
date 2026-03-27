'use client';
/**
 * @fileOverview Bread Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { BreadOrder } from '@/lib/types';

class BreadService {
    async getOrdersForDate(date: string): Promise<BreadOrder[]> {
        return api.get<BreadOrder[]>(`bread?date=${date}`);
    }
    
    async addOrder(data: any): Promise<BreadOrder> {
        return api.post<BreadOrder>('bread', data);
    }

    async generateOrdersFromRecurrence(date: string): Promise<number> {
        const result = await api.post<any>('bread/generate', { date });
        return result.count;
    }

    async updateOrder(uuid: string, data: Partial<BreadOrder>): Promise<void> {
        return api.put(`bread/${uuid}`, data);
    }

    async bulkDeleteOrders(uuids: string[]): Promise<void> {
        return api.post('bread/bulk-delete', { uuids });
    }

    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        return api.post('bread/convert-to-sales', { orderUuids, breadPrice });
    }
}

export const breadService = new BreadService();
