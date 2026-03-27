
import { NextResponse } from 'next/server';
import { InventoryRepository } from '@/repositories/inventory.repository';

/**
 * @fileOverview API WALL: Inventory Movements
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productUuid = searchParams.get('productUuid');
        if (!productUuid) throw new Error("PRODUCT_UUID_REQUIRED");
        
        const repo = new InventoryRepository();
        const data = await repo.getByProductUuid(productUuid);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
