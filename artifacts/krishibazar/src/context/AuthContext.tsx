import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserLogin, UserRegistration, AuthResponse } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserRegistration) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (storedToken: string) => {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` }
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('kb_token');
      if (!storedToken) { setLoading(false); return; }
      try {
        const ok = await fetchMe(storedToken);
        if (ok) setToken(storedToken);
        else localStorage.removeItem('kb_token');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (data: UserLogin) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Login failed");
    const result: AuthResponse = await res.json();
    localStorage.setItem('kb_token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const register = async (data: UserRegistration) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Registration failed");
    const result: AuthResponse = await res.json();
    localStorage.setItem('kb_token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('kb_token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    const stored = localStorage.getItem('kb_token');
    if (!stored) return;
    await fetchMe(stored);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
