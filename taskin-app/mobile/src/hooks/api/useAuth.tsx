// mobile/src/hooks/api/useAuth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../types/auth';
import { authApi } from '../../services/api/authApi';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@taskin_token';
const REFRESH_TOKEN_KEY = '@taskin_refresh_token';
const USER_KEY = '@taskin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        // Configurar token no axios
        authApi.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verificar se token ainda é válido
        try {
          const response = await authApi.get('/me');
          setUser(response.data);
        } catch (error) {
          // Token inválido, tentar renovar
          await tryRefreshToken();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tryRefreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        const response = await authApi.post('/refresh', { refreshToken });
        await storeAuth(response.data);
      } else {
        await clearAuth();
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      await clearAuth();
    }
  };

  const storeAuth = async (authData: AuthResponse) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, authData.token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(authData.user)),
      ]);

      // Configurar token no axios
      authApi.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
      setUser(authData.user);
    } catch (error) {
      console.error('Erro ao salvar autenticação:', error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);

      delete authApi.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Erro ao limpar autenticação:', error);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.post('/login', credentials);
      await storeAuth(response.data);
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.post('/register', userData);
      await storeAuth(response.data);
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Tentar notificar o servidor sobre o logout
      await authApi.post('/logout').catch(() => {
        // Ignorar erro - logout local sempre deve funcionar
      });
    } finally {
      await clearAuth();
    }
  };

  const refreshToken = async () => {
    await tryRefreshToken();
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// mobile/src/hooks/ui/useTheme.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../../types/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: Theme['colors'];
}

const THEME_KEY = '@taskin_theme';

// Tema claro focado em produtividade
const lightTheme: Theme = {
  colors: {
    primary: '#6366F1', // Indigo - estimula foco
    secondary: '#10B981', // Emerald - transmite calma
    accent: '#8B5CF6', // Violet - criatividade
    background: '#FFFFFF',
    surface: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    white: '#FFFFFF',
    black: '#000000',
    priority: {
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
      urgent: '#DC2626',
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
};

// Tema escuro
const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#818CF8',
    secondary: '#34D399',
    accent: '#A78BFA',
    background: '#111827',
    surface: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#4B5563',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    white: '#FFFFFF',
    black: '#000000',
    priority: {
      high: '#F87171',
      medium: '#FBBF24',
      low: '#34D399',
      urgent: '#FCA5A5',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        setIsDark(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
    colors: theme.colors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}