'use client';

import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef } from "react";

export function StoreInitializer() {
    const initialized = useRef(false);
    const { initSession } = useAppStore(state => state.actions);

    useEffect(() => {
        if (!initialized.current) {
            initSession();
            initialized.current = true;
        }
    }, [initSession]);

    return null;
}
