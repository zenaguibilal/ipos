import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('q');
        if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

        const repo = new ProductRepository();
        const product = await repo.findByBarcode(code);
        return NextResponse.json({ data: product });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
