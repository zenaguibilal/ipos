'use client';
/**
 * @fileOverview Stock Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { StockIntake } from '@/lib/types';

class StockService {
    async getStockIntakes(filters: any): Promise<StockIntake[]> {
        const query = new URLSearchParams(filters).toString();
        return api.get<StockIntake[]>(`stock?${query}`);
    }
    
    async addStockIntake(intakeData: any): Promise<StockIntake> {
        return api.post<StockIntake>('stock', intakeData);
    }

    async processStockIntakeCancellation(uuid: string): Promise<void> {
        return api.delete(`stock/${uuid}`);
    }
}

export const stockService = new StockService();
