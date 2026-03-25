'use client';

import { v4 as uuidv4 } from 'uuid';
import { companyRepository } from '@/services/company.repository';
import type { CompanyProfile } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';

class ProfileService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getProfile(): Promise<CompanyProfile | null> {
        try {
            let profile = await companyRepository.get();
            if (!profile) {
                const newProfile: CompanyProfile = {
                    uuid: uuidv4(),
                    user_id: this.getUserId(),
                    companyName: "Mon Magasin",
                    role: 'admin', // Default role for new user
                };
                return await companyRepository.add(newProfile);
            }
            return profile;
        } catch (error) {
            throw error;
        }
    }

    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        try {
            const existing = await this.getProfile();
            if (!existing) {
                 throw new Error("Profil non trouvé, impossible de mettre à jour.");
            }

            const dataToUpdate: Partial<CompanyProfile> = {
                ...profileData,
                updatedAt: new Date(),
            };

            const updated = await companyRepository.update(dataToUpdate);
            return { ...existing, ...updated };
        } catch (error) {
            throw error;
        }
    }
}

export const profileService = new ProfileService();
