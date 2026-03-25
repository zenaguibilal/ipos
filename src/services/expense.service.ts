'use client';

import type { Expense } from '@/lib/types';
import { expenseRepository } from '@/repositories/expense.repository';

class ExpenseService {
    
    async filter(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
        return expenseRepository.filter(params);
    }

    async getCategories(): Promise<string[]> {
        return expenseRepository.getCategories();
    }
    
    async addExpense(expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at'>): Promise<Expense> {
        return expenseRepository.add(expenseData);
    }

    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>): Promise<Expense> {
        return expenseRepository.update(id, expenseData);
    }

    async deleteExpense(id: number): Promise<void> {
        await expenseRepository.delete(id);
    }
}

export const expenseService = new ExpenseService();
