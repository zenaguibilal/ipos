
import { NextResponse } from 'next/server';
import { SaleRepository } from '@/repositories/sale.repository';

/**
 * @fileOverview API WALL: Customer Financial Stats
 */

export async function GET(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const saleRepo = new SaleRepository();
        const sales = await saleRepo.findByCustomerUuid(params.uuid);
        
        const totalSalesCount = sales.length;
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const averageBasketValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        // Extract top products
        const productMap = new Map();
        sales.forEach(s => {
            s.items.forEach(item => {
                const current = productMap.get(item.productUuid) || { name: item.name, quantity: 0, productUuid: item.productUuid };
                current.quantity += item.quantity;
                productMap.set(item.productUuid, current);
            });
        });

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return NextResponse.json({
            data: {
                financialSummary: { totalSalesCount, totalRevenue, averageBasketValue },
                topProducts
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
