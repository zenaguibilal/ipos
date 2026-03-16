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
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: companyProfile?.lastSyncDate || null,
    pendingItems: 0,
    error: null,
  });

  useEffect(() => {
    sheetsService.loadScriptUrl();
    const interval = setInterval(() => {
      setSyncStatus(prev => ({
        ...prev,
        ...sheetsService.getStatus(),
        lastSync: companyProfile?.lastSyncDate || prev.lastSync
      }));
    }, 5000);
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
