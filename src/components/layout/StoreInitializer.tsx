'use client';

import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef } from "react";

export function StoreInitializer() {
    const initialized = useRef(false);
    const { initSession, fetchProfile } = useAppStore(state => state.actions);

    useEffect(() => {
        if (!initialized.current) {
            initSession();
            fetchProfile();
            initialized.current = true;
        }
    }, [initSession, fetchProfile]);

    return null;
}
