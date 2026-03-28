import { createClient } from "@/utils/supabase/server";
import type { CompanyProfile, AppRole } from "@/lib/types";

/**
 * @fileOverview Company Repository (Absolute Server Authority)
 * PHASE 2, 11 & 13: Deterministic profile & role discovery logic.
 * المركز السيادي لإدارة ملفات المنشأة وتحديد مستويات السلطة والتحقق من نشاط الحسابات.
 */
export class CompanyRepository {
    private supabase = createClient();

    async get(): Promise<CompanyProfile | null> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return null;

        // 1. التحقق أولاً إذا كان المستخدم هو المالك (Admin)
        const { data: profile, error: profileError } = await this.supabase
            .from('company_profile')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileError) throw new Error(`PROFILE_FETCH_FAILED: ${profileError.message}`);
        
        if (profile) {
            return this.mapFromDb(profile, 'admin', undefined);
        }

        // 2. إذا لم يكن مالكاً، نبحث في سجل الموظفين
        const { data: staff, error: staffError } = await this.supabase
            .from('staff_profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

        if (staffError) throw new Error(`STAFF_CHECK_FAILED: ${staffError.message}`);

        if (staff) {
            // بروتوكول التطهير: منع الحسابات الموقوفة فوراً
            if (!staff.is_active) {
                throw new Error("ACCOUNT_SUSPENDED");
            }

            // جلب بيانات المنشأة المرتبطة
            const { data: comp } = await this.supabase.from('company_profile').select('*').limit(1).maybeSingle();
            return this.mapFromDb(comp || { company_name: "iPOS Terminal" }, staff.role, staff.permissions);
        }

        return null;
    }

    /**
     * وظيفة سيادية للتحقق السريع من الدور في الـ API
     */
    async checkRole(requiredRoles: AppRole[]): Promise<boolean> {
        try {
            const profile = await this.get();
            if (!profile) return false;
            return requiredRoles.includes(profile.role);
        } catch (e: any) {
            if (e.message === "ACCOUNT_SUSPENDED") return false;
            throw e;
        }
    }

    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        const currentProfile = await this.get();
        if (currentProfile?.role !== 'admin') throw new Error("UNAUTHORIZED_PROFILE_UPDATE");

        const { data: updated, error } = await this.supabase
            .from('company_profile')
            .update(this.mapToDb(data))
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(`PROFILE_UPDATE_FAILED: ${error.message}`);
        return this.mapFromDb(updated, 'admin', undefined);
    }

    private mapFromDb(p: any, role: AppRole, permissions?: string[]): CompanyProfile {
        return {
            uuid: p.uuid || '',
            user_id: p.user_id || '',
            companyName: p.company_name || "iPOS Instance",
            address: p.address || '',
            city: p.city || '',
            zipCode: p.zip_code || '',
            country: p.country || '',
            phone: p.phone || '',
            email: p.email || '',
            website: p.website || '',
            vatNumber: p.vat_number || '',
            rcNumber: p.rc_number || '',
            artImposition: p.art_imposition || '',
            goldPricePerGram: p.gold_price_per_gram || 0,
            prix_pain: p.prix_pain || 0,
            currencySymbol: p.currency_symbol || 'DA',
            decimalPlaces: p.decimal_places ?? 1,
            role: role,
            permissions: permissions || [],
            updatedAt: p.updated_at || new Date().toISOString(),
        };
    }

    private mapToDb(p: Partial<CompanyProfile>) {
        return {
            company_name: p.companyName,
            address: p.address,
            city: p.city,
            zip_code: p.zipCode,
            country: p.country,
            phone: p.phone,
            email: p.email,
            website: p.website,
            vat_number: p.vatNumber,
            rc_number: p.rcNumber,
            art_imposition: p.artImposition,
            gold_price_per_gram: p.goldPricePerGram,
            prix_pain: p.prix_pain,
            currency_symbol: p.currencySymbol,
            decimal_places: p.decimalPlaces,
        };
    }
}
