
import { NextResponse } from 'next/server';
import { SupplierRepository } from '@/repositories/supplier.repository';

/**
 * @fileOverview API WALL: Supplier Bulk Import
 */

export async function POST(req: Request) {
    try {
        const { toAdd, toUpdate } = await req.json();
        const repo = new SupplierRepository();

        for (const s of toAdd) {
            await repo.create(s);
        }

        for (const s of toUpdate) {
            await repo.update(s.uuid, s);
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
