
'use client';

import { api } from '@/lib/api-client';
import type { DashboardData } from '@/lib/types';

/**
 * @fileOverview Dashboard Service (API Wall Purified)
 * تم استئصال كافة المستودعات. الخدمة الآن مجرد بوابة لجدار الحماية.
 */

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        const query = `from=${from.toISOString()}&to=${to.toISOString()}`;
        return api.get<DashboardData>(`dashboard?${query}`);
    }
}

export const dashboardService = new DashboardService();
