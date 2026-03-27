import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';

/**
 * @fileOverview API WALL: Products
 */

export async function GET(req: Request) {
    try {
        const repo = new ProductRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new ProductRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}