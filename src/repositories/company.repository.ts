import { createClient } from "@/utils/supabase/server";
import type { CompanyProfile } from "@/lib/types";

/**
 * @fileOverview Company Repository (Absolute Server Authority)
 * PHASE 2 & 11: Final deterministic profile authority.
 */
export class CompanyRepository {
    private supabase = createClient();

    async get(): Promise<CompanyProfile | null> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await this.supabase
            .from('company_profile')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw new Error(`PROFILE_FETCH_FAILED: ${error.message}`);
        
        // Auto-initialize if somehow missing but user exists
        if (!data) {
            return this.initializeDefault(user.id);
        }

        return this.mapFromDb(data);
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
        return this.mapFromDb(data);
    }

    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        const { data: updated, error } = await this.supabase
            .from('company_profile')
            .update(this.mapToDb(data))
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(`PROFILE_UPDATE_FAILED: ${error.message}`);
        return this.mapFromDb(updated);
    }

    private mapFromDb(p: any): CompanyProfile {
        return {
            uuid: p.uuid,
            user_id: p.user_id,
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
            role: p.role,
            updatedAt: p.updated_at,
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
        };
    }
}
