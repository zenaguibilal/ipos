import { NextResponse } from 'next/server';
import { CompanyRepository } from '@/repositories/company.repository';

/**
 * @fileOverview API WALL: Company Profile Gateway
 * تم تحويل المسار لاستخدام Repository حصرياً لفرض سلطة البيانات.
 */

export async function GET() {
    try {
        const repo = new CompanyRepository();
        const data = await repo.get();
        if (!data) return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 404 });
        
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const repo = new CompanyRepository();
        const data = await repo.update(body);

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
