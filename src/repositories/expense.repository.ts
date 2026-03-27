import { createClient } from "@/utils/supabase/server";
import type { Expense } from "@/lib/types";

/**
 * @fileOverview Expense Repository (Absolute Data Authority)
 * المسؤول الحصري عن تسجيل المصاريف وتصنيفها.
 */
export class ExpenseRepository {
    private supabase = createClient();

    async getAll(): Promise<Expense[]> {
        const { data, error } = await this.supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });
        if (error) throw new Error(`EXPENSE_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async create(expense: Partial<Expense>): Promise<Expense> {
        const { data, error } = await this.supabase
            .from('expenses')
            .insert([{
                description: expense.description,
                category: expense.category || 'Autre',
                amount: expense.amount || 0,
                expense_date: expense.expenseDate || new Date().toISOString(),
            }])
            .select()
            .single();
        if (error) throw new Error(`EXPENSE_CREATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('expenses').delete().eq('uuid', uuid);
        if (error) throw new Error(`EXPENSE_DELETE_FAILURE: ${error.message}`);
    }

    private mapFromDb(e: any): Expense {
        return {
            uuid: e.uuid,
            user_id: e.user_id,
            description: e.description,
            category: e.category,
            amount: e.amount,
            expenseDate: e.expense_date,
            createdAt: e.created_at,
            updatedAt: e.updated_at,
        };
    }
}
