
import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';

/**
 * @fileOverview API WALL: Customer Bulk Operations (Import/Delete)
 */

export async function POST(req: Request) {
    try {
        const { toAdd, toUpdate } = await req.json();
        const repo = new CustomerRepository();

        for (const c of toAdd) {
            await repo.create(c);
        }

        for (const c of toUpdate) {
            await repo.update(c.uuid, c);
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
