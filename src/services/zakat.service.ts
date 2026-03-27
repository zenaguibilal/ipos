
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

    private getUserId(): string {
        const id = useAppStore.getState().session?.user?.id;
        if (!id) throw new Error("Non authentifié");
        return id;
    }

    async getAutomaticData() {
        try {
            const [products, customers, suppliers, profile] = await Promise.all([
                productRepository.getAll(),
                customerRepository.getAll(),
                supplierRepository.getAll(),
                companyRepository.get()
            ]);

            return {
                inventoryValue: products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0),
                customerDebts: customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
                supplierDebts: suppliers.reduce((sum, s) => sum + s.balance, 0),
                goldPrice: profile?.goldPricePerGram || 0
            };
        } catch (error) { throw error; }
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

    async saveCalculation(calc: ZakatCalculation): Promise<void> {
        const userId = this.getUserId();
        const { error } = await this.supabase.from('zakat_history').insert({
            uuid: uuidv4(),
            user_id: userId,
            inventory_value: calc.inventoryValue,
            customer_debts: calc.customerDebts,
            bad_debts: calc.badDebts,
            cash_on_hand: calc.cashOnHand,
            supplier_debts: calc.supplierDebts,
            other_debts: calc.otherDebts,
            gold_price: calc.goldPrice,
            nisab: calc.nisab,
            zakat_base: calc.zakatBase,
            zakat_amount: calc.zakatAmount,
            is_nisab_reached: calc.isNisabReached
        });
        if (error) throw error;
    }

    async getHistory(): Promise<SavedZakatCalculation[]> {
        const userId = this.getUserId();
        const { data, error } = await this.supabase.from('zakat_history')
            .select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((r: any) => ({
            ...r,
            zakatBase: r.zakat_base,
            zakatAmount: r.zakat_amount,
            isNisabReached: r.is_nisab_reached,
            createdAt: new Date(r.created_at)
        }));
    }
}

export const zakatService = new ZakatService();
