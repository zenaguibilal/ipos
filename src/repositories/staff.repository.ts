import { createClient } from "@/utils/supabase/server";
import type { StaffMember } from "@/lib/types";

/**
 * @fileOverview Staff Repository (Absolute Data Authority)
 * المسؤول عن إدارة ملفات الموظفين وصلاحياتهم مع معالجة الأخطاء السيادية.
 */
export class StaffRepository {
    private supabase = createClient();

    async getAll(): Promise<StaffMember[]> {
        try {
            const { data, error } = await this.supabase
                .from('staff_profiles')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (error) {
                if (error.code === '42P01') {
                    console.warn('[REPOSITORY_WARNING] Table staff_profiles not found.');
                    return [];
                }
                throw error;
            }
            return data.map(this.mapFromDb);
        } catch (e: any) {
            console.error(`[STAFF_FETCH_FAILED] ${e.message}`);
            return [];
        }
    }

    async create(member: Partial<StaffMember>): Promise<StaffMember> {
        const { data, error } = await this.supabase
            .from('staff_profiles')
            .insert([{
                email: member.email,
                display_name: member.displayName,
                role: member.role || 'cashier',
                permissions: member.permissions || [],
                is_active: member.isActive ?? true,
            }])
            .select()
            .single();

        if (error) throw new Error(`STAFF_CREATE_FAILED: ${error.message}`);
        return this.mapFromDb(data);
    }

    async update(uuid: string, member: Partial<StaffMember>): Promise<StaffMember> {
        const { data, error } = await this.supabase
            .from('staff_profiles')
            .update({
                display_name: member.displayName,
                role: member.role,
                permissions: member.permissions,
                is_active: member.isActive,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();

        if (error) throw new Error(`STAFF_UPDATE_FAILED: ${error.message}`);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase
            .from('staff_profiles')
            .delete()
            .eq('uuid', uuid);
        
        if (error) throw new Error(`STAFF_DELETE_FAILED: ${error.message}`);
    }

    private mapFromDb(s: any): StaffMember {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            email: s.email,
            displayName: s.display_name,
            role: s.role,
            permissions: s.permissions || [],
            isActive: s.is_active,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        };
    }
}
