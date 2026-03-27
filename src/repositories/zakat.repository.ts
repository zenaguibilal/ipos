
import { createClient } from "@/utils/supabase/server";
import type { ZakatCalculation, SavedZakatCalculation } from "@/lib/types";

/**
 * @fileOverview Zakat Repository (Absolute Data Authority)
 * Handles both data fetching and the deterministic Zakat calculation logic.
 */
export class ZakatRepository {
    private supabase = createClient();

    async getAutomaticData() {
        const [
            { data: products },
            { data: customers },
            { data: suppliers },
            { data: profile }
        ] = await Promise.all([
            this.supabase.from('products').select('quantity, purchase_price'),
            this.supabase.from('customers').select('outstanding_balance'),
            this.supabase.from('suppliers').select('balance'),
            this.supabase.from('company_profile').select('gold_price_per_gram').single()
        ]);

        const inventoryValue = products?.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0) || 0;
        const customerDebts = customers?.reduce((sum, c) => sum + c.outstanding_balance, 0) || 0;
        const supplierDebts = suppliers?.reduce((sum, s) => sum + s.balance, 0) || 0;

        return {
            inventoryValue,
            customerDebts,
            supplierDebts,
            goldPrice: profile?.gold_price_per_gram || 0
        };
    }

    async getHistory(): Promise<SavedZakatCalculation[]> {
        const { data, error } = await this.supabase
            .from('zakat_logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw new Error("ZAKAT_HISTORY_FETCH_FAILED");
        return data.map((l: any) => ({
            uuid: l.uuid,
            zakatBase: l.zakat_base,
            zakatAmount: l.zakat_amount,
            createdAt: l.created_at
        }));
    }

    async save(calc: ZakatCalculation): Promise<void> {
        const { error } = await this.supabase
            .from('zakat_logs')
            .insert([{
                zakat_base: calc.zakatBase,
                zakat_amount: calc.zakatAmount,
                details: calc
            }]);
        if (error) throw new Error("ZAKAT_SAVE_FAILED");
    }

    /**
     * Logic extracted from ZakatService to enforce single-authority architecture.
     */
    static calculate(data: any): ZakatCalculation {
        const nisab = (data.goldPrice || 0) * 85;
        const totalAssets = (data.inventoryValue || 0) + Math.max(0, (data.customerDebts || 0) - (data.badDebts || 0)) + (data.cashOnHand || 0);
        const totalLiabilities = (data.supplierDebts || 0) + (data.otherDebts || 0);
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
