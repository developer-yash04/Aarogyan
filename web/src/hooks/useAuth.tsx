import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'PATIENT' | 'HOSPITAL' | 'RESEARCHER' | null;

interface AuthContextType {
  address: string | null;
  role: Role;
  name: string | null;
  token: string | null;
  isLoading: boolean;
  login: (address: string, signature: string, message: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('aarogyan_jwt'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAddress(data.address);
          setRole(data.role);
          setName(data.name || data.orgName);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, [token]);

  const login = async (address: string, signature: string, message: string) => {
    const res = await fetch('http://localhost:3001/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature, message })
    });
    
    if (!res.ok) throw new Error('Login failed');
    
    const data = await res.json();
    setToken(data.token);
    setAddress(address);
    setRole(data.role);
    setName(data.name);
    localStorage.setItem('aarogyan_jwt', data.token);
  };

  const logout = () => {
    setToken(null);
    setAddress(null);
    setRole(null);
    setName(null);
    localStorage.removeItem('aarogyan_jwt');
  };

  return (
    <AuthContext.Provider value={{ address, role, name, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
