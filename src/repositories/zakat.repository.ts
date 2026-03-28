import { createClient } from "@/utils/supabase/server";
import { calculateZakat } from "@/lib/utils";

/**
 * @fileOverview Zakat Repository (Absolute Data Authority - Resilient Edition)
 * PHASE 18: Hardened data aggregation with defensive fault tolerance.
 * Ensures the system remains deterministic even during partial cloud failures.
 */
export class ZakatRepository {
    private supabase = createClient();

    async getAutomaticData() {
        try {
            const [pRes, cRes, sRes, prRes] = await Promise.all([
                this.supabase.from('products').select('quantity, purchase_price'),
                this.supabase.from('customers').select('outstanding_balance'),
                this.supabase.from('suppliers').select('balance'),
                this.supabase.from('company_profile').select('gold_price_per_gram').maybeSingle()
            ]);

            const inventoryValue = (pRes.data || []).reduce((sum, p) => sum + ((p.quantity || 0) * (p.purchase_price || 0)), 0);
            const customerDebts = (cRes.data || []).reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
            const supplierDebts = (sRes.data || []).reduce((sum, s) => sum + (s.balance || 0), 0);

            return {
                inventoryValue,
                customerDebts,
                supplierDebts,
                goldPrice: prRes.data?.gold_price_per_gram || 0
            };
        } catch (e: any) {
            console.error('[CORE_AUDIT_ERROR] Zakat data aggregation failed:', e.message);
            // Return zeroed data to prevent UI crash, keeping the system deterministic
            return { inventoryValue: 0, customerDebts: 0, supplierDebts: 0, goldPrice: 0 };
        }
    }

    async getHistory(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('zakat_logs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                // Undefined table fallback
                if (error.code === '42P01') return [];
                throw error;
            }
            
            return (data || []).map((l: any) => ({
                uuid: l.uuid,
                zakatBase: l.zakat_base,
                zakatAmount: l.zakat_amount,
                createdAt: l.created_at,
                details: l.details
            }));
        } catch (e: any) {
            console.warn('[CORE_AUDIT_NOTICE] Zakat history unavailable:', e.message);
            return [];
        }
    }

    async save(calc: any): Promise<void> {
        const { error } = await this.supabase
            .from('zakat_logs')
            .insert([{
                zakat_base: calc.zakatBase,
                zakat_amount: calc.zakatAmount,
                details: calc
            }]);
        if (error) throw new Error(`ZAKAT_LOG_FAILED: ${error.message}`);
    }

    static calculate(data: any) {
        return calculateZakat(data);
    }
}
