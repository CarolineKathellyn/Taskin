// mobile/src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setAuth: (token: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,

      // Ações
      setAuth: (token: string, refreshToken: string, user: User) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      },

      initialize: () => {
        set({ isInitialized: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// mobile/src/store/tasksStore.ts
import { create } from 'zustand';
import { Task, TaskPriority, TaskStatus } from '../types/task';

interface TasksState {
  tasks: Task[];
  filteredTasks: Task[];
  currentFilter: TaskFilter;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
}

interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  categoryId?: number;
  dateRange?: 'today' | 'week' | 'month' | 'overdue';
}

interface TasksActions {
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: number) => void;
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTasks: () => void;
  applyFilters: () => void;
  setLastSync: (timestamp: string) => void;
}

export const useTasksStore = create<TasksState & TasksActions>((set, get) => ({
  // Estado inicial
  tasks: [],
  filteredTasks: [],
  currentFilter: {},
  searchQuery: '',
  isLoading: false,
  error: null,
  lastSync: null,

  // Ações
  setTasks: (tasks: Task[]) => {
    set({ tasks });
    get().applyFilters();
  },

  addTask: (task: Task) => {
    const { tasks } = get();
    const newTasks = [task, ...tasks];
    set({ tasks: newTasks });
    get().applyFilters();
  },

  updateTask: (updatedTask: Task) => {
    const { tasks } = get();
    const newTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    set({ tasks: newTasks });
    get().applyFilters();
  },

  removeTask: (taskId: number) => {
    const { tasks } = get();
    const newTasks = tasks.filter(task => task.id !== taskId);
    set({ tasks: newTasks });
    get().applyFilters();
  },

  setFilter: (filter: TaskFilter) => {
    set({ currentFilter: filter });
    get().applyFilters();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearTasks: () => {
    set({ 
      tasks: [], 
      filteredTasks: [], 
      currentFilter: {}, 
      searchQuery: '',
      error: null 
    });
  },

  setLastSync: (timestamp: string) => {
    set({ lastSync: timestamp });
  },

  applyFilters: () => {
    const { tasks, currentFilter, searchQuery } = get();
    let filtered = [...tasks];

    // Filtrar por status
    if (currentFilter.status && currentFilter.status.length > 0) {
      filtered = filtered.filter(task => 
        currentFilter.status!.includes(task.status)
      );
    }

    // Filtrar por prioridade
    if (currentFilter.priority && currentFilter.priority.length > 0) {
      filtered = filtered.filter(task => 
        currentFilter.priority!.includes(task.priority)
      );
    }

    // Filtrar por categoria
    if (currentFilter.categoryId) {
      filtered = filtered.filter(task => 
        task.category?.id === currentFilter.categoryId
      );
    }

    // Filtrar por data
    if (currentFilter.dateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (currentFilter.dateRange) {
        case 'today':
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate).toDateString() === today.toDateString()
          );
          break;
        case 'overdue':
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) < today && !task.isCompleted
          );
          break;
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= weekEnd
          );
          break;
      }
    }

    // Filtrar por busca de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.notes && task.notes.toLowerCase().includes(query))
      );
    }

    set({ filteredTasks: filtered });
  },
}));

