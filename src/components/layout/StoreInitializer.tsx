
'use client';

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
            // Check initial session
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
            });
            
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setSession(session);
                }
            );
            
            initialized.current = true;
            
            return () => {
                subscription?.unsubscribe();
            };
        }
    }, [setSession]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchProfile();
        }
    }, [session?.user?.id, fetchProfile]);

    return null;
}
