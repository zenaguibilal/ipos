'use client';
/**
 * @fileOverview Expense Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { Expense } from '@/lib/types';
import Papa from 'papaparse';

class ExpenseService {
    async filter(params: any): Promise<Expense[]> {
        const query = new URLSearchParams(params).toString();
        return api.get<Expense[]>(`expenses?${query}`);
    }

    async getCategories(): Promise<string[]> {
        return api.get<string[]>('expenses/categories');
    }
    
    async addExpense(expenseData: any): Promise<Expense> {
        return api.post<Expense>('expenses', expenseData);
    }

    async updateExpense(uuid: string, expenseData: Partial<Expense>): Promise<Expense> {
        return api.put<Expense>(`expenses/${uuid}`, expenseData);
    }

    async deleteExpense(uuid: string): Promise<void> {
        return api.delete(`expenses/${uuid}`);
    }

    async exportToCSV(expenses: Expense[]) {
        const csv = Papa.unparse(expenses.map(e => ({ 'Desc': e.description, 'Montant': e.amount })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

export const expenseService = new ExpenseService();
