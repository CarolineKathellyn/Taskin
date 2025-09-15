-- ==================== V1__Create_users_table.sql ====================
-- backend/src/main/resources/db/migration/V1__Create_users_table.sql

-- ==================== V1__Create_users_table.sql ====================
-- backend/src/main/resources/db/migration/V1__Create_users_table.sql

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme_preference VARCHAR(20) DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ==================== V2__Create_categories_table.sql ====================
-- backend/src/main/resources/db/migration/V2__Create_categories_table.sql

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    icon VARCHAR(50) DEFAULT 'folder',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    client_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'SYNCED',
    version BIGINT DEFAULT 1,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_default ON categories(is_default);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE UNIQUE INDEX idx_categories_user_name ON categories(user_id, name);

-- ==================== V3__Create_tasks_table.sql ====================
-- backend/src/main/resources/db/migration/V3__Create_tasks_table.sql

CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    notes TEXT,
    tags TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(100),
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_minutes_before INTEGER DEFAULT 15,
    sync_status VARCHAR(20) DEFAULT 'SYNCED',
    client_id VARCHAR(100),
    version BIGINT DEFAULT 1,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_sync_status ON tasks(sync_status);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority);

-- ==================== V4__Create_sync_logs_table.sql ====================
-- backend/src/main/resources/db/migration/V4__Create_sync_logs_table.sql

CREATE TABLE sync_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'TASK', 'CATEGORY', 'USER'
    entity_id BIGINT NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'ERROR'
    error_message TEXT,
    client_timestamp TIMESTAMP,
    server_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(sync_status);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);

-- ==================== V5__Insert_default_data.sql ====================
-- backend/src/main/resources/db/migration/V5__Insert_default_data.sql

-- Inserir usuário de exemplo para desenvolvimento
INSERT INTO users (name, email, password, is_active, email_verified) VALUES 
('Usuário Teste', 'test@taskin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc3Ko6QF1uN.OMeK.uNou', TRUE, TRUE);
-- Senha: password123

-- Inserir categorias padrão para o usuário teste
INSERT INTO categories (user_id, name, description, color, icon, is_default, sort_order) VALUES 
(1, 'Trabalho', 'Tarefas relacionadas ao trabalho', '#3B82F6', 'briefcase', TRUE, 0),
(1, 'Pessoal', 'Tarefas pessoais e familiares', '#10B981', 'person', TRUE, 1),
(1, 'Estudos', 'Estudos e aprendizado', '#8B5CF6', 'book', TRUE, 2),
(1, 'Saúde', 'Cuidados com a saúde', '#F59E0B', 'heart', TRUE, 3),
(1, 'Casa', 'Tarefas domésticas', '#EF4444', 'home', TRUE, 4);

-- Inserir algumas tarefas de exemplo
INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date) VALUES 
(1, 1, 'Reunião de planejamento', 'Reunião mensal de planejamento da equipe', 'HIGH', 'PENDING', DATEADD('DAY', 1, CURRENT_TIMESTAMP)),
(1, 1, 'Revisar relatório', 'Revisar relatório mensal de vendas', 'MEDIUM', 'PENDING', DATEADD('DAY', 3, CURRENT_TIMESTAMP)),
(1, 2, 'Comprar mantimentos', 'Fazer compras no supermercado', 'LOW', 'PENDING', CURRENT_TIMESTAMP),
(1, 3, 'Estudar React Native', 'Continuar curso de React Native', 'MEDIUM', 'IN_PROGRESS', DATEADD('DAY', 2, CURRENT_TIMESTAMP)),
(1, 4, 'Consulta médica', 'Consulta de rotina com clínico geral', 'HIGH', 'PENDING', DATEADD('DAY', 7, CURRENT_TIMESTAMP));

-- ==================== Triggers para updated_at ====================

-- Trigger para users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    SET NEW.updated_at = CURRENT_TIMESTAMP;

-- Trigger para categories  
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    SET NEW.updated_at = CURRENT_TIMESTAMP;

-- Trigger para tasks
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    SET NEW.updated_at = CURRENT_TIMESTAMP; TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme_preference VARCHAR(20) DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE