
import { NextResponse } from 'next/server';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';

/**
 * @fileOverview API WALL: Bread Order Individual Resource
 */

export async function PUT(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const body = await req.json();
        const repo = new BreadOrderRepository();
        await repo.update(params.uuid, body);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
