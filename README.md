# 📱 Taskin - Gerenciador de Tarefas Inteligente

## 🎯 **Sobre o Taskin**

**Taskin** é um aplicativo moderno de gerenciamento de tarefas que combina a robustez de um backend Spring Boot com a agilidade do React Native. Desenvolvido com arquitetura cliente-servidor, oferece funcionalidade offline completa através de sincronização inteligente entre SQLite local e API REST.

### ✨ **Características Principais:**
- 🔄 **Sincronização Inteligente**: Funciona offline e online com sync automática
- 🎨 **Design  Focado**: Interface otimizada para produtividade e concentração  
- 🔐 **Segurança Robusta**: Autenticação JWT e criptografia de dados
- 👥 **Colaboração Real-time**: Compartilhamento e edição colaborativa
- 📊 **Analytics Avançados**: Relatórios detalhados de produtividade

---

## 🏗️ **Arquitetura Técnica**

### **Backend (Spring Boot)**
- **Spring Boot 3.2.0** - Framework principal
- **Java 21** - Linguagem de programação
- **H2 Database** - Banco de dados em memória
- **JWT** - Autenticação e autorização
- **Swagger/OpenAPI** - Documentação da API
- **Maven** - Gerenciador de dependências

### **Frontend Mobile (React Native)**
- **React Native 0.79.6** - Framework mobile
- **Expo 53.0.22** - Plataforma de desenvolvimento
- **TypeScript 5.8.3** - Linguagem de programação
- **TanStack Query** - Gerenciamento de estado e cache
- **SQLite** - Banco de dados local
- **Expo Notifications** - Sistema de notificações

---

## 📊 Product Backlog

| Id | Prioridade | User Story | Requisito | Critério de Aceitação | Sprint |
|---|---|---|---|---|---|
| 1 | Alta | Como usuário, eu quero criar uma conta com autenticação JWT, para acessar minhas tarefas com segurança. | 1 | Sistema deve permitir registro/login com JWT e sincronização de perfil. | 1 |
| 2 | Alta | Como usuário, eu quero criar tarefas com título, descrição, prazo e prioridade, para organizar atividades. | 2 | Sistema deve permitir CRUD de tarefas com sincronização online/offline. | 1 |
| 3 | Alta | Como usuário, eu quero visualizar tarefas em lista organizada, para controle visual das atividades. | 3 | Sistema deve exibir tarefas com filtros e indicadores visuais de status. | 1 |
| 4 | Alta | Como usuário, eu quero que o app funcione offline, para acessar tarefas sem internet. | 4 | Sistema deve manter funcionalidades offline com sync automática. | 1 |
| 5 | Alta | Como usuário, eu quero marcar tarefas como concluídas, para acompanhar progresso. | 5 | Sistema deve alterar status com feedback visual e sincronização imediata. | 1 |
| 6 | Alta | Como usuário, eu quero editar/excluir tarefas, para manter lista atualizada. | 6 | Sistema deve permitir operações CRUD com confirmações. | 1 |
| 7 | Alta | Como usuário, eu quero categorizar tarefas, para organizar por tipo de atividade. | 7 | Sistema deve permitir criação/associação de categorias com cores. | 1 |
| 8 | Alta | Como usuário, eu quero dashboard de produtividade, para visualizar estatísticas. | 8 | Sistema deve exibir métricas: total, concluídas, pendentes, hoje. | 1 |
| 9 | Média | Como usuário, eu quero filtrar tarefas por múltiplos critérios, para encontrar rapidamente. | 9 | Sistema deve oferecer filtros combinados por categoria, prioridade, status. | 2 |
| 10 | Média | Como usuário, eu quero buscar tarefas por texto, para localizar atividades específicas. | 10 | Sistema deve implementar busca full-text com highlights. | 2 |
| 11 | Média | Como usuário, eu quero receber notificações de prazos, para não perder deadlines. | 11 | Sistema deve enviar push notifications configuráveis. | 2 |
| 12 | Média | Como usuário, eu quero definir lembretes personalizados, para alertas específicos. | 12 | Sistema deve permitir múltiplos lembretes por tarefa. | 2 |
| 13 | Média | Como usuário, eu quero ordenar tarefas por diferentes critérios, para priorizar trabalho. | 13 | Sistema deve oferecer ordenação por data, prioridade, categoria, status. | 2 |
| 14 | Média | Como usuário, eu quero colaborar em tarefas compartilhadas, para trabalhar em equipe. | 14 | Sistema deve permitir compartilhamento e comentários. | 2 |
| 15 | Média | Como usuário, eu quero sincronização em tempo real, para dados atualizados. | 15 | Sistema deve sync automática com resolução de conflitos. | 2 |
| 16 | Baixa | Como usuário, eu quero anexar arquivos às tarefas, para centralizar informações. | 16 | Sistema deve suportar upload de imagens, documentos e links. | 3 |
| 17 | Baixa | Como usuário, eu quero relatórios de produtividade, para analisar desempenho. | 17 | Sistema deve gerar gráficos interativos e métricas avançadas. | 3 |
| 18 | Baixa | Como usuário, eu quero criar projetos complexos, para organizar hierarquias. | 18 | Sistema deve permitir projetos com sub-tarefas e dependências. | 3 |
| 19 | Baixa | Como usuário, eu quero exportar dados, para backup ou uso externo. | 19 | Sistema deve exportar em PDF, CSV, JSON configuráveis. | 3 |
| 20 | Baixa | Como usuário, eu quero personalizar interface, para adaptar ao estilo. | 20 | Sistema deve oferecer temas, layouts e configurações de UI. | 3 |
| 21 | Baixa | Como usuário, eu quero integrações externas, para conectar outras ferramentas. | 21 | Sistema deve integrar calendários, email e produtividade. | 3 |
| 22 | Baixa | Como usuário, eu quero IA para sugestões, para otimizar produtividade. | 22 | Sistema deve analisar padrões e sugerir otimizações. | 3 |

