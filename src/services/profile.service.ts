'use client';

import { db } from '@/lib/database';
import type { CompanyProfile } from '@/lib/types';
import { syncService } from './sync.service';
import { v4 as uuidv4 } from 'uuid';

export class ProfileService {
    async getCompanyProfile(): Promise<CompanyProfile | null> {
        return await db.companyProfile.get(1) ?? null;
    }

    async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<void> {
        const now = new Date();
        const existingProfile = await db.companyProfile.get(1);
        const uuid = existingProfile?.uuid || uuidv4();
        
        const dataToUpdate: CompanyProfile = {
            id: 1,
            uuid,
            ...profileData,
            updatedAt: now,
            last_modified_by: syncService.getLocalDeviceId(),
        };

        if (existingProfile) {
            dataToUpdate.sync_status = existingProfile.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';
            await db.companyProfile.update(1, dataToUpdate);
            await syncService.queueSyncOperation('companyProfile', uuid, 'update', { ...dataToUpdate, id: undefined });
        } else {
            dataToUpdate.createdAt = now;
            dataToUpdate.sync_status = 'pending_create';
            await db.companyProfile.add(dataToUpdate);
            await syncService.queueSyncOperation('companyProfile', uuid, 'create', { ...dataToUpdate, id: undefined });
        }
    }
}
