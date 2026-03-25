'use client';

import type { Expense } from '@/lib/types';
import { expenseRepository } from '@/repositories';
import { v4 as uuidv4 } from 'uuid';

class ExpenseService {
    
    async filter(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
        return expenseRepository.filter(params);
    }

    async getCategories(): Promise<string[]> {
        return expenseRepository.getUniqueCategories();
    }
    
    async addExpense(expenseData: Omit<Expense, 'uuid' | 'user_id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
        const newExpense: Expense = {
            ...expenseData,
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return await expenseRepository.add(newExpense);
    }

    async updateExpense(uuid: string, expenseData: Partial<Expense>): Promise<Expense> {
        const dataToUpdate: Partial<Expense> = {
            ...expenseData,
            updatedAt: new Date(),
        };
        return await expenseRepository.update(uuid, dataToUpdate);
    }

    async deleteExpense(uuid: string): Promise<void> {
        await expenseRepository.delete(uuid);
    }
}

export const expenseService = new ExpenseService();
