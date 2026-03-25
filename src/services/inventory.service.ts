'use client';

import { db } from '@/lib/database';
import type { InventoryLog, InventoryLogReason } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

class InventoryService {
    /**
     * Logs a change in product inventory. This should be called within a Dexie transaction
     * along with the operation that causes the stock change (e.g., sale, return).
     * @param productId The local DB ID of the product.
     * @param change The amount the quantity changed by (e.g., -2 for a sale, +1 for a return).
     * @param newQuantity The final quantity of the product after the change.
     * @param reason The reason for the inventory change.
     * @param relatedId The local DB ID of the document that caused this change (e.g., sale ID, return ID).
     */
    async logChange(
        productId: number,
        change: number,
        newQuantity: number,
        reason: InventoryLogReason,
        relatedId?: number | string
    ): Promise<void> {
        const now = new Date();
        const uuid = uuidv4();
        const logEntry: Omit<InventoryLog, 'id'> = {
            uuid,
            productId,
            change,
            newQuantity,
            reason,
            relatedId,
            createdAt: now,
            updatedAt: now,
            sync_status: 'pending_create',
            last_modified_by: syncService.getLocalDeviceId(),
        };

        const id = await db.inventoryLogs.add(logEntry as InventoryLog);
        await syncService.queueSyncOperation('inventory_logs', uuid, 'create', { ...logEntry, id: undefined });
    }
}

export const inventoryService = new InventoryService();
