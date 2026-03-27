import { createClient } from "@/utils/supabase/server";
import { calculateZakat } from "@/lib/utils";

/**
 * @fileOverview Zakat Repository (Absolute Data Authority)
 * Phase 4 & 7: Centralized logic for Zakat computation.
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

    async getHistory(): Promise<any[]> {
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

    async save(calc: any): Promise<void> {
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
     * Proxies the unified calculation logic from utils.
     */
    static calculate(data: any) {
        return calculateZakat(data);
    }
}
