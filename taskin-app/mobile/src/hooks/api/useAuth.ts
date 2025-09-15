// ==================== AUTH HOOKS ====================
// mobile/src/hooks/api/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../../services/api/authApi';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User 
} from '../../types/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Query para obter usuário atual
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: async (data: AuthResponse) => {
      // Salvar tokens no AsyncStorage
      await AsyncStorage.multiSet([
        ['@auth_token', data.token],
        ['@refresh_token', data.refreshToken],
        ['@user', JSON.stringify(data.user)],
      ]);
      
      // Atualizar cache do usuário
      queryClient.setQueryData(['user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
    onSuccess: async (data: AuthResponse) => {
      // Salvar tokens no AsyncStorage
      await AsyncStorage.multiSet([
        ['@auth_token', data.token],
        ['@refresh_token', data.refreshToken],
        ['@user', JSON.stringify(data.user)],
      ]);
      
      // Atualizar cache do usuário
      queryClient.setQueryData(['user'], data.user);
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      // Limpar dados locais
      await AsyncStorage.multiRemove(['@auth_token', '@refresh_token', '@user']);
      
      // Limpar cache
      queryClient.clear();
    },
  });

  // Função para verificar disponibilidade de email
  const checkEmailMutation = useMutation({
    mutationFn: (email: string) => authApi.checkEmailAvailability(email),
  });

  return {
    // Estado
    user,
    isLoadingUser,
    userError,
    isAuthenticated: !!user,

    // Mutations
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    checkEmail: checkEmailMutation.mutate,
    isCheckingEmail: checkEmailMutation.isPending,
    emailCheckResult: checkEmailMutation.data,
  };
};

// ==================== TASKS HOOKS ====================
// mobile/src/hooks/api/useTasks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../services/api/tasksApi';
import { Task, TaskRequest } from '../../types/task';

export const useTasks = (params?: {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  status?: string;
  priority?: string;
  categoryId?: number;
  dateFilter?: string;
}) => {
  const queryClient = useQueryClient();

  // Query para listar tarefas
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.getTasks(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Mutation para criar tarefa
  const createTaskMutation = useMutation({
    mutationFn: (task: TaskRequest) => tasksApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutation para atualizar tarefa
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: number; task: TaskRequest }) =>
      tasksApi.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutation para deletar tarefa
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      tasksApi.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    // Data
    tasks: tasksData?.content || [],
    totalElements: tasksData?.totalElements || 0,
    totalPages: tasksData?.totalPages || 0,
    
    // Loading states
    isLoading,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    // Errors
    error,
    createError: createTaskMutation.error,
    updateError: updateTaskMutation.error,
    deleteError: deleteTaskMutation.error,
    statusError: updateStatusMutation.error,
    
    // Actions
    refetch,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
  };
};

// Hook para tarefa específica
export const useTask = (id: number) => {
  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getTaskById(id),
    enabled: !!id,
  });

  return {
    task,
    isLoading,
    error,
  };
};

// Hook para busca de tarefas
export const useSearchTasks = () => {
  const searchMutation = useMutation({
    mutationFn: ({ query, limit }: { query: string; limit?: number }) =>
      tasksApi.searchTasks(query, limit),
  });

  return {
    search: searchMutation.mutate,
    results: searchMutation.data || [],
    isSearching: searchMutation.isPending,
    searchError: searchMutation.error,
  };
};

// Hook para tarefas de hoje
export const useTodayTasks = () => {
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: tasksApi.getTodayTasks,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
  };
};

// Hook para tarefas vencidas
export const useOverdueTasks = () => {
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: tasksApi.getOverdueTasks,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
  };
};

// ==================== CATEGORIES HOOKS ====================
// mobile/src/hooks/api/useCategories.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../services/api/categoriesApi';
import { Category, CategoryRequest } from '../../types/category';

export const useCategories = (includeInactive = false) => {
  const queryClient = useQueryClient();

  // Query para listar categorias
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['categories', includeInactive],
    queryFn: () => categoriesApi.getCategories(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar categoria
  const createCategoryMutation = useMutation({
    mutationFn: (category: CategoryRequest) => categoriesApi.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Mutation para atualizar categoria
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }: { id: number; category: CategoryRequest }) =>
      categoriesApi.updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Mutation para deletar categoria
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para criar categorias padrão
  const createDefaultsMutation = useMutation({
    mutationFn: categoriesApi.createDefaultCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    // Data
    categories: categories || [],
    
    // Loading states
    isLoading,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
    isCreatingDefaults: createDefaultsMutation.isPending,
    
    // Errors
    error,
    createError: createCategoryMutation.error,
    updateError: updateCategoryMutation.error,
    deleteError: deleteCategoryMutation.error,
    
    // Actions
    refetch,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    createDefaults: createDefaultsMutation.mutate,
  };
};

// ==================== DASHBOARD HOOKS ====================
// mobile/src/hooks/api/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api/dashboardApi';

export const useDashboard = () => {
  // Query para estatísticas do dashboard
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para resumo de hoje
  const {
    data: todaySummary,
    isLoading: isLoadingToday,
    error: todayError,
  } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: dashboardApi.getTodaySummary,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  return {
    stats,
    todaySummary,
    isLoadingStats,
    isLoadingToday,
    statsError,
    todayError,
  };
};