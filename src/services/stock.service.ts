
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { StockIntake } from '@/lib/types';
import { stockRepository } from '@/repositories/stock.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { useAppStore } from '@/stores/appStore';
import { productService } from './product.service';
import { inventoryService } from './inventory.service';
import { supplierService } from './supplier.service';

class StockService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getStockIntakes(filters: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
        try {
            let supplierUuids: string[] | undefined = undefined;

            if (filters.query) {
                const suppliers = await supplierRepository.filterByName(filters.query);
                supplierUuids = suppliers.map(s => s.uuid);
            }

            return await stockRepository.filter({
                query: filters.query,
                from: filters.from,
                to: filters.to
            });
        } catch (error) {
            throw error;
        }
    }
    
    async addStockIntake(intakeData: Omit<StockIntake, 'uuid' | 'user_id' | 'createdAt' | 'updatedAt'>): Promise<StockIntake> {
        try {
            const now = new Date();
            const newIntake: StockIntake = {
                ...intakeData,
                uuid: uuidv4(),
                user_id: this.getUserId(),
                createdAt: now,
                updatedAt: now,
            };
            return await stockRepository.add(newIntake);
        } catch (error) {
            throw error;
        }
    }

    async processStockIntakeCancellation(intakeUuid: string): Promise<void> {
        const intake = await stockRepository.findByUuid(intakeUuid);
        if (!intake) {
            throw new Error("Réception de stock non trouvée.");
        }

        // Revert product quantities
        for (const item of intake.items) {
            if (item.productUuid) {
                const quantityToRevert = item.quantityReceived - item.quantityDamaged;
                await inventoryService.adjustStock(item.productUuid, -quantityToRevert, 'cancellation', intake.uuid);
            }
        }

        // Revert supplier balance
        if (intake.supplierUuid && intake.totalValue > 0) {
            await supplierService.updateSupplierBalance(intake.supplierUuid, -intake.totalValue);
        }

        // Delete the intake record
        await stockRepository.delete(intake.uuid);
    }
}

export const stockService = new StockService();
