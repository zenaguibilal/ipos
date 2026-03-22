'use client';

import { useState, useEffect, useCallback } from 'react';
import { sheetsService } from '@/services/googleSheets';
import type { CompanyProfile } from '@/lib/types';
import { dataService } from '@/services/data-service';

interface SyncStatus {
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: string | null;
    pendingItems: number;
    error: string | null;
}

export const useSync = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  
  const fetchProfile = useCallback(async () => {
      const profile = await dataService.getCompanyProfile();
      setCompanyProfile(profile);
  }, []);
  
  useEffect(() => {
      fetchProfile();
  }, [fetchProfile]);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    error: null,
  });

  useEffect(() => {
    sheetsService.init();
    
    const updateStatus = () => {
        const currentStatus = sheetsService.getStatus();
        setSyncStatus(prev => ({
            ...prev,
            ...currentStatus,
            lastSync: companyProfile?.lastSyncDate || prev.lastSync,
        }));
    };
    
    const interval = setInterval(updateStatus, 5000);
    updateStatus();

    return () => clearInterval(interval);
  }, [companyProfile]);

  const syncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const result = await sheetsService.fullSync();
      const updatedProfile = await dataService.getCompanyProfile();
      setCompanyProfile(updatedProfile);

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
