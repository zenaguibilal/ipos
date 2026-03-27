
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
        const nisab = (data.goldPrice || 0) * 85;
        // Total Assets = Inventory (Market Value assumed same as Purchase for MVP) + Liquid Cash + Recoverable Debts
        const recoverableDebts = Math.max(0, data.customerDebts - data.badDebts);
        const totalAssets = data.inventoryValue + recoverableDebts + data.cashOnHand;
        
        // Total Liabilities = Supplier Debts + Other urgent business charges
        const totalLiabilities = data.supplierDebts + data.otherDebts;
        
        const zakatBase = Math.max(0, totalAssets - totalLiabilities);
        const isNisabReached = nisab > 0 && zakatBase >= nisab;
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
        if (!userId) throw new Error("Non authentifié");

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

        return data.map((r: any) => ({
            uuid: r.uuid,
            user_id: r.user_id,
            inventoryValue: r.inventory_value,
            customerDebts: r.customer_debts,
            badDebts: r.bad_debts,
            cashOnHand: r.cash_on_hand,
            supplierDebts: r.supplier_debts,
            otherDebts: r.other_debts,
            goldPrice: r.gold_price,
            nisab: r.nisab,
            zakatBase: r.zakat_base,
            zakatAmount: r.zakat_amount,
            isNisabReached: r.is_nisab_reached,
            createdAt: new Date(r.created_at)
        }));
    }

    async deleteRecord(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('zakat_history').delete().eq('uuid', uuid);
        if (error) throw error;
    }
}

export const zakatService = new ZakatService();
