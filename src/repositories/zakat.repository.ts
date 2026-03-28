import { createClient } from "@/utils/supabase/server";
import { calculateZakat } from "@/lib/utils";

/**
 * @fileOverview Zakat Repository (Absolute Data Authority - Resilient Edition)
 * PHASE 4, 7 & 15: Centralized logic for Zakat computation with robust error handling.
 * المسؤول عن جلب البيانات المالية الموزعة وحساب الوعاء الزكوي بشكل حتمي مع ضمان عدم انهيار المنظومة عند نقص الجداول.
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

            // التحقق من البيانات واستخدام القيم الافتراضية لمنع الأخطاء الحسابية
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
            console.error('[ZAKAT_DATA_FETCH_FAILED]', e.message);
            return {
                inventoryValue: 0,
                customerDebts: 0,
                supplierDebts: 0,
                goldPrice: 0
            };
        }
    }

    async getHistory(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('zakat_logs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                // التعامل مع خطأ الجدول المفقود (Postgres code 42P01) بمرونة
                if (error.code === '42P01') {
                    console.warn('[REPOSITORY_WARNING] Table zakat_logs not found. Returning empty history.');
                    return [];
                }
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
            // منع انهيار الواجهة عند فشل استرجاع الأرشيف
            console.error(`[ZAKAT_HISTORY_FETCH_FAILED_SILENT] ${e.message}`);
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
        if (error) throw new Error(`ZAKAT_SAVE_FAILED: ${error.message}`);
    }

    static calculate(data: any) {
        return calculateZakat(data);
    }
}
