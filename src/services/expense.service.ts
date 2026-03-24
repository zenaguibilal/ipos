'use client';

import { db } from '@/lib/database';
import type { Expense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class ExpenseService {
    async getExpenses(params: { category?: string, from?: Date, to?: Date }): Promise<Expense[]> {
        let collection = db.expenses.where('sync_status').notEqual('pending_delete').reverse();

        if (params.from && params.to) {
            collection = collection.filter(e => e.expenseDate >= params.from! && e.expenseDate <= params.to!);
        }
        if (params.category && params.category !== 'all') {
            collection = collection.filter(e => e.category === params.category);
        }
        return await collection.sortBy('expenseDate');
    }
    
    async getExpenseCategories(): Promise<string[]> {
        const expenses = await db.expenses.where('sync_status').notEqual('pending_delete').toArray();
        const categories = new Set(expenses.map(e => e.category));
        return Array.from(categories).sort();
    }
    
    async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const now = new Date();
        const uuid = uuidv4();
        const newExpense = { 
            ...expense, 
            uuid,
            createdAt: now, 
            updatedAt: now,
            sync_status: 'pending_create' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };
        const id = await db.expenses.add(newExpense as Expense);
        await syncService.queueSyncOperation('expenses', uuid, 'create', { ...newExpense, id: undefined });
        return { ...newExpense, id };
    }

    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
        const expense = await db.expenses.get(id);
        if (!expense || !expense.uuid) return;

        const updateData = { 
            ...expenseData, 
            updatedAt: new Date(),
            sync_status: expense.sync_status === 'pending_create' ? 'pending_create' : 'pending_update' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };

        await db.expenses.update(id, updateData);
        await syncService.queueSyncOperation('expenses', expense.uuid, 'update', updateData);
    }

    async deleteExpense(id: number): Promise<void> {
        const expense = await db.expenses.get(id);
        if (!expense || !expense.uuid) return;
        
        await db.expenses.update(id, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
        await syncService.queueSyncOperation('expenses', expense.uuid, 'delete', {});
    }
}
