import { NextResponse } from 'next/server';
import { ZakatRepository } from '@/repositories/zakat.repository';
import { CompanyRepository } from '@/repositories/company.repository';

/**
 * @fileOverview API WALL: Zakat Calculations (Manager Guarded)
 */

export async function GET(req: Request) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'ACCESS_RESTRICTED' }, { status: 403 });

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
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

        const body = await req.json();
        const repo = new ZakatRepository();
        
        const finalResult = ZakatRepository.calculate(body);
        await repo.save(finalResult);
        
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
