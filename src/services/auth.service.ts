'use client';

import { createClient } from "@/utils/supabase/client";

class AuthService {
    private supabase = createClient();

    async signIn(email: string, password?: string) {
        if (!password) {
            throw new Error("Le mot de passe est requis.");
        }
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message === 'Invalid login credentials') {
                throw new Error("Email ou mot de passe incorrect.");
            }
            throw new Error(error.message);
        }
        return data.session;
    }
    
    async signUp(email: string, password?: string) {
        if (!password) {
            throw new Error("Le mot de passe est requis.");
        }
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw new Error(error.message);
        }
        if (!data.session) {
            throw new Error("L'inscription a réussi, mais la session n'a pas pu être créée. Veuillez vous connecter.");
        }
        return data.session;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            throw new Error(error.message);
        }
    }

    async getSession() {
        const { data, error } = await this.supabase.auth.getSession();
        if (error) {
            throw new Error(error.message);
        }
        return data.session;
    }
}

export const authService = new AuthService();
