-- Script para definir um usuário como administrador
-- Execute este script no MySQL para definir um usuário como admin

-- Substitua 'seu_username' pelo username do usuário que você deseja tornar admin
UPDATE users SET is_admin = TRUE WHERE username = 'menorzin222k';

-- Verificar se foi atualizado corretamente
SELECT id, username, email, is_admin FROM users WHERE username = 'menorzin222k';

-- Se você quiser tornar TODOS os usuários admin (não recomendado em produção):
-- UPDATE users SET is_admin = TRUE;

-- Se você quiser remover admin de todos os usuários:
-- UPDATE users SET is_admin = FALSE;

-- Se você quiser criar um novo usuário admin diretamente no banco:
-- INSERT INTO users (username, email, password_hash, is_admin, created_at) 
-- VALUES ('admin', 'admin@example.com', 'hash_da_senha', TRUE, NOW());

