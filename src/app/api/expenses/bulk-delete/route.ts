import { NextResponse } from 'next/server';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { CompanyRepository } from '@/repositories/company.repository';

/**
 * @fileOverview API WALL: Bulk Expense Deletion (Role Guarded)
 */

export async function POST(req: Request) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'MANAGEMENT_AUTHORITY_REQUIRED' }, { status: 403 });

        const { uuids } = await req.json();
        if (!uuids || !Array.isArray(uuids)) throw new Error("UUIDS_REQUIRED");

        const repo = new ExpenseRepository();
        await repo.bulkDelete(uuids);

        return NextResponse.json({ data: { success: true, count: uuids.length } });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Bulk Expense Deletion Failed:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
