import { NextResponse } from 'next/server';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { ExpenseSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Expenses
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from') || undefined;
        const to = searchParams.get('to') || undefined;

        const repo = new ExpenseRepository();
        const data = await repo.getAll({ from, to });
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = ExpenseSchema.parse(body);
        const repo = new ExpenseRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
