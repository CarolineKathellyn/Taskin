// mobile/src/services/api/authApi.ts
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants/endpoints';

export const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.log('Token inválido, redirecionando para login...');
    }
    return Promise.reject(error);
  }
);

// mobile/src/services/api/tasksApi.ts
import axios from 'axios';
import { Task, TaskRequest, DashboardStats, TodaySummary } from '../../types/task';
import { PaginatedResponse } from '../../types/api';
import { API_BASE_URL } from '../../utils/constants/endpoints';

export const tasksApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
tasksApi.interceptors.request.use(
  (config) => {
    // O token será adicionado pelo AuthProvider
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
tasksApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, o AuthProvider vai lidar com isso
    }
    return Promise.reject(error);
  }
);

export const taskService = {
  // Tarefas
  getTasks: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    status?: string;
    priority?: string;
    categoryId?: number;
    dateFilter?: string;
  }): Promise<PaginatedResponse<Task>> => {
    const response = await tasksApi.get('/tasks', { params });
    return response.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await tasksApi.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (task: TaskRequest): Promise<Task> => {
    const response = await tasksApi.post('/tasks', task);
    return response.data;
  },

  updateTask: async (id: number, task: TaskRequest): Promise<Task> => {
    const response = await tasksApi.put(`/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await tasksApi.delete(`/tasks/${id}`);
  },

  updateTaskStatus: async (id: number, status: string): Promise<Task> => {
    const response = await tasksApi.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  searchTasks: async (query: string, limit?: number): Promise<Task[]> => {
    const response = await tasksApi.get('/tasks/search', {
      params: { query, limit },
    });
    return response.data;
  },

  getTaskStatistics: async (): Promise<DashboardStats> => {
    const response = await tasksApi.get('/tasks/statistics');
    return response.data;
  },

  getTodayTasks: async (): Promise<Task[]> => {
    const response = await tasksApi.get('/tasks/today');
    return response.data;
  },

  getOverdueTasks: async (): Promise<Task[]> => {
    const response = await tasksApi.get('/tasks/overdue');
    return response.data;
  },

  getPendingTasks: async (): Promise<Task[]> => {
    const response = await tasksApi.get('/tasks/pending');
    return response.data;
  },

  getCompletedTasks: async (): Promise<Task[]> => {
    const response = await tasksApi.get('/tasks/completed');
    return response.data;
  },

  completeMultipleTasks: async (taskIds: number[]): Promise<Task[]> => {
    const response = await tasksApi.patch('/tasks/bulk/complete', { taskIds });
    return response.data;
  },

  duplicateTask: async (id: number): Promise<Task> => {
    const response = await tasksApi.post(`/tasks/${id}/duplicate`);
    return response.data;
  },
};

// mobile/src/services/api/categoriesApi.ts
import { Category, CategoryRequest } from '../../types/category';

export const categoryService = {
  getCategories: async (includeInactive = false): Promise<Category[]> => {
    const response = await tasksApi.get('/categories', {
      params: { includeInactive },
    });
    return response.data;
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await tasksApi.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (category: CategoryRequest): Promise<Category> => {
    const response = await tasksApi.post('/categories', category);
    return response.data;
  },

  updateCategory: async (id: number, category: CategoryRequest): Promise<Category> => {
    const response = await tasksApi.put(`/categories/${id}`, category);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await tasksApi.delete(`/categories/${id}`);
  },

  getCategoriesWithStats: async (): Promise<any[]> => {
    const response = await tasksApi.get('/categories/with-stats');
    return response.data;
  },

  createDefaultCategories: async (): Promise<Category[]> => {
    const response = await tasksApi.post('/categories/create-defaults');
    return response.data;
  },

  reorderCategories: async (categoryIds: number[]): Promise<Category[]> => {
    const response = await tasksApi.patch('/categories/reorder', { categoryIds });
    return response.data;
  },
};

// mobile/src/services/api/dashboardApi.ts
import { DashboardStats, RecentActivity, TodaySummary } from '../../types/task';

export const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await tasksApi.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async (): Promise<RecentActivity> => {
    const response = await tasksApi.get('/dashboard/recent-activity');
    return response.data;
  },

  getStatsByPeriod: async (days: number): Promise<any> => {
    const response = await tasksApi.get('/dashboard/stats/period', {
      params: { days },
    });
    return response.data;
  },

  getTodaySummary: async (): Promise<TodaySummary> => {
    const response = await tasksApi.get('/dashboard/today');
    return response.data;
  },
};

// mobile/src/utils/constants/endpoints.ts
import Constants from 'expo-constants';

// Configuração do endpoint da API
const getApiUrl = () => {
  if (__DEV__) {
    // Em desenvolvimento, usar localhost
    return 'http://localhost:8080';
  } else {
    // Em produção, usar URL real
    return 'https://api.taskin.com';
  }
};

export const API_BASE_URL = getApiUrl();

// mobile/src/utils/helpers/dateUtils.ts
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Hoje';
  }
  
  if (isTomorrow(date)) {
    return 'Amanhã';
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }
  
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = parseISO(dateString);
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

export const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = parseISO(dateString);
  return format(date, 'HH:mm', { locale: ptBR });
};

export const isOverdue = (dueDate: string | undefined, completed: boolean): boolean => {
  if (!dueDate || completed) return false;
  
  const date = parseISO(dueDate);
  const now = new Date();
  
  return date < now;
};

export const generateClientId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// mobile/src/utils/helpers/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateTaskTitle = (title: string): boolean => {
  return title.trim().length >= 1 && title.length <= 200;
};

export const validateCategoryName = (name: string): boolean => {
  return name.trim().length >= 1 && name.length <= 50;
};

export const validateColor = (color: string): boolean => {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color);
};

// mobile/src/utils/helpers/formatters.ts
export const formatTaskPriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return priorityMap[priority] || priority;
};

export const formatTaskStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Progresso',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
    ON_HOLD: 'Em Espera',
  };
  return statusMap[status] || status;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

export const formatCompletionRate = (rate: number): string => {
  return `${Math.round(rate)}%`;
};