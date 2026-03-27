import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';

/**
 * @fileOverview API WALL: Customer Categories
 */

export async function GET() {
    try {
        const repo = new CustomerRepository();
        const data = await repo.getCategories();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
