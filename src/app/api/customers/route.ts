import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';
import { CustomerSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Customers
 */

export async function GET() {
    try {
        const repo = new CustomerRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = CustomerSchema.parse(body);
        const repo = new CustomerRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
