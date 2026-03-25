// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { Expense } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class ExpenseRepository {
    async filter(filters: { category?: string, from?: Date, to?: Date }): Promise<Expense[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async getUniqueCategories(): Promise<string[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async add(expense: Expense): Promise<Expense> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async update(uuid: string, data: Partial<Expense>): Promise<Expense> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async delete(uuid: string): Promise<void> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const expenseRepository = new ExpenseRepository();
