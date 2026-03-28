
import { NextResponse } from 'next/server';
import { StockRepository } from '@/repositories/stock.repository';
import { CompanyRepository } from '@/repositories/company.repository';

/**
 * @fileOverview API WALL: Bulk Stock Intake Deletion (Role Guarded)
 */

export async function POST(req: Request) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'ADMIN_AUTHORITY_REQUIRED' }, { status: 403 });

        const { uuids } = await req.json();
        if (!uuids || !Array.isArray(uuids)) throw new Error("UUIDS_REQUIRED");

        const repo = new StockRepository();
        
        // Sequential deletion to ensure transactional integrity per resource
        for (const uuid of uuids) {
            await repo.delete(uuid);
        }

        return NextResponse.json({ data: { success: true, count: uuids.length } });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Bulk Stock Deletion Failed:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
