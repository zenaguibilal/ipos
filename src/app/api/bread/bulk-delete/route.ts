import { NextResponse } from 'next/server';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';

/**
 * @fileOverview API WALL: Bread Orders Bulk Deletion (Thin Proxy)
 */

export async function POST(req: Request) {
    try {
        const { uuids } = await req.json();
        if (!uuids || !Array.isArray(uuids)) throw new Error("UUIDS_REQUIRED");

        const repo = new BreadOrderRepository();
        await repo.bulkDelete(uuids);

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}