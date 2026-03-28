import { NextResponse } from 'next/server';
import { ReturnRepository } from '@/repositories/return.repository';
import { CompanyRepository } from '@/repositories/company.repository';

/**
 * @fileOverview API WALL: Return Resource (Cancellation)
 */

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'MANAGEMENT_AUTHORITY_REQUIRED' }, { status: 403 });

        const repo = new ReturnRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}