// Core domain types following SOLID principles

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: 'image' | 'document' | 'link';
  fileSize?: number;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // Now required - all tasks must have a due date
  categoryId?: string;
  projectId?: string;
  progressPercentage: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  parentTaskId?: string; // For recurring task instances
  attachments?: TaskAttachment[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  categoryId?: string;
  icon: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'baixa' | 'media' | 'alta';
export type TaskStatus = 'pendente' | 'em_progresso' | 'concluida';

// API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: string;
  email: string;
  name: string;
  expiresIn: number;
  expiresAt: string;
}

export interface SyncRequest {
  taskDatabase: string;
  lastSyncAt?: string;
}

export interface SyncResponse {
  taskDatabase?: string;
  lastSyncAt?: string;
  message: string;
  success: boolean;
}

// Database Types
export interface DatabaseTask {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  priority: string;
  status: string;
  due_date?: string;
  category_id?: string;
  project_id?: string;
  progress_percentage: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_recurring?: number; // SQLite uses integers for booleans
  recurrence_pattern?: string;
  parent_task_id?: string;
  attachments?: string; // JSON string of TaskAttachment[]
}

export interface DatabaseCategory {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  category_id?: string;
  icon: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Service Interfaces (Dependency Inversion Principle)
export interface IAuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(userData: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  getStoredToken(): Promise<string | null>;
  isTokenValid(token: string): boolean;
  refreshToken(): Promise<string>;
}

export interface IDatabaseService {
  initializeDatabase(): Promise<void>;
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  exportDatabase(): Promise<string>;
  importDatabase(data: string): Promise<void>;
}

export interface ISyncService {
  uploadDatabase(): Promise<SyncResponse>;
  downloadDatabase(): Promise<SyncResponse>;
  getSyncStatus(): Promise<any>;
  autoSync(): Promise<void>;
}

export interface IStorageService {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Redux State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
}

export interface SyncState {
  lastSyncAt: string | null;
  isSyncing: boolean;
  error: string | null;
  pendingChanges: number;
}

export interface RootState {
  auth: AuthState;
  tasks: TaskState;
  sync: SyncState;
}

// UI Types
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  projectId?: string;
  searchTerm?: string;
  dateRange?: 'today' | 'this_week' | 'this_month' | 'overdue';
  completedFilter?: 'all' | 'completed' | 'pending';
}

export interface Navigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  reset: (state: any) => void;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class TaskinError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'TaskinError';
  }
}