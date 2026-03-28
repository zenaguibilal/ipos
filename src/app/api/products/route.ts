import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { CompanyRepository } from '@/repositories/company.repository';
import { ProductSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Products (Role Guarded)
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query') || undefined;
        const category = searchParams.get('category') || undefined;
        const supplierUuid = searchParams.get('supplierUuid') || undefined;

        const repo = new ProductRepository();
        const data = await repo.getAll({ query, category, supplierUuid });
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
        const validatedData = ProductSchema.parse(body);
        const repo = new ProductRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
