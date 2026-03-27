'use client';

/**
 * @fileOverview Application Bootstrapper
 * Synchronizes Supabase auth session with Zustand and initializes the user profile.
 * Hardened to prevent race conditions and ensure single-source-of-truth.
 */

import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

export function StoreInitializer() {
    const initialized = useRef(false);
    const { setSession, fetchProfile } = useAppStore(state => state.actions);
    const session = useAppStore(state => state.session);

    useEffect(() => {
        const supabase = createClient();
        
        if (!initialized.current) {
            // Initial mount session probe
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                setSession(currentSession);
            });
            
            // Real-time listener for auth lifecycle
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, newSession) => {
                    setSession(newSession);
                }
            );
            
            initialized.current = true;
            return () => subscription?.unsubscribe();
        }
    }, [setSession]);

    // Profile lazy-loading upon session stabilization
    useEffect(() => {
        if (session?.user?.id) {
            fetchProfile().catch(err => {
                console.error("Critical: Profile initialization failed", err);
            });
        }
    }, [session?.user?.id, fetchProfile]);

    return null;
}