---

## 🚀 **Sprints Detalhadas**

### 📅 **Sprint 1 - Fundação e Core Features (3 semanas) - 🔄 EM DESENVOLVIMENTO**
**Objetivo**: Estabelecer arquitetura robusta e funcionalidades essenciais

**Story Points**: 65 | **User Stories**: 16

#### 🏗️ **Épicos Principais:**
- **Infraestrutura**: Setup Backend + Frontend + Sincronização
- **Autenticação**: JWT, registro, login, perfil de usuário  
- **Tarefas Core**: CRUD completo com prioridades e categorias
- **Interface**: Design system e navegação intuitiva

#### ✅ **Entregas Esperadas:**
- Backend Spring Boot funcional com API REST
- App React Native com navegação e autenticação
- Sincronização offline/online básica
- Dashboard de produtividade

---

### 📅 **Sprint 2 - Funcionalidades Avançadas (3 semanas) - 📋 PLANEJADO**
**Objetivo**: Expandir funcionalidades com colaboração e notificações

**Story Points**: 75 | **User Stories**: 16

#### 🔍 **Épicos Principais:**
- **Busca e Filtros**: Full-text search e filtros avançados
- **Notificações**: Push notifications e lembretes
- **Colaboração**: Compartilhamento e comentários
- **Sincronização**: Real-time com WebSockets

---

### 📅 **Sprint 3 - Recursos Premium (3 semanas) - 📋 BACKLOG**
**Objetivo**: Funcionalidades avançadas e integrações externas

**Story Points**: 85 | **User Stories**: 20

#### 📊 **Épicos Principais:**
- **Analytics**: Relatórios e gráficos interativos
- **Projetos**: Hierarquia e dependências complexas
- **Anexos**: Upload e gerenciamento de mídia


## 📁 **Estrutura do Projeto**

