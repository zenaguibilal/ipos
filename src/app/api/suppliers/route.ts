import { NextResponse } from 'next/server';
import { SupplierRepository } from '@/repositories/supplier.repository';

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
        const repo = new SupplierRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}