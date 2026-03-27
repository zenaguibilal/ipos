
import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';

/**
 * @fileOverview API WALL: Product Bulk Import
 */

export async function POST(req: Request) {
    try {
        const { toAdd, toUpdate } = await req.json();
        const repo = new ProductRepository();

        for (const p of toAdd) {
            await repo.create(p);
        }

        for (const p of toUpdate) {
            await repo.update(p.uuid, p);
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
