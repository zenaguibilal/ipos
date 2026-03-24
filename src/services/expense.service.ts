'use client';

import { db } from '@/lib/database';
import type { Expense } from '@/lib/types';

export class ExpenseService {
    async getExpenses(params: { category?: string, from?: Date, to?: Date }): Promise<Expense[]> {
        let collection = db.expenses.orderBy('expenseDate').reverse();
        if (params.from && params.to) {
            collection = collection.filter(e => e.expenseDate >= params.from! && e.expenseDate <= params.to!);
        }
        if (params.category && params.category !== 'all') {
            collection = collection.filter(e => e.category === params.category);
        }
        return await collection.toArray();
    }
    
    async getExpenseCategories(): Promise<string[]> {
        const expenses = await db.expenses.toArray();
        const categories = new Set(expenses.map(e => e.category));
        return Array.from(categories).sort();
    }
    
    async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const now = new Date();
        const newExpense = { ...expense, createdAt: now, updatedAt: now };
        const id = await db.expenses.add(newExpense as Expense);
        return { ...newExpense, id };
    }

    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
        await db.expenses.update(id, { ...expenseData, updatedAt: new Date() });
    }

    async deleteExpense(id: number): Promise<void> {
        await db.expenses.delete(id);
    }
}
