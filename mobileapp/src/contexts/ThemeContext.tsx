import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    light: string;
    dark: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    disabled: string;
    placeholder: string;
    card: string;
    notification: string;
  };
}

const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#A78BFA',
    light: '#F2F2F7',
    dark: '#1C1C1E',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6D6D80',
    border: '#C6C6C8',
    disabled: '#C6C6C8',
    placeholder: '#C7C7CD',
    card: '#FFFFFF',
    notification: '#FF3B30',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: {
    primary: '#A78BFA',
    secondary: '#C4B5FD',
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
    info: '#C4B5FD',
    light: '#F2F2F7',
    dark: '#1C1C1E',
    background: '#0D1117',
    surface: '#161B22',
    text: '#F0F6FC',
    textSecondary: '#7C8396',
    border: '#30363D',
    disabled: '#484F58',
    placeholder: '#6E7681',
    card: '#21262D',
    notification: '#FF453A',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemIsDark, setSystemIsDark] = useState(false);

  // Determine the actual theme based on mode and system preference
  const getActualTheme = (mode: ThemeMode, systemDark: boolean): Theme => {
    if (mode === 'system') {
      return systemDark ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getActualTheme(themeMode, systemIsDark);

  useEffect(() => {
    loadThemePreference();

    // Listen for system theme changes
    // Note: In a real app, you'd use Appearance.addChangeListener from react-native
    // For now, we'll just detect it once
    detectSystemTheme();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const detectSystemTheme = () => {
    // In a real implementation, use Appearance.getColorScheme()
    // For this demo, we'll default to light
    setSystemIsDark(false);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = theme.isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}