import { NextResponse } from 'next/server';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';

/**
 * @fileOverview API WALL: Bread Orders
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        if (!date) throw new Error("DATE_REQUIRED");
        
        const repo = new BreadOrderRepository();
        const data = await repo.getForDate(date);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new BreadOrderRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}