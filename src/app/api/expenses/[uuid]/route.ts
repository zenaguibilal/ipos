import { NextResponse } from 'next/server';
import { ExpenseRepository } from '@/repositories/expense.repository';

/**
 * @fileOverview API WALL: Expense Resource
 */

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new ExpenseRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
