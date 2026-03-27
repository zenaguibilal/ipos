
import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';

/**
 * @fileOverview API WALL: Global Customer Stats Summary
 */

export async function GET() {
    try {
        const repo = new CustomerRepository();
        const customers = await repo.getAll();

        const summary = {
            total: customers.length,
            overdue: customers.filter(c => c.debtStatus === 'overdue').length,
            overLimit: customers.filter(c => c.isOverLimit).length,
            totalDebt: customers.reduce((sum, c) => sum + c.outstandingBalance, 0)
        };

        return NextResponse.json({ data: summary });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
