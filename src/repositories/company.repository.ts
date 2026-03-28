
import { createClient } from "@/utils/supabase/server";
import type { CompanyProfile, AppRole } from "@/lib/types";

/**
 * @fileOverview Référentiel de l'Entreprise (Autorité Serveur Absolue)
 * PHASE 2, 11 & 13 : Logique de découverte de profil et de rôle déterministe.
 * Le centre souverain pour gérer les fichiers de l'établissement, définir les niveaux d'autorité et vérifier l'activité des comptes.
 */
export class CompanyRepository {
    private supabase = createClient();

    async get(): Promise<CompanyProfile | null> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return null;

        // 1. Vérifier d'abord si l'utilisateur est le propriétaire (Admin)
        const { data: profile, error: profileError } = await this.supabase
            .from('company_profile')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileError) throw new Error(`ÉCHEC_RÉCUPÉRATION_PROFIL : ${profileError.message}`);
        
        if (profile) {
            return this.mapFromDb(profile, 'admin', undefined);
        }

        // 2. Si ce n'est pas le propriétaire, chercher dans les profils du personnel
        const { data: staff, error: staffError } = await this.supabase
            .from('staff_profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

        if (staffError) throw new Error(`ÉCHEC_VÉRIFICATION_PERSONNEL : ${staffError.message}`);

        if (staff) {
            // Protocole de purification : Interdire immédiatement les comptes suspendus
            if (!staff.is_active) {
                throw new Error("COMPTE_SUSPENDU");
            }

            // Récupérer les données de l'entreprise associée
            const { data: comp } = await this.supabase.from('company_profile').select('*').limit(1).maybeSingle();
            return this.mapFromDb(comp || { company_name: "iPOS Terminal" }, staff.role, staff.permissions);
        }

        return null;
    }

    /**
     * Fonction souveraine pour une vérification rapide du rôle dans l'API
     */
    async checkRole(requiredRoles: AppRole[]): Promise<boolean> {
        try {
            const profile = await this.get();
            if (!profile) return false;
            return requiredRoles.includes(profile.role);
        } catch (e: any) {
            if (e.message === "COMPTE_SUSPENDU") return false;
            throw e;
        }
    }

    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("NON_AUTHENTIFIÉ");

        const currentProfile = await this.get();
        if (currentProfile?.role !== 'admin') throw new Error("MISE_À_JOUR_PROFIL_NON_AUTORISÉE");

        const { data: updated, error } = await this.supabase
            .from('company_profile')
            .update(this.mapToDb(data))
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(`ÉCHEC_MISE_À_JOUR_PROFIL : ${error.message}`);
        return this.mapFromDb(updated, 'admin', undefined);
    }

    private mapFromDb(p: any, role: AppRole, permissions?: string[]): CompanyProfile {
        return {
            uuid: p.uuid || '',
            user_id: p.user_id || '',
            companyName: p.company_name || "Instance iPOS",
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
