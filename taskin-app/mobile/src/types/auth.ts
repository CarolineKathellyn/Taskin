// ==================== AUTH TYPES ====================
// mobile/src/types/auth.ts
export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  language: string;
  themePreference: string;
  notificationsEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// ==================== TASK TYPES ====================
// mobile/src/types/task.ts
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING_SYNC = 'PENDING_SYNC',
  CONFLICT = 'CONFLICT',
  ERROR = 'ERROR'
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  notes?: string;
  tags?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  category?: CategoryInfo;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  syncStatus: SyncStatus;
  version: number;
  lastSyncAt?: string;
  isCompleted: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
}

export interface TaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  estimatedMinutes?: number;
  notes?: string;
  tags?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  categoryId?: number;
  clientId?: string;
}

// ==================== CATEGORY TYPES ====================
// mobile/src/types/category.ts
export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  syncStatus: SyncStatus;
  version: number;
  lastSyncAt?: string;
}

export interface CategoryInfo {
  id: number;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface CategoryRequest {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  clientId?: string;
}

// ==================== API TYPES ====================
// mobile/src/types/api.ts
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  error: string;
  message?: string;
  status: number;
  timestamp: string;
  path: string;
  validationErrors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  todayTasks: number;
  overdueTasks: number;
  weekTasks: number;
  completionRate: number;
  weeklyProductivity: number;
  byPriority: Record<string, number>;
  totalCategories: number;
}

export interface TodaySummary {
  todayTotal: number;
  todayPending: number;
  todayInProgress: number;
  todayCompleted: number;
  overdueTotal: number;
  upcomingHighPriority: Task[];
  dailyProgress: number;
}

// ==================== USER TYPES ====================
// mobile/src/types/user.ts
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  timezone: string;
  language: string;
  themePreference: string;
  notificationsEnabled: boolean;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  themePreference?: string;
  notificationsEnabled?: boolean;
}

// ==================== NAVIGATION TYPES ====================
// mobile/src/types/navigation.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: NavigatorScreenParams<TaskStackParamList>;
  Profile: undefined;
};

export type TaskStackParamList = {
  TaskList: {
    filter?: string;
    categoryId?: number;
  };
  TaskDetail: {
    taskId: number;
  };
  CreateTask: {
    categoryId?: number;
  };
  EditTask: {
    task: Task;
  };
};

// ==================== FILTER TYPES ====================
// mobile/src/types/filters.ts
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: number;
  dateFilter?: 'today' | 'overdue' | 'week' | 'month';
  searchQuery?: string;
}

export interface SortOptions {
  field: 'dueDate' | 'priority' | 'created' | 'title';
  direction: 'ASC' | 'DESC';
}

// ==================== SYNC TYPES ====================
// mobile/src/types/sync.ts
export interface SyncOperation {
  id: string;
  entityType: 'TASK' | 'CATEGORY' | 'USER';
  entityId: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errorCount: number;
  conflicts: SyncConflict[];
  timestamp: string;
}

export interface SyncConflict {
  entityType: string;
  entityId: number;
  localVersion: number;
  serverVersion: number;
  localData: any;
  serverData: any;
}