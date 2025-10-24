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
- **Expo 54.0.0** - Plataforma de desenvolvimento
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
| 10 | Média | Como usuário, eu quero buscar tarefas por texto, para localizar atividades específicas. | 10 | Sistema deve implementar busca . | 2 |
| 11 | Média | Como usuário, eu quero receber notificações de prazos, para não perder deadlines. | 11 | Sistema deve enviar notificações para lembrar o usuário. | 2 |
| 12 | Média | Como usuário, eu quero colaborar em tarefas compartilhadas, para trabalhar em equipe. | 12 | Sistema deve permitir compartilhamento de tarefas e criação de times. | 2 |
| 13 | Baixa | Como usuário, eu quero anexar arquivos às tarefas, para centralizar informações. | 13 | Sistema deve suportar upload de imagens, documentos e links. | 3 |
| 14 | Baixa | Como usuário, quero gráficos e dashboards para analisar desempenho e produtividade. | 14 | Sistema deve gerar gráficos interativos e métricas. | 3 |
| 15 | Baixa | Como usuário, eu quero criar projetos, para organização de tarefas. | 15 | Sistema deve permitir projetos com sub-tarefas. | 3 |
| 16 | Baixa | Como usuário, eu quero exportar dados, para backup ou uso externo. | 16 | Sistema deve exportar as tarefas em formato de PDF. | 3 |
| 17 | Baixa | Como usuário, eu quero personalizar interface, para adaptar ao estilo. | 17 | Sistema deve oferecer temas diferentes para personalização. | 3 |
| 18 | Baixa | Como usuário, desejo que meu aplicativo esteja sempre atualizado. | 18 | Sistema deve oferecer updates automáticos para o usuário. | 3 |
---



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
git clone https://github.com/CarolineKathellyn/Taskin.git
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
npx expo start --tunnel      # Acesso remoto
```

#### **3. Testar no Dispositivo:**
```bash
# 1. Instalar Expo Go no smartphone
# 2. Escanear QR code do terminal
# 3. App carregará automaticamente
```

