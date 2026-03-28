import { createClient } from "@/utils/supabase/server";
import type { CompanyProfile, AppRole } from "@/lib/types";

/**
 * @fileOverview Company Repository (Absolute Server Authority)
 * PHASE 2, 11 & 13: Deterministic profile & role discovery logic.
 * المركز السيادي لإدارة ملفات المنشأة وتحديد مستويات السلطة.
 */
export class CompanyRepository {
    private supabase = createClient();

    async get(): Promise<CompanyProfile | null> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return null;

        // 1. محاولة جلب ملف المنشأة (للمالك/الأدمن)
        const { data: profile, error: profileError } = await this.supabase
            .from('company_profile')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileError) throw new Error(`PROFILE_FETCH_FAILED: ${profileError.message}`);
        
        if (profile) {
            return this.mapFromDb(profile, profile.role || 'admin');
        }

        // 2. إذا لم يكن مالكاً، نبحث في سجل الموظفين بناءً على البريد الإلكتروني
        const { data: staff, error: staffError } = await this.supabase
            .from('staff_profiles')
            .select('*')
            .eq('email', user.email)
            .eq('is_active', true) // التأكد من أن الحساب نشط
            .maybeSingle();

        if (staffError) throw new Error(`STAFF_CHECK_FAILED: ${staffError.message}`);

        if (staff) {
            // جلب بيانات المنشأة الأساسية (أول سجل متاح لهذا الحساب المرتبط)
            const { data: comp } = await this.supabase.from('company_profile').select('*').limit(1).maybeSingle();
            return this.mapFromDb(comp || { company_name: "iPOS Terminal" }, staff.role);
        }

        // 3. حالة طارئة: مستخدم مسجل ولكن ليس له سجل منشأة أو موظف
        return this.initializeDefault(user.id);
    }

    /**
     * وظيفة سيادية للتحقق السريع من الدور في الـ API
     */
    async checkRole(requiredRoles: AppRole[]): Promise<boolean> {
        const profile = await this.get();
        if (!profile) return false;
        return requiredRoles.includes(profile.role);
    }

    private async initializeDefault(userId: string): Promise<CompanyProfile> {
        const { data, error } = await this.supabase
            .from('company_profile')
            .insert([{
                user_id: userId,
                company_name: "Nouvel Établissement iPOS",
                role: 'admin'
            }])
            .select()
            .single();
        
        if (error) throw new Error("PROFILE_AUTO_INIT_FAILED");
        return this.mapFromDb(data, 'admin');
    }

    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        // التأكد من أن القائم بالتعديل هو الأدمن فقط
        const currentProfile = await this.get();
        if (currentProfile?.role !== 'admin') throw new Error("UNAUTHORIZED_PROFILE_UPDATE");

        const { data: updated, error } = await this.supabase
            .from('company_profile')
            .update(this.mapToDb(data))
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(`PROFILE_UPDATE_FAILED: ${error.message}`);
        return this.mapFromDb(updated, updated.role);
    }

    private mapFromDb(p: any, role: AppRole): CompanyProfile {
        return {
            uuid: p.uuid || '',
            user_id: p.user_id || '',
            companyName: p.company_name,
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
