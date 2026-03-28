import { NextResponse } from 'next/server';
import { StockRepository } from '@/repositories/stock.repository';
import { StockIntakeSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Stock Intake Gateway (Validated)
 * تم تحديث الـ GET لدعم كافة فلاتر البحث لضمان حتمية التقارير.
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from') || undefined;
        const to = searchParams.get('to') || undefined;
        const query = searchParams.get('query') || undefined;
        const supplierUuid = searchParams.get('supplierUuid') || undefined;

        const repo = new StockRepository();
        const data = await repo.getAll({ from, to, query, supplierUuid });
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

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
