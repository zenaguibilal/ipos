import { NextResponse } from 'next/server';
import { SaleRepository } from '@/repositories/sale.repository';
import { SaleSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Sales
 */

export async function GET() {
    try {
        const repo = new SaleRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = SaleSchema.parse(body);
        const repo = new SaleRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
