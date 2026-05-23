import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, VendorRequest, UserRole } from '../types';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  vendorRequest: VendorRequest | null;
  login: (emailOrPhone: string, code: string) => Promise<User>;
  signup: (payload: { name: string; email: string; phone: string; code: string; role: UserRole; storeName?: string }) => Promise<User>;
  logout: () => void;
  updateVendorRequest: (request: VendorRequest) => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [vendorRequest, setVendorRequest] = useState<VendorRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-authenticate caller if token exists in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('omni_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setVendorRequest(data.vendorRequest);
      } else {
        // Clear broken session
        logout();
      }
    } catch (e) {
      console.error('Profile sync interruption:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrPhone: string, code: string): Promise<User> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password: code })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication process stopped.');
      }
      localStorage.setItem('omni_token', data.token);
      setToken(data.token);
      setUser(data.user);
      // Fetch full details
      await fetchProfile(data.token);
      return data.user;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const signup = async (payload: { name: string; email: string; phone: string; code: string; role: UserRole; storeName?: string }): Promise<User> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          password: payload.code,
          role: payload.role,
          storeName: payload.storeName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      localStorage.setItem('omni_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await fetchProfile(data.token);
      return data.user;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('omni_token');
    setToken(null);
    setUser(null);
    setVendorRequest(null);
    setError(null);
  };

  const updateVendorRequest = (request: VendorRequest) => {
    setVendorRequest(request);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        vendorRequest,
        login,
        signup,
        logout,
        updateVendorRequest,
        refreshProfile,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
