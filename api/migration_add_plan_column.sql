-- Migração: Adicionar coluna plan e plan_expires_at na tabela users
-- Execute este script manualmente se a coluna não existir
-- IMPORTANTE: Este script verifica se as colunas existem antes de adicioná-las

USE auth_db;

-- Verificar e adicionar coluna plan
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'plan';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1', -- Coluna existe, não fazer nada
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) DEFAULT ''tester''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar e adicionar coluna plan_expires_at
SET @columnname = 'plan_expires_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1', -- Coluna existe, não fazer nada
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Atualizar usuários existentes para terem o valor padrão 'tester'
UPDATE users 
SET plan = 'tester' 
WHERE plan IS NULL OR plan = '';

-- Verificar se as colunas foram criadas
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'auth_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('plan', 'plan_expires_at');

