'use client';

import { useState, useEffect } from 'react';
import { sheetsService } from '@/services/googleSheets';
import type { CompanyProfile } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';

interface SyncStatus {
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: string | null;
    pendingItems: number;
    error: string | null;
}

export const useSync = () => {
  const companyProfile = useLiveQuery<CompanyProfile | null>(() => dataService.getCompanyProfile());
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    error: null,
  });

  useEffect(() => {
    sheetsService.init();
    const lastSyncFromDb = companyProfile?.lastSyncDate || null;

    const interval = setInterval(() => {
      const currentStatus = sheetsService.getStatus();
      setSyncStatus(prev => ({
        ...prev,
        ...currentStatus,
        lastSync: companyProfile?.lastSyncDate || prev.lastSync || lastSyncFromDb,
      }));
    }, 5000);

    // Initial status check
     const initialStatus = sheetsService.getStatus();
      setSyncStatus(prev => ({
        ...prev,
        ...initialStatus,
        lastSync: lastSyncFromDb,
        pendingItems: initialStatus.pendingItems,
      }));

    return () => clearInterval(interval);
  }, [companyProfile]);

  const syncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const result = await sheetsService.fullSync();
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: result.lastSync,
        pendingItems: 0,
      }));
      return result;
    } catch (error: any) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error.message,
      }));
      throw error;
    }
  };

  return { syncStatus, syncNow };
};
