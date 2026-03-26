
'use client';

import { productRepository } from '@/repositories/product.repository';
import { customerRepository } from '@/repositories/customer.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { companyRepository } from '@/repositories/company.repository';
import type { ZakatCalculation } from '@/lib/types';

class ZakatService {
    async getAutomaticData(): Promise<{ inventoryValue: number; customerDebts: number; supplierDebts: number; goldPrice: number }> {
        try {
            const [products, customers, suppliers, profile] = await Promise.all([
                productRepository.getAll(),
                customerRepository.getAll(),
                supplierRepository.getAll(),
                companyRepository.get()
            ]);

            const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
            const customerDebts = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
            const supplierDebts = suppliers.reduce((sum, s) => sum + s.balance, 0);
            const goldPrice = profile?.goldPricePerGram || 0;

            return {
                inventoryValue,
                customerDebts,
                supplierDebts,
                goldPrice
            };
        } catch (error) {
            console.error("Error fetching zakat data:", error);
            throw error;
        }
    }

    calculate(data: {
        inventoryValue: number;
        customerDebts: number;
        cashOnHand: number;
        supplierDebts: number;
        otherDebts: number;
        goldPrice: number;
    }): ZakatCalculation {
        const nisab = data.goldPrice * 85;
        const totalAssets = data.inventoryValue + data.customerDebts + data.cashOnHand;
        const totalLiabilities = data.supplierDebts + data.otherDebts;
        const zakatBase = Math.max(0, totalAssets - totalLiabilities);
        const isNisabReached = zakatBase >= nisab;
        const zakatAmount = isNisabReached ? zakatBase * 0.025 : 0;

        return {
            ...data,
            nisab,
            zakatBase,
            zakatAmount,
            isNisabReached
        };
    }
}

export const zakatService = new ZakatService();
