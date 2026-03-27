import { NextResponse } from 'next/server';
import { StockRepository } from '@/repositories/stock.repository';

/**
 * @fileOverview API WALL: Individual Stock Intake Resource
 */

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new StockRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
