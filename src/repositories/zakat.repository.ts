
import { createClient } from "@/utils/supabase/server";

/**
 * @fileOverview Référentiel de la Zakat (Autorité de Données Absolue)
 * Logique pure côté serveur pour le calcul patrimonial.
 */
export class ZakatRepository {
    private supabase = createClient();

    async getAutomaticData() {
        const [pRes, cRes, sRes, prRes] = await Promise.all([
            this.supabase.from('products').select('quantity, purchase_price'),
            this.supabase.from('customers').select('outstanding_balance'),
            this.supabase.from('suppliers').select('balance'),
            this.supabase.from('company_profile').select('gold_price_per_gram').maybeSingle()
        ]);

        const inventoryValue = (pRes.data || []).reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0);
        const customerDebts = (cRes.data || []).reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
        const supplierDebts = (sRes.data || []).reduce((sum, s) => sum + (s.balance || 0), 0);

        return {
            inventoryValue,
            customerDebts,
            supplierDebts,
            goldPrice: prRes.data?.gold_price_per_gram || 0
        };
    }

    async getHistory(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('zakat_logs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) return [];
        return data.map((l: any) => ({
            uuid: l.uuid,
            zakatBase: l.zakat_base,
            zakatAmount: l.zakat_amount,
            createdAt: l.created_at,
            details: l.details
        }));
    }

    async save(calc: any): Promise<void> {
        await this.supabase
            .from('zakat_logs')
            .insert([{
                zakat_base: calc.zakatBase,
                zakat_amount: calc.zakatAmount,
                details: calc
            }]);
    }
}
