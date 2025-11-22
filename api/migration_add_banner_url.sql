-- Migration: Adicionar coluna banner_url na tabela users
-- Execute este arquivo para adicionar suporte a banners de perfil

USE auth_db;

-- Adicionar coluna banner_url se não existir
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'banner_url';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL AFTER profile_picture_url')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_users_banner_url ON users(banner_url);

