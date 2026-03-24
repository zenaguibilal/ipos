'use client';

import { db } from '@/lib/database';
import type { CompanyProfile } from '@/lib/types';

export class ProfileService {
    async getCompanyProfile(): Promise<CompanyProfile | null> {
        return await db.companyProfile.get(1) ?? null;
    }

    async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<void> {
        await db.companyProfile.put({ id: 1, ...profileData, updatedAt: new Date() });
    }
}
