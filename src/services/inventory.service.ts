
'use client';
/**
 * @fileOverview Inventory Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { InventoryLog } from '@/lib/types';

class InventoryService {
    async getHistoryForProduct(productUuid: string): Promise<InventoryLog[]> {
        return api.get<InventoryLog[]>(`inventory?productUuid=${productUuid}`);
    }

    async adjustStock(data: { productUuid: string, change: number, reason: string, relatedUuid?: string }): Promise<void> {
        return api.post('inventory/adjust', data);
    }
}

export const inventoryService = new InventoryService();
