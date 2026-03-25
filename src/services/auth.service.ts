// In a real Supabase implementation, this will interact with the Supabase client.
// For now, it mocks session management in-memory.

interface Session {
    id: string;
    email: string;
}

// In-memory session store for the duration of the app lifetime.
let memorySession: Session | null = null;

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
        memorySession = mockSession;
        return mockSession;
    }

    /**
     * Signs the current user out.
     */
    async signOut(): Promise<void> {
        console.log('AuthService: Signing out');
        memorySession = null;
    }

    /**
     * Retrieves the current session from memory.
     * @returns The session object or null if not logged in.
     */
    getSession(): Session | null {
        return memorySession;
    }
}

export const authService = new AuthService();
