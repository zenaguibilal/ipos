import { NextResponse } from 'next/server';
import { predictStockNeeds } from '@/ai/flows/stock-prediction-flow';
import { ProductRepository } from '@/repositories/product.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { subDays } from 'date-fns';

/**
 * @fileOverview API WALL: AI Stock Prediction Gateway
 */

export async function POST() {
    try {
        const productRepo = new ProductRepository();
        const saleRepo = new SaleRepository();

        const [products, allSales] = await Promise.all([
            productRepo.getAll(),
            saleRepo.getAll()
        ]);

        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentSales = allSales
            .filter(s => new Date(s.createdAt) >= thirtyDaysAgo)
            .flatMap(s => s.items.map(i => ({
                productName: i.name,
                quantity: i.quantity,
                date: s.createdAt
            })));

        const input = {
            products: products.map(p => ({
                name: p.name,
                quantity: p.quantity,
                minStockLevel: p.minStockLevel,
                category: p.category
            })),
            recentSales
        };

        const result = await predictStockNeeds(input);
        return NextResponse.json({ data: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}