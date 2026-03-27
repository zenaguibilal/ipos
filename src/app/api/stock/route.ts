import { NextResponse } from 'next/server';
import { StockRepository } from '@/repositories/stock.repository';

/**
 * @fileOverview API WALL: Stock Intake
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new StockRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}