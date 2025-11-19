'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const PASSWORD_STORAGE_KEY = 'site_password';
const DEFAULT_PASSWORD = 'password';

interface PasswordContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sitePassword, setSitePassword] = useState(DEFAULT_PASSWORD);

  useEffect(() => {
    // Check session storage for authentication status on initial load
    const storedAuth = sessionStorage.getItem('is-authenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    
    // Check local storage for a saved password
    const savedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (savedPassword) {
      setSitePassword(savedPassword);
    } else {
        localStorage.setItem(PASSWORD_STORAGE_KEY, DEFAULT_PASSWORD);
    }
  }, []);

  const login = (password: string) => {
    if (password === sitePassword) {
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
  
  const changePassword = (oldPassword: string, newPassword: string) => {
      if (oldPassword === sitePassword) {
          localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
          setSitePassword(newPassword);
          return true;
      }
      return false;
  }

  return (
    <PasswordContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
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