```
taskin-app/
├── 📱 mobile/                          # React Native App
│   ├── 📁 src/
│   │   ├── 📁 components/              # Componentes reutilizáveis
│   │   │   ├── 📁 common/              # Componentes base
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── 📁 forms/               # Formulários específicos
│   │   │   │   ├── TaskForm.tsx
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── 📁 cards/               # Cards de exibição
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   └── StatsCard.tsx
│   │   │   └── 📁 navigation/          # Componentes de navegação
│   │   │       ├── TabBar.tsx
│   │   │       └── Header.tsx
│   │   │
│   │   ├── 📁 screens/                 # Telas da aplicação
│   │   │   ├── 📁 auth/                # Telas de autenticação
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   └── ForgotPasswordScreen.tsx
│   │   │   ├── 📁 tasks/               # Telas de tarefas
│   │   │   │   ├── TaskListScreen.tsx
│   │   │   │   ├── TaskDetailScreen.tsx
│   │   │   │   ├── CreateTaskScreen.tsx
│   │   │   │   └── EditTaskScreen.tsx
│   │   │   ├── 📁 dashboard/           # Dashboard e estatísticas
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   └── StatsScreen.tsx
│   │   │   └── 📁 profile/             # Perfil e configurações
│   │   │       ├── ProfileScreen.tsx
│   │   │       └── SettingsScreen.tsx
│   │   │
│   │   ├── 📁 services/                # Serviços e APIs
│   │   │   ├── 📁 api/                 # Chamadas para backend
│   │   │   │   ├── authApi.ts
│   │   │   │   ├── tasksApi.ts
│   │   │   │   ├── categoriesApi.ts
│   │   │   │   └── usersApi.ts
│   │   │   ├── 📁 database/            # SQLite local
│   │   │   │   ├── database.ts
│   │   │   │   ├── migrations.ts
│   │   │   │   └── seeds.ts
│   │   │   ├── 📁 sync/                # Sincronização
│   │   │   │   ├── syncService.ts
│   │   │   │   ├── conflictResolver.ts
│   │   │   │   └── queueManager.ts
│   │   │   └── 📁 notifications/       # Push notifications
│   │   │       ├── notificationService.ts
│   │   │       └── reminderService.ts
│   │   │
│   │   ├── 📁 hooks/                   # Custom React Hooks
│   │   │   ├── 📁 api/                 # Hooks para API
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useTasks.ts
│   │   │   │   ├── useCategories.ts
│   │   │   │   └── useSync.ts
│   │   │   ├── 📁 storage/             # Hooks para storage
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── useDatabase.ts
│   │   │   └── 📁 ui/                  # Hooks de UI
│   │   │       ├── useTheme.ts
│   │   │       ├── useKeyboard.ts
│   │   │       └── useNavigation.ts
│   │   │
│   │   ├── 📁 store/                   # Estado global
│   │   │   ├── authStore.ts
│   │   │   ├── tasksStore.ts
│   │   │   ├── settingsStore.ts
│   │   │   └── syncStore.ts
│   │   │
│   │   ├── 📁 types/                   # TypeScript Types
│   │   │   ├── auth.ts
│   │   │   ├── task.ts
│   │   │   ├── category.ts
│   │   │   ├── user.ts
│   │   │   └── api.ts
│   │   │
│   │   ├── 📁 utils/                   # Utilitários
│   │   │   ├── 📁 helpers/             # Funções auxiliares
│   │   │   │   ├── dateUtils.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   └── encryption.ts
│   │   │   ├── 📁 constants/           # Constantes
│   │   │   │   ├── colors.ts
│   │   │   │   ├── fonts.ts
│   │   │   │   ├── sizes.ts
│   │   │   │   └── endpoints.ts
│   │   │   └── 📁 config/              # Configurações
│   │   │       ├── environment.ts
│   │   │       ├── database.ts
│   │   │       └── notifications.ts
│   │   │
│   │   └── 📁 assets/                  # Recursos estáticos
│   │       ├── 📁 images/              # Imagens e ícones
│   │       ├── 📁 fonts/               # Fontes personalizadas
│   │       └── 📁 sounds/              # Sons de notificação
│   │
│   ├── 📄 App.tsx                      # Componente raiz
│   ├── 📄 app.json                     # Configuração Expo
│   ├── 📄 package.json                 # Dependências Node
│   ├── 📄 tsconfig.json                # Configuração TypeScript
│   ├── 📄 babel.config.js              # Configuração Babel
│   └── 📄 metro.config.js              # Configuração Metro
│
├── 🖥️ backend/                         # Spring Boot API
│   ├── 📁 src/main/java/com/taskin/
│   │   ├── 📁 config/                  # Configurações Spring
│   │   │   ├── SecurityConfig.java
│   │   │   ├── JwtConfig.java
│   │   │   ├── DatabaseConfig.java
│   │   │   └── SwaggerConfig.java
│   │   │
│   │   ├── 📁 controller/              # Controllers REST
│   │   │   ├── AuthController.java
│   │   │   ├── TaskController.java
│   │   │   ├── CategoryController.java
│   │   │   ├── UserController.java
│   │   │   └── SyncController.java
│   │   │
│   │   ├── 📁 service/                 # Lógica de negócio
│   │   │   ├── 📁 impl/                # Implementações
│   │   │   │   ├── AuthServiceImpl.java
│   │   │   │   ├── TaskServiceImpl.java
│   │   │   │   ├── CategoryServiceImpl.java
│   │   │   │   └── SyncServiceImpl.java
│   │   │   ├── AuthService.java
│   │   │   ├── TaskService.java
│   │   │   ├── CategoryService.java
│   │   │   └── SyncService.java
│   │   │
│   │   ├── 📁 repository/              # Acesso a dados
│   │   │   ├── TaskRepository.java
│   │   │   ├── CategoryRepository.java
│   │   │   ├── UserRepository.java
│   │   │   └── SyncLogRepository.java
│   │   │
│   │   ├── 📁 model/                   # Entidades JPA
│   │   │   ├── Task.java
│   │   │   ├── Category.java
│   │   │   ├── User.java
│   │   │   ├── SyncLog.java
│   │   │   └── Notification.java
│   │   │
│   │   ├── 📁 dto/                     # Data Transfer Objects
│   │   │   ├── 📁 request/             # DTOs de entrada
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   ├── TaskRequest.java
│   │   │   │   └── CategoryRequest.java
│   │   │   └── 📁 response/            # DTOs de saída
│   │   │       ├── AuthResponse.java
│   │   │       ├── TaskResponse.java
│   │   │       ├── CategoryResponse.java
│   │   │       └── SyncResponse.java
│   │   │
│   │   ├── 📁 security/                # Segurança JWT
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── UserDetailsServiceImpl.java
│   │   │
│   │   ├── 📁 exception/               # Tratamento de exceções
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   ├── TaskNotFoundException.java
│   │   │   ├── UnauthorizedException.java
│   │   │   └── ValidationException.java
│   │   │
│   │   └── 📁 util/                    # Utilitários
│   │       ├── DateUtils.java
│   │       ├── ValidationUtils.java
│   │       └── EncryptionUtils.java
│   │
│   ├── 📁 src/main/resources/          # Recursos
│   │   ├── application.yml             # Configuração Spring
│   │   ├── application-dev.yml         # Config desenvolvimento
│   │   ├── application-prod.yml        # Config produção
│   │   └── 📁 db/migration/            # Scripts de migração
│   │       ├── V1__Create_users_table.sql
│   │       ├── V2__Create_categories_table.sql
│   │       ├── V3__Create_tasks_table.sql
│   │       └── V4__Create_sync_logs_table.sql
│   │
│   ├── 📁 src/test/                    # Testes unitários
│   │   ├── 📁 java/com/taskin/
│   │   │   ├── 📁 controller/          # Testes de controller
│   │   │   ├── 📁 service/             # Testes de service
│   │   │   └── 📁 repository/          # Testes de repository
│   │   └── 📁 resources/               # Recursos de teste
│   │
│   ├── 📄 pom.xml                      # Configuração Maven
│   └── 📄 Dockerfile                   # Container Docker
│
├── 📁 docs/                            # Documentação
│   ├── 📁 api/                         # Documentação da API
│   │   ├── authentication.md
│   │   ├── tasks.md
│   │   ├── categories.md
│   │   └── sync.md
│   ├── 📁 mobile/                      # Documentação mobile
│   │   ├── setup.md
│   │   ├── architecture.md
│   │   └── testing.md
│   ├── 📁 deployment/                  # Deploy e DevOps
│   │   ├── docker-compose.yml
│   │   ├── kubernetes.yml
│   │   └── ci-cd.md
│   └── 📄 CHANGELOG.md                 # Histórico de mudanças
│
├── 📁 scripts/                         # Scripts de automação
│   ├── setup.sh                       # Setup inicial
│   ├── build.sh                       # Build do projeto
│   ├── test.sh                         # Execução de testes
│   └── deploy.sh                       # Deploy automatizado
│
├── 📄 README.md                        # Este arquivo
├── 📄 .gitignore                       # Arquivos ignorados pelo Git
├── 📄 docker-compose.yml               # Orquestração Docker
└── 📄 package.json                     # Scripts do projeto raiz

```

