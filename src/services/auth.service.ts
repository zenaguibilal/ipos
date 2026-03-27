
'use client';

import { api } from "@/lib/api-client";
import type { Session } from '@supabase/supabase-js';

/**
 * @fileOverview Auth Service (API Wall Implementation)
 * يمنع الوصول المباشر لـ Supabase Auth من المكونات.
 */

class AuthService {
    async signIn(email: string, password?: string): Promise<Session> {
        if (!password) throw new Error("PASSWORD_REQUIRED");
        return api.post<Session>('auth/login', { email, password });
    }

    async signOut(): Promise<void> {
        return api.post('auth/signout', {});
    }
}

export const authService = new AuthService();
