
'use client';

import { createClient } from "@/utils/supabase/client";
import { productRepository } from '@/repositories/product.repository';
import { customerRepository } from '@/repositories/customer.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { companyRepository } from '@/repositories/company.repository';
import type { ZakatCalculation, SavedZakatCalculation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from "@/stores/appStore";

class ZakatService {
    private supabase = createClient();

    private getUserId(): string | undefined {
        return useAppStore.getState().session?.user?.id;
    }

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
        badDebts: number;
        cashOnHand: number;
        supplierDebts: number;
        otherDebts: number;
        goldPrice: number;
    }): ZakatCalculation {
        const nisab = data.goldPrice * 85;
        // Zakat logic: Assets - Liabilities
        // Assets = Inventory + Recoverable Customer Debts + Cash
        const totalAssets = data.inventoryValue + (data.customerDebts - data.badDebts) + data.cashOnHand;
        // Liabilities = Supplier Debts + Other business debts
        const totalLiabilities = data.supplierDebts + data.otherDebts;
        
        const zakatBase = Math.max(0, totalAssets - totalLiabilities);
        const isNisabReached = data.goldPrice > 0 && zakatBase >= nisab;
        const zakatAmount = isNisabReached ? zakatBase * 0.025 : 0;

        return {
            ...data,
            nisab,
            zakatBase,
            zakatAmount,
            isNisabReached
        };
    }

    async saveCalculation(calculation: ZakatCalculation): Promise<void> {
        const userId = this.getUserId();
        if (!userId) throw new Error("Utilisateur non authentifié");

        const { error } = await this.supabase
            .from('zakat_history')
            .insert({
                uuid: uuidv4(),
                user_id: userId,
                inventory_value: calculation.inventoryValue,
                customer_debts: calculation.customerDebts,
                bad_debts: calculation.badDebts,
                cash_on_hand: calculation.cashOnHand,
                supplier_debts: calculation.supplierDebts,
                other_debts: calculation.otherDebts,
                gold_price: calculation.goldPrice,
                nisab: calculation.nisab,
                zakat_base: calculation.zakatBase,
                zakat_amount: calculation.zakatAmount,
                is_nisab_reached: calculation.isNisabReached,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
    }

    async getHistory(): Promise<SavedZakatCalculation[]> {
        const userId = this.getUserId();
        if (!userId) return [];

        const { data, error } = await this.supabase
            .from('zakat_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((record: any) => ({
            uuid: record.uuid,
            user_id: record.user_id,
            inventoryValue: record.inventory_value,
            customerDebts: record.customer_debts,
            badDebts: record.bad_debts,
            cashOnHand: record.cash_on_hand,
            supplierDebts: record.supplier_debts,
            otherDebts: record.other_debts,
            goldPrice: record.gold_price,
            nisab: record.nisab,
            zakatBase: record.zakat_base,
            zakatAmount: record.zakat_amount,
            isNisabReached: record.is_nisab_reached,
            createdAt: new Date(record.created_at)
        }));
    }

    async deleteRecord(uuid: string): Promise<void> {
        const { error } = await this.supabase
            .from('zakat_history')
            .delete()
            .eq('uuid', uuid);
        
        if (error) throw error;
    }
}

export const zakatService = new ZakatService();
