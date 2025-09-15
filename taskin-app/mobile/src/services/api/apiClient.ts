// ==================== API CLIENT ====================
// mobile/src/services/api/apiClient.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../../types/api';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080' 
  : 'https://api.taskin.com';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adicionar token
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('@auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Erro ao obter token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - tratar erros
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, tentar renovar
          try {
            await this.refreshToken();
            // Repetir requisição original
            return this.instance.request(error.config);
          } catch (refreshError) {
            // Refresh falhou, fazer logout
            await this.handleLogout();
            return Promise.reject(error);
          }
        }

        // Exibir erro para o usuário
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('@refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await this.instance.post('/api/auth/refresh', {
        refreshToken,
      });

      const { token, refreshToken: newRefreshToken } = response.data;
      
      await AsyncStorage.setItem('@auth_token', token);
      await AsyncStorage.setItem('@refresh_token', newRefreshToken);
    } catch (error) {
      throw error;
    }
  }

  private async handleLogout(): Promise<void> {
    await AsyncStorage.multiRemove(['@auth_token', '@refresh_token', '@user']);
    // TODO: Navegar para tela de login
  }

  private handleApiError(error: any): void {
    let message = 'Erro de conexão. Tente novamente.';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    if (__DEV__) {
      console.error('API Error:', error);
    }

    Alert.alert('Erro', message);
  }

  // Métodos HTTP
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete(url);
    return response.data;
  }
}

export default new ApiClient();

// ==================== AUTH API ====================
// mobile/src/services/api/authApi.ts
import apiClient from './apiClient';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User 
} from '../../types/auth';

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/login', credentials);
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/register', userData);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken });
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  },

  async logout(): Promise<void> {
    return apiClient.post<void>('/api/auth/logout');
  },

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    return apiClient.get<{ available: boolean }>('/api/auth/check-email', { email });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/forgot-password', { email });
  },
};

// ==================== TASKS API ====================
// mobile/src/services/api/tasksApi.ts
import apiClient from './apiClient';
import { 
  Task, 
  TaskRequest, 
  PaginatedResponse,
  DashboardStats,
  TodaySummary 
} from '../../types/task';

export const tasksApi = {
  async getTasks(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    status?: string;
    priority?: string;
    categoryId?: number;
    dateFilter?: string;
  }): Promise<PaginatedResponse<Task>> {
    return apiClient.get<PaginatedResponse<Task>>('/api/tasks', params);
  },

  async getTaskById(id: number): Promise<Task> {
    return apiClient.get<Task>(`/api/tasks/${id}`);
  },

  async createTask(task: TaskRequest): Promise<Task> {
    return apiClient.post<Task>('/api/tasks', task);
  },

  async updateTask(id: number, task: TaskRequest): Promise<Task> {
    return apiClient.put<Task>(`/api/tasks/${id}`, task);
  },

  async deleteTask(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/tasks/${id}`);
  },

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    return apiClient.patch<Task>(`/api/tasks/${id}/status`, { status });
  },

  async searchTasks(query: string, limit?: number): Promise<Task[]> {
    return apiClient.get<Task[]>('/api/tasks/search', { query, limit });
  },

  async getTaskStatistics(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/api/tasks/statistics');
  },

  async getTasksByCategory(categoryId: number): Promise<Task[]> {
    return apiClient.get<Task[]>(`/api/tasks/by-category/${categoryId}`);
  },

  async getTodayTasks(): Promise<Task[]> {
    return apiClient.get<Task[]>('/api/tasks/today');
  },

  async getOverdueTasks(): Promise<Task[]> {
    return apiClient.get<Task[]>('/api/tasks/overdue');
  },

  async getPendingTasks(): Promise<Task[]> {
    return apiClient.get<Task[]>('/api/tasks/pending');
  },

  async getCompletedTasks(): Promise<Task[]> {
    return apiClient.get<Task[]>('/api/tasks/completed');
  },

  async completeMultipleTasks(taskIds: number[]): Promise<Task[]> {
    return apiClient.patch<Task[]>('/api/tasks/bulk/complete', { taskIds });
  },

  async duplicateTask(id: number): Promise<Task> {
    return apiClient.post<Task>(`/api/tasks/${id}/duplicate`);
  },
};

// ==================== CATEGORIES API ====================
// mobile/src/services/api/categoriesApi.ts
import apiClient from './apiClient';
import { Category, CategoryRequest } from '../../types/category';

export const categoriesApi = {
  async getCategories(includeInactive?: boolean): Promise<Category[]> {
    return apiClient.get<Category[]>('/api/categories', { includeInactive });
  },

  async getCategoryById(id: number): Promise<Category> {
    return apiClient.get<Category>(`/api/categories/${id}`);
  },

  async createCategory(category: CategoryRequest): Promise<Category> {
    return apiClient.post<Category>('/api/categories', category);
  },

  async updateCategory(id: number, category: CategoryRequest): Promise<Category> {
    return apiClient.put<Category>(`/api/categories/${id}`, category);
  },

  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/categories/${id}`);
  },

  async getCategoriesWithStats(): Promise<any[]> {
    return apiClient.get<any[]>('/api/categories/with-stats');
  },

  async createDefaultCategories(): Promise<Category[]> {
    return apiClient.post<Category[]>('/api/categories/create-defaults');
  },

  async reorderCategories(categoryIds: number[]): Promise<Category[]> {
    return apiClient.patch<Category[]>('/api/categories/reorder', { categoryIds });
  },
};

// ==================== DASHBOARD API ====================
// mobile/src/services/api/dashboardApi.ts
import apiClient from './apiClient';
import { DashboardStats, TodaySummary } from '../../types/api';

export const dashboardApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/api/dashboard/stats');
  },

  async getRecentActivity(): Promise<any> {
    return apiClient.get<any>('/api/dashboard/recent-activity');
  },

  async getStatsByPeriod(days: number): Promise<any> {
    return apiClient.get<any>('/api/dashboard/stats/period', { days });
  },

  async getTodaySummary(): Promise<TodaySummary> {
    return apiClient.get<TodaySummary>('/api/dashboard/today');
  },
};