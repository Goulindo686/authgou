-- Migração: Criar tabela de vídeos tutoriais
-- Executar após criar o banco de dados

USE auth_db;

-- Tabela de vídeos tutoriais
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    category VARCHAR(50) DEFAULT 'tutorial', -- tutorial, api, integration, etc
    language VARCHAR(10) DEFAULT 'pt-BR',
    duration INT, -- duração em segundos
    views INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_published (published),
    INDEX idx_featured (featured),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

