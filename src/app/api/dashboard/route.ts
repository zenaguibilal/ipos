import { NextResponse } from 'next/server';
import { DashboardRepository } from '@/repositories/dashboard.repository';
import { startOfDay, endOfDay, subDays } from 'date-fns';

/**
 * @fileOverview API WALL: Unified Dashboard Analytics (Clean Proxy)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const from = fromParam ? new Date(fromParam) : startOfDay(subDays(new Date(), 30));
        const to = toParam ? new Date(toParam) : endOfDay(new Date());

        const repo = new DashboardRepository();
        const data = await repo.getAnalytics(from, to);

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}