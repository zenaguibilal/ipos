
'use client';
/**
 * @fileOverview Zakat Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { ZakatCalculation, SavedZakatCalculation } from '@/lib/types';

class ZakatService {
    async getAutomaticData(): Promise<any> {
        return api.get('zakat');
    }

    async getHistory(): Promise<SavedZakatCalculation[]> {
        return api.get<SavedZakatCalculation[]>('zakat?type=history');
    }

    async saveCalculation(data: ZakatCalculation): Promise<void> {
        return api.post('zakat', data);
    }

    calculate(data: any): ZakatCalculation {
        const nisab = (data.goldPrice || 0) * 85;
        const totalAssets = data.inventoryValue + Math.max(0, data.customerDebts - data.badDebts) + data.cashOnHand;
        const totalLiabilities = data.supplierDebts + data.otherDebts;
        const zakatBase = Math.max(0, totalAssets - totalLiabilities);
        const isNisabReached = nisab > 0 && zakatBase >= nisab;
        
        return {
            ...data,
            nisab,
            zakatBase,
            zakatAmount: isNisabReached ? zakatBase * 0.025 : 0,
            isNisabReached
        };
    }
}

export const zakatService = new ZakatService();
