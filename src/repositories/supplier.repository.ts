
import { createClient } from "@/utils/supabase/server";
import type { Supplier } from "@/lib/types";

/**
 * @fileOverview Référentiel Fournisseur (Autorité de Données Absolue)
 * La source souveraine des données des fournisseurs et de leurs balances financières.
 */
export class SupplierRepository {
    private supabase = createClient();

    async getAll(): Promise<Supplier[]> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw new Error(`ERREUR_RÉCUPÉRATION_FOURNISSEUR : ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async findByUuid(uuid: string): Promise<Supplier | null> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .select('*')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('suppliers').delete().in('uuid', uuids);
        if (error) throw new Error(`ÉCHEC_SUPPRESSION_GROUPÉE_FOURNISSEUR : ${error.message}`);
    }

    async create(supplier: Partial<Supplier>): Promise<Supplier> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .insert([{
                name: supplier.name,
                contact_person: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                balance: 0
            }])
            .select()
            .single();
        if (error) throw new Error(`ÉCHEC_CRÉATION_FOURNISSEUR : ${error.message}`);
        return this.mapFromDb(data);
    }

    async update(uuid: string, supplier: Partial<Supplier>): Promise<Supplier> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .update({
                name: supplier.name,
                contact_person: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw new Error(`ÉCHEC_MISE_À_JOUR_FOURNISSEUR : ${error.message}`);
        return this.mapFromDb(data);
    }

    async recalculateBalance(uuid: string): Promise<void> {
        const { data: intakes, error: iErr } = await this.supabase.from('stock_intakes').select('total_value').eq('supplier_uuid', uuid);
        const { data: payments, error: pErr } = await this.supabase.from('supplier_payments').select('amount').eq('supplier_uuid', uuid);

        if (iErr || pErr) throw new Error("ERREUR_AUTORITÉ_SOLDE_FOURNISSEUR");

        const totalBought = intakes?.reduce((sum, i) => sum + i.total_value, 0) || 0;
        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        await this.supabase.from('suppliers').update({
            balance: Math.max(0, totalBought - totalPaid),
            updated_at: new Date().toISOString()
        }).eq('uuid', uuid);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('suppliers').delete().eq('uuid', uuid);
        if (error) throw new Error(`ÉCHEC_SUPPRESSION_FOURNISSEUR : ${error.message}`);
    }

    private mapFromDb(s: any): Supplier {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            name: s.name,
            contactPerson: s.contact_person,
            phone: s.phone,
            email: s.email,
            address: s.address,
            balance: s.balance || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        };
    }
}
