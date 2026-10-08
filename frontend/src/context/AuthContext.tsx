import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  loginApi, 
  registerApi, 
  fetchMeApi, 
  fetchDemoAccountsApi, 
  type AuthUser, 
  type UserRole, 
  type DemoAccount 
} from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role: UserRole; department?: string }) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  demoAccounts: DemoAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flowmind_token'));
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  // Load demo accounts
  useEffect(() => {
    fetchDemoAccountsApi()
      .then((res) => setDemoAccounts(res.accounts))
      .catch((err) => console.warn('Could not fetch demo accounts:', err));
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('flowmind_token');
      if (savedToken) {
        try {
          const profile = await fetchMeApi();
          setUser(profile);
          setToken(savedToken);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('Saved token expired or invalid, clearing session.');
          localStorage.removeItem('flowmind_token');
        }
      }

      // Auto-login as default Admin (Elena) if no active session
      try {
        const res = await loginApi('elena@flowmind.ai', 'Flowmind@123');
        localStorage.setItem('flowmind_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } catch (err) {
        console.warn('Default admin auto-login failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);
    localStorage.setItem('flowmind_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: { name: string; email: string; password: string; role: UserRole; department?: string }) => {
    const res = await registerApi(payload);
    localStorage.setItem('flowmind_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('flowmind_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const target = demoAccounts.find((a) => a.role === targetRole);
    if (!target) return;
    try {
      await login(target.email, 'Flowmind@123');
    } catch (err) {
      console.error(`Failed to switch to demo role ${targetRole}:`, err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        demoAccounts
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
