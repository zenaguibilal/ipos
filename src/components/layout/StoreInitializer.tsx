
'use client';

import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api-client";

/**
 * @fileOverview Application Bootstrapper (Phase 11 Consolidated)
 * Deterministically syncs session and profile.
 */

export function StoreInitializer() {
    const initialized = useRef(false);
    const { setAuth, fetchProfile } = useAppStore(state => state.actions);

    useEffect(() => {
        if (!initialized.current) {
            const syncSession = async () => {
                try {
                    // Quick ping to check if session exists
                    const { data: { user } } = await fetch('/api/auth/session').then(res => res.json());
                    if (user) {
                        setAuth(user);
                        await fetchProfile();
                    }
                } catch (err) {
                    console.warn("Session sync failed:", err);
                }
            };

            syncSession();
            initialized.current = true;
        }
    }, [setAuth, fetchProfile]);

    return null;
}