// mobile/src/store/categoriesStore.ts
import { create } from 'zustand';
import { Category } from '../types/category';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoriesActions {
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (categoryId: number) => void;
  reorderCategories: (categoryIds: number[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCategories: () => void;
}

export const useCategoriesStore = create<CategoriesState & CategoriesActions>((set, get) => ({
  // Estado inicial
  categories: [],
  isLoading: false,
  error: null,

  // Ações
  setCategories: (categories: Category[]) => {
    const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    set({ categories: sortedCategories });
  },

  addCategory: (category: Category) => {
    const { categories } = get();
    const newCategories = [...categories, category].sort((a, b) => a.sortOrder - b.sortOrder);
    set({ categories: newCategories });
  },

  updateCategory: (updatedCategory: Category) => {
    const { categories } = get();
    const newCategories = categories.map(category => 
      category.id === updatedCategory.id ? updatedCategory : category
    ).sort((a, b) => a.sortOrder - b.sortOrder);
    set({ categories: newCategories });
  },

  removeCategory: (categoryId: number) => {
    const { categories } = get();
    const newCategories = categories.filter(category => category.id !== categoryId);
    set({ categories: newCategories });
  },

  reorderCategories: (categoryIds: number[]) => {
    const { categories } = get();
    const reorderedCategories = categoryIds.map((id, index) => {
      const category = categories.find(cat => cat.id === id);
      return category ? { ...category, sortOrder: index } : null;
    }).filter(Boolean) as Category[];
    
    set({ categories: reorderedCategories });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearCategories: () => {
    set({ categories: [], error: null });
  },
}));

// mobile/src/store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../types/theme';

interface SettingsState {
  // Configurações de aparência
  themeMode: ThemeMode;
  isDarkMode: boolean;
  
  // Configurações de notificação
  notificationsEnabled: boolean;
  reminderNotifications: boolean;
  deadlineNotifications: boolean;
  dailySummary: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Configurações de sincronização
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  lastSyncTimestamp: string | null;
  
  // Configurações da interface
  compactMode: boolean;
  showCompletedTasks: boolean;
  defaultTaskPriority: string;
  taskSortOrder: 'dueDate' | 'priority' | 'created' | 'title';
  
  // Configurações de produtividade
  workingHours: {
    start: string;
    end: string;
    enabled: boolean;
  };
  weeklyGoal: number;
  reminderMinutesBefore: number;
}

interface SettingsActions {
  setThemeMode: (mode: ThemeMode) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleNotifications: (enabled: boolean) => void;
  updateNotificationSettings: (settings: Partial<SettingsState>) => void;
  updateSyncSettings: (settings: Partial<SettingsState>) => void;
  updateUISettings: (settings: Partial<SettingsState>) => void;
  updateProductivitySettings: (settings: Partial<SettingsState>) => void;
  resetToDefaults: () => void;
  setLastSyncTimestamp: (timestamp: string) => void;
}

const defaultSettings: SettingsState = {
  themeMode: 'system',
  isDarkMode: false,
  notificationsEnabled: true,
  reminderNotifications: true,
  deadlineNotifications: true,
  dailySummary: true,
  soundEnabled: true,
  vibrationEnabled: true,
  autoSync: true,
  syncOnWifiOnly: false,
  lastSyncTimestamp: null,
  compactMode: false,
  showCompletedTasks: false,
  defaultTaskPriority: 'MEDIUM',
  taskSortOrder: 'dueDate',
  workingHours: {
    start: '09:00',
    end: '18:00',
    enabled: true,
  },
  weeklyGoal: 20,
  reminderMinutesBefore: 15,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark });
      },

      toggleNotifications: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
      },

      updateNotificationSettings: (settings: Partial<SettingsState>) => {
        set((state) => ({ ...state, ...settings }));
      },

      updateSyncSettings: (settings: Partial<SettingsState>) => {
        set((state) => ({ ...state, ...settings }));
      },

      updateUISettings: (settings: Partial<SettingsState>) => {
        set((state) => ({ ...state, ...settings }));
      },

      updateProductivitySettings: (settings: Partial<SettingsState>) => {
        set((state) => ({ ...state, ...settings }));
      },

      resetToDefaults: () => {
        set(defaultSettings);
      },

      setLastSyncTimestamp: (timestamp: string) => {
        set({ lastSyncTimestamp: timestamp });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// mobile/src/store/syncStore.ts
import { create } from 'zustand';
import { SyncAction, SyncResult } from '../types/sync';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: SyncAction[];
  lastSyncResult: SyncResult | null;
  syncError: string | null;
  lastSyncTimestamp: string | null;
}

interface SyncActions {
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  addPendingAction: (action: SyncAction) => void;
  removePendingAction: (actionId: string) => void;
  clearPendingActions: () => void;
  setSyncResult: (result: SyncResult) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncTimestamp: (timestamp: string) => void;
  incrementRetryCount: (actionId: string) => void;
}

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  // Estado inicial
  isOnline: true,
  isSyncing: false,
  pendingActions: [],
  lastSyncResult: null,
  syncError: null,
  lastSyncTimestamp: null,

  // Ações
  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
  },

  setSyncing: (isSyncing: boolean) => {
    set({ isSyncing });
  },

  addPendingAction: (action: SyncAction) => {
    const { pendingActions } = get();
    set({ pendingActions: [...pendingActions, action] });
  },

  removePendingAction: (actionId: string) => {
    const { pendingActions } = get();
    set({ 
      pendingActions: pendingActions.filter(action => action.id !== actionId) 
    });
  },

  clearPendingActions: () => {
    set({ pendingActions: [] });
  },

  setSyncResult: (result: SyncResult) => {
    set({ lastSyncResult: result });
  },

  setSyncError: (error: string | null) => {
    set({ syncError: error });
  },

  setLastSyncTimestamp: (timestamp: string) => {
    set({ lastSyncTimestamp: timestamp });
  },

  incrementRetryCount: (actionId: string) => {
    const { pendingActions } = get();
    const updatedActions = pendingActions.map(action => 
      action.id === actionId 
        ? { ...action, retryCount: action.retryCount + 1 }
        : action
    );
    set({ pendingActions: updatedActions });
  },
}));