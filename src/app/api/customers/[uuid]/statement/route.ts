
import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';
import { SaleRepository } from '@/repositories/sale.repository';

/**
 * @fileOverview API WALL: Customer Statement Data
 */

export async function GET(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const custRepo = new CustomerRepository();
        const saleRepo = new SaleRepository();

        const [customer, allSales] = await Promise.all([
            custRepo.findByUuid(params.uuid),
            saleRepo.findByCustomerUuid(params.uuid)
        ]);

        if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

        const unpaidSales = allSales.filter(s => s.remainingBalance > 0);

        return NextResponse.json({
            data: { customer, unpaidSales }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
