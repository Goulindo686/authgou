-- Schema do banco de dados para sistema de autenticação
-- Compatível com MySQL, H2, MariaDB

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE auth_db;

-- Tabela de usuários (criar primeiro, sem foreign key para applications)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    subscription VARCHAR(20) DEFAULT 'standard',
    expires DATETIME NOT NULL,
    session_token VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    verified BOOLEAN DEFAULT FALSE,
    -- Configurações de 2FA
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    -- Configurações da conta
    account_logs BOOLEAN DEFAULT TRUE,
    new_location_alerts BOOLEAN DEFAULT TRUE,
    profile_picture_url VARCHAR(500),
    owner_id VARCHAR(100),
    security_words TEXT,
    hwid VARCHAR(255),
    ip_address VARCHAR(45),
    banned BOOLEAN DEFAULT FALSE,
    app_id INT,
    is_admin BOOLEAN DEFAULT FALSE,
    -- Campos de plano/subscription
    plan VARCHAR(20) DEFAULT 'tester', -- tester, developer, seller
    plan_expires_at DATETIME NULL,
    sessionid VARCHAR(64), -- alias para session_token para compatibilidade
    UNIQUE KEY unique_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de códigos de verificação
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(255) NOT NULL,  -- Aumentado para suportar códigos de 6 dígitos e tokens temporários (TEMP_SESSION_...)
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    expires DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de aplicações (criar antes de licenses e user_variables)
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(100) NOT NULL,
    app_secret VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'active',
    paused BOOLEAN DEFAULT FALSE,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_app_name_user (name, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de licenças (criar depois de applications)
CREATE TABLE IF NOT EXISTS licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_key VARCHAR(100) NOT NULL,
    subscription VARCHAR(20) NOT NULL,
    expires DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    user_id INT,
    app_id INT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE KEY unique_license_app (license_key, app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de variáveis de usuário
CREATE TABLE IF NOT EXISTS user_variables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    variable_name VARCHAR(100) NOT NULL,
    variable_value TEXT,
    app_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_variable_app (user_id, variable_name, app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar foreign key app_id em users (após criar applications)
-- Nota: Esta foreign key será adicionada pelo servidor Node.js após criar todas as tabelas

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_app_id ON users(app_id);
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_owner_id ON applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_variables_user_id ON user_variables(user_id);
CREATE INDEX IF NOT EXISTS idx_user_variables_app_id ON user_variables(app_id);

-- Tabela de tickets de suporte/chat
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, closed, waiting
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    assigned_to INT NULL, -- admin que está atendendo
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tickets_user_id (user_id),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    image_url VARCHAR(500) NULL, -- URL da imagem se houver
    is_staff BOOLEAN DEFAULT FALSE, -- true se for mensagem do staff/admin
    read_at DATETIME NULL, -- quando foi lida
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_ticket_id (ticket_id),
    INDEX idx_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan VARCHAR(20) NOT NULL, -- developer, seller
    period VARCHAR(20) NOT NULL, -- monthly, annual
    amount DECIMAL(10, 2) NOT NULL,
    preference_id VARCHAR(255) NULL, -- ID da preferência do Mercado Pago
    payment_id VARCHAR(255) NULL, -- ID do pagamento do Mercado Pago
    external_reference VARCHAR(255) NOT NULL UNIQUE, -- Referência externa única
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled, refunded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payments_user_id (user_id),
    INDEX idx_payments_external_reference (external_reference),
    INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    endpoint VARCHAR(500) NOT NULL, -- URL do webhook (Discord)
    user_agent VARCHAR(255) DEFAULT NULL,
    authenticated BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at DATETIME NULL,
    FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_webhooks_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

