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
      // Also update the sheetsService if the URL changes
      if (profile?.syncUrl && profile.syncUrl !== sheetsService.scriptUrl) {
          sheetsService.scriptUrl = profile.syncUrl;
      }
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
    
    const interval = setInterval(updateStatus, 5000); // Check every 5 seconds
    updateStatus(); // Initial check

    return () => clearInterval(interval);
  }, [companyProfile]); // Rerun if profile changes

  const syncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      // Re-fetch profile right before sync to ensure URL is up-to-date
      await fetchProfile();
      const result = await sheetsService.fullSync();
      // Re-fetch profile again after sync to get the new lastSyncDate
      await fetchProfile();

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
