
'use client';
/**
 * @fileOverview Backup Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';

class BackupService {
    async createBackup(): Promise<void> {
        return api.post('backup', {});
    }

    async listBackups(): Promise<any[]> {
        return api.get<any[]>('backup');
    }
    
    async deleteBackup(backupName: string): Promise<void> {
        return api.delete(`backup?name=${backupName}`);
    }

    async getBackupData(backupName: string): Promise<any> {
        return api.get(`backup/details?name=${backupName}`);
    }

    async restoreBackup(backupName: string): Promise<void> {
        return api.post('backup/restore', { name: backupName });
    }
}

export const backupService = new BackupService();
