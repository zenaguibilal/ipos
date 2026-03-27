
import { NextResponse } from 'next/server';
import { ZakatRepository } from '@/repositories/zakat.repository';

/**
 * @fileOverview API WALL: Zakat Calculations
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const repo = new ZakatRepository();

        if (type === 'history') {
            const data = await repo.getHistory();
            return NextResponse.json({ data });
        }

        const data = await repo.getAutomaticData();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new ZakatRepository();
        const data = await repo.save(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
