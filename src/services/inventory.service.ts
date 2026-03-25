'use client';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productRepository } from '@/repositories/product.repository';
import { calculateStockStatus } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

class InventoryService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async adjustStock(productUuid: string, quantityChange: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        try {
            if (productUuid === 'BREAD_PRODUCT') {
                return; // Do not track stock for special bread product
            }

            const product = await productRepository.findByUuid(productUuid);
            if (!product) {
                console.warn(`Attempted to adjust stock for a non-existent product UUID: ${productUuid}`);
                return;
            }

            const newQuantity = product.quantity + quantityChange;

            await productRepository.update(product.uuid, {
                quantity: newQuantity,
                stockStatus: calculateStockStatus(newQuantity, product.minStockLevel),
                updatedAt: new Date()
            });

            await this.logChange(productUuid, quantityChange, newQuantity, reason, relatedUuid);
        } catch (error) {
            throw error;
        }
    }
    
    async logChange(productUuid: string, change: number, newQuantity: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        try {
            const logEntry: InventoryLog = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                productUuid: productUuid,
                change: change,
                newQuantity: newQuantity,
                reason: reason,
                relatedUuid: relatedUuid,
                createdAt: new Date(),
            };

            await inventoryRepository.add(logEntry);
        } catch (error) {
            throw error;
        }
    }

    async getProductInfo(productUuid: string): Promise<Product | undefined> {
        try {
            return await productRepository.findByUuid(productUuid);
        } catch (error) {
            throw error;
        }
    }
}

export const inventoryService = new InventoryService();
