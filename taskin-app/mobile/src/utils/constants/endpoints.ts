// mobile/src/utils/constants/endpoints.ts
import Constants from 'expo-constants';

// Configuração da URL base da API
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Em desenvolvimento, use o IP local ou localhost
    // Para emulador Android: 10.0.2.2
    // Para dispositivo físico: use o IP da sua máquina
    return 'http://10.0.2.2:8080/api';
  } else {
    // Em produção, use a URL real da API
    return 'https://api.taskin.com/api';
  }
};

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHECK_EMAIL: '/auth/check-email',
  },
  
  // Tasks
  TASKS: {
    BASE: '/tasks',
    SEARCH: '/tasks/search',
    STATISTICS: '/tasks/statistics',
    TODAY: '/tasks/today',
    OVERDUE: '/tasks/overdue',
    PENDING: '/tasks/pending',
    COMPLETED: '/tasks/completed',
    BULK_COMPLETE: '/tasks/bulk/complete',
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    WITH_STATS: '/categories/with-stats',
    CREATE_DEFAULTS: '/categories/create-defaults',
    REORDER: '/categories/reorder',
  },
  
  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
    TODAY: '/dashboard/today',
  },
};

// mobile/src/utils/constants/colors.ts
import { ThemeColors } from '../../types/theme';

// Cores para tema claro
export const LIGHT_COLORS: ThemeColors = {
  primary: '#6366F1',        // Indigo - estimula foco
  secondary: '#10B981',      // Emerald - transmite calma
  accent: '#8B5CF6',         // Violet - criatividade
  background: '#FFFFFF',     // Branco puro
  surface: '#F9FAFB',        // Cinza muito claro
  card: '#FFFFFF',           // Branco para cards
  text: '#111827',           // Cinza muito escuro
  textSecondary: '#6B7280',  // Cinza médio
  border: '#E5E7EB',         // Cinza claro para bordas
  error: '#EF4444',          // Vermelho para erros
  warning: '#F59E0B',        // Amarelo para avisos
  success: '#10B981',        // Verde para sucesso
  priority: {
    high: '#EF4444',         // Vermelho para alta prioridade
    medium: '#F59E0B',       // Amarelo para média prioridade
    low: '#10B981',          // Verde para baixa prioridade
    urgent: '#DC2626',       // Vermelho mais escuro para urgente
  },
};

// Cores para tema escuro
export const DARK_COLORS: ThemeColors = {
  primary: '#818CF8',        // Indigo mais claro
  secondary: '#34D399',      // Emerald mais claro
  accent: '#A78BFA',         // Violet mais claro
  background: '#111827',     // Cinza muito escuro
  surface: '#1F2937',        // Cinza escuro
  card: '#374151',           // Cinza médio escuro
  text: '#F9FAFB',           // Branco quase puro
  textSecondary: '#D1D5DB',  // Cinza claro
  border: '#4B5563',         // Cinza médio
  error: '#F87171',          // Vermelho mais claro
  warning: '#FBBF24',        // Amarelo mais claro
  success: '#34D399',        // Verde mais claro
  priority: {
    high: '#F87171',         // Vermelho claro
    medium: '#FBBF24',       // Amarelo claro
    low: '#34D399',          // Verde claro
    urgent: '#FCA5A5',       // Vermelho muito claro
  },
};

// Cores por categoria (padrão)
export const CATEGORY_COLORS = {
  WORK: '#3B82F6',           // Azul para trabalho
  PERSONAL: '#10B981',       // Verde para pessoal
  STUDY: '#8B5CF6',          // Roxo para estudos
  HEALTH: '#F59E0B',         // Amarelo para saúde
  HOME: '#EF4444',           // Vermelho para casa
  FINANCE: '#06B6D4',        // Ciano para finanças
  SHOPPING: '#EC4899',       // Rosa para compras
};

// mobile/src/utils/constants/sizes.ts
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

export const ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

// Dimensões comuns de componentes
export const COMPONENT_SIZES = {
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  HEADER_HEIGHT: 60,
  TAB_BAR_HEIGHT: 70,
  CARD_MIN_HEIGHT: 80,
  AVATAR_SIZE: 40,
  FAB_SIZE: 56,
};

// mobile/src/utils/constants/fonts.ts
export const FONT_FAMILIES = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const FONT_WEIGHTS = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

// mobile/src/utils/config/environment.ts
import Constants from 'expo-constants';

interface Environment {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  IS_DEV: boolean;
  IS_PREVIEW: boolean;
  IS_PRODUCTION: boolean;
}

const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.releaseChannel || 'default';
  
  return {
    API_BASE_URL: API_BASE_URL,
    APP_NAME: 'Taskin',
    APP_VERSION: Constants.expoConfig?.version || '1.0.0',
    IS_DEV: __DEV__,
    IS_PREVIEW: releaseChannel === 'preview',
    IS_PRODUCTION: releaseChannel === 'production',
  };
};

export const ENV = getEnvironment();

// Configurações por ambiente
export const CONFIG = {
  // Timeouts
  API_TIMEOUT: 10000,
  OFFLINE_TIMEOUT: 5000,
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  MAX_CACHE_SIZE: 50,
  
  // Paginação
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Validação
  MIN_PASSWORD_LENGTH: 6,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_TASK_DESCRIPTION_LENGTH: 2000,
  MAX_CATEGORY_NAME_LENGTH: 50,
  
  // Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  
  // Notificações
  DEFAULT_REMINDER_MINUTES: 15,
  MAX_REMINDER_MINUTES: 24 * 60, // 24 horas
  
  // Sincronização
  SYNC_INTERVAL: 30 * 1000, // 30 segundos
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// mobile/src/utils/config/database.ts
export const DATABASE_CONFIG = {
  name: 'taskin.db',
  version: 1,
  displayName: 'Taskin Database',
  size: 200000, // 200KB
};

// Configurações das tabelas SQLite local
export const TABLES = {
  USERS: 'users',
  TASKS: 'tasks',
  CATEGORIES: 'categories',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings',
};

// SQL para criação das tabelas
export const CREATE_TABLES_SQL = {
  USERS: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      language TEXT DEFAULT 'pt-BR',
      theme_preference TEXT DEFAULT 'system',
      notifications_enabled BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );
  `,
  
  TASKS: `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      server_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'PENDING',
      due_date TEXT,
      completed_at TEXT,
      estimated_minutes INTEGER,
      notes TEXT,
      tags TEXT,
      is_recurring BOOLEAN DEFAULT 0,
      reminder_enabled BOOLEAN DEFAULT 0,
      reminder_minutes_before INTEGER DEFAULT 15,
      category_id INTEGER,
      user_id INTEGER NOT NULL,
      client_id TEXT UNIQUE,
      version INTEGER DEFAULT 1,
      sync_status TEXT DEFAULT 'PENDING_SYNC',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `,
  
  CATEGORIES: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      server_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#6366F1',
      icon TEXT DEFAULT 'folder',
      is_default BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL,
      client_id TEXT UNIQUE,
      version INTEGER DEFAULT 1,
      sync_status TEXT DEFAULT 'PENDING_SYNC',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `,
  
  SYNC_QUEUE: `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      attempted_at TEXT
    );
  `,
  
  SETTINGS: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
};