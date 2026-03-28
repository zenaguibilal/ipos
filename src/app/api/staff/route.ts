import { NextResponse } from 'next/server';
import { StaffRepository } from '@/repositories/staff.repository';
import { CompanyRepository } from '@/repositories/company.repository';
import { StaffMemberSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Staff Management (Admin Only Protection)
 * PHASE 13: Enforced strict admin-only authority for personnel records.
 */

export async function GET() {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin', 'manager']);
        if (!isAuthorized) return NextResponse.json({ error: 'UNAUTHORIZED_ACCESS' }, { status: 403 });

        const repo = new StaffRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const companyRepo = new CompanyRepository();
        const isAuthorized = await companyRepo.checkRole(['admin']);
        if (!isAuthorized) return NextResponse.json({ error: 'ADMIN_AUTHORITY_REQUIRED' }, { status: 403 });

        const body = await req.json();
        const validatedData = StaffMemberSchema.parse(body);
        const repo = new StaffRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
