import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CompanyProfile } from '@/lib/types';
import { profileService } from '@/services';

interface SettingsState {
    profile: CompanyProfile | null;
    isLoading: boolean;
    loadProfile: () => Promise<void>;
    updateProfile: (data: Partial<Omit<CompanyProfile, 'id'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
    immer((set) => ({
        profile: null,
        isLoading: true,
        loadProfile: async () => {
            set({ isLoading: true });
            const profile = await profileService.getCompanyProfile();
            set({ profile, isLoading: false });
        },
        updateProfile: async (data) => {
            await profileService.updateCompanyProfile(data);
            const profile = await profileService.getCompanyProfile();
            set({ profile });
        },
    }))
);
