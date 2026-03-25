'use client';

import { createClient } from '@/utils/supabase/client';
import type { Expense } from '@/lib/types';
import { fromSnakeCase, toSnakeCase } from './utils';

class ExpenseRepository {
    private supabase = createClient();

    async get(id: number): Promise<Expense | null> {
        const { data, error } = await this.supabase
            .from('expenses')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return fromSnakeCase(data);
    }
    
    async filter({ category, from, to }: { category?: string, from?: Date, to?: Date }): Promise<Expense[]> {
        let query = this.supabase.from('expenses').select('*');

        if (from) {
            query = query.gte('expense_date', from.toISOString());
        }
        if (to) {
            query = query.lte('expense_date', to.toISOString());
        }
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('expense_date', { ascending: false });

        if (error) throw error;
        return fromSnakeCase(data);
    }

    async getCategories(): Promise<string[]> {
        const { data, error } = await this.supabase.rpc('get_distinct_expense_categories');
        if (error) throw error;
        return data;
    }

    async add(expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense> {
        const { data, error } = await this.supabase
            .from('expenses')
            .insert(toSnakeCase(expense))
            .select()
            .single();
        if (error) throw error;
        return fromSnakeCase(data);
    }

    async update(id: number, expenseData: Partial<Omit<Expense, 'id' | 'created_at' | 'user_id'>>): Promise<Expense> {
        const { data, error } = await this.supabase
            .from('expenses')
            .update(toSnakeCase(expenseData))
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return fromSnakeCase(data);
    }

    async delete(id: number): Promise<void> {
        const { error } = await this.supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}

export const expenseRepository = new ExpenseRepository();
