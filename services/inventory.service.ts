'use client';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { inventoryRepository, productRepository } from '@/repositories';
import { calculateStockStatus } from '@/lib/utils';

class InventoryService {

    /**
     * Adjusts the stock for a given product and creates an inventory log.
     * This is the single source of truth for all stock modifications.
     * @param productUuid - The UUID of the product to adjust.
     * @param quantityChange - The change in quantity (e.g., -2 for a sale, +50 for stock intake).
     * @param reason - The reason for the stock change.
     * @param relatedUuid - The UUID of the related document (e.g., Sale, Return, StockIntake).
     */
    async adjustStock(productUuid: string, quantityChange: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        const product = await productRepository.findByUuid(productUuid);
        if (!product) {
            if(productUuid !== 'BREAD_PRODUCT') { // Allow special bread product to be skipped
                console.warn(`Attempted to adjust stock for a non-existent product UUID: ${productUuid}`);
            }
            return;
        }

        const newQuantity = product.quantity + quantityChange;

        await productRepository.update(product.uuid, {
            quantity: newQuantity,
            stockStatus: calculateStockStatus(newQuantity, product.minStockLevel),
            updatedAt: new Date()
        });

        await this.logChange(productUuid, quantityChange, newQuantity, reason, relatedUuid);
    }
    
    /**
     * Creates an inventory log entry. This is typically called from `adjustStock`.
     */
    async logChange(productUuid: string, change: number, newQuantity: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        const logEntry: InventoryLog = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            productUuid: productUuid,
            change: change,
            newQuantity: newQuantity,
            reason: reason,
            relatedUuid: relatedUuid,
            createdAt: new Date(),
        };

        await inventoryRepository.add(logEntry);
    }

    async getProductInfo(productUuid: string): Promise<Product | undefined> {
        return productRepository.findByUuid(productUuid);
    }
}

export const inventoryService = new InventoryService();
