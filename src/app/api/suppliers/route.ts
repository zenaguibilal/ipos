import { NextResponse } from 'next/server';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { SupplierSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Suppliers
 */

export async function GET() {
    try {
        const repo = new SupplierRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = SupplierSchema.parse(body);
        const repo = new SupplierRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
