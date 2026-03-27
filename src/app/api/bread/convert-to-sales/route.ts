import { NextResponse } from 'next/server';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';

/**
 * @fileOverview API WALL: Conversion of Bread Orders to Invoices (Proxy only)
 */

export async function POST(req: Request) {
    try {
        const { orderUuids, breadPrice } = await req.json();
        if (!orderUuids || !Array.isArray(orderUuids)) throw new Error("UUIDS_REQUIRED");
        if (!breadPrice || breadPrice <= 0) throw new Error("INVALID_PRICE");

        const breadRepo = new BreadOrderRepository();
        await breadRepo.convertOrdersToSales(orderUuids, breadPrice);

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
