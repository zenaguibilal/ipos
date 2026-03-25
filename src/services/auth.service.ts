// In a real Supabase implementation, this would interact with the Supabase client.
// For now, it mocks session management using LocalStorage.

interface Session {
    id: string;
    email: string;
}

const SESSION_KEY = 'ipos-session';

class AuthService {
    /**
     * Signs a user in. In this mock, password is not checked.
     * @param email The user's email
     * @param password The user's password (ignored in mock)
     * @returns A promise that resolves to the user session.
     */
    async signIn(email: string, password?: string): Promise<Session> {
        console.log(`AuthService: Signing in ${email}`);
        // In a real app, you would validate credentials here.
        const mockSession: Session = { id: 'user_id_placeholder', email };
        localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));
        return mockSession;
    }

    /**
     * Signs the current user out.
     */
    async signOut(): Promise<void> {
        console.log('AuthService: Signing out');
        localStorage.removeItem(SESSION_KEY);
    }

    /**
     * Retrieves the current session from LocalStorage.
     * @returns The session object or null if not logged in.
     */
    getSession(): Session | null {
        try {
            const sessionStr = localStorage.getItem(SESSION_KEY);
            if (sessionStr) {
                return JSON.parse(sessionStr);
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}

export const authService = new AuthService();
