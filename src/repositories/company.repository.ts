
'use client';

import { createClient } from "@/utils/supabase/client";
import type { CompanyProfile } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";

const fromSupabase = (profile: any): CompanyProfile => profile ? ({
    uuid: profile.uuid,
    user_id: profile.user_id,
    companyName: profile.company_name,
    address: profile.address,
    city: profile.city,
    zipCode: profile.zip_code,
    country: profile.country,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    vatNumber: profile.vat_number,
    rcNumber: profile.rc_number,
    artImposition: profile.art_imposition,
    goldPricePerGram: profile.gold_price_per_gram,
    prix_pain: profile.prix_pain,
    updatedAt: profile.updated_at,
    role: profile.role,
}) : ({} as CompanyProfile);

const toSupabase = (profile: Partial<CompanyProfile>) => ({
    uuid: profile.uuid,
    user_id: profile.user_id,
    company_name: profile.companyName,
    address: profile.address,
    city: profile.city,
    zip_code: profile.zipCode,
    country: profile.country,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    vat_number: profile.vatNumber,
    rc_number: profile.rcNumber,
    art_imposition: profile.artImposition,
    gold_price_per_gram: profile.goldPricePerGram,
    prix_pain: profile.prix_pain,
    updated_at: profile.updatedAt,
    role: profile.role,
});


class CompanyRepository {
    private supabase = createClient();
    
    private getUserId(): string | undefined {
        return useAppStore.getState().session?.user?.id;
    }

    async get(): Promise<CompanyProfile | null> {
        const userId = this.getUserId();
        if (!userId) return null;

        const { data, error } = await this.supabase
            .from('company_profile')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : null;
    }
    
    async add(profile: CompanyProfile): Promise<CompanyProfile> {
        const { data, error } = await this.supabase.from('company_profile').insert(toSupabase(profile)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const userId = this.getUserId();
        if (!userId) throw new Error("User not authenticated for profile update.");

        const { data: updatedData, error } = await this.supabase
            .from('company_profile')
            .update(toSupabase(data))
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return fromSupabase(updatedData);
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('company_profile').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(profiles: CompanyProfile[]): Promise<void> {
        const { error } = await this.supabase.from('company_profile').upsert(profiles.map(toSupabase));
        if (error) throw error;
    }
}

export const companyRepository = new CompanyRepository();
