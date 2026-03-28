
import { NextResponse } from 'next/server';
import { StaffRepository } from '@/repositories/staff.repository';
import { CompanyRepository } from '@/repositories/company.repository';
import { StaffMemberSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Staff Individual Resource (Admin Shielded)
 */

export async function PUT(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin']);
        if (!isAuthorized) return NextResponse.json({ error: 'ADMIN_AUTHORITY_REQUIRED' }, { status: 403 });

        const body = await req.json();
        const validatedData = StaffMemberSchema.partial().parse(body);
        const repo = new StaffRepository();
        const data = await repo.update(params.uuid, validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin']);
        if (!isAuthorized) return NextResponse.json({ error: 'ADMIN_AUTHORITY_REQUIRED' }, { status: 403 });

        const repo = new StaffRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
