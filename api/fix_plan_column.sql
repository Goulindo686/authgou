-- Script simples para adicionar coluna plan na tabela users
-- Execute este script no seu banco de dados MySQL

USE auth_db;

-- Adicionar coluna plan (execute mesmo se já existir - o MySQL vai avisar mas não vai quebrar)
ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT 'tester';

-- Adicionar coluna plan_expires_at
ALTER TABLE users ADD COLUMN plan_expires_at DATETIME NULL;

-- Atualizar usuários existentes
UPDATE users SET plan = 'tester' WHERE plan IS NULL OR plan = '';

-- Verificar
SELECT id, username, plan, plan_expires_at FROM users LIMIT 5;

