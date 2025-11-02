// Application constants following the Open/Closed Principle

export const Colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  light: '#F2F2F7',
  dark: '#1C1C1E',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#6D6D80',
  border: '#C6C6C8',
  disabled: '#C6C6C8',
  placeholder: '#C7C7CD',
} as const;

export const CategoryColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
  '#00D2D3', '#FF9F43', '#EE5A24', '#0984E3',
  '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055'
] as const;

export const TaskPriorities = {
  baixa: { label: 'Baixa', color: Colors.success, icon: 'arrow-down-outline' },
  media: { label: 'Média', color: Colors.warning, icon: 'remove-outline' },
  alta: { label: 'Alta', color: Colors.danger, icon: 'arrow-up-outline' },
} as const;

export const TaskStatuses = {
  pendente: { label: 'Pendente', color: Colors.textSecondary, icon: 'time-outline' },
  em_progresso: { label: 'Em Progresso', color: Colors.info, icon: 'play-outline' },
  concluida: { label: 'Concluída', color: Colors.success, icon: 'checkmark-outline' },
} as const;

export const ProjectIcons = [
  { name: 'briefcase', label: 'Portfólio' },
  { name: 'business', label: 'Negócios' },
  { name: 'code', label: 'Código' },
  { name: 'design', label: 'Design' },
  { name: 'fitness', label: 'Fitness' },
  { name: 'heart', label: 'Coração' },
  { name: 'home', label: 'Casa' },
  { name: 'school', label: 'Escola' },
  { name: 'medical', label: 'Médico' },
  { name: 'restaurant', label: 'Restaurante' },
  { name: 'car', label: 'Carro' },
  { name: 'airplane', label: 'Viagem' },
  { name: 'camera', label: 'Câmera' },
  { name: 'musical-notes', label: 'Música' },
  { name: 'game-controller', label: 'Jogos' },
  { name: 'book', label: 'Livro' },
  { name: 'star', label: 'Estrela' },
  { name: 'trophy', label: 'Troféu' },
  { name: 'lightbulb', label: 'Ideia' },
  { name: 'rocket', label: 'Foguete' },
] as const;

export const Strings = {
  // App
  appName: 'Taskin',
  appDescription: 'Gerenciador de Tarefas Offline',

  // Authentication
  login: 'Entrar',
  register: 'Criar Conta',
  logout: 'Sair',
  email: 'Email',
  password: 'Senha',
  name: 'Nome',
  forgotPassword: 'Esqueci minha senha',
  dontHaveAccount: 'Não tem uma conta?',
  alreadyHaveAccount: 'Já tem uma conta?',

  // Tasks
  tasks: 'Tarefas',
  addTask: 'Adicionar Tarefa',
  editTask: 'Editar Tarefa',
  deleteTask: 'Excluir Tarefa',
  taskTitle: 'Título da Tarefa',
  taskDescription: 'Descrição',
  dueDate: 'Data de Vencimento',
  priority: 'Prioridade',
  status: 'Status',
  category: 'Categoria',
  noTasks: 'Nenhuma tarefa encontrada',

  // Categories
  categories: 'Categorias',
  addCategory: 'Adicionar Categoria',
  editCategory: 'Editar Categoria',
  deleteCategory: 'Excluir Categoria',
  categoryName: 'Nome da Categoria',
  categoryColor: 'Cor da Categoria',

  // Navigation
  home: 'Início',
  dashboard: 'Dashboard',
  settings: 'Configurações',

  // Actions
  save: 'Salvar',
  cancel: 'Cancelar',
  delete: 'Excluir',
  edit: 'Editar',
  search: 'Buscar',
  filter: 'Filtrar',
  clear: 'Limpar',
  sync: 'Sincronizar',

  // Messages
  success: 'Sucesso!',
  error: 'Erro!',
  loading: 'Carregando...',
  saved: 'Salvo com sucesso',
  deleted: 'Excluído com sucesso',
  syncing: 'Sincronizando...',
  syncComplete: 'Sincronização completa',
  offline: 'Modo offline',
  online: 'Conectado',

  // Validation
  required: 'Este campo é obrigatório',
  invalidEmail: 'Email inválido',
  passwordTooShort: 'Senha deve ter pelo menos 6 caracteres',
  passwordsDoNotMatch: 'Senhas não coincidem',
} as const;

export const Config = {
  // API
  apiBaseUrl: 'http://10.0.2.2:8080/api', // Android emulator IP
  apiTimeout: 10000,

  // Storage Keys
  storageKeys: {
    authToken: 'auth_token',
    userData: 'user_data',
    lastSyncAt: 'last_sync_at',
    settings: 'app_settings',
    dbBackup: 'db_backup',
    notificationSettings: 'notification_settings',
  },

  // Database
  databaseName: 'taskin.db',
  databaseVersion: 1,

  // Sync
  autoSyncInterval: 5 * 60 * 1000, // 5 minutes
  maxRetryAttempts: 3,
  retryDelay: 1000,

  // JWT
  jwtExpiration: 90 * 24 * 60 * 60 * 1000, // 90 days

  // UI
  animationDuration: 300,
  debounceDelay: 500,
  itemsPerPage: 20,
} as const;

// Type-safe configuration for different environments
export const Environment = {
  development: {
    apiUrl: 'http://localhost:8080/api',
    enableLogging: true,
    debugMode: true,
  },
  production: {
    apiUrl: 'https://api.taskin.app',
    enableLogging: false,
    debugMode: false,
  }
} as const;

export const getCurrentConfig = () => {
  return __DEV__ ? Environment.development : Environment.production;
};

// Export hardcoded categories
export { HARDCODED_CATEGORIES, getCategoryById, getCategoryName, getCategoryColor, getCategoryIcon } from './Categories';
export type { HardcodedCategory } from './Categories';