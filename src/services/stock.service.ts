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
        try {
            return await stockRepository.filter(filters);
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
}

export const stockService = new StockService();
