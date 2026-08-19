import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthUser, LoginDto, RegisterDto } from '../api/auth.api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (permissionName: string) => boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('user_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      if (savedToken) {
        try {
          const res = await authApi.refreshToken();
          setToken(res.accessToken);
          setUser(res.user);
          localStorage.setItem('access_token', res.accessToken);
          localStorage.setItem('user_info', JSON.stringify(res.user));
        } catch (e) {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await authApi.login(dto);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('user_info', JSON.stringify(res.user));
  };

  const register = async (dto: RegisterDto) => {
    await authApi.register(dto);
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  const hasPermission = (permissionName: string): boolean => {
    if (isAdmin) return true;
    if (!user?.permissions) return false;
    return user.permissions.some(
      (p) => p.permission?.name === permissionName || (p as any).name === permissionName
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isAdmin,
        hasPermission,
        login,
        register,
        logout,
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
