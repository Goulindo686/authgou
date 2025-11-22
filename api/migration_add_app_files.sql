-- Migration: Criar tabela app_files para armazenar arquivos por aplicação
-- Compatível com MySQL, MariaDB

USE auth_db;

-- Tabela de arquivos por aplicação
CREATE TABLE IF NOT EXISTS app_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    authenticated BOOLEAN DEFAULT FALSE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_app_files_app_id (app_id),
    INDEX idx_app_files_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

