'use client';

import { useState, useEffect } from 'react';
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
  
  // This effect fetches the profile when the hook mounts.
  useEffect(() => {
      const fetchProfile = async () => {
          const profile = await dataService.getCompanyProfile();
          setCompanyProfile(profile);
      };
      fetchProfile();
  }, []);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    error: null,
  });

  // This effect manages the sync status and polling.
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
  }, [companyProfile]); // It depends on companyProfile to get the latest lastSyncDate

  const syncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const result = await sheetsService.fullSync();
      // After a sync, re-fetch the profile to get the new lastSyncDate
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
      throw error; // Re-throw the error to be caught by the calling component
    }
  };

  return { syncStatus, syncNow };
};
