'use client';

import { createClient } from "@/utils/supabase/client";

class AuthService {
    private supabase = createClient();

    async signIn(email: string, password?: string) {
        try {
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
        } catch (error) {
            throw error;
        }
    }
    
    async signUp(email: string, password?: string) {
        try {
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
        } catch (error) {
            throw error;
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                throw new Error(error.message);
            }
        } catch (error) {
            throw error;
        }
    }

    async getSession() {
        try {
            const { data, error } = await this.supabase.auth.getSession();
            if (error) {
                throw new Error(error.message);
            }
            return data.session;
        } catch (error) {
            throw error;
        }
    }

    async sendPasswordResetEmail(email: string): Promise<void> {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email);
            if (error) {
                throw new Error(error.message);
            }
        } catch(error: any) {
            throw new Error(error.message || "Une erreur est survenue lors de l'envoi de l'email.");
        }
    }
}

export const authService = new AuthService();
