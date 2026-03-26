'use client';

import { createClient } from "@/utils/supabase/client";
import type { Expense } from "@/lib/types";

// Helper to convert DB snake_case to app camelCase
const fromSupabase = (expense: any): Expense => ({
    uuid: expense.uuid,
    user_id: expense.user_id,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    expenseDate: expense.expense_date,
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
});

// Helper to convert app camelCase to DB snake_case
const toSupabase = (expense: Partial<Expense>) => ({
    uuid: expense.uuid,
    user_id: expense.user_id,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    expense_date: expense.expenseDate,
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
});

class ExpenseRepository {
    private supabase = createClient();

    async getAll(): Promise<Expense[]> {
        const { data, error } = await this.supabase.from('expenses').select('*');
        if (error) throw error;
        return data.map(fromSupabase);
    }
    
    async filter(filters: { category?: string, from?: Date, to?: Date }): Promise<Expense[]> {
        let query = this.supabase.from('expenses').select('*').order('expense_date', { ascending: false });

        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters.from) {
            query = query.gte('expense_date', filters.from.toISOString());
        }
        if (filters.to) {
            query = query.lte('expense_date', filters.to.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map(fromSupabase);
    }

    async getUniqueCategories(): Promise<string[]> {
        const { data, error } = await this.supabase.rpc('get_unique_expense_categories');
        if (error) throw error;
        return data;
    }

    async add(expense: Expense): Promise<Expense> {
        const { data, error } = await this.supabase.from('expenses').insert(toSupabase(expense)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }

    async update(uuid: string, data: Partial<Expense>): Promise<Expense> {
        const { data: updatedData, error } = await this.supabase.from('expenses').update(toSupabase(data)).eq('uuid', uuid).select().single();
        if (error) throw error;
        return fromSupabase(updatedData);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('expenses').delete().eq('uuid', uuid);
        if (error) throw error;
    }

    async deleteAllForUser(userId: string): Promise<void> {
        const { error } = await this.supabase.from('expenses').delete().eq('user_id', userId);
        if (error) throw error;
    }

    async bulkUpsert(expenses: Expense[]): Promise<void> {
        const { error } = await this.supabase.from('expenses').upsert(expenses.map(toSupabase));
        if (error) throw error;
    }
}

export const expenseRepository = new ExpenseRepository();
