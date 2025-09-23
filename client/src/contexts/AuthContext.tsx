import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import keycloakService, { type KeycloakUser } from '../services/keycloakService';

interface AuthContextType {
  currentUser: KeycloakUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: () => Promise<void>;
  registerUser: (userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
  }) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<KeycloakUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (keycloakService.isAuthenticated()) {
        const userData = await keycloakService.getCurrentUser();
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setCurrentUser(null);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await keycloakService.loginWithCredentials(username, password);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const handleLogout = async () => {
    try {
      await keycloakService.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setCurrentUser(null);
    }
  };

  const handleRegister = async () => {
    try {
      await keycloakService.register();
    } catch (error) {
      console.error('Registration redirect failed:', error);
      throw error;
    }
  };

  const handleRegisterUser = async (userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
  }) => {
    try {
      return await keycloakService.registerUser(userData);
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const hasRole = (role: string): boolean => {
    return keycloakService.hasRole(role);
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        // Initialize Keycloak
        const authenticated = await keycloakService.init();
        
        if (authenticated && isMounted) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isLoggedIn: !!currentUser,
        logout: handleLogout,
        login: handleLogin,
        register: handleRegister,
        registerUser: handleRegisterUser,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
