// Script de migração para adicionar foreign key app_id em users
// Execute este script se você receber o erro de foreign key constraint

const mysql = require('mysql2/promise')
require('dotenv').config()
const config = require('./config')

async function migrateAddAppIdFk() {
  let connection
  try {
    console.log('🔄 Iniciando migração para adicionar foreign key app_id...')
    
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    })
    
    // Verificar se a tabela applications existe
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'applications'`,
      [config.database.database]
    )
    
    if (tables.length === 0) {
      console.error('❌ Tabela applications não existe. Crie-a primeiro executando o schema.sql')
      process.exit(1)
    }
    
    // Verificar se a coluna app_id existe na tabela users
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'app_id'`,
      [config.database.database]
    )
    
    if (columns.length === 0) {
      console.log('➕ Adicionando coluna app_id à tabela users...')
      await connection.query(
        'ALTER TABLE users ADD COLUMN app_id INT NULL AFTER banned'
      )
      console.log('✅ Coluna app_id adicionada')
    } else {
      console.log('✓ Coluna app_id já existe')
    }
    
    // Verificar se a foreign key já existe
    const [constraints] = await connection.query(
      `SELECT CONSTRAINT_NAME 
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
       WHERE CONSTRAINT_SCHEMA = ? 
       AND TABLE_NAME = 'users' 
       AND CONSTRAINT_NAME = 'fk_users_app_id'`,
      [config.database.database]
    )
    
    if (constraints.length === 0) {
      console.log('➕ Adicionando foreign key fk_users_app_id...')
      
      // Remover foreign keys existentes que possam estar causando conflito
      try {
        await connection.query(
          'ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_app_id'
        )
      } catch (err) {
        // Ignorar erro se não existir
      }
      
      // Adicionar foreign key
      await connection.query(
        'ALTER TABLE users ADD CONSTRAINT fk_users_app_id FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE SET NULL'
      )
      console.log('✅ Foreign key fk_users_app_id adicionada com sucesso')
    } else {
      console.log('✓ Foreign key fk_users_app_id já existe')
    }
    
    console.log('✅ Migração concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro na migração:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

migrateAddAppIdFk()

