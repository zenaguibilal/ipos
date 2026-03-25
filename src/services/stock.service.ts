'use client';
import { v4 as uuidv4 } from 'uuid';
import type { StockIntake } from '@/lib/types';
import { stockRepository } from '@/repositories/stock.repository';
import { useAppStore } from '@/stores/appStore';

class StockService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getStockIntakes(filters: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
        return stockRepository.filter(filters);
    }
    
    async addStockIntake(intakeData: Omit<StockIntake, 'uuid' | 'user_id' | 'createdAt' | 'updatedAt'>): Promise<StockIntake> {
        const now = new Date();
        const newIntake: StockIntake = {
            ...intakeData,
            uuid: uuidv4(),
            user_id: this.getUserId(),
            createdAt: now,
            updatedAt: now,
        };

        // The service's responsibility ends at creating the stock intake record.
        // Orchestration of supplier/product creation/updates and inventory adjustments
        // is handled by the calling layer (e.g., the page component).
        return await stockRepository.add(newIntake);
    }
}

export const stockService = new StockService();
