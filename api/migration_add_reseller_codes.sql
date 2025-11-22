-- Migration: Criar tabela de códigos de revendedor
-- Execute este arquivo para adicionar suporte ao sistema de revendedores

USE auth_db;

-- Tabela de códigos de revendedor
CREATE TABLE IF NOT EXISTS reseller_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    plan VARCHAR(20) NOT NULL, -- developer, seller
    period VARCHAR(20) NOT NULL, -- monthly, annual
    created_by INT NOT NULL, -- ID do usuário que criou o código
    used_by INT NULL, -- ID do usuário que usou o código
    used_at DATETIME NULL, -- Data de uso
    expires_at DATETIME NULL, -- Data de expiração (opcional)
    status VARCHAR(20) DEFAULT 'active', -- active, used, expired, cancelled
    note TEXT NULL, -- Nota adicional
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reseller_code (code),
    INDEX idx_reseller_created_by (created_by),
    INDEX idx_reseller_status (status),
    INDEX idx_reseller_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