---

## 🚀 **Como Executar o Projeto**

### **📋 Pré-requisitos:**
```bash
# Versões necessárias
Node.js >= 18.0.0
Java >= 21
Maven >= 3.8.0
Expo CLI >= 6.0.0
Android Studio (para emulador)
```

### **⚙️ Setup Inicial:**

#### **1. Clonar o Repositório:**
```bash
git clone https://github.com/seu-usuario/taskin-app.git
cd taskin-app
```

#### **2. Configurar Backend (Spring Boot):**
```bash
cd backend

# Instalar dependências Maven
mvn clean install

# Configurar banco H2 (automático)
# Executar migrations (automático no startup)

# Iniciar servidor
mvn spring-boot:run

# Servidor rodará em: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

#### **3. Configurar Frontend (React Native):**
```bash
cd mobile

# Instalar dependências
npm install

# Instalar dependências específicas do Expo
npx expo install expo-sqlite expo-notifications
npx expo install @react-native-async-storage/async-storage
npx expo install @tanstack/react-query
npx expo install react-native-gesture-handler react-native-reanimated

# Verificar instalação
npx expo doctor
```

---

## 📱 **Testando no Expo**

### **🔧 Desenvolvimento Local:**

#### **1. Iniciar Backend:**
```bash
cd backend
mvn spring-boot:run
```

#### **2. Iniciar App Mobile:**
```bash
cd mobile
npx expo start

# Opções de execução:
npx expo start --android     # Android emulador
npx expo start --ios         # iOS simulator
npx expo start --web         # Versão web
npx expo start --tunnel      # Acesso remoto
```

#### **3. Testar no Dispositivo:**
```bash
# 1. Instalar Expo Go no smartphone
# 2. Escanear QR code do terminal
# 3. App carregará automaticamente
```

### **🔍 Testes Automatizados:**

#### **Backend (Spring Boot):**
```bash
cd backend

# Testes unitários
mvn test

# Testes de integração
mvn verify

# Coverage report
mvn jacoco:report
```

#### **Frontend (React Native):**
```bash
cd mobile

# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Testes E2E (Detox)
npm run test:e2e
```
