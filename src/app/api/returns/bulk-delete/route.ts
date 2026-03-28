
import { NextResponse } from 'next/server';
import { ReturnRepository } from '@/repositories/return.repository';
import { CompanyRepository } from '@/repositories/company.repository';

/**
 * @fileOverview API WALL: Bulk Return Deletion (Role Guarded)
 * المركز السيادي لإلغاء المرتجعات بشكل جماعي وتصحيح المخزون والديون.
 */

export async function POST(req: Request) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'MANAGEMENT_AUTHORITY_REQUIRED' }, { status: 403 });

        const { uuids } = await req.json();
        if (!uuids || !Array.isArray(uuids)) throw new Error("UUIDS_REQUIRED");

        const repo = new ReturnRepository();
        
        // Sequential deletion to ensure transactional integrity per resource
        // This ensures stock and balance are recalculated correctly for each return
        for (const uuid of uuids) {
            await repo.delete(uuid);
        }

        return NextResponse.json({ data: { success: true, count: uuids.length } });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Bulk Return Deletion Failed:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
