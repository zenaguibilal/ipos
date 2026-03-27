import { NextResponse } from 'next/server';
import { StockRepository } from '@/repositories/stock.repository';
import { StockIntakeSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Stock Intake Gateway (Validated)
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = StockIntakeSchema.parse(body);
        const repo = new StockRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Stock Intake Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}
