'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// The password is hardcoded here. In a real application, you would
// want to use an environment variable for this.
const SITE_PASSWORD = 'password';

interface PasswordContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check session storage on initial load
    const storedAuth = sessionStorage.getItem('is-authenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (password: string) => {
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem('is-authenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('is-authenticated');
    setIsAuthenticated(false);
  };

  return (
    <PasswordContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </PasswordContext.Provider>
  );
}

export function usePassword() {
  const context = useContext(PasswordContext);
  if (context === undefined) {
    throw new Error('usePassword must be used within a PasswordProvider');
  }
  return context;
}
