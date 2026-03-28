
'use client';

import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef } from "react";

/**
 * @fileOverview Application Bootstrapper (Phase 11 Consolidated)
 * Deterministically syncs session and profile.
 * Applies global UI scale (Resolution) and display modes.
 */

export function StoreInitializer() {
    const initialized = useRef(false);
    const { setAuth, fetchProfile } = useAppStore(state => state.actions);
    const { interfaceScale, isCompactMode, isMotionEnabled } = useAppStore();

    // Apply global UI Scale
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.fontSize = `${interfaceScale}%`;
        }
    }, [interfaceScale]);

    // Apply global Display Modes
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.classList.toggle('compact-mode', isCompactMode);
            document.body.classList.toggle('reduce-motion', !isMotionEnabled);
        }
    }, [isCompactMode, isMotionEnabled]);

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
