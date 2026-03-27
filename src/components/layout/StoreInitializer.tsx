'use client';

/**
 * @fileOverview Application Bootstrapper (Domination Mode)
 * تم رفع التبعية للتحقق من الجلسة.
 */

import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef } from "react";

export function StoreInitializer() {
    const initialized = useRef(false);
    const { fetchProfile } = useAppStore(state => state.actions);

    useEffect(() => {
        if (!initialized.current) {
            // جلب الإعدادات فوراً وبشكل حتمي
            fetchProfile().catch(err => {
                console.warn("Critical: Initial settings load failed", err);
            });
            initialized.current = true;
        }
    }, [fetchProfile]);

    return null;
}
