import { NextResponse } from 'next/server';
import { ExpenseRepository } from '@/repositories/expense.repository';

/**
 * @fileOverview API WALL: Expense Categories
 */

export async function GET() {
    try {
        const repo = new ExpenseRepository();
        const data = await repo.getCategories();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
