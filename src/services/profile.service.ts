
'use client';

import { v4 as uuidv4 } from 'uuid';
import { companyRepository } from '@/repositories/company.repository';
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
        let profile = await companyRepository.get();
        if (!profile) {
            // Create a default profile if it doesn't exist
            const newProfile: CompanyProfile = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                companyName: "Mon Magasin",
            };
            return await companyRepository.add(newProfile);
        }
        return profile;
    }

    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const existing = await this.getProfile();
        if (!existing) {
             throw new Error("Profil non trouvé, impossible de mettre à jour.");
        }

        const dataToUpdate: Partial<CompanyProfile> = {
            ...profileData,
            updatedAt: new Date(),
        };

        // In the new architecture, the repository handles the update.
        // It knows it's a singleton and how to update it.
        const updated = await companyRepository.update(dataToUpdate);
        return { ...existing, ...updated };
    }
}

export const profileService = new ProfileService();
