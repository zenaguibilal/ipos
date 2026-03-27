import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';

/**
 * @fileOverview API WALL: Products
 * Enforces strict schema validation and deterministic normalization.
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const barcode = searchParams.get('barcode');
        const repo = new ProductRepository();

        if (barcode) {
            const product = await repo.findByBarcode(barcode);
            return NextResponse.json({ data: product });
        }

        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body.name || body.price === undefined) {
            return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS" }, { status: 400 });
        }
        const repo = new ProductRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
