'use client';

import { db } from '@/lib/database';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';
import { calculateStockStatus } from '@/lib/utils';

class InventoryService {
    /**
     * Logs a change in product inventory. Must be called from within a Dexie transaction.
     * @param productId The local DB ID of the product.
     * @param change The amount the quantity changed by.
     * @param newQuantity The final quantity of the product.
     * @param reason The reason for the inventory change.
     * @param relatedId The local DB ID of the document that caused this change.
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

    /**
     * Atomically adjusts a product's stock, updates its status, logs the change, and queues for sync.
     * MUST be called from within a Dexie transaction that includes `db.products`, `db.inventoryLogs`, and `db.sync_queue`.
     * @param productId The local DB ID of the product to adjust.
     * @param quantityChange The change in quantity (e.g., -2 for a sale, +50 for stock intake).
     * @param reason The reason for the adjustment.
     * @param relatedId The ID of the document causing the change (e.g., sale ID, return ID).
     */
    async adjustStock(
        productId: number,
        quantityChange: number,
        reason: InventoryLogReason,
        relatedId?: number | string
    ): Promise<void> {
        const product = await db.products.get(productId);
        if (!product || !product.uuid) return;

        const newQuantity = product.quantity + quantityChange;
        const newStockStatus = calculateStockStatus(newQuantity, product.minStockLevel);

        const updatePayload: Partial<Product> = {
            quantity: newQuantity,
            stockStatus: newStockStatus,
            updatedAt: new Date(),
            last_modified_by: syncService.getLocalDeviceId(),
        };

        if (product.sync_status !== 'pending_create') {
            updatePayload.sync_status = 'pending_update';
        }

        await db.products.update(productId, updatePayload);
        await this.logChange(productId, quantityChange, newQuantity, reason, relatedId);

        await syncService.queueSyncOperation('products', product.uuid, 'update', {
            quantity: newQuantity,
            stockStatus: newStockStatus,
            updatedAt: updatePayload.updatedAt,
            last_modified_by: updatePayload.last_modified_by,
        });
    }
}

export const inventoryService = new InventoryService();
