'use client';

import { useCartStore } from "@/stores/cartStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect, useRef } from "react";

export function StoreInitializer() {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            useCartStore.getState().actions.initCart();
            useSettingsStore.getState().loadProfile();
            initialized.current = true;
        }
    }, []);

    return null;
}
