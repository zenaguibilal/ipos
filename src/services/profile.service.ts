'use client';
/**
 * @fileOverview Profile Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { CompanyProfile } from '@/lib/types';

class ProfileService {
    async getProfile(): Promise<CompanyProfile | null> {
        return api.get<CompanyProfile>('profile');
    }

    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        return api.put<CompanyProfile>('profile', profileData);
    }
}

export const profileService = new ProfileService();
