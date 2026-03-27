import { NextResponse } from 'next/server';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';

/**
 * @fileOverview API WALL: Deterministic Bread Order Generation (Proxy only)
 */

export async function POST(req: Request) {
    try {
        const { date } = await req.json();
        if (!date) throw new Error("DATE_REQUIRED");

        const repo = new BreadOrderRepository();
        const generatedCount = await repo.generateForDate(date);

        return NextResponse.json({ data: { count: generatedCount } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
