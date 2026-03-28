import { NextResponse } from 'next/server';
import { StockRepository } from '@/repositories/stock.repository';
import { CompanyRepository } from '@/repositories/company.repository';
import { StockIntakeSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Stock Intake Gateway (Role Guarded)
 */

export async function GET(req: Request) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'ACCESS_RESTRICTED' }, { status: 403 });

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
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'FORBIDDEN_AUTHORITY_REQUIRED' }, { status: 403 });

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
