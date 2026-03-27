import { NextResponse } from 'next/server';
import { ExpenseRepository } from '@/repositories/expense.repository';

/**
 * @fileOverview API WALL: Expenses
 */

export async function GET() {
    try {
        const repo = new ExpenseRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new ExpenseRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}