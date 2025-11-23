// API Backend - Similar KeyUnit
// Suporta integração com C++, C#, Lua
// Usa MySQL como banco de dados e Nodemailer para envio de emails

// Carregar variáveis de ambiente primeiro
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const mysql = require('mysql2/promise')
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const multer = require('multer')
const https = require('https')
const http = require('http')
const config = require('./config')
const { useSupabase, db, supabaseAnon, supabase } = require('./db_supabase')

const app = express()
const PORT = 3001
const IS_VERCEL = Boolean(process.env.VERCEL)
const ALLOW_DEBUG_CODES = process.env.ALLOW_DEBUG_CODES === 'true'
const DEMO_MODE = process.env.DEMO_MODE === 'true' || (IS_VERCEL && !useSupabase)
const memory = { users: [], licenses: [] }

// Configurar CORS para aceitar requisições do frontend
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true)
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://keyunit.online:3000',
      'https://keyunit.online',
      'http://keyunit.online',
      'http://keyunit.online:3000',
      'http://127.0.0.1:3000',
      'https://www.gouc.com.br',
      'https://gouc.com.br'
    ]
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('keyunit.online') || origin.includes('gouc.com.br')) {
      callback(null, true)
    } else {
      console.log('⚠️  CORS: Origem não permitida:', origin)
      callback(null, true) // Permitir temporariamente para debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Log de requisições para debug
app.use((req, res, next) => {
  // Obter IP do cliente (verificando headers de proxy)
  let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'unknown'
  if (clientIp && clientIp.includes(',')) {
    clientIp = clientIp.split(',')[0].trim()
  }
  
  // Limpar IPv6 localhost
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    clientIp = '127.0.0.1'
  }
  
  // Coletar informações de headers disponíveis
  const headersInfo = {
    origin: req.headers.origin || '(não enviado)',
    'user-agent': req.headers['user-agent']?.substring(0, 100) || '(não enviado)',
    ip: clientIp,
    referer: req.headers.referer || '(não enviado)'
  }
  
  // Log apenas para endpoints da API (evitar spam em assets estáticos)
  if (req.path.startsWith('/api/')) {
    console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`, headersInfo)
    
    // Se origin ou user-agent não foram enviados, logar todos os headers disponíveis para debug
    if (!req.headers.origin && !req.headers['user-agent']) {
      const availableHeaders = Object.keys(req.headers).filter(key => 
        !key.startsWith('x-forwarded') && 
        !key.startsWith('x-real-ip') &&
        key !== 'host' &&
        key !== 'connection' &&
        key !== 'accept-encoding'
      )
      if (availableHeaders.length > 0) {
        console.log(`   ℹ️  Headers disponíveis: ${availableHeaders.join(', ')}`)
      }
    }
  }
  
  next()
})

app.use(express.json())

// Configurar multer para upload de imagens
const uploadsDir = path.join(__dirname, 'uploads', 'chat-images')
const bannersDir = path.join(__dirname, 'uploads', 'banners')
try {
  if (!useSupabase && !IS_VERCEL) {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    if (!fs.existsSync(bannersDir)) fs.mkdirSync(bannersDir, { recursive: true })
  }
} catch (e) {
  console.warn('Uploads directories not created (likely read-only FS). Using memory storage on Vercel.', e.message)
}

const memoryStorage = multer.memoryStorage()

const storage = useSupabase
  ? memoryStorage
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir)
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, `image-${uniqueSuffix}${ext}`)
      }
    })

const bannerStorage = useSupabase
  ? memoryStorage
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, bannersDir)
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, `banner-${uniqueSuffix}${ext}`)
      }
    })

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)'))
    }
  }
})

const uploadBanner = multer({
  storage: bannerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para banners
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)'))
    }
  }
})

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Middleware de log para debug (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.path.includes('/api/')) {
      console.log(`\n📥 ${req.method} ${req.path}`)
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyCopy = { ...req.body }
        // Ocultar senhas e tokens
        if (bodyCopy.password) bodyCopy.password = '***'
        if (bodyCopy.sessionid) bodyCopy.sessionid = bodyCopy.sessionid.substring(0, 10) + '...'
        if (bodyCopy.temp_session) bodyCopy.temp_session = bodyCopy.temp_session.substring(0, 10) + '...'
        console.log('📦 Body:', JSON.stringify(bodyCopy, null, 2))
      }
    }
    next()
  })
}

// Criar pool de conexões MySQL
const pool = mysql.createPool(config.database)

// Função para executar schema SQL
const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Criar conexão sem especificar database primeiro para criar o banco se não existir
    const connectionWithoutDb = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password
    })
    
    // Criar banco de dados se não existir
    try {
      await connectionWithoutDb.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
      console.log('✅ Banco de dados criado/verificado')
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('Aviso ao criar banco de dados:', err.message)
      }
    }
    
    await connectionWithoutDb.end()
    
    // Criar conexão com o banco de dados
    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    })
    
    // Dividir schema em comandos individuais (excluindo CREATE DATABASE e USE)
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        if (cmd.length === 0) return false
        if (cmd.startsWith('--')) return false
        const cmdUpper = cmd.toUpperCase().trim()
        // Excluir CREATE DATABASE e USE
        if (cmdUpper.includes('CREATE DATABASE')) return false
        if (cmdUpper.startsWith('USE ')) return false
        return true
      })
    
    // Executar cada comando
    for (const command of commands) {
      if (command) {
        try {
          await connection.query(command)
        } catch (err) {
          // Ignorar erros de "já existe" para tabelas e índices
          if (!err.message.includes('already exists') && 
              !err.message.includes('Duplicate') && 
              !err.message.includes('ER_DUP_KEYNAME') &&
              !err.message.includes('ER_DUP_NAME')) {
            console.warn('Aviso ao executar schema:', err.message, '| Comando:', command.substring(0, 50) + '...')
          }
        }
      }
    }
    
    // Migração: Atualizar coluna code na tabela verification_codes para suportar tokens temporários
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'verification_codes' 
         AND COLUMN_NAME = 'code'`,
        [config.database.database]
      )
      
      if (columns.length > 0) {
        const column = columns[0]
        const currentLength = column.CHARACTER_MAXIMUM_LENGTH
        
        // Se o campo code tem apenas 6 caracteres, atualizar para 255
        if (currentLength && currentLength <= 6) {
          console.log('🔄 Atualizando coluna code na tabela verification_codes de VARCHAR(6) para VARCHAR(255)...')
          await connection.query(
            'ALTER TABLE verification_codes MODIFY COLUMN code VARCHAR(255) NOT NULL'
          )
          console.log('✅ Coluna code atualizada com sucesso para VARCHAR(255)')
        } else {
          console.log('✓ Coluna code já está configurada corretamente')
        }
      }
    } catch (err) {
      console.warn('⚠️  Aviso ao atualizar coluna code:', err.message)
    }
    
    // Migração: Adicionar coluna is_admin na tabela users
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'is_admin'`,
        [config.database.database]
      )
      
      if (columns.length === 0) {
        console.log('🔄 Adicionando coluna is_admin na tabela users...')
        await connection.query(
          'ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE'
        )
        console.log('✅ Coluna is_admin adicionada com sucesso')
      } else {
        console.log('✓ Coluna is_admin já existe')
      }
    } catch (err) {
      console.warn('⚠️  Aviso ao adicionar coluna is_admin:', err.message)
    }
    
    // Migração: Adicionar coluna plan na tabela users
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'plan'`,
        [config.database.database]
      )
      
      if (columns.length === 0) {
        console.log('🔄 Adicionando coluna plan na tabela users...')
        await connection.query(
          'ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT "tester"'
        )
        // Atualizar usuários existentes para terem o valor padrão 'tester'
        await connection.query(
          'UPDATE users SET plan = "tester" WHERE plan IS NULL OR plan = ""'
        )
        console.log('✅ Coluna plan adicionada com sucesso')
      } else {
        console.log('✓ Coluna plan já existe')
        // Garantir que usuários sem plano tenham o valor padrão
        await connection.query(
          'UPDATE users SET plan = "tester" WHERE plan IS NULL OR plan = ""'
        )
      }
    } catch (err) {
      console.warn('⚠️  Aviso ao adicionar coluna plan:', err.message)
    }
    
    // Migração: Adicionar coluna plan_expires_at na tabela users
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'plan_expires_at'`,
        [config.database.database]
      )
      
      if (columns.length === 0) {
        console.log('🔄 Adicionando coluna plan_expires_at na tabela users...')
        await connection.query(
          'ALTER TABLE users ADD COLUMN plan_expires_at DATETIME NULL'
        )
        console.log('✅ Coluna plan_expires_at adicionada com sucesso')
      } else {
        console.log('✓ Coluna plan_expires_at já existe')
      }
    } catch (err) {
      console.warn('⚠️  Aviso ao adicionar coluna plan_expires_at:', err.message)
    }
    
    // Adicionar foreign key app_id em users após criar applications
    try {
      // Verificar se a tabela applications existe
      const [tables] = await connection.query(
        `SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'applications'`,
        [config.database.database]
      )
      
      if (tables.length > 0) {
        // Verificar se a constraint já existe
        const [constraints] = await connection.query(
          `SELECT CONSTRAINT_NAME 
           FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
           WHERE CONSTRAINT_SCHEMA = ? 
           AND TABLE_NAME = 'users' 
           AND CONSTRAINT_NAME = 'fk_users_app_id'`,
          [config.database.database]
        )
        
        if (constraints.length === 0) {
          // Verificar se a coluna app_id existe
          const [columns] = await connection.query(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = 'users' 
             AND COLUMN_NAME = 'app_id'`,
            [config.database.database]
          )
          
          if (columns.length > 0) {
            // Adicionar foreign key
            await connection.query(
              'ALTER TABLE users ADD CONSTRAINT fk_users_app_id FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE SET NULL'
            )
            console.log('✅ Foreign key fk_users_app_id adicionada à tabela users')
          } else {
            console.warn('⚠️  Coluna app_id não encontrada na tabela users')
          }
        } else {
          console.log('✓ Foreign key fk_users_app_id já existe')
        }
      } else {
        console.warn('⚠️  Tabela applications não encontrada. Foreign key não será adicionada.')
      }
    } catch (err) {
      // Ignorar erro se a constraint já existir
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_NAME' || err.message.includes('Duplicate key name')) {
        console.log('✓ Foreign key fk_users_app_id já existe')
      } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_CANNOT_ADD_FOREIGN' || err.message.includes('Cannot add foreign key constraint')) {
        console.warn('⚠️  Não foi possível adicionar foreign key. Certifique-se de que a tabela applications existe e tem a coluna id.')
      } else {
        console.warn('⚠️  Aviso ao adicionar foreign key fk_users_app_id:', err.message)
      }
    }
    
    // Migração: Criar tabela videos se não existir
    try {
      const [tables] = await connection.query(
        `SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'videos'`,
        [config.database.database]
      )
      
      if (tables.length === 0) {
        console.log('🔄 Criando tabela videos...')
        await connection.query(`
          CREATE TABLE IF NOT EXISTS videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            video_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            category VARCHAR(50) DEFAULT 'tutorial',
            language VARCHAR(10) DEFAULT 'pt-BR',
            duration INT,
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
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ Tabela videos criada com sucesso')
      } else {
        console.log('✓ Tabela videos já existe')
      }
    } catch (err) {
      console.warn('⚠️  Aviso ao criar tabela videos:', err.message)
    }
    
    // Migração: Criar tabelas Anti-Crack
    try {
      // Criar tabela anticrack_logs
      await connection.query(`
        CREATE TABLE IF NOT EXISTS anticrack_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          app_name VARCHAR(255) NOT NULL,
          owner_id VARCHAR(255) NOT NULL,
          threat_type VARCHAR(50) NOT NULL,
          threat_data TEXT,
          ip_address VARCHAR(45),
          session_id VARCHAR(255),
          severity VARCHAR(20) DEFAULT 'high',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_app_owner (app_name, owner_id),
          INDEX idx_created_at (created_at),
          INDEX idx_threat_type (threat_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      
      // Verificar se coluna severity existe, se não, adicionar
      const [severityColumns] = await connection.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'anticrack_logs' 
         AND COLUMN_NAME = 'severity'`,
        [config.database.database]
      )
      
      if (severityColumns.length === 0) {
        console.log('🔄 Adicionando coluna severity na tabela anticrack_logs...')
        await connection.query(
          'ALTER TABLE anticrack_logs ADD COLUMN severity VARCHAR(20) DEFAULT "high"'
        )
        console.log('✅ Coluna severity adicionada com sucesso')
      }
      
      // Criar tabela anticrack_monitoring
      await connection.query(`
        CREATE TABLE IF NOT EXISTS anticrack_monitoring (
          id INT AUTO_INCREMENT PRIMARY KEY,
          app_name VARCHAR(255) NOT NULL,
          owner_id VARCHAR(255) NOT NULL,
          is_monitoring BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_app_owner (app_name, owner_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      
      console.log('✓ Tabelas Anti-Crack verificadas/criadas')
    } catch (err) {
      console.warn('⚠️  Aviso ao criar tabelas Anti-Crack:', err.message)
    }
    
    await connection.end()
    console.log('✅ Banco de dados inicializado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }
}

// Inicializar banco de dados na primeira execução
if (!IS_VERCEL) initializeDatabase()

app.get('/api/health', async (req, res) => {
  const result = {
    vercel: IS_VERCEL,
    useSupabase,
    supabase: {
      url_set: Boolean(process.env.SUPABASE_URL),
      key_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)
    },
    email: {
      host: config.email.host,
      port: config.email.port,
      configured: Boolean(
        config.email.auth.user &&
        config.email.auth.pass &&
        config.email.auth.user !== 'seu-email@gmail.com' &&
        config.email.auth.pass !== 'sua-senha-de-app'
      )
    },
    mercadopago: {
      token_set: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN)
    },
    tables: {
      users_exists: null,
      verification_codes_exists: null
    }
  }
  try {
    const { supabase } = require('./db_supabase')
    if (useSupabase && supabase) {
      const usersCheck = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .limit(1)
      result.tables.users_exists = !usersCheck.error
      const codesCheck = await supabase
        .from('verification_codes')
        .select('id', { count: 'exact' })
        .limit(1)
      result.tables.verification_codes_exists = !codesCheck.error
      if (usersCheck.error) result.tables.users_error = usersCheck.error.message
      if (codesCheck.error) result.tables.verification_codes_error = codesCheck.error.message
    }
    res.json({ success: true, health: result })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao verificar health', error: err.message })
  }
})

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: parseInt(config.email.port),
  secure: config.email.secure === true || config.email.port === 465, // true para 465, false para outras portas
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass ? config.email.auth.pass.trim() : config.email.auth.pass // Remove espaços extras
  },
  tls: {
    // Não rejeitar conexões não autorizadas
    rejectUnauthorized: false
  },
  debug: true, // Sempre habilitar debug para identificar problemas
  logger: true // Sempre habilitar logs
})

// Verificar conexão de email (opcional, apenas para debug)
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️  Erro na configuração de email:', error.message)
    console.log('⚠️  Configure as variáveis de ambiente EMAIL_USER e EMAIL_PASS no arquivo .env')
    console.log('⚠️  Para Gmail, você precisa:')
    console.log('   1. Ativar verificação em duas etapas na sua conta Google')
    console.log('   2. Criar uma "Senha de App" em: https://myaccount.google.com/apppasswords')
    console.log('   3. Usar essa senha no campo EMAIL_PASS')
    console.log('⚠️  Configuração atual:', {
      host: config.email.host,
      port: config.email.port,
      user: config.email.auth.user === 'seu-email@gmail.com' ? 'NÃO CONFIGURADO' : config.email.auth.user,
      pass: config.email.auth.pass === 'sua-senha-de-app' ? 'NÃO CONFIGURADO' : '***',
      from: config.email.from
    })
  } else {
    console.log('✅ Servidor de email configurado com sucesso')
    console.log('📧 Configuração:', {
      host: config.email.host,
      port: config.email.port,
      from: config.email.from,
      user: config.email.auth.user
    })
    
    // Teste de envio de email (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development' && config.email.auth.user && config.email.auth.user !== 'seu-email@gmail.com') {
      console.log('📧 Testando envio de email...')
      transporter.sendMail({
        from: config.email.from,
        to: config.email.from, // Enviar para si mesmo
        subject: 'Teste de Configuração - KeyUnit',
        text: 'Este é um email de teste. Se você recebeu isso, a configuração de email está funcionando!',
        html: '<p>Este é um email de teste. Se você recebeu isso, a configuração de email está funcionando!</p>'
      }).then(info => {
        console.log('✅ Email de teste enviado com sucesso! MessageId:', info.messageId)
        console.log('📧 Verifique sua caixa de entrada (e pasta de spam) em:', config.email.from)
      }).catch(testError => {
        console.error('❌ Erro ao enviar email de teste:', testError.message)
        console.error('❌ Detalhes:', {
          code: testError.code,
          responseCode: testError.responseCode,
          command: testError.command
        })
      })
    }
  }
})

// Função para gerar hash
const generateHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Função para gerar token de sessão
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Função para gerar código de verificação (6 dígitos)
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Função para enviar email de verificação
const sendVerificationEmail = async (email, code) => {
  console.log('📧 [sendVerificationEmail] Iniciando função...')
  try {
    console.log('🔍 [sendVerificationEmail] Verificando configuração de email...')
    // Verificar se email está configurado
    if (!config.email.auth.user || !config.email.auth.pass || 
        config.email.auth.user === 'seu-email@gmail.com' || 
        config.email.auth.pass === 'sua-senha-de-app') {
      console.error('❌ [sendVerificationEmail] Email não configurado!')
      throw new Error('Email não configurado. Crie um arquivo .env na pasta api/ com EMAIL_USER, EMAIL_PASS e EMAIL_FROM')
    }
    console.log('✅ [sendVerificationEmail] Configuração de email OK')

    console.log('📝 [sendVerificationEmail] Criando mailOptions...')
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Código de Verificação - Sistema de Autenticação',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Código de Verificação</h2>
          <p>Olá,</p>
          <p>Seu código de verificação é:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>Este código expira em 10 minutos.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Este é um email automático, por favor não responda.</p>
        </div>
      `,
      text: `Seu código de verificação é: ${code}\n\nEste código expira em 10 minutos.`
    }
    console.log('✅ [sendVerificationEmail] mailOptions criado')

    console.log(`📧 [sendVerificationEmail] Tentando enviar email para: ${email}`)
    console.log(`📧 [sendVerificationEmail] Configuração de email:`, {
      host: config.email.host,
      port: config.email.port,
      from: config.email.from,
      user: config.email.auth.user ? config.email.auth.user.substring(0, 3) + '***' : 'não configurado',
      pass: config.email.auth.pass ? '***' : 'não configurado'
    })
    
    console.log('📤 [sendVerificationEmail] Chamando transporter.sendMail...')
    console.log('📤 [sendVerificationEmail] mailOptions:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text
    })
    
    try {
      const info = await transporter.sendMail(mailOptions)
      console.log(`✅ [sendVerificationEmail] Email enviado para ${email}:`, info.messageId)
      console.log(`✅ [sendVerificationEmail] Resposta completa:`, JSON.stringify(info, null, 2))
      return true
    } catch (sendError) {
      console.error('❌ [sendVerificationEmail] Erro DURANTE sendMail:', sendError)
      throw sendError
    }
  } catch (error) {
    console.error('❌ [sendVerificationEmail] Erro capturado!')
    console.error('❌ [sendVerificationEmail] Mensagem:', error.message)
    console.error('❌ [sendVerificationEmail] Tipo:', typeof error)
    console.error('❌ [sendVerificationEmail] Erro completo:', error)
    console.error('❌ [sendVerificationEmail] Detalhes completos:', {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response,
      stack: error.stack
    })
    throw error
  }
}

// Enviar email de recuperação de senha
const sendPasswordResetEmail = async (email, code, username) => {
  console.log('📧 [sendPasswordResetEmail] Iniciando função...')
  try {
    // Verificar se email está configurado
    if (!config.email.auth.user || !config.email.auth.pass || 
        config.email.auth.user === 'seu-email@gmail.com' || 
        config.email.auth.pass === 'sua-senha-de-app') {
      console.error('❌ [sendPasswordResetEmail] Email não configurado!')
      throw new Error('Email não configurado. Crie um arquivo .env na pasta api/ com EMAIL_USER, EMAIL_PASS e EMAIL_FROM')
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Recuperação de Senha - KeyUnit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 30px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #60a5fa; margin: 0; font-size: 32px;">
              <span style="color: #60a5fa;">Key</span><span style="color: #ffffff;">Unit</span>
            </h1>
          </div>
          <div style="background-color: #1e293b; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-top: 0;">Recuperação de Senha</h2>
            <p style="color: #cbd5e1; line-height: 1.6;">
              Olá ${username || 'usuário'},
            </p>
            <p style="color: #cbd5e1; line-height: 1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar:
            </p>
            <div style="background-color: #0f172a; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px solid #3b82f6;">
              <h1 style="color: #60a5fa; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">${code}</h1>
            </div>
            <p style="color: #cbd5e1; line-height: 1.6; font-size: 14px;">
              ⏰ Este código expira em <strong style="color: #60a5fa;">10 minutos</strong>.
            </p>
            <p style="color: #cbd5e1; line-height: 1.6; font-size: 14px;">
              Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #334155; margin: 25px 0;">
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
            Este é um email automático, por favor não responda.<br>
            © ${new Date().getFullYear()} KeyUnit - Sistema de Autenticação
          </p>
        </div>
      `,
      text: `Recuperação de Senha - KeyUnit\n\nOlá ${username || 'usuário'},\n\nRecebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar:\n\n${code}\n\nEste código expira em 10 minutos.\n\nSe você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.\n\n© ${new Date().getFullYear()} KeyUnit - Sistema de Autenticação`
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ [sendPasswordResetEmail] Email enviado para ${email}:`, info.messageId)
    return true
  } catch (error) {
    console.error('❌ [sendPasswordResetEmail] Erro:', error.message)
    throw error
  }
}

// Limpar códigos de verificação expirados
const cleanupExpiredCodes = async () => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    await pool.query(
      'DELETE FROM verification_codes WHERE expires < ? AND used = FALSE',
      [now]
    )
  } catch (error) {
    console.error('Erro ao limpar códigos expirados:', error.message)
  }
}

// Executar limpeza a cada 5 minutos
if (!IS_VERCEL) setInterval(cleanupExpiredCodes, 5 * 60 * 1000)

// ========================================
// SISTEMA DE VERIFICAÇÃO DE LIMITES DE PLANOS
// ========================================

// Definir limites de cada plano
const PLAN_LIMITS = {
  tester: {
    applications: 1,
    licenses: 10,
    users: 10,
    maxUploadSize: 10 * 1024 * 1024, // 10 MB em bytes
    globalVariables: 5, // Limite de variáveis globais
    webhooks: 2,
    hasUserVariables: false,
    hasAdvancedLogs: false,
    hasWebhookAuth: false
  },
  weekly: {
    applications: 3,
    licenses: 20,
    users: 50,
    maxUploadSize: 15 * 1024 * 1024, // 15 MB
    globalVariables: -1, // Ilimitado
    webhooks: 5,
    hasUserVariables: false,
    hasAdvancedLogs: true,
    hasWebhookAuth: false
  },
  monthly: {
    applications: -1, // Ilimitado
    licenses: -1, // Ilimitado
    users: -1, // Ilimitado
    maxUploadSize: 50 * 1024 * 1024, // 50 MB
    globalVariables: -1, // Ilimitado
    webhooks: -1, // Ilimitado
    hasUserVariables: true,
    hasAdvancedLogs: true,
    hasWebhookAuth: false
  },
  quarterly: {
    applications: -1,
    licenses: -1,
    users: -1,
    maxUploadSize: 75 * 1024 * 1024, // 75 MB
    globalVariables: -1,
    webhooks: -1,
    hasUserVariables: true,
    hasAdvancedLogs: true,
    hasWebhookAuth: true
  },
  annual: {
    applications: -1,
    licenses: -1,
    users: -1,
    maxUploadSize: 150 * 1024 * 1024, // 150 MB
    globalVariables: -1,
    webhooks: -1,
    hasUserVariables: true,
    hasAdvancedLogs: true,
    hasWebhookAuth: true
  },
  lifetime: {
    applications: -1,
    licenses: -1,
    users: -1,
    maxUploadSize: -1, // Ilimitado
    globalVariables: -1,
    webhooks: -1,
    hasUserVariables: true,
    hasAdvancedLogs: true,
    hasWebhookAuth: true
  }
}

PLAN_LIMITS.test_5m = {
  applications: 2,
  licenses: 5,
  users: 10,
  maxUploadSize: 10 * 1024 * 1024,
  globalVariables: 10,
  webhooks: 5,
  hasUserVariables: false,
  hasAdvancedLogs: false,
  hasWebhookAuth: false
}

// Função para obter o plano do usuário, aplicando expiração se necessário
const getUserPlan = async (connection, userId) => {
  try {
    const [rows] = await connection.query(
      'SELECT plan, plan_expires_at FROM users WHERE id = ?',
      [userId]
    )
    if (rows.length === 0) return 'tester'
    const plan = rows[0].plan || 'tester'
    const expAt = rows[0].plan_expires_at
    if (expAt && plan !== 'lifetime') {
      const now = new Date()
      const exp = new Date(expAt)
      if (exp <= now) {
        await connection.query('UPDATE users SET plan = ?, plan_expires_at = NULL WHERE id = ?', ['tester', userId])
        return 'tester'
      }
    }
    return plan
  } catch (error) {
    console.error('Erro ao obter plano do usuário:', error)
    return 'tester'
  }
}

// Função para obter limites do plano
const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.tester
}

// Verificar limite de aplicações
const checkApplicationLimit = async (connection, userId, plan) => {
  const limits = getPlanLimits(plan)
  if (limits.applications === -1) return { allowed: true }
  
  const [rows] = await connection.query(
    'SELECT COUNT(*) as count FROM applications WHERE user_id = ?',
    [userId]
  )
  const currentCount = rows[0].count
  
  if (currentCount >= limits.applications) {
    return {
      allowed: false,
      message: `Limite de aplicações atingido. Seu plano (${plan}) permite ${limits.applications} aplicação(ões). Faça upgrade para criar mais aplicações.`,
      current: currentCount,
      limit: limits.applications
    }
  }
  
  return { allowed: true, current: currentCount, limit: limits.applications }
}

// Verificar limite de licenças
const checkLicenseLimit = async (connection, userId, appId, plan, amount = 1) => {
  const limits = getPlanLimits(plan)
  if (limits.licenses === -1) return { allowed: true }
  
  const [rows] = await connection.query(
    'SELECT COUNT(*) as count FROM licenses WHERE app_id = ?',
    [appId]
  )
  const currentCount = rows[0].count
  
  if (currentCount + amount > limits.licenses) {
    return {
      allowed: false,
      message: `Limite de licenças atingido. Seu plano (${plan}) permite ${limits.licenses} licenças por aplicação. Você já tem ${currentCount} licenças. Faça upgrade para criar mais licenças.`,
      current: currentCount,
      limit: limits.licenses
    }
  }
  
  return { allowed: true, current: currentCount, limit: limits.licenses }
}

// Verificar limite de usuários
const checkUserLimit = async (connection, appId, plan, amount = 1) => {
  const limits = getPlanLimits(plan)
  if (limits.users === -1) return { allowed: true }
  
  try {
    if (useSupabase && supabase) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('app_id', appId)
      if (error) throw new Error(error.message)
      const currentCount = count || 0
      if (currentCount + amount > limits.users) {
        return {
          allowed: false,
          message: `Limite de usuários atingido. Seu plano (${plan}) permite ${limits.users} usuários por aplicação. Você já tem ${currentCount} usuários. Faça upgrade para criar mais usuários.`,
          current: currentCount,
          limit: limits.users
        }
      }
      return { allowed: true, current: currentCount, limit: limits.users }
    }
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE app_id = ?',
      [appId]
    )
    const currentCount = rows[0].count
    if (currentCount + amount > limits.users) {
      return {
        allowed: false,
        message: `Limite de usuários atingido. Seu plano (${plan}) permite ${limits.users} usuários por aplicação. Você já tem ${currentCount} usuários. Faça upgrade para criar mais usuários.`,
        current: currentCount,
        limit: limits.users
      }
    }
    return { allowed: true, current: currentCount, limit: limits.users }
  } catch (error) {
    return { allowed: true }
  }
}

// Verificar limite de tamanho de upload
const checkUploadSizeLimit = (plan, fileSize) => {
  const limits = getPlanLimits(plan)
  if (limits.maxUploadSize === -1) return { allowed: true }
  
  if (fileSize > limits.maxUploadSize) {
    const maxSizeMB = limits.maxUploadSize / (1024 * 1024)
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)
    return {
      allowed: false,
      message: `Tamanho de arquivo excedido. Seu plano (${plan}) permite uploads de até ${maxSizeMB} MB. O arquivo tem ${fileSizeMB} MB. Faça upgrade para fazer uploads maiores.`,
      maxSize: limits.maxUploadSize,
      fileSize: fileSize
    }
  }
  
  return { allowed: true }
}

// Verificar limite de variáveis globais
const checkGlobalVariableLimit = async (connection, userId, appId, plan) => {
  const limits = getPlanLimits(plan)
  if (limits.globalVariables === -1) return { allowed: true }
  
  const [rows] = await connection.query(
    'SELECT COUNT(*) as count FROM user_variables WHERE app_id = ? AND user_id IS NULL',
    [appId]
  )
  const currentCount = rows[0].count
  
  if (currentCount >= limits.globalVariables) {
    return {
      allowed: false,
      message: `Limite de variáveis globais atingido. Seu plano (${plan}) permite ${limits.globalVariables} variáveis globais. Faça upgrade para criar mais variáveis.`,
      current: currentCount,
      limit: limits.globalVariables
    }
  }
  
  return { allowed: true, current: currentCount, limit: limits.globalVariables }
}

// Verificar limite de webhooks
const checkWebhookLimit = async (connection, appId, plan) => {
  const limits = getPlanLimits(plan)
  if (limits.webhooks === -1) return { allowed: true }
  
  try {
    if (useSupabase && supabase) {
      const { count, error } = await supabase
        .from('webhooks')
        .select('id', { count: 'exact', head: true })
        .eq('app_id', appId)
      if (error) throw new Error(error.message)
      const currentCount = count || 0
      if (currentCount >= limits.webhooks) {
        return {
          allowed: false,
          message: `Limite de webhooks atingido. Seu plano (${plan}) permite ${limits.webhooks} webhook(s). Faça upgrade para criar mais webhooks.`,
          current: currentCount,
          limit: limits.webhooks
        }
      }
      return { allowed: true, current: currentCount, limit: limits.webhooks }
    }
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM webhooks WHERE app_id = ?',
      [appId]
    )
    const currentCount = rows[0].count
    if (currentCount >= limits.webhooks) {
      return {
        allowed: false,
        message: `Limite de webhooks atingido. Seu plano (${plan}) permite ${limits.webhooks} webhook(s). Faça upgrade para criar mais webhooks.`,
        current: currentCount,
        limit: limits.webhooks
      }
    }
    return { allowed: true, current: currentCount, limit: limits.webhooks }
  } catch (error) {
    return { allowed: true }
  }
}

// Verificar se plano tem variáveis de usuário
const hasUserVariables = (plan) => {
  const limits = getPlanLimits(plan)
  return limits.hasUserVariables
}

// Verificar se plano tem logs avançados
const hasAdvancedLogs = (plan) => {
  const limits = getPlanLimits(plan)
  return limits.hasAdvancedLogs
}

// Verificar se plano tem autenticação de webhook
const hasWebhookAuth = (plan) => {
  const limits = getPlanLimits(plan)
  return limits.hasWebhookAuth
}

// Endpoint: Login
app.post('/api/login', async (req, res) => {
  let connection
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      })
    }
    if (useSupabase) {
      const user = await db.getUserByUsername(username)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuário não encontrado' })
      }
      const passwordHash = generateHash(password)
      if (user.password_hash !== passwordHash) {
        return res.status(401).json({ success: false, message: 'Senha incorreta' })
      }
      if (user.two_factor_enabled) {
        const tempSessionToken = generateSessionToken()
        const expires = new Date(Date.now() + 10 * 60 * 1000)
        const tempCode = 'TEMP_SESSION_' + tempSessionToken
        await db.deleteVerificationCodesByEmail(user.email || '')
        await db.insertVerificationCode({ email: user.email || '', code: tempCode, username: user.username, password_hash: '', expires })
        const hasEmail = Boolean(user.email)
        return res.json({ success: true, requires_2fa: true, message: 'Código 2FA necessário para completar o login', temp_session: tempSessionToken, has_email: hasEmail, username: user.username })
      }
      const sessionToken = generateSessionToken()
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
      await db.updateUserSession(user.id, sessionToken, nowStr)
      return res.json({ success: true, message: 'Login realizado com sucesso', requires_2fa: false, info: { username: user.username, subscription: user.subscription, expires: user.expires, sessionid: sessionToken } })
    }

    connection = await pool.getConnection()
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    
    if (rows.length === 0) {
      connection.release()
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const user = rows[0]
    const passwordHash = generateHash(password)
    
    if (user.password_hash !== passwordHash) {
      connection.release()
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      })
    }

    // Verificar se 2FA está ativo
    if (user.two_factor_enabled) {
      console.log('🔐 2FA está ativo para o usuário:', user.username)
      
      // Criar token temporário para verificação 2FA
      const tempSessionToken = generateSessionToken() // Remover o prefixo 'temp_' aqui
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      
      // Salvar token temporário no banco
      const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
      const expiresStr = expires.toISOString().slice(0, 19).replace('T', ' ')
      const tempCode = 'TEMP_SESSION_' + tempSessionToken
      
      console.log('🔑 Criando token temporário:', tempCode.substring(0, 30) + '...')
      console.log('📧 Email do usuário:', user.email || 'não cadastrado')
      console.log('⏰ Expira em:', expiresStr)
      
      // Limpar tokens temporários antigos deste usuário
      await connection.query(
        'DELETE FROM verification_codes WHERE username = ? AND code LIKE ?',
        [user.username, 'TEMP_SESSION_%']
      )
      
      // Salvar token temporário na tabela verification_codes
      await connection.query(
        `INSERT INTO verification_codes (email, code, username, password_hash, expires)
         VALUES (?, ?, ?, ?, ?)`,
        [user.email || '', tempCode, user.username, '', expiresStr]
      )
      
      console.log('✅ Token temporário salvo no banco de dados')
      
      connection.release()
      
      // Verificar se usuário tem email para enviar código 2FA
      const hasEmail = user.email && 
                       config.email.auth.user && 
                       config.email.auth.pass &&
                       config.email.auth.user !== 'seu-email@gmail.com' &&
                       config.email.auth.pass !== 'sua-senha-de-app'
      
      console.log('📧 Email configurado:', hasEmail ? 'Sim' : 'Não')
      
      return res.json({
        success: true,
        requires_2fa: true,
        message: 'Código 2FA necessário para completar o login',
        temp_session: tempSessionToken,
        has_email: hasEmail,
        username: user.username
      })
    }

    // Se 2FA não está ativo, fazer login normalmente
    const sessionToken = generateSessionToken()
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    await connection.query(
      'UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
      [sessionToken, now, user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      requires_2fa: false,
      info: {
        username: user.username,
        subscription: user.subscription,
        expires: user.expires,
        sessionid: sessionToken
      }
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro no login:', error)
    res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    })
  }
})

// Endpoint: Enviar código de verificação por email
app.post('/api/send-verification-code', async (req, res) => {
  console.log('📥 [SEND-VERIFICATION-CODE] Requisição recebida')
  let connection
  try {
    const { email, username, password } = req.body
    console.log('📥 [SEND-VERIFICATION-CODE] Dados recebidos:', { 
      email, 
      username, 
      password: password ? '***' : undefined 
    })

    if (!username || !password || !email) {
      console.log('❌ [SEND-VERIFICATION-CODE] Campos obrigatórios faltando')
      return res.status(400).json({
        success: false,
        message: 'Username, password e email são obrigatórios'
      })
    }

    if (IS_VERCEL && !useSupabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase não configurado na Vercel. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY e USE_SUPABASE=true.',
      })
    }

    if (useSupabase) {
      console.log('🔌 [SEND-VERIFICATION-CODE] Usando Supabase (envio de código por email)')
      try {
        const existingUser = await db.getUserByUsername(username)
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'Usuário já existe' })
        }
        const { data: emailCheck, error: emailErr } = require('./db_supabase').supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .limit(1)
          .maybeSingle()
        if (emailErr) throw new Error(emailErr.message)
        if (emailCheck) {
          return res.status(400).json({ success: false, message: 'Email já cadastrado' })
        }
        await db.deleteVerificationCodesByEmail(email)
        const passwordHash = generateHash(password)
        const expires = new Date(Date.now() + config.verificationCodeExpiry)
        const code = generateVerificationCode()
        await db.insertVerificationCode({ email, code, username, password_hash: passwordHash, expires, used: false })
        try {
          await sendVerificationEmail(email, code)
          return res.json({ success: true, message: 'Código de verificação enviado para seu email!' })
        } catch (emailError) {
          let errorMessage = 'Erro ao enviar email'
          if (emailError.code === 'EAUTH') {
            errorMessage = 'Erro de autenticação. Verifique EMAIL_USER e EMAIL_PASS no ambiente'
          } else if (emailError.code === 'ECONNECTION') {
            errorMessage = 'Erro de conexão com o servidor de email'
          } else if (emailError.responseCode === 535) {
            errorMessage = 'Credenciais inválidas para SMTP'
          } else if (emailError.message) {
            errorMessage = `Erro ao enviar email: ${emailError.message}`
          }
          if (ALLOW_DEBUG_CODES) {
            return res.json({ success: true, message: 'Código gerado. O envio por email falhou, use o código exibido.', debug: { code } })
          }
          return res.status(500).json({ success: false, message: errorMessage, error: emailError.message, code: emailError.code })
        }
      } catch (supabaseError) {
        const msg = supabaseError.message || 'Erro no banco (Supabase)'
        const needsSchema = /relation .* does not exist/i.test(msg) || /table .* does not exist/i.test(msg)
        return res.status(500).json({
          success: false,
          message: needsSchema
            ? 'Tabelas ausentes no Supabase. Crie as tabelas users e verification_codes conforme o SQL fornecido.'
            : `Erro no banco (Supabase): ${msg}`,
          error: msg
        })
      }
    }

    console.log('🔌 [SEND-VERIFICATION-CODE] Tentando obter conexão do banco...')
    try {
      connection = await pool.getConnection()
      console.log('✅ [SEND-VERIFICATION-CODE] Conexão do banco obtida com sucesso')
    } catch (dbError) {
      console.error('❌ [SEND-VERIFICATION-CODE] Erro ao obter conexão do banco de dados:', dbError.message)
      console.error('❌ [SEND-VERIFICATION-CODE] Stack:', dbError.stack)
      return res.status(500).json({
        success: false,
        message: 'Erro ao conectar ao banco de dados',
        error: dbError.message
      })
    }

    try {
      console.log('🔍 [SEND-VERIFICATION-CODE] Verificando se usuário já existe...')
      // Verificar se usuário já existe
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      )
      if (existingUsers.length > 0) {
        console.log('❌ [SEND-VERIFICATION-CODE] Usuário já existe:', username)
        connection.release()
        return res.status(400).json({
          success: false,
          message: 'Usuário já existe'
        })
      }
      console.log('✅ [SEND-VERIFICATION-CODE] Usuário não existe, pode continuar')

      console.log('🔍 [SEND-VERIFICATION-CODE] Verificando se email já existe...')
      // Verificar se email já existe
      const [existingEmails] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      )
      if (existingEmails.length > 0) {
        console.log('❌ [SEND-VERIFICATION-CODE] Email já cadastrado:', email)
        connection.release()
        return res.status(400).json({
          success: false,
          message: 'Email já cadastrado'
        })
      }
      console.log('✅ [SEND-VERIFICATION-CODE] Email não existe, pode continuar')

      console.log('🧹 [SEND-VERIFICATION-CODE] Limpando códigos antigos...')
      // Limpar códigos antigos para este email
      await connection.query(
        'DELETE FROM verification_codes WHERE email = ? AND used = FALSE',
        [email]
      )
      console.log('✅ [SEND-VERIFICATION-CODE] Códigos antigos limpos')

      console.log('🔢 [SEND-VERIFICATION-CODE] Gerando código de verificação...')
      // Gerar código de verificação
      const code = generateVerificationCode()
      const expires = new Date(Date.now() + config.verificationCodeExpiry)
      const expiresStr = expires.toISOString().slice(0, 19).replace('T', ' ')
      const passwordHash = generateHash(password)
      console.log('✅ [SEND-VERIFICATION-CODE] Código gerado:', code)

      console.log('💾 [SEND-VERIFICATION-CODE] Salvando código no banco...')
      // Salvar código de verificação no banco
      await connection.query(
        `INSERT INTO verification_codes (email, code, username, password_hash, expires)
         VALUES (?, ?, ?, ?, ?)`,
        [email, code, username, passwordHash, expiresStr]
      )
      console.log('✅ [SEND-VERIFICATION-CODE] Código salvo no banco com sucesso')

      // Liberar conexão antes de enviar email (operação que pode demorar)
      connection.release()
      connection = null
      console.log('🔓 [SEND-VERIFICATION-CODE] Conexão liberada, iniciando envio de email...')

      // Enviar email com código de verificação
      try {
        console.log('📧 [SEND-VERIFICATION-CODE] Chamando sendVerificationEmail...')
        await sendVerificationEmail(email, code)
        console.log('✅ [SEND-VERIFICATION-CODE] Email enviado com sucesso!')
        
        return res.json({
          success: true,
          message: 'Código de verificação enviado para seu email!'
        })
      } catch (emailError) {
        console.error('❌ [SEND-VERIFICATION-CODE] Erro ao enviar email, mas código foi gerado:', emailError.message)
        console.error('❌ [SEND-VERIFICATION-CODE] Tipo do erro:', typeof emailError)
        console.error('❌ [SEND-VERIFICATION-CODE] Erro completo:', emailError)
        console.error('❌ [SEND-VERIFICATION-CODE] Detalhes completos do erro:', {
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
          responseCode: emailError.responseCode,
          stack: emailError.stack
        })
        
        // Mensagem de erro mais específica
        let errorMessage = 'Erro ao enviar email'
        if (emailError.code === 'EAUTH') {
          errorMessage = 'Erro de autenticação. Verifique se EMAIL_USER e EMAIL_PASS estão corretos no arquivo .env. Para Gmail, use uma "Senha de App" criada em https://myaccount.google.com/apppasswords'
        } else if (emailError.code === 'ECONNECTION') {
          errorMessage = 'Erro de conexão com o servidor de email. Verifique sua conexão com a internet'
        } else if (emailError.responseCode === 535) {
          errorMessage = 'Credenciais inválidas. Verifique EMAIL_USER e EMAIL_PASS no arquivo .env'
        } else if (emailError.message) {
          errorMessage = `Erro ao enviar email: ${emailError.message}`
        }
        if (ALLOW_DEBUG_CODES) {
          return res.json({
            success: true,
            message: 'Código gerado. O envio por email falhou, use o código exibido.',
            debug: { code }
          })
        }
        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: emailError.message,
          code: emailError.code,
          debug: process.env.NODE_ENV === 'development' ? {
            responseCode: emailError.responseCode,
            command: emailError.command
          } : undefined
        })
      }
    } catch (queryError) {
      console.error('❌ [SEND-VERIFICATION-CODE] Erro ao executar query no banco de dados:', queryError.message)
      console.error('❌ [SEND-VERIFICATION-CODE] Tipo do erro:', typeof queryError)
      console.error('❌ [SEND-VERIFICATION-CODE] Erro completo:', queryError)
      console.error('❌ [SEND-VERIFICATION-CODE] Stack:', queryError.stack)
      if (connection) {
        connection.release()
        connection = null
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar solicitação no banco de dados',
        error: queryError.message
      })
    }
  } catch (error) {
    console.error('❌ [SEND-VERIFICATION-CODE] Erro inesperado ao enviar código de verificação:', error.message)
    console.error('❌ [SEND-VERIFICATION-CODE] Tipo do erro:', typeof error)
    console.error('❌ [SEND-VERIFICATION-CODE] Erro completo:', error)
    console.error('❌ [SEND-VERIFICATION-CODE] Stack:', error.stack)
    if (connection) {
      connection.release()
    }
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    })
  }
})

// Endpoint: Registro com código de verificação
app.post('/api/register', async (req, res) => {
  let connection
  try {
    const { username, password, email, verificationCode } = req.body

    if (!username || !password || !email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      })
    }

    if (useSupabase) {
      const pending = await db.findVerificationCode({ email, code: verificationCode })
      if (!pending) {
        return res.status(400).json({ success: false, message: 'Código de verificação inválido ou não encontrado. Solicite um novo código.' })
      }
      const now = new Date()
      const expires = new Date(pending.expires)
      if (now > expires || pending.used) {
        await db.markVerificationCodeUsed(pending.id)
        return res.status(400).json({ success: false, message: 'Código de verificação expirado. Solicite um novo código.' })
      }
      const passwordHash = generateHash(password)
      if (pending.username !== username || pending.password_hash !== passwordHash) {
        return res.status(400).json({ success: false, message: 'Username ou password não correspondem ao solicitado' })
      }
      const sessionToken = generateSessionToken()
      const expiresDate = new Date(Date.now() + config.subscriptionDefaultDays * 24 * 60 * 60 * 1000)
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
      await db.insertUser({ username, email, password_hash: passwordHash, subscription: 'standard', expires: expiresDate, session_token: sessionToken, created_at: nowStr, last_login: nowStr, verified: true })
      await db.markVerificationCodeUsed(pending.id)
      return res.json({ success: true, message: 'Registro realizado com sucesso!', requires_2fa: false, info: { username, subscription: 'standard', expires: expiresDate, sessionid: sessionToken } })
    }

    connection = await pool.getConnection()

    // Buscar código de verificação no banco
    const [codeRows] = await connection.query(
      `SELECT * FROM verification_codes 
       WHERE email = ? AND code = ? AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, verificationCode]
    )
    
    if (codeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação não encontrado ou já utilizado. Por favor, solicite um novo código.'
      })
    }

    const codeData = codeRows[0]

    // Verificar se o código expirou
    const now = new Date()
    const expires = new Date(codeData.expires)
    if (now > expires) {
      await connection.query(
        'UPDATE verification_codes SET used = TRUE WHERE id = ?',
        [codeData.id]
      )
      return res.status(400).json({
        success: false,
        message: 'Código de verificação expirado. Por favor, solicite um novo código.'
      })
    }

    // Verificar se username e password correspondem
    const passwordHash = generateHash(password)
    if (codeData.username !== username || codeData.password_hash !== passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Username ou password não correspondem aos dados do código de verificação'
      })
    }

    // Criar usuário
    const sessionToken = generateSessionToken()
    const expiresDate = new Date(Date.now() + config.subscriptionDefaultDays * 24 * 60 * 60 * 1000)
    const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    await connection.query(
      `INSERT INTO users (username, email, password_hash, subscription, expires, session_token, created_at, last_login, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, 'standard', expiresStr, sessionToken, nowStr, nowStr, 1]
    )

    // Marcar código como usado
    await connection.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [codeData.id]
    )

    res.json({
      success: true,
      message: 'Registro realizado com sucesso!',
      info: {
        username: username,
        subscription: 'standard',
        expires: expiresStr,
        sessionid: sessionToken
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Verificar sessão (para C++, C#, Lua)
app.post('/api/verify', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const now = new Date()
      const expires = new Date(user.expires)
      if (now > expires) {
        return res.status(401).json({ success: false, message: 'Assinatura expirada' })
      }
      return res.json({ success: true, info: { username: user.username, subscription: user.subscription, expires: user.expires } })
    }

    connection = await pool.getConnection()
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = rows[0]

    // Verificar se expirou
    const now = new Date()
    const expires = new Date(user.expires)
    if (now > expires) {
      return res.status(401).json({
        success: false,
        message: 'Assinatura expirada'
      })
    }

    res.json({
      success: true,
      info: {
        username: user.username,
        subscription: user.subscription,
        expires: user.expires
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Logout
app.post('/api/logout', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (sessionid && !useSupabase) {
      connection = await pool.getConnection()
      await connection.query(
        'UPDATE users SET session_token = NULL WHERE session_token = ?',
        [sessionid]
      )
    }
    if (sessionid && useSupabase) {
      const u = await db.getUserBySessionToken(sessionid)
      if (u) await db.updateUserFields(u.id, { session_token: null })
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Função auxiliar para verificar sessão e retornar usuário
const verifySession = async (sessionid) => {
  if (!sessionid) {
    throw new Error('Session ID é obrigatório')
  }

  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )
    
    if (rows.length === 0) {
      throw new Error('Sessão inválida')
    }

    const user = rows[0]
    try {
      const now = new Date()
      if (user.plan_expires_at && user.plan !== 'lifetime') {
        const exp = new Date(user.plan_expires_at)
        if (exp <= now) {
          await connection.query(
            'UPDATE users SET plan = ?, plan_expires_at = NULL WHERE id = ?',
            ['tester', user.id]
          )
          user.plan = 'tester'
          user.plan_expires_at = null
        }
      }
    } catch (e) {}

    return { user, connection }
  } catch (error) {
    connection.release()
    throw error
  }
}

// Cache para verificação de admin (evita consultas repetidas ao banco)
const adminVerificationCache = new Map()
const CACHE_DURATION = 30000 // 30 segundos de cache
const adminVerificationPromises = new Map() // Para evitar múltiplas verificações simultâneas

// Verificar se o usuário é admin
const verifyAdmin = async (sessionid) => {
  if (!sessionid) {
    throw new Error('Session ID é obrigatório')
  }

  const cacheKey = `admin_${sessionid}`
  const now = Date.now()
  
  // Verificar cache primeiro - se válido, retornar SEM query ao banco
  const cached = adminVerificationCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    // Cache válido - criar nova conexão e retornar dados do cache (sem query)
    const connection = await pool.getConnection()
    return { user: cached.user, connection }
  }
  
  // Verificar se já existe uma verificação em andamento
  const existingPromise = adminVerificationPromises.get(cacheKey)
  if (existingPromise) {
    try {
      const result = await existingPromise
      // Criar nova conexão para esta chamada
      const connection = await pool.getConnection()
      return { user: result.user, connection }
    } catch (error) {
      adminVerificationPromises.delete(cacheKey)
      // Continuar para fazer nova verificação
    }
  }

  // Criar nova promise de verificação
  const verificationPromise = (async () => {
    const connection = await pool.getConnection()
    try {
      // Buscar usuário com session_token E is_admin = TRUE em uma única query
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE session_token = ? AND is_admin = TRUE',
        [sessionid]
      )
      
      if (rows.length === 0) {
        connection.release()
        throw new Error('Acesso negado. Apenas administradores podem acessar esta funcionalidade.')
      }

      // Salvar no cache (dados do usuário)
      adminVerificationCache.set(cacheKey, {
        userId: rows[0].id,
        timestamp: now,
        user: JSON.parse(JSON.stringify(rows[0])) // Cópia dos dados
      })
      
      // Limpar cache antigo se necessário
      if (adminVerificationCache.size > 100) {
        for (const [key, value] of adminVerificationCache.entries()) {
          if (now - value.timestamp > CACHE_DURATION * 2) {
            adminVerificationCache.delete(key)
          }
        }
      }
      
      return { user: rows[0], connection }
    } catch (error) {
      connection.release()
      throw error
    } finally {
      // Remover promise após um pequeno delay
      setTimeout(() => {
        adminVerificationPromises.delete(cacheKey)
      }, 500)
    }
  })()

  // Armazenar promise
  adminVerificationPromises.set(cacheKey, verificationPromise)
  
  // Aguardar e retornar (cada chamada precisa de sua própria conexão)
  const result = await verificationPromise
  const connection = await pool.getConnection()
  return { user: result.user, connection }
}

// Limpar cache quando um admin faz logout ou altera privilégios
const clearAdminCache = (sessionid) => {
  if (sessionid) {
    adminVerificationCache.delete(`admin_${sessionid}`)
    adminVerificationPromises.delete(`admin_${sessionid}`)
  }
}

// Endpoint: Salvar configurações
app.post('/api/save-settings', async (req, res) => {
  let connection
  try {
    const { sessionid, accountLogs, newLocationAlerts, profilePictureUrl, ownerId, securityWords } = req.body

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const updates = {}
      if (accountLogs !== undefined) updates.account_logs = accountLogs === 'Enabled' || accountLogs === true
      if (newLocationAlerts !== undefined) updates.new_location_alerts = newLocationAlerts === 'Enabled' || newLocationAlerts === true
      if (profilePictureUrl !== undefined) updates.profile_picture_url = profilePictureUrl
      if (ownerId !== undefined) updates.owner_id = ownerId
      if (securityWords !== undefined) updates.security_words = securityWords
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhuma configuração para atualizar' })
      }
      await db.updateUserFields(user.id, updates)
      return res.json({ success: true, message: 'Configurações salvas com sucesso' })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    const updates = []
    const values = []

    if (accountLogs !== undefined) {
      updates.push('account_logs = ?')
      values.push(accountLogs === 'Enabled' || accountLogs === true)
    }
    if (newLocationAlerts !== undefined) {
      updates.push('new_location_alerts = ?')
      values.push(newLocationAlerts === 'Enabled' || newLocationAlerts === true)
    }
    if (profilePictureUrl !== undefined) {
      updates.push('profile_picture_url = ?')
      values.push(profilePictureUrl)
    }
    if (ownerId !== undefined) {
      updates.push('owner_id = ?')
      values.push(ownerId)
    }
    if (securityWords !== undefined) {
      updates.push('security_words = ?')
      values.push(securityWords)
    }

    if (updates.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Nenhuma configuração para atualizar'
      })
    }

    values.push(user.id)
    await connection.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    connection.release()
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao salvar configurações',
      error: error.message
    })
  }
})

// Endpoint: Gerar QR Code para 2FA
app.post('/api/generate-2fa', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Gerar secret para 2FA
    const secret = speakeasy.generateSecret({
      name: `${user.username} (KeyUnit)`,
      issuer: 'KeyUnit'
    })

    // Gerar QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    // Salvar secret temporariamente (não ativar ainda)
    await connection.query(
      'UPDATE users SET two_factor_secret = ? WHERE id = ?',
      [secret.base32, user.id]
    )

    connection.release()
    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualCode: secret.base32
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar QR code 2FA',
      error: error.message
    })
  }
})

// Endpoint: Ativar 2FA
app.post('/api/enable-2fa', async (req, res) => {
  let connection
  try {
    const { sessionid, token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação é obrigatório'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    if (!user.two_factor_secret) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Por favor, gere um QR code primeiro'
      })
    }

    // Verificar token (garantir que é uma string numérica)
    const tokenStr = String(token).trim()
    if (!/^\d{6}$/.test(tokenStr)) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação deve ter 6 dígitos'
      })
    }

    // Verificar token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: tokenStr,
      window: 2
    })

    if (!verified) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação inválido'
      })
    }

    // Ativar 2FA
    await connection.query(
      'UPDATE users SET two_factor_enabled = TRUE WHERE id = ?',
      [user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: '2FA ativado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao ativar 2FA',
      error: error.message
    })
  }
})

// Endpoint: Enviar código 2FA por email
app.post('/api/send-2fa-email', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Verificar se o usuário tem email cadastrado
    if (!user.email) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Usuário não possui email cadastrado. Por favor, cadastre um email primeiro.'
      })
    }

    // Verificar se as credenciais de email estão configuradas
    if (!config.email.auth.user || !config.email.auth.pass || 
        config.email.auth.user === 'seu-email@gmail.com' || 
        config.email.auth.pass === 'sua-senha-de-app') {
      connection.release()
      console.error('❌ Erro: Credenciais de email não configuradas')
      return res.status(500).json({
        success: false,
        message: 'Servidor de email não configurado. Por favor, configure as variáveis de ambiente EMAIL_USER, EMAIL_PASS e EMAIL_FROM no arquivo .env',
        error: 'Email não configurado'
      })
    }

    // Gerar código de 6 dígitos
    const code = generateVerificationCode()

    // Salvar código temporariamente (podemos usar verification_codes ou criar uma tabela específica)
    // Por simplicidade, vamos usar a mesma tabela
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    const expiresStr = expires.toISOString().slice(0, 19).replace('T', ' ')

    // Limpar códigos antigos
    await connection.query(
      'DELETE FROM verification_codes WHERE email = ? AND used = FALSE',
      [user.email]
    )

    // Salvar código
    await connection.query(
      `INSERT INTO verification_codes (email, code, username, password_hash, expires)
       VALUES (?, ?, ?, ?, ?)`,
      [user.email, code, user.username, '', expiresStr]
    )

    // Enviar email
    try {
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: 'Código de Verificação 2FA - KeyUnit',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Código de Verificação 2FA</h2>
            <p>Olá ${user.username},</p>
            <p>Seu código de verificação para 2FA é:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p>Este código expira em 10 minutos.</p>
            <p>Se você não solicitou este código, ignore este email.</p>
          </div>
        `,
        text: `Seu código de verificação 2FA é: ${code}\n\nEste código expira em 10 minutos.`
      }

      console.log(`📧 Tentando enviar email 2FA para: ${user.email}`)
      console.log(`📧 Configuração de email:`, {
        host: config.email.host,
        port: config.email.port,
        from: config.email.from,
        user: config.email.auth.user ? config.email.auth.user.substring(0, 3) + '***' : 'não configurado'
      })
      
      const emailResult = await transporter.sendMail(mailOptions)
      console.log(`✅ Email 2FA enviado com sucesso para: ${user.email}`)
      console.log(`📧 MessageId: ${emailResult.messageId}`)
    } catch (emailError) {
      connection.release()
      console.error('❌ Erro ao enviar email 2FA:', emailError.message)
      console.error('❌ Detalhes completos do erro:', {
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode
      })
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao enviar email'
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Erro de autenticação. Verifique se EMAIL_USER e EMAIL_PASS estão corretos no arquivo .env. Para Gmail, use uma "Senha de App" criada em https://myaccount.google.com/apppasswords'
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = 'Erro de conexão com o servidor de email. Verifique sua conexão com a internet'
      } else if (emailError.responseCode === 535) {
        errorMessage = 'Credenciais inválidas. Verifique EMAIL_USER e EMAIL_PASS no arquivo .env'
      } else if (emailError.message) {
        errorMessage = `Erro ao enviar email: ${emailError.message}`
      }
      if (ALLOW_DEBUG_CODES) {
        return res.json({
          success: true,
          message: 'Código gerado. O envio por email falhou, use o código exibido.',
          debug: { code }
        })
      }
      
      if (ALLOW_DEBUG_CODES) {
        return res.json({
          success: true,
          message: 'Código gerado. O envio por email falhou, use o código exibido.',
          debug: { code }
        })
      }
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: emailError.message,
        code: emailError.code,
        debug: process.env.NODE_ENV === 'development' ? {
          responseCode: emailError.responseCode,
          command: emailError.command
        } : undefined
      })
    }

    connection.release()
    res.json({
      success: true,
      message: 'Código de verificação enviado para seu email'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ Erro ao processar solicitação de 2FA:', error.message)
    console.error('Stack trace:', error.stack)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar código 2FA',
      error: error.message
    })
  }
})

// Endpoint: Verificar código 2FA via email
app.post('/api/verify-2fa-email', async (req, res) => {
  let connection
  try {
    const { sessionid, code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação é obrigatório'
      })
    }

    // Validar código (garantir que é uma string numérica)
    const codeStr = String(code).trim()
    if (!/^\d{6}$/.test(codeStr)) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação deve ter 6 dígitos'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Buscar código de verificação
    const [codeRows] = await connection.query(
      `SELECT * FROM verification_codes 
       WHERE email = ? AND code = ? AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.email, codeStr]
    )

    if (codeRows.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação inválido'
      })
    }

    const codeData = codeRows[0]

    // Verificar se expirou
    const now = new Date()
    const expires = new Date(codeData.expires)
    if (now > expires) {
      await connection.query(
        'UPDATE verification_codes SET used = TRUE WHERE id = ?',
        [codeData.id]
      )
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação expirado'
      })
    }

    // Marcar código como usado
    await connection.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [codeData.id]
    )

    // Se não tiver secret, gerar um e ativar 2FA
    if (!user.two_factor_secret) {
      const secret = speakeasy.generateSecret({
        name: `${user.username} (KeyUnit)`,
        issuer: 'KeyUnit'
      })
      
      await connection.query(
        'UPDATE users SET two_factor_secret = ?, two_factor_enabled = TRUE WHERE id = ?',
        [secret.base32, user.id]
      )
    } else {
      // Ativar 2FA
      await connection.query(
        'UPDATE users SET two_factor_enabled = TRUE WHERE id = ?',
        [user.id]
      )
    }

    connection.release()
    res.json({
      success: true,
      message: '2FA ativado com sucesso via email'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao verificar código 2FA',
      error: error.message
    })
  }
})

// Endpoint: Enviar código 2FA durante login
app.post('/api/login-send-2fa', async (req, res) => {
  let connection
  try {
    const { temp_session } = req.body

    console.log('📥 Recebida requisição para enviar código 2FA durante login')
    console.log('📦 temp_session recebido:', temp_session ? temp_session.substring(0, 20) + '...' : 'não fornecido')

    if (!temp_session) {
      console.error('❌ Erro: temp_session não fornecido')
      return res.status(400).json({
        success: false,
        message: 'Token de sessão temporário é obrigatório'
      })
    }

    connection = await pool.getConnection()

    // Buscar token temporário na tabela verification_codes
    const searchCode = 'TEMP_SESSION_' + temp_session
    console.log('🔍 Buscando token temporário:', searchCode.substring(0, 30) + '...')
    
    const [tempRows] = await connection.query(
      `SELECT * FROM verification_codes 
       WHERE code = ? AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [searchCode]
    )

    console.log('📊 Tokens temporários encontrados:', tempRows.length)

    if (tempRows.length === 0) {
      connection.release()
      console.error('❌ Erro: Token temporário não encontrado no banco de dados')
      // Buscar todos os tokens temporários para debug
      const [allTempRows] = await connection.query(
        `SELECT code, username, expires, used FROM verification_codes 
         WHERE code LIKE 'TEMP_SESSION_%'
         ORDER BY created_at DESC
         LIMIT 5`
      )
      console.log('📊 Últimos tokens temporários no banco:', allTempRows)
      return res.status(400).json({
        success: false,
        message: 'Token de sessão temporário inválido ou expirado. Por favor, faça login novamente.'
      })
    }

    const tempData = tempRows[0]
    console.log('✅ Token temporário encontrado para usuário:', tempData.username)

    // Verificar se expirou
    const now = new Date()
    const expires = new Date(tempData.expires)
    console.log('⏰ Verificando expiração - Agora:', now.toISOString(), 'Expira:', expires.toISOString())
    
    if (now > expires) {
      await connection.query(
        'UPDATE verification_codes SET used = TRUE WHERE id = ?',
        [tempData.id]
      )
      connection.release()
      console.error('❌ Erro: Token temporário expirado')
      return res.status(400).json({
        success: false,
        message: 'Token de sessão temporário expirado. Por favor, faça login novamente.'
      })
    }

    // Buscar usuário
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [tempData.username]
    )

    if (userRows.length === 0) {
      connection.release()
      console.error('❌ Erro: Usuário não encontrado:', tempData.username)
      return res.status(400).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const user = userRows[0]
    console.log('✅ Usuário encontrado:', user.username, 'Email:', user.email || 'não cadastrado')

    // Verificar se usuário tem email cadastrado
    if (!user.email) {
      connection.release()
      console.error('❌ Erro: Usuário não possui email cadastrado')
      return res.status(400).json({
        success: false,
        message: 'Usuário não possui email cadastrado. Por favor, cadastre um email primeiro.'
      })
    }

    // Verificar se as credenciais de email estão configuradas
    if (!config.email.auth.user || !config.email.auth.pass || 
        config.email.auth.user === 'seu-email@gmail.com' || 
        config.email.auth.pass === 'sua-senha-de-app') {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Servidor de email não configurado'
      })
    }

    // Gerar código de 6 dígitos
    const code = generateVerificationCode()
    const expiresCode = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    const expiresCodeStr = expiresCode.toISOString().slice(0, 19).replace('T', ' ')

    // Limpar códigos antigos deste usuário (exceto o temp_session)
    await connection.query(
      'DELETE FROM verification_codes WHERE email = ? AND code NOT LIKE ? AND used = FALSE',
      [user.email, 'TEMP_SESSION_%']
    )

    // Salvar código de verificação
    await connection.query(
      `INSERT INTO verification_codes (email, code, username, password_hash, expires)
       VALUES (?, ?, ?, ?, ?)`,
      [user.email, code, user.username, '', expiresCodeStr]
    )

    // Enviar email
    try {
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: 'Código de Verificação 2FA - Login',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Código de Verificação 2FA</h2>
            <p>Olá ${user.username},</p>
            <p>Seu código de verificação para completar o login é:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p>Este código expira em 10 minutos.</p>
            <p>Se você não solicitou este código, ignore este email.</p>
          </div>
        `,
        text: `Seu código de verificação 2FA é: ${code}\n\nEste código expira em 10 minutos.`
      }

      console.log(`📧 Tentando enviar email 2FA para login: ${user.email}`)
      console.log(`📧 Configuração de email:`, {
        host: config.email.host,
        port: config.email.port,
        from: config.email.from,
        user: config.email.auth.user ? config.email.auth.user.substring(0, 3) + '***' : 'não configurado'
      })
      
      const emailResult = await transporter.sendMail(mailOptions)
      console.log(`✅ Email 2FA enviado com sucesso para login: ${user.email}`)
      console.log(`📧 MessageId: ${emailResult.messageId}`)
      
      connection.release()
      res.json({
        success: true,
        message: 'Código de verificação enviado para seu email',
        debug: process.env.NODE_ENV === 'development' ? { messageId: emailResult.messageId } : undefined
      })
    } catch (emailError) {
      connection.release()
      console.error('❌ Erro ao enviar email 2FA:', emailError.message)
      console.error('❌ Detalhes completos do erro:', {
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode
      })
      
      let errorMessage = 'Erro ao enviar email'
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Erro de autenticação. Verifique se EMAIL_USER e EMAIL_PASS estão corretos no arquivo .env'
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = 'Erro de conexão com o servidor de email. Verifique sua conexão com a internet'
      } else if (emailError.responseCode === 535) {
        errorMessage = 'Credenciais inválidas. Verifique EMAIL_USER e EMAIL_PASS no arquivo .env'
      } else if (emailError.message) {
        errorMessage = `Erro ao enviar email: ${emailError.message}`
      }
      if (ALLOW_DEBUG_CODES) {
        return res.json({
          success: true,
          message: 'Código gerado. O envio por email falhou, use o código exibido.',
          debug: { code }
        })
      }
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: emailError.message,
        code: emailError.code,
        debug: process.env.NODE_ENV === 'development' ? {
          responseCode: emailError.responseCode,
          command: emailError.command
        } : undefined
      })
    }
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ Erro ao processar solicitação de envio de 2FA:', error.message)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar código 2FA',
      error: error.message
    })
  }
})

// Endpoint: Verificar código 2FA e finalizar login
app.post('/api/login-verify-2fa', async (req, res) => {
  let connection
  try {
    const { temp_session, code, method } = req.body // method: 'email' ou 'qr'

    if (!temp_session || !code) {
      return res.status(400).json({
        success: false,
        message: 'Token de sessão temporário e código são obrigatórios'
      })
    }

    // Validar código (garantir que é uma string numérica de 6 dígitos ou código TOTP)
    const codeStr = String(code).trim()
    const isTotpCode = /^\d{6}$/.test(codeStr)

    if (!isTotpCode && method !== 'qr') {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação deve ter 6 dígitos'
      })
    }

    connection = await pool.getConnection()

    // Buscar token temporário
    const [tempRows] = await connection.query(
      `SELECT * FROM verification_codes 
       WHERE code = ? AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      ['TEMP_SESSION_' + temp_session]
    )

    if (tempRows.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Token de sessão temporário inválido ou expirado'
      })
    }

    const tempData = tempRows[0]

    // Verificar se expirou
    const now = new Date()
    const expires = new Date(tempData.expires)
    if (now > expires) {
      await connection.query(
        'UPDATE verification_codes SET used = TRUE WHERE id = ?',
        [tempData.id]
      )
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Token de sessão temporário expirado. Por favor, faça login novamente.'
      })
    }

    // Buscar usuário
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [tempData.username]
    )

    if (userRows.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const user = userRows[0]

    // Verificar código 2FA
    let codeValid = false

    if (method === 'qr' || !method) {
      // Verificar código TOTP (QR Code)
      if (user.two_factor_secret) {
        const verified = speakeasy.totp.verify({
          secret: user.two_factor_secret,
          encoding: 'base32',
          token: codeStr,
          window: 2 // Aceitar códigos dentro de uma janela de 2 períodos (60 segundos)
        })
        
        if (verified) {
          codeValid = true
        }
      }
    }

    // Se não foi verificado via TOTP, tentar verificar via email
    if (!codeValid && (method === 'email' || !method)) {
      if (user.email) {
        const [codeRows] = await connection.query(
          `SELECT * FROM verification_codes 
           WHERE email = ? AND code = ? AND used = FALSE
           ORDER BY created_at DESC
           LIMIT 1`,
          [user.email, codeStr]
        )

        if (codeRows.length > 0) {
          const codeData = codeRows[0]
          const expiresCode = new Date(codeData.expires)
          
          if (now <= expiresCode) {
            // Marcar código como usado
            await connection.query(
              'UPDATE verification_codes SET used = TRUE WHERE id = ?',
              [codeData.id]
            )
            codeValid = true
          } else {
            // Código expirado
            await connection.query(
              'UPDATE verification_codes SET used = TRUE WHERE id = ?',
              [codeData.id]
            )
          }
        }
      }
    }

    if (!codeValid) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação inválido ou expirado'
      })
    }

    // Código válido - finalizar login
    // Marcar token temporário como usado
    await connection.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [tempData.id]
    )

    // Criar session_token completo
    const sessionToken = generateSessionToken()
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    await connection.query(
      'UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
      [sessionToken, nowStr, user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      info: {
        username: user.username,
        subscription: user.subscription,
        expires: user.expires,
        sessionid: sessionToken
      }
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ Erro ao verificar 2FA no login:', error.message)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao verificar código 2FA',
      error: error.message
    })
  }
})

// Endpoint: Teste de envio de email
app.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body
    const testEmail = email || config.email.from

    // Verificar se email está configurado
    if (!config.email.auth.user || !config.email.auth.pass || 
        config.email.auth.user === 'seu-email@gmail.com' || 
        config.email.auth.pass === 'sua-senha-de-app') {
      return res.status(500).json({
        success: false,
        message: 'Email não configurado. Crie um arquivo .env na pasta api/ com EMAIL_USER, EMAIL_PASS e EMAIL_FROM'
      })
    }

    console.log(`📧 Testando envio de email para: ${testEmail}`)
    console.log(`📧 Configuração:`, {
      host: config.email.host,
      port: config.email.port,
      from: config.email.from,
      user: config.email.auth.user
    })

    const testCode = generateVerificationCode()
    const mailOptions = {
      from: config.email.from,
      to: testEmail,
      subject: 'Teste de Email - KeyUnit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Teste de Email</h2>
          <p>Olá,</p>
          <p>Este é um email de teste do sistema KeyUnit.</p>
          <p>Se você recebeu este email, a configuração de email está funcionando corretamente!</p>
          <p>Código de teste: <strong>${testCode}</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Este é um email automático de teste.</p>
        </div>
      `,
      text: `Teste de Email - KeyUnit\n\nEste é um email de teste. Se você recebeu este email, a configuração de email está funcionando!\n\nCódigo de teste: ${testCode}`
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Email de teste enviado com sucesso! MessageId: ${info.messageId}`)
    console.log(`📧 Verifique a caixa de entrada (e pasta de spam) em: ${testEmail}`)

    res.json({
      success: true,
      message: `Email de teste enviado para ${testEmail}`,
      messageId: info.messageId,
      testCode: testCode,
      note: 'Verifique sua caixa de entrada e pasta de spam. Pode levar alguns minutos para chegar.'
    })
  } catch (error) {
    console.error('❌ Erro ao enviar email de teste:', error.message)
    console.error('❌ Detalhes:', {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response
    })

    let errorMessage = 'Erro ao enviar email de teste'
    if (error.code === 'EAUTH') {
      errorMessage = 'Erro de autenticação. Verifique se EMAIL_USER e EMAIL_PASS estão corretos no arquivo .env. Para Gmail, use uma "Senha de App" criada em https://myaccount.google.com/apppasswords'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Erro de conexão com o servidor de email. Verifique sua conexão com a internet'
    } else if (error.responseCode === 535) {
      errorMessage = 'Credenciais inválidas. Verifique EMAIL_USER e EMAIL_PASS no arquivo .env'
    } else if (error.message) {
      errorMessage = `Erro ao enviar email: ${error.message}`
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code,
      responseCode: error.responseCode,
      debug: process.env.NODE_ENV === 'development' ? {
        command: error.command,
        response: error.response
      } : undefined
    })
  }
})

// Endpoint: Alterar senha
app.post('/api/change-password', async (req, res) => {
  let connection
  try {
    const { sessionid, currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Verificar senha atual
    const currentPasswordHash = generateHash(currentPassword)
    if (user.password_hash !== currentPasswordHash) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      })
    }

    // Atualizar senha
    const newPasswordHash = generateHash(newPassword)
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao alterar senha',
      error: error.message
    })
  }
})

// Endpoint: Alterar email
app.post('/api/change-email', async (req, res) => {
  let connection
  try {
    const { sessionid, newEmail, password } = req.body

    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Novo email e senha são obrigatórios'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Verificar senha
    const passwordHash = generateHash(password)
    if (user.password_hash !== passwordHash) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Senha incorreta'
      })
    }

    // Verificar se email já existe
    const [existingEmails] = await connection.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [newEmail, user.id]
    )
    if (existingEmails.length > 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado'
      })
    }

    // Atualizar email
    await connection.query(
      'UPDATE users SET email = ? WHERE id = ?',
      [newEmail, user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Email alterado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao alterar email',
      error: error.message
    })
  }
})

// Endpoint: Upload banner do perfil
app.post('/api/upload-banner', uploadBanner.single('banner'), async (req, res) => {
  let connection
  try {
    const sessionid = req.body.sessionid || req.query.sessionid
    
    if (!sessionid) {
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      })
    }
    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const bucket = process.env.SUPABASE_BUCKET_BANNERS || 'banners'
      const ext = path.extname(req.file.originalname) || ''
      const objectPath = `${user.id}/banner-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`
      const uploadRes = await require('./db_supabase').supabase
        .storage.from(bucket)
        .upload(objectPath, req.file.buffer, { contentType: req.file.mimetype })
      if (uploadRes.error) {
        throw new Error(uploadRes.error.message)
      }
      const { data: publicData } = require('./db_supabase').supabase
        .storage.from(bucket)
        .getPublicUrl(objectPath)
      const bannerUrl = publicData.publicUrl
      // tentar remover banner antigo do storage
      if (user.banner_url && typeof user.banner_url === 'string') {
        const marker = `/storage/v1/object/public/${bucket}/`
        const idx = user.banner_url.indexOf(marker)
        if (idx !== -1) {
          const oldObject = user.banner_url.substring(idx + marker.length)
          await require('./db_supabase').supabase.storage.from(bucket).remove([oldObject])
        }
      }
      await db.updateUserFields(user.id, { banner_url: bannerUrl })
      return res.json({ success: true, message: 'Banner atualizado com sucesso', bannerUrl })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    if (user.banner_url) {
      const oldBannerPath = path.join(__dirname, 'uploads', 'banners', path.basename(user.banner_url))
      try {
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath)
        }
      } catch (err) {
        console.error('Erro ao deletar banner antigo:', err)
      }
    }

    const bannerUrl = `/uploads/banners/${req.file.filename}`
    await connection.query(
      'UPDATE users SET banner_url = ? WHERE id = ?',
      [bannerUrl, user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Banner atualizado com sucesso',
      bannerUrl: bannerUrl
    })
  } catch (error) {
    if (connection) connection.release()
    // Se houver erro de upload, deletar arquivo se foi criado
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (err) {
        console.error('Erro ao deletar arquivo após erro:', err)
      }
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer upload do banner',
      error: error.message
    })
  }
})

// Endpoint: Buscar emails associados a um username ou email (sem enviar código)
app.post('/api/get-user-emails', async (req, res) => {
  let connection
  try {
    const { username, email } = req.body

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Username ou email é obrigatório'
      })
    }

    connection = await pool.getConnection()

    // Buscar usuário por username ou email
    let query = 'SELECT * FROM users WHERE '
    let params = []
    
    if (username && email) {
      query += '(username = ? OR email = ?)'
      params = [username, email]
    } else if (username) {
      query += 'username = ?'
      params = [username]
    } else {
      query += 'email = ?'
      params = [email]
    }

    const [users] = await connection.query(query, params)

    if (users.length === 0) {
      connection.release()
      // Por segurança, não revelar se o usuário existe ou não
      return res.json({
        success: true,
        emails: []
      })
    }

    const user = users[0]

    // Retornar emails associados ao usuário
    const emails = []
    if (user.email) {
      emails.push(user.email)
    }

    connection.release()
    return res.json({
      success: true,
      emails: emails,
      username: user.username
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ Erro ao buscar emails do usuário:', error.message)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar emails',
      error: error.message
    })
  }
})

// Endpoint: Solicitar reset de senha (forgot password)
app.post('/api/forgot-password', async (req, res) => {
  let connection
  try {
    const { username, email } = req.body

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Username ou email é obrigatório'
      })
    }

    connection = await pool.getConnection()

    // Buscar usuário por username ou email
    let query = 'SELECT * FROM users WHERE '
    let params = []
    
    if (username && email) {
      query += '(username = ? OR email = ?)'
      params = [username, email]
    } else if (username) {
      query += 'username = ?'
      params = [username]
    } else {
      query += 'email = ?'
      params = [email]
    }

    const [users] = await connection.query(query, params)

    if (users.length === 0) {
      connection.release()
      // Por segurança, não revelar se o usuário existe ou não
      return res.json({
        success: true,
        message: 'Se o usuário existir, um código de recuperação será enviado para o email cadastrado'
      })
    }

    const user = users[0]

    // Verificar se o usuário tem email cadastrado
    if (!user.email) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Usuário não possui email cadastrado. Entre em contato com o suporte.'
      })
    }

    // Verificar se as credenciais de email estão configuradas
    if (!config.email.auth.user || !config.email.auth.pass || 
        config.email.auth.user === 'seu-email@gmail.com' || 
        config.email.auth.pass === 'sua-senha-de-app') {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Servidor de email não configurado. Por favor, entre em contato com o suporte.'
      })
    }

    // Gerar código de 6 dígitos
    const code = generateVerificationCode()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    const expiresStr = expires.toISOString().slice(0, 19).replace('T', ' ')

    // Limpar códigos antigos de reset para este email
    await connection.query(
      'DELETE FROM verification_codes WHERE email = ? AND code LIKE ? AND used = FALSE',
      [user.email, 'RESET_PASSWORD_%']
    )

    // Salvar código de reset (usando formato especial para identificar)
    await connection.query(
      `INSERT INTO verification_codes (email, code, username, expires)
       VALUES (?, ?, ?, ?)`,
      [user.email, `RESET_PASSWORD_${code}`, user.username, expiresStr]
    )

    // Enviar email
    try {
      await sendPasswordResetEmail(user.email, code, user.username)
      connection.release()
      res.json({
        success: true,
        message: 'Se o usuário existir, um código de recuperação será enviado para o email cadastrado'
      })
    } catch (emailError) {
      connection.release()
      console.error('❌ Erro ao enviar email de reset:', emailError.message)
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de recuperação. Tente novamente mais tarde ou entre em contato com o suporte.'
      })
    }
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ Erro ao processar solicitação de reset de senha:', error.message)
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação',
      error: error.message
    })
  }
})

// Endpoint: Resetar senha com código
app.post('/api/reset-password', async (req, res) => {
  let connection
  try {
    const { username, email, code, newPassword } = req.body

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Username ou email é obrigatório'
      })
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação é obrigatório'
      })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha é obrigatória e deve ter pelo menos 6 caracteres'
      })
    }

    connection = await pool.getConnection()

    // Buscar usuário
    let query = 'SELECT * FROM users WHERE '
    let params = []
    
    if (username && email) {
      query += '(username = ? OR email = ?)'
      params = [username, email]
    } else if (username) {
      query += 'username = ?'
      params = [username]
    } else {
      query += 'email = ?'
      params = [email]
    }

    const [users] = await connection.query(query, params)

    if (users.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const user = users[0]

    // Buscar código de reset
    const resetCode = `RESET_PASSWORD_${code}`
    const [codeRows] = await connection.query(
      `SELECT * FROM verification_codes 
       WHERE email = ? AND code = ? AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.email, resetCode]
    )

    if (codeRows.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação inválido'
      })
    }

    const codeData = codeRows[0]

    // Verificar se expirou
    const now = new Date()
    const expires = new Date(codeData.expires)
    if (now > expires) {
      await connection.query(
        'UPDATE verification_codes SET used = TRUE WHERE id = ?',
        [codeData.id]
      )
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Código de verificação expirado. Solicite um novo código.'
      })
    }

    // Atualizar senha
    const newPasswordHash = generateHash(newPassword)
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, user.id]
    )

    // Marcar código como usado
    await connection.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [codeData.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ Erro ao resetar senha:', error.message)
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar senha',
      error: error.message
    })
  }
})

// Endpoint: Alterar username
app.post('/api/change-username', async (req, res) => {
  let connection
  try {
    const { sessionid, newUsername, password } = req.body

    if (!newUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Novo username e senha são obrigatórios'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Verificar senha
    const passwordHash = generateHash(password)
    if (user.password_hash !== passwordHash) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Senha incorreta'
      })
    }

    // Verificar se username já existe
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [newUsername, user.id]
    )
    if (existingUsers.length > 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Username já cadastrado'
      })
    }

    // Atualizar username
    await connection.query(
      'UPDATE users SET username = ? WHERE id = ?',
      [newUsername, user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Username alterado com sucesso',
      newUsername
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao alterar username',
      error: error.message
    })
  }
})

// Endpoint: Buscar configurações do usuário
app.post('/api/get-settings', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      return res.json({
        success: true,
        settings: {
          accountLogs: user.account_logs ? 'Enabled' : 'Disabled',
          newLocationAlerts: user.new_location_alerts ? 'Enabled' : 'Disabled',
          profilePictureUrl: user.profile_picture_url || '',
          bannerUrl: user.banner_url || '',
          ownerId: user.owner_id || '',
          securityWords: user.security_words || '',
          twoFactorEnabled: user.two_factor_enabled || false,
          plan: user.plan ? user.plan : 'tester',
          planExpiresAt: user.plan_expires_at ? new Date(user.plan_expires_at).toISOString() : null,
          email: user.email || '',
          username: user.username || '',
          expires: user.expires ? new Date(user.expires).toISOString() : null,
          registeredDate: user.created_at ? new Date(user.created_at).toISOString() : null,
          isAdmin: user.is_admin || false
        }
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Verificar se há pagamentos aprovados que ainda não foram aplicados ao plano
    try {
      // Tentar ordenar por updated_at, se não existir, usar created_at
      let [approvedPayments] = await connection.query(
        `SELECT * FROM payments 
         WHERE user_id = ? 
         AND status = 'approved' 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [user.id]
      )
      
      // Se não encontrar nenhum, tentar sem filtro de status (caso o status não tenha sido atualizado)
      if (approvedPayments.length === 0) {
        [approvedPayments] = await connection.query(
          `SELECT * FROM payments 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [user.id]
        )
      }

      if (approvedPayments.length > 0) {
        const payment = approvedPayments[0]
        
        // Aplicar plano apenas se estiver aprovado e for diferente do plano atual
        // Se a query encontrou um pagamento, ele já está aprovado (filtrado na query)
        if (payment.status === 'approved' && user.plan !== payment.plan) {
          console.log(`🔄 Sincronizando plano: usuário ${user.id} tem pagamento aprovado para ${payment.plan}, mas plano atual é ${user.plan}`)
          
          const expiryDate = new Date()
          if (payment.period === 'weekly') {
            expiryDate.setDate(expiryDate.getDate() + 7)
          } else if (payment.period === 'monthly') {
            expiryDate.setMonth(expiryDate.getMonth() + 1)
          } else if (payment.period === 'quarterly') {
            expiryDate.setMonth(expiryDate.getMonth() + 3)
          } else if (payment.period === 'annual') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1)
          } else if (payment.period === 'lifetime') {
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1)
          }
          const expiryDateStr = expiryDate.toISOString().slice(0, 19).replace('T', ' ')

          try {
            if (payment.period === 'lifetime') {
              await connection.query(
                `UPDATE users 
                 SET plan = ?, plan_expires_at = NULL 
                 WHERE id = ?`,
                [payment.plan, user.id]
              )
            } else {
              await connection.query(
                `UPDATE users 
                 SET plan = ?, plan_expires_at = ? 
                 WHERE id = ?`,
                [payment.plan, expiryDateStr, user.id]
              )
            }
            console.log(`✅ Plano sincronizado: usuário ${user.id} agora tem plano ${payment.plan}`)
            
            // Atualizar o objeto user para retornar o plano correto
            user.plan = payment.plan
          } catch (error) {
            console.error(`❌ Erro ao sincronizar plano:`, error.message)
            // Tentar sem plan_expires_at se a coluna não existir
            try {
              await connection.query(
                `UPDATE users SET plan = ? WHERE id = ?`,
                [payment.plan, user.id]
              )
              console.log(`✅ Plano sincronizado (sem plan_expires_at): usuário ${user.id} agora tem plano ${payment.plan}`)
              user.plan = payment.plan
            } catch (error2) {
              console.error(`❌ Erro ao sincronizar plano (sem plan_expires_at):`, error2.message)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos aprovados:', error.message)
    }

    connection.release()
    res.json({
      success: true,
      settings: {
        accountLogs: user.account_logs ? 'Enabled' : 'Disabled',
        newLocationAlerts: user.new_location_alerts ? 'Enabled' : 'Disabled',
        profilePictureUrl: user.profile_picture_url || '',
        bannerUrl: user.banner_url || '',
        ownerId: user.owner_id || '',
        securityWords: user.security_words || '',
        twoFactorEnabled: user.two_factor_enabled || false,
        plan: (user.plan !== undefined && user.plan !== null && user.plan !== '') ? user.plan : 'tester',
        planExpiresAt: user.plan_expires_at ? new Date(user.plan_expires_at).toISOString() : null,
        email: user.email || '',
        username: user.username || '',
        expires: user.expires ? new Date(user.expires).toISOString() : null,
        registeredDate: user.created_at ? new Date(user.created_at).toISOString() : null,
        isAdmin: user.is_admin || false
      }
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar configurações',
      error: error.message
    })
  }
})

// Endpoint: Desativar 2FA
app.post('/api/disable-2fa', async (req, res) => {
  let connection
  try {
    const { sessionid, password } = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória para desativar 2FA'
      })
    }

    const { user, connection: conn } = await verifySession(sessionid)
    connection = conn

    // Verificar senha
    const passwordHash = generateHash(password)
    if (user.password_hash !== passwordHash) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Senha incorreta'
      })
    }

    // Desativar 2FA
    await connection.query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = ?',
      [user.id]
    )

    connection.release()
    res.json({
      success: true,
      message: '2FA desativado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao desativar 2FA',
      error: error.message
    })
  }
})

// Função para gerar secret da aplicação
const generateAppSecret = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Endpoint: Obter aplicações do usuário
app.post('/api/get-applications', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const apps = await db.getApplicationsByUserId(user.id)
      return res.json({ success: true, applications: apps })
    }

    connection = await pool.getConnection()

    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const userId = userRows[0].id

    const [appRows] = await connection.query(
      'SELECT id, name, owner_id, app_secret, version, status, paused, created_at, updated_at FROM applications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )

    res.json({
      success: true,
      applications: appRows
    })
  } catch (error) {
    console.error('Erro ao buscar aplicações:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar aplicações'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Criar aplicação
app.post('/api/create-application', async (req, res) => {
  let connection
  try {
    const { sessionid, name, version, owner_id } = req.body

    if (!sessionid || !name) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e nome da aplicação são obrigatórios'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const userId = user.id
      let userOwnerId = user.owner_id
      const userPlan = user.plan || 'tester'
      const limits = getPlanLimits(userPlan)
      if (limits.applications !== -1) {
        const count = await db.countApplicationsByUserId(userId)
        if (count >= limits.applications) {
          return res.status(403).json({ success: false, message: `Limite de aplicações atingido. Seu plano (${userPlan}) permite ${limits.applications} aplicação(ões). Faça upgrade para criar mais aplicações.`, limit: limits.applications, current: count })
        }
      }
      if (!userOwnerId || (typeof userOwnerId === 'string' && userOwnerId.trim() === '')) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        userOwnerId = ''
        for (let i = 0; i < 10; i++) userOwnerId += chars.charAt(Math.floor(Math.random() * chars.length))
        await db.updateUserFields(userId, { owner_id: userOwnerId })
      }
      const appSecret = generateAppSecret()
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let appOwnerId = ''
      for (let i = 0; i < 10; i++) appOwnerId += chars.charAt(Math.floor(Math.random() * chars.length))
      const newApp = await db.insertApplication({ name, owner_id: appOwnerId, app_secret: appSecret, version: version || '1.0', status: 'active', user_id: userId })
      return res.json({ success: true, application: newApp, message: 'Aplicação criada com sucesso' })
    }

    connection = await pool.getConnection()

    // Verificar limite de aplicações baseado no plano
    const userPlan = await getUserPlan(connection, userId)
    const appLimitCheck = await checkApplicationLimit(connection, userId, userPlan)
    
    if (!appLimitCheck.allowed) {
      connection.release()
      return res.status(403).json({
        success: false,
        message: appLimitCheck.message,
        limit: appLimitCheck.limit,
        current: appLimitCheck.current
      })
    }

    // Se o usuário não tiver owner_id, gerar um único automaticamente
    if (!userOwnerId || userOwnerId.trim() === '') {
      // Gerar um owner_id único (10 caracteres alfanuméricos aleatórios)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      userOwnerId = ''
      for (let i = 0; i < 10; i++) {
        userOwnerId += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      
      // Verificar se esse owner_id já existe (muito improvável, mas verificar mesmo assim)
      const [existingOwner] = await connection.query(
        'SELECT id FROM users WHERE owner_id = ?',
        [userOwnerId]
      )
      
      // Se já existir, gerar outro (muito raro, mas precaução)
      while (existingOwner.length > 0) {
        userOwnerId = ''
        for (let i = 0; i < 10; i++) {
          userOwnerId += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        const [checkAgain] = await connection.query(
          'SELECT id FROM users WHERE owner_id = ?',
          [userOwnerId]
        )
        if (checkAgain.length === 0) break
      }
      
      // Salvar o owner_id gerado no usuário
      await connection.query(
        'UPDATE users SET owner_id = ? WHERE id = ?',
        [userOwnerId, userId]
      )
    }

    // Verificar se já existe aplicação com o mesmo nome para este usuário
    const [existingRows] = await connection.query(
      'SELECT id FROM applications WHERE name = ? AND user_id = ?',
      [name, userId]
    )

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma aplicação com este nome'
      })
    }

    // Gerar secret
    const appSecret = generateAppSecret()

    // Gerar um owner_id único para cada aplicação (não usar o owner_id do usuário)
    // Cada aplicação deve ter seu próprio owner_id único
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let appOwnerId = ''
    for (let i = 0; i < 10; i++) {
      appOwnerId += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Verificar se esse owner_id já existe nas aplicações (muito improvável, mas verificar mesmo assim)
    const [existingAppOwner] = await connection.query(
      'SELECT id FROM applications WHERE owner_id = ?',
      [appOwnerId]
    )
    
    // Se já existir, gerar outro até encontrar um único
    while (existingAppOwner.length > 0) {
      appOwnerId = ''
      for (let i = 0; i < 10; i++) {
        appOwnerId += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      const [checkAgain] = await connection.query(
        'SELECT id FROM applications WHERE owner_id = ?',
        [appOwnerId]
      )
      if (checkAgain.length === 0) break
    }

    // Criar aplicação com owner_id único para esta aplicação
    const [result] = await connection.query(
      'INSERT INTO applications (name, owner_id, app_secret, version, status, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, appOwnerId, appSecret, version || '1.0', 'active', userId]
    )

    // Buscar aplicação criada
    const [appRows] = await connection.query(
      'SELECT id, name, owner_id, app_secret, version, status, paused, created_at, updated_at FROM applications WHERE id = ?',
      [result.insertId]
    )

    res.json({
      success: true,
      application: appRows[0],
      message: 'Aplicação criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar aplicação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar aplicação'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Renomear aplicação
app.post('/api/rename-application', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, newName } = req.body

    if (!sessionid || !appId || !newName) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, ID da aplicação e novo nome são obrigatórios'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      await db.renameApplication(appId, user.id, newName)
      return res.json({ success: true, message: 'Aplicação renomeada com sucesso' })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const userId = userRows[0].id

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [appId, userId]
    )

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se já existe aplicação com o mesmo nome
    const [existingRows] = await connection.query(
      'SELECT id FROM applications WHERE name = ? AND user_id = ? AND id != ?',
      [newName, userId, appId]
    )

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma aplicação com este nome'
      })
    }

    // Renomear aplicação
    await connection.query(
      'UPDATE applications SET name = ? WHERE id = ?',
      [newName, appId]
    )

    res.json({
      success: true,
      message: 'Aplicação renomeada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao renomear aplicação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao renomear aplicação'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar aplicação
app.post('/api/delete-application', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e ID da aplicação são obrigatórios'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      await db.deleteApplication(appId, user.id)
      return res.json({ success: true, message: 'Aplicação deletada com sucesso' })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const userId = userRows[0].id

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [appId, userId]
    )

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Deletar aplicação
    await connection.query(
      'DELETE FROM applications WHERE id = ?',
      [appId]
    )

    res.json({
      success: true,
      message: 'Aplicação deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar aplicação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar aplicação'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Pausar/Retomar aplicação
app.post('/api/pause-application', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, paused } = req.body

    if (!sessionid || !appId || paused === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, ID da aplicação e estado paused são obrigatórios'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      await db.pauseApplication(appId, user.id, paused)
      return res.json({ success: true, message: paused ? 'Aplicação pausada com sucesso' : 'Aplicação retomada com sucesso' })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const userId = userRows[0].id

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [appId, userId]
    )

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Atualizar estado paused
    await connection.query(
      'UPDATE applications SET paused = ?, status = ? WHERE id = ?',
      [paused ? 1 : 0, paused ? 'paused' : 'active', appId]
    )

    res.json({
      success: true,
      message: paused ? 'Aplicação pausada com sucesso' : 'Aplicação retomada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao pausar aplicação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao pausar aplicação'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Atualizar secret da aplicação
app.post('/api/refresh-app-secret', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e ID da aplicação são obrigatórios'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const newSecret = generateAppSecret()
      await db.refreshAppSecret(appId, user.id, newSecret)
      return res.json({ success: true, app_secret: newSecret, message: 'Secret atualizado com sucesso' })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const userId = userRows[0].id

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [appId, userId]
    )

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Gerar novo secret
    const newSecret = generateAppSecret()

    // Atualizar secret
    await connection.query(
      'UPDATE applications SET app_secret = ? WHERE id = ?',
      [newSecret, appId]
    )

    res.json({
      success: true,
      app_secret: newSecret,
      message: 'Secret atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar secret:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar secret'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Inicializar com algumas licenças de exemplo
const initializeLicenses = async () => {
  let connection
  try {
    connection = await pool.getConnection()
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM licenses')
    
    if (rows[0].count === 0) {
      const now = new Date()
      const licenses = [
        ['TEST-LICENSE-001', 'premium', new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), 0],
        ['TEST-LICENSE-002', 'standard', new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), 0],
        ['TEST-LICENSE-003', 'premium', new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), 0]
      ]
      
      for (const license of licenses) {
        await connection.query(
          'INSERT INTO licenses (license_key, subscription, expires, used) VALUES (?, ?, ?, ?)',
          license
        )
      }
      console.log('✅ Licenças de exemplo criadas')
    }
  } catch (error) {
    console.error('Erro ao inicializar licenças:', error.message)
  } finally {
    if (connection) connection.release()
  }
}

// Inicializar licenças após um pequeno delay para garantir que o banco está pronto
setTimeout(initializeLicenses, 2000)

// Função para gerar chave de licença única
const generateLicenseKey = (mask = null, useLowercase = true, useUppercase = true) => {
  let chars = '0123456789'
  if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  
  // Se não há caracteres disponíveis, usar alfanuméricos por padrão
  if (chars === '0123456789') {
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  }
  
  // Se máscara fornecida, usar a máscara
  if (mask && mask.trim() !== '') {
    let key = ''
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === '*') {
        // Substituir * por caractere aleatório
        key += chars.charAt(Math.floor(Math.random() * chars.length))
      } else if (mask[i] === '_') {
        // Substituir _ por hífen
        key += '-'
      } else {
        // Manter outros caracteres como estão (incluindo hífens já presentes)
        key += mask[i]
      }
    }
    return key
  }
  
  // Gerar chave padrão (formato: XXXX-XXXX-XXXX-XXXX)
  let key = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-'
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

// ========================================
// ENDPOINTS DE LICENÇAS
// ========================================

// Endpoint: Obter licenças de uma aplicação
app.post('/api/get-licenses', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      if (appId) {
        const app = await db.getApplicationByIdForUser(appId, user.id)
        if (!app) {
          return res.json({ success: false, message: 'Aplicação não encontrada' })
        }
        const licenses = await db.getLicensesByAppId(appId)
        const userIds = [...new Set(licenses.map(l => l.user_id).filter(Boolean))]
        let usersMap = {}
        if (userIds.length > 0) {
          const { data: usersData } = await require('./db_supabase').supabase
            .from('users')
            .select('id,username')
            .in('id', userIds)
          if (Array.isArray(usersData)) {
            usersMap = usersData.reduce((acc, u) => { acc[u.id] = u.username; return acc }, {})
          }
        }
        const responseLicenses = licenses.map(license => ({
          id: license.id,
          license_key: license.license_key,
          subscription: license.subscription,
          expires: license.expires,
          used: license.used,
          user_id: license.user_id,
          app_id: license.app_id,
          created_at: license.created_at,
          used_by: license.user_id ? usersMap[license.user_id] || null : null
        }))
        return res.json({ success: true, licenses: responseLicenses })
      } else {
        const appIds = await db.getApplicationIdsByUserId(user.id)
        if (appIds.length === 0) {
          return res.json({ success: true, licenses: [] })
        }
        const licenses = await db.getLicensesByAppIds(appIds)
        const userIds = [...new Set(licenses.map(l => l.user_id).filter(Boolean))]
        const { data: appsData } = await require('./db_supabase').supabase
          .from('applications')
          .select('id,name')
          .in('id', appIds)
        let appMap = {}
        if (Array.isArray(appsData)) {
          appMap = appsData.reduce((acc, a) => { acc[a.id] = a.name; return acc }, {})
        }
        let usersMap = {}
        if (userIds.length > 0) {
          const { data: usersData } = await require('./db_supabase').supabase
            .from('users')
            .select('id,username')
            .in('id', userIds)
          if (Array.isArray(usersData)) {
            usersMap = usersData.reduce((acc, u) => { acc[u.id] = u.username; return acc }, {})
          }
        }
        const responseLicenses = licenses.map(license => ({
          id: license.id,
          license_key: license.license_key,
          subscription: license.subscription,
          expires: license.expires,
          used: license.used,
          user_id: license.user_id,
          app_id: license.app_id,
          app_name: appMap[license.app_id] || null,
          created_at: license.created_at,
          used_by: license.user_id ? usersMap[license.user_id] || null : null
        }))
        return res.json({ success: true, licenses: responseLicenses })
      }
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Se appId for fornecido, verificar se a aplicação pertence ao usuário
    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, user.id]
      )

      if (appRows.length === 0) {
        return res.json({
          success: false,
          message: 'Aplicação não encontrada'
        })
      }

      // Buscar licenças da aplicação
      const [licenseRows] = await connection.query(
        `SELECT l.*, u.username as used_by_username 
         FROM licenses l 
         LEFT JOIN users u ON l.user_id = u.id 
         WHERE l.app_id = ? 
         ORDER BY l.created_at DESC`,
        [appId]
      )

      // Buscar informações dos usuários que usaram as licenças
      const licenses = licenseRows.map(license => ({
        id: license.id,
        license_key: license.license_key,
        subscription: license.subscription,
        expires: license.expires,
        used: license.used,
        user_id: license.user_id,
        app_id: license.app_id,
        created_at: license.created_at,
        used_by: license.used_by_username || null
      }))

      return res.json({
        success: true,
        licenses: licenses
      })
    } else {
      // Buscar todas as licenças do usuário (de todas as aplicações)
      // Primeiro buscar IDs das aplicações do usuário
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [user.id]
      )
      
      if (appRows.length === 0) {
        return res.json({
          success: true,
          licenses: []
        })
      }
      
      const appIds = appRows.map(app => app.id)
      const placeholders = appIds.map(() => '?').join(',')
      
      const [licenseRows] = await connection.query(
        `SELECT l.*, u.username as used_by_username, a.name as app_name 
         FROM licenses l 
         LEFT JOIN users u ON l.user_id = u.id 
         LEFT JOIN applications a ON l.app_id = a.id 
         WHERE l.app_id IN (${placeholders}) 
         ORDER BY l.created_at DESC`,
        appIds
      )

      const licenses = licenseRows.map(license => ({
        id: license.id,
        license_key: license.license_key,
        subscription: license.subscription,
        expires: license.expires,
        used: license.used,
        user_id: license.user_id,
        app_id: license.app_id,
        app_name: license.app_name,
        created_at: license.created_at,
        used_by: license.used_by_username || null
      }))

      return res.json({
        success: true,
        licenses: licenses
      })
    }
  } catch (error) {
    console.error('Erro ao buscar licenças:', error)
    res.json({
      success: false,
      message: 'Erro ao buscar licenças'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Criar licença
app.post('/api/create-license', async (req, res) => {
  let connection
  try {
    console.log('📥 Recebendo requisição para criar licença:', JSON.stringify(req.body, null, 2))
    
    const { sessionid, appId, amount, duration, mask, useLowercase = true, useUppercase = true, note } = req.body

    if (!sessionid || !appId || !amount || !duration) {
      console.log('❌ Dados incompletos:', { sessionid: !!sessionid, appId: !!appId, amount, duration })
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      const app = await db.getApplicationByIdForUser(appId, suUser.id)
      if (!app) {
        return res.json({ success: false, message: 'Aplicação não encontrada' })
      }
      const userPlan = suUser.plan || 'tester'
      const limits = getPlanLimits(userPlan)
      const licenseCount = parseInt(amount) || 1
      if (limits.licenses !== -1) {
        const currentCount = await db.countLicensesByAppId(appId)
        if (currentCount + licenseCount > limits.licenses) {
          return res.json({ success: false, message: `Limite de licenças atingido. Seu plano (${userPlan}) permite ${limits.licenses} licenças por aplicação. Você já tem ${currentCount} licenças. Faça upgrade para criar mais licenças.`, limit: limits.licenses, current: currentCount })
        }
      }
      const now = new Date()
      const expiresDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
      const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')
      const subscription = 'standard'
      const createdLicenses = []
      for (let i = 0; i < (parseInt(amount) || 1); i++) {
        let licenseKey = generateLicenseKey(mask, useLowercase, useUppercase)
        let attempts = 0
        while (attempts < 10) {
          const existing = await db.findLicenseByKeyForApp(licenseKey, appId)
          if (!existing) break
          licenseKey = generateLicenseKey(mask, useLowercase, useUppercase)
          attempts++
        }
        const inserted = await db.insertLicense({ license_key: licenseKey, subscription, expires: expiresStr, used: false, app_id: appId, note: note || null })
        createdLicenses.push({
          id: inserted.id,
          license_key: inserted.license_key,
          subscription: inserted.subscription,
          expires: inserted.expires,
          used: inserted.used,
          app_id: inserted.app_id,
          note: inserted.note || null
        })
      }
      return res.json({ success: true, message: `${createdLicenses.length} licença(s) criada(s) com sucesso`, licenses: createdLicenses })
    }

    connection = await pool.getConnection()
    console.log('✅ Conexão com banco de dados estabelecida')

    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      console.log('❌ Sessão inválida:', sessionid)
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]
    console.log('✅ Usuário encontrado:', user.username)

    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )

    if (appRows.length === 0) {
      console.log('❌ Aplicação não encontrada:', { appId, userId: user.id })
      connection.release()
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    const app = appRows[0]
    console.log('✅ Aplicação encontrada:', app.name)

    const userPlan = await getUserPlan(connection, user.id)
    const licenseCount = parseInt(amount) || 1
    const licenseLimitCheck = await checkLicenseLimit(connection, user.id, appId, userPlan, licenseCount)
    
    if (!licenseLimitCheck.allowed) {
      connection.release()
      return res.json({
        success: false,
        message: licenseLimitCheck.message,
        limit: licenseLimitCheck.limit,
        current: licenseLimitCheck.current
      })
    }

    // Calcular data de expiração (duration já está em dias)
    const now = new Date()
    const expiresDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
    const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')

    // Determinar subscription (padrão: standard)
    const subscription = 'standard'

    // Criar licenças
    console.log(`🔑 Criando ${licenseCount} licença(s) com máscara: ${mask || 'padrão'}`)
    const createdLicenses = []
    
    for (let i = 0; i < licenseCount; i++) {
      let licenseKey = generateLicenseKey(mask, useLowercase, useUppercase)
      
      // Garantir que a chave é única
      let attempts = 0
      while (attempts < 10) {
        const [existing] = await connection.query(
          'SELECT id FROM licenses WHERE license_key = ? AND app_id = ?',
          [licenseKey, appId]
        )
        if (existing.length === 0) break
        licenseKey = generateLicenseKey(mask, useLowercase, useUppercase)
        attempts++
      }

      console.log(`  📝 Licença ${i + 1}/${count}: ${licenseKey}`)

      // Verificar se a coluna note existe antes de inserir
      let insertQuery = 'INSERT INTO licenses (license_key, subscription, expires, used, app_id'
      let insertValues = [licenseKey, subscription, expiresStr, false, appId]
      
      try {
        // Tentar verificar se a coluna note existe
        const [columns] = await connection.query(
          'SHOW COLUMNS FROM licenses LIKE "note"'
        )
        if (columns.length > 0) {
          insertQuery += ', note) VALUES (?, ?, ?, ?, ?, ?)'
          insertValues.push(note || null)
        } else {
          insertQuery += ') VALUES (?, ?, ?, ?, ?)'
          console.log('⚠️ Coluna "note" não encontrada, inserindo sem nota')
        }
      } catch (error) {
        // Se não conseguir verificar, tentar inserir sem a coluna note
        insertQuery += ') VALUES (?, ?, ?, ?, ?)'
        console.log('⚠️ Não foi possível verificar coluna "note", inserindo sem nota')
      }

      const [result] = await connection.query(insertQuery, insertValues)

      createdLicenses.push({
        id: result.insertId,
        license_key: licenseKey,
        subscription: subscription,
        expires: expiresStr,
        used: false,
        app_id: appId,
        note: note || null
      })
    }

    console.log(`✅ ${licenseCount} licença(s) criada(s) com sucesso!`)
    res.json({ success: true, message: `${licenseCount} licença(s) criada(s) com sucesso`, licenses: createdLicenses })
  } catch (error) {
    console.error('❌ Erro ao criar licença:', error)
    console.error('Stack trace:', error.stack)
    res.json({
      success: false,
      message: 'Erro ao criar licença: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Adicionar tempo a licenças não usadas
app.post('/api/add-time-to-unused-licenses', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, days } = req.body

    if (!sessionid || !appId || !days) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      const app = await db.getApplicationByIdForUser(appId, suUser.id)
      if (!app) {
        return res.json({ success: false, message: 'Aplicação não encontrada' })
      }
      const { data: licenseRows } = await require('./db_supabase').supabase
        .from('licenses')
        .select('*')
        .eq('app_id', appId)
        .eq('used', false)
      if (!Array.isArray(licenseRows) || licenseRows.length === 0) {
        return res.json({ success: false, message: 'Nenhuma licença não usada encontrada' })
      }
      const millisecondsToAdd = days * 24 * 60 * 60 * 1000
      let updatedCount = 0
      for (const license of licenseRows) {
        const currentExpires = new Date(license.expires)
        const newExpires = new Date(currentExpires.getTime() + millisecondsToAdd)
        const newExpiresStr = newExpires.toISOString().slice(0, 19).replace('T', ' ')
        await require('./db_supabase').supabase
          .from('licenses')
          .update({ expires: newExpiresStr })
          .eq('id', license.id)
        updatedCount++
      }
      return res.json({ success: true, message: `${updatedCount} licença(s) atualizada(s) com sucesso`, updatedCount })
    }

    connection = await pool.getConnection()

    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    const [licenseRows] = await connection.query(
      'SELECT * FROM licenses WHERE app_id = ? AND used = FALSE',
      [appId]
    )

    if (licenseRows.length === 0) {
      return res.json({
        success: false,
        message: 'Nenhuma licença não usada encontrada'
      })
    }

    const millisecondsToAdd = days * 24 * 60 * 60 * 1000
    let updatedCount = 0

    for (const license of licenseRows) {
      const currentExpires = new Date(license.expires)
      const newExpires = new Date(currentExpires.getTime() + millisecondsToAdd)
      const newExpiresStr = newExpires.toISOString().slice(0, 19).replace('T', ' ')

      await connection.query(
        'UPDATE licenses SET expires = ? WHERE id = ?',
        [newExpiresStr, license.id]
      )
      updatedCount++
    }

    res.json({
      success: true,
      message: `${updatedCount} licença(s) atualizada(s) com sucesso`,
      updatedCount: updatedCount
    })
  } catch (error) {
    console.error('Erro ao adicionar tempo às licenças:', error)
    res.json({
      success: false,
      message: 'Erro ao adicionar tempo às licenças'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Exportar licenças
app.post('/api/export-licenses', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, format = 'json' } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      let licensesData = []
      let appMap = {}
      if (appId) {
        const app = await db.getApplicationByIdForUser(appId, suUser.id)
        if (!app) {
          return res.json({ success: false, message: 'Aplicação não encontrada' })
        }
        const { data } = await require('./db_supabase').supabase
          .from('licenses')
          .select('*')
          .eq('app_id', appId)
          .order('created_at', { ascending: false })
        licensesData = Array.isArray(data) ? data : []
        appMap[appId] = app.name
      } else {
        const appIds = await db.getApplicationIdsByUserId(suUser.id)
        if (appIds.length === 0) {
          if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.csv`)
            res.send('License Key,Subscription,Expires,Used,Used By,Created At\n')
          } else {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.json`)
            res.json([])
          }
          return
        }
        const { data } = await require('./db_supabase').supabase
          .from('licenses')
          .select('*')
          .in('app_id', appIds)
          .order('created_at', { ascending: false })
        licensesData = Array.isArray(data) ? data : []
        const { data: appsData } = await require('./db_supabase').supabase
          .from('applications')
          .select('id,name')
          .in('id', appIds)
        if (Array.isArray(appsData)) {
          appMap = appsData.reduce((acc, a) => { acc[a.id] = a.name; return acc }, {})
        }
      }
      const userIds = [...new Set(licensesData.map(l => l.user_id).filter(Boolean))]
      let usersMap = {}
      if (userIds.length > 0) {
        const { data: usersData } = await require('./db_supabase').supabase
          .from('users')
          .select('id,username')
          .in('id', userIds)
        if (Array.isArray(usersData)) {
          usersMap = usersData.reduce((acc, u) => { acc[u.id] = u.username; return acc }, {})
        }
      }
      if (format === 'csv') {
        const csvHeader = 'License Key,Subscription,Expires,Used,Used By,Created At\n'
        const csvRows = licensesData.map(license => {
          const usedBy = license.user_id ? (usersMap[license.user_id] || '') : ''
          return `"${license.license_key}","${license.subscription}","${license.expires}","${license.used ? 'Yes' : 'No'}","${usedBy}","${license.created_at}"`
        }).join('\n')
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.csv`)
        return res.send(csvHeader + csvRows)
      } else {
        const licenses = licensesData.map(license => ({
          license_key: license.license_key,
          subscription: license.subscription,
          expires: license.expires,
          used: license.used,
          used_by: license.user_id ? usersMap[license.user_id] || null : null,
          created_at: license.created_at,
          app_name: appMap[license.app_id] || null
        }))
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.json`)
        return res.json(licenses)
      }
    }

    connection = await pool.getConnection()

    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    let licenseRows
    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, user.id]
      )

      if (appRows.length === 0) {
        return res.json({ success: false, message: 'Aplicação não encontrada' })
      }

      [licenseRows] = await connection.query(
        `SELECT l.*, u.username as used_by 
         FROM licenses l 
         LEFT JOIN users u ON l.user_id = u.id 
         WHERE l.app_id = ? 
         ORDER BY l.created_at DESC`,
        [appId]
      )
    } else {
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [user.id]
      )
      
      if (appRows.length === 0) {
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv')
          res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.csv`)
          res.send('License Key,Subscription,Expires,Used,Used By,Created At\n')
        } else {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.json`)
          res.json([])
        }
        return
      }
      
      const appIds = appRows.map(app => app.id)
      const placeholders = appIds.map(() => '?').join(',')
      
      [licenseRows] = await connection.query(
        `SELECT l.*, u.username as used_by, a.name as app_name 
         FROM licenses l 
         LEFT JOIN users u ON l.user_id = u.id 
         LEFT JOIN applications a ON l.app_id = a.id 
         WHERE l.app_id IN (${placeholders}) 
         ORDER BY l.created_at DESC`,
        appIds
      )
    }

    if (format === 'csv') {
      const csvHeader = 'License Key,Subscription,Expires,Used,Used By,Created At\n'
      const csvRows = licenseRows.map(license => {
        return `"${license.license_key}","${license.subscription}","${license.expires}","${license.used ? 'Yes' : 'No'}","${license.used_by || ''}","${license.created_at}"`
      }).join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.csv`)
      res.send(csvHeader + csvRows)
    } else {
      const licenses = licenseRows.map(license => ({
        license_key: license.license_key,
        subscription: license.subscription,
        expires: license.expires,
        used: license.used,
        used_by: license.used_by || null,
        created_at: license.created_at,
        app_name: license.app_name || null
      }))
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename=licenses_${Date.now()}.json`)
      res.json(licenses)
    }
  } catch (error) {
    console.error('Erro ao exportar licenças:', error)
    res.json({
      success: false,
      message: 'Erro ao exportar licenças'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar todas as licenças
app.post('/api/delete-all-licenses', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      if (appId) {
        const app = await db.getApplicationByIdForUser(appId, suUser.id)
        if (!app) {
          return res.json({ success: false, message: 'Aplicação não encontrada' })
        }
        const count = await db.countLicensesByAppId(appId)
        await db.deleteAllLicensesByAppId(appId)
        return res.json({ success: true, message: `${count} licença(s) deletada(s) com sucesso`, deletedCount: count })
      } else {
        const appIds = await db.getApplicationIdsByUserId(suUser.id)
        if (appIds.length === 0) {
          return res.json({ success: true, message: '0 licença(s) deletada(s) com sucesso', deletedCount: 0 })
        }
        const licenses = await db.getLicensesByAppIds(appIds)
        const count = licenses.length
        await db.deleteAllLicensesByAppIds(appIds)
        return res.json({ success: true, message: `${count} licença(s) deletada(s) com sucesso`, deletedCount: count })
      }
    }

    connection = await pool.getConnection()

    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, user.id]
      )

      if (appRows.length === 0) {
        return res.json({
          success: false,
          message: 'Aplicação não encontrada'
        })
      }

      const [result] = await connection.query(
        'DELETE FROM licenses WHERE app_id = ?',
        [appId]
      )

      res.json({ success: true, message: `${result.affectedRows} licença(s) deletada(s) com sucesso`, deletedCount: result.affectedRows })
    } else {
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [user.id]
      )
      
      if (appRows.length === 0) {
        return res.json({ success: true, message: '0 licença(s) deletada(s) com sucesso', deletedCount: 0 })
      }
      
      const appIds = appRows.map(app => app.id)
      const placeholders = appIds.map(() => '?').join(',')
      
      const [result] = await connection.query(
        `DELETE FROM licenses WHERE app_id IN (${placeholders})`,
        appIds
      )

      res.json({ success: true, message: `${result.affectedRows} licença(s) deletada(s) com sucesso`, deletedCount: result.affectedRows })
    }
  } catch (error) {
    console.error('Erro ao deletar licenças:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar licenças'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar licenças usadas
app.post('/api/delete-used-licenses', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      if (appId) {
        const app = await db.getApplicationByIdForUser(appId, suUser.id)
        if (!app) {
          return res.json({ success: false, message: 'Aplicação não encontrada' })
        }
        const { data: rows } = await require('./db_supabase').supabase
          .from('licenses')
          .select('id')
          .eq('app_id', appId)
          .eq('used', true)
        const count = Array.isArray(rows) ? rows.length : 0
        await db.deleteUsedLicensesByAppId(appId)
        return res.json({ success: true, message: `${count} licença(s) usada(s) deletada(s) com sucesso`, deletedCount: count })
      } else {
        const appIds = await db.getApplicationIdsByUserId(suUser.id)
        if (appIds.length === 0) {
          return res.json({ success: true, message: '0 licença(s) usada(s) deletada(s) com sucesso', deletedCount: 0 })
        }
        const { data: rows } = await require('./db_supabase').supabase
          .from('licenses')
          .select('id')
          .in('app_id', appIds)
          .eq('used', true)
        const count = Array.isArray(rows) ? rows.length : 0
        await db.deleteUsedLicensesByAppIds(appIds)
        return res.json({ success: true, message: `${count} licença(s) usada(s) deletada(s) com sucesso`, deletedCount: count })
      }
    }

    connection = await pool.getConnection()

    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, user.id]
      )

      if (appRows.length === 0) {
        return res.json({
          success: false,
          message: 'Aplicação não encontrada'
        })
      }

      const [result] = await connection.query(
        'DELETE FROM licenses WHERE app_id = ? AND used = TRUE',
        [appId]
      )

      res.json({ success: true, message: `${result.affectedRows} licença(s) usada(s) deletada(s) com sucesso`, deletedCount: result.affectedRows })
    } else {
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [user.id]
      )
      
      if (appRows.length === 0) {
        return res.json({ success: true, message: '0 licença(s) usada(s) deletada(s) com sucesso', deletedCount: 0 })
      }
      
      const appIds = appRows.map(app => app.id)
      const placeholders = appIds.map(() => '?').join(',')
      
      const [result] = await connection.query(
        `DELETE FROM licenses WHERE app_id IN (${placeholders}) AND used = TRUE`,
        appIds
      )

      res.json({ success: true, message: `${result.affectedRows} licença(s) usada(s) deletada(s) com sucesso`, deletedCount: result.affectedRows })
    }
  } catch (error) {
    console.error('Erro ao deletar licenças usadas:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar licenças usadas'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar licenças não usadas
app.post('/api/delete-unused-licenses', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      if (appId) {
        const app = await db.getApplicationByIdForUser(appId, suUser.id)
        if (!app) {
          return res.json({ success: false, message: 'Aplicação não encontrada' })
        }
        const { data: rows } = await require('./db_supabase').supabase
          .from('licenses')
          .select('id')
          .eq('app_id', appId)
          .eq('used', false)
        const count = Array.isArray(rows) ? rows.length : 0
        await db.deleteUnusedLicensesByAppId(appId)
        return res.json({ success: true, message: `${count} licença(s) não usada(s) deletada(s) com sucesso`, deletedCount: count })
      } else {
        const appIds = await db.getApplicationIdsByUserId(suUser.id)
        if (appIds.length === 0) {
          return res.json({ success: true, message: '0 licença(s) não usada(s) deletada(s) com sucesso', deletedCount: 0 })
        }
        const { data: rows } = await require('./db_supabase').supabase
          .from('licenses')
          .select('id')
          .in('app_id', appIds)
          .eq('used', false)
        const count = Array.isArray(rows) ? rows.length : 0
        await db.deleteUnusedLicensesByAppIds(appIds)
        return res.json({ success: true, message: `${count} licença(s) não usada(s) deletada(s) com sucesso`, deletedCount: count })
      }
    }

    connection = await pool.getConnection()

    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, user.id]
      )

      if (appRows.length === 0) {
        return res.json({
          success: false,
          message: 'Aplicação não encontrada'
        })
      }

      const [result] = await connection.query(
        'DELETE FROM licenses WHERE app_id = ? AND used = FALSE',
        [appId]
      )

      res.json({ success: true, message: `${result.affectedRows} licença(s) não usada(s) deletada(s) com sucesso`, deletedCount: result.affectedRows })
    } else {
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [user.id]
      )
      
      if (appRows.length === 0) {
        return res.json({ success: true, message: '0 licença(s) não usada(s) deletada(s) com sucesso', deletedCount: 0 })
      }
      
      const appIds = appRows.map(app => app.id)
      const placeholders = appIds.map(() => '?').join(',')
      
      const [result] = await connection.query(
        `DELETE FROM licenses WHERE app_id IN (${placeholders}) AND used = FALSE`,
        appIds
      )

      res.json({ success: true, message: `${result.affectedRows} licença(s) não usada(s) deletada(s) com sucesso`, deletedCount: result.affectedRows })
    }
  } catch (error) {
    console.error('Erro ao deletar licenças não usadas:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar licenças não usadas'
    })
  } finally {
    if (connection) connection.release()
  }
})

// ========================================
// ENDPOINTS KeyUnit-LIKE (/api/1.3/*)
// ========================================

// Endpoint: GET base (para diagnóstico rápido)
app.get('/api/1.3', (req, res) => {
  res.json({
    success: true,
    message: 'api-alive',
    endpoints: [
      'POST /api/1.3/init',
      'POST /api/1.3/login',
      'POST /api/1.3/register',
      'POST /api/1.3/license',
      'POST /api/1.3/user_data'
    ]
  })
})

// Função para gerar hash KeyUnit-like
const generateKeyUnitHash = (data) => {
  // Hash simples baseado nos dados - você pode melhorar isso
  const hashInput = JSON.stringify(data)
  return crypto.createHash('sha256').update(hashInput).digest('hex')
}

// Função para validar requisição KeyUnit
const validateKeyUnitRequest = (req, appSecret) => {
  const { type, name, ownerid, hash, sessionid, enckey } = req.body
  // Validação básica - você pode adicionar mais validações aqui
  // Em produção, você deve validar o hash contra o app_secret
  return { type, name, ownerid, hash, sessionid, enckey, valid: true }
}

// Endpoint: Init (Inicializar aplicação)
app.post('/api/1.3/init', async (req, res) => {
  if (DEMO_MODE) {
    return res.json({
      success: true,
      message: 'successfullyinitialized',
      sessionid: generateSessionToken(),
      appinfo: {
        numUsers: memory.users.length,
        numOnlineUsers: 0,
        numKeys: memory.licenses.length,
        version: config.apiVersion,
        customerPanelLink: `${config.apiUrl}/dashboard`
      }
    })
  }
  let connection
  try {
    // Obter IP do cliente (verificando headers de proxy)
    let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'unknown'
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim()
    }
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1'
    }
    
    // Log da requisição recebida
    console.log('📥 [Init] Requisição recebida:', {
      type: req.body?.type,
      name: req.body?.name,
      ownerid: req.body?.ownerid,
      hasHash: !!req.body?.hash,
      hasEnckey: !!req.body?.enckey,
      protocol: req.protocol,
      secure: req.secure,
      ip: clientIp,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin || '(não enviado)',
        'user-agent': req.headers['user-agent']?.substring(0, 50) || '(não enviado)'
      }
    })

    const { type, name, ownerid, hash, enckey } = req.body

    if (!type || !name || !ownerid || !hash) {
      console.warn('⚠️  [Init] Campos obrigatórios faltando:', { type, name, ownerid, hasHash: !!hash })
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Buscar aplicação
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE name = ? AND owner_id = ?',
      [name, ownerid]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidapp'
      })
    }

    const app = appRows[0]

    // Verificar se aplicação está pausada
    if (app.paused) {
      return res.json({
        success: false,
        message: 'apppaused'
      })
    }

    // Contar usuários e licenças da aplicação
    const [userCountRows] = await connection.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM licenses WHERE app_id = ? AND user_id IS NOT NULL',
      [app.id]
    )
    const [licenseCountRows] = await connection.query(
      'SELECT COUNT(*) as count FROM licenses WHERE app_id = ?',
      [app.id]
    )

    // Gerar sessionid temporário para init
    const initSessionId = generateSessionToken()

    // Retornar resposta KeyUnit-like
    res.json({
      success: true,
      message: 'successfullyinitialized',
      sessionid: initSessionId,
      appinfo: {
        numUsers: userCountRows[0]?.count || 0,
        numOnlineUsers: 0,
        numKeys: licenseCountRows[0]?.count || 0,
        version: app.version,
        customerPanelLink: `${config.apiUrl}/dashboard`
      }
    })
  } catch (error) {
    console.error('Erro no init:', error)
    res.json({
      success: false,
      message: 'error'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Login
app.post('/api/1.3/login', async (req, res) => {
  if (useSupabase) {
    try {
      const { type, name, ownerid, username, password, hash, sessionid, enckey, hwid } = req.body
      if (!type || !name || !ownerid || !username || !password || !hash) {
        return res.json({ success: false, message: 'missingrequired' })
      }
      const { supabase } = require('./db_supabase')
      let { data: appRows, error: appErr } = await supabase
        .from('applications')
        .select('*')
        .eq('name', name)
        .eq('owner_id', ownerid)
        .limit(1)
        .maybeSingle()
      if (appErr) throw new Error(appErr.message)
      let app = appRows
      if (!app) {
        const appSecret = generateSessionToken()
        const version = req.body.version || '1.0'
        const insertRes = await supabase
          .from('applications')
          .insert({ name, owner_id: ownerid, app_secret: appSecret, version, status: 'active', paused: false })
          .select('*')
          .limit(1)
        if (insertRes.error) throw new Error(insertRes.error.message)
        app = insertRes.data && insertRes.data[0]
      }
      const passwordHash = generateHash(password)
      const { data: userRows, error: userErr } = supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .maybeSingle()
      if (userErr) throw new Error(userErr.message)
      if (!userRows) return res.json({ success: false, message: 'invalidcredentials' })
      const newSessionId = generateSessionToken()
      const clientIp = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || ''
      await supabase
        .from('users')
        .update({ session_token: newSessionId, last_login: new Date().toISOString().slice(0,19).replace('T',' '), hwid: hwid || null, ip_address: clientIp })
        .eq('id', userRows.id)
      const { data: licenseRows } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userRows.id)
        .eq('app_id', app.id)
        .limit(1)
      return res.json({
        success: true,
        message: 'successfullyloggedin',
        info: {
          username: userRows.username,
          subscriptions: (licenseRows && licenseRows.length > 0) ? [{ subscription: licenseRows[0].subscription, key: licenseRows[0].license_key, expiry: licenseRows[0].expires }] : [],
          ip: clientIp || '',
          hwid: hwid || '',
          createdate: userRows.created_at,
          lastlogin: userRows.last_login || userRows.created_at
        },
        sessionid: newSessionId
      })
    } catch (error) {
      console.error('Erro no login (Supabase):', error)
      return res.json({ success: false, message: 'error' })
    }
  }
  if (DEMO_MODE) {
    const { username, password } = req.body
    const user = memory.users.find(u => u.username === username && u.password_hash === generateHash(password))
    if (!user) return res.json({ success: false, message: 'invalidcredentials' })
    const newSessionId = generateSessionToken()
    user.session_token = newSessionId
    const license = memory.licenses.find(l => l.user_id === user.id)
    return res.json({
      success: true,
      message: 'successfullyloggedin',
      info: {
        username: user.username,
        subscriptions: license ? [{ subscription: license.subscription, key: license.license_key, expiry: license.expires }] : [],
        ip: '', hwid: '', createdate: user.created_at, lastlogin: user.last_login || user.created_at
      },
      sessionid: newSessionId
    })
  }
  let connection
  try {
    const { type, name, ownerid, username, password, hash, sessionid, enckey, hwid } = req.body

    if (!type || !name || !ownerid || !username || !password || !hash) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Buscar aplicação
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE name = ? AND owner_id = ?',
      [name, ownerid]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidapp'
      })
    }

    const app = appRows[0]

    // Verificar se aplicação está pausada
    if (app.paused) {
      return res.json({
        success: false,
        message: 'apppaused'
      })
    }

    // Buscar usuário - deve pertencer à aplicação
    const passwordHash = generateHash(password)
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE username = ? AND password_hash = ? AND app_id = ?',
      [username, passwordHash, app.id]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidcredentials'
      })
    }

    const user = userRows[0]
    
    // Verificar se usuário está banido
    if (user.banned) {
      return res.json({
        success: false,
        message: 'userbanned'
      })
    }

    // Verificar se assinatura expirou
    const expires = new Date(user.expires)
    const now = new Date()
    if (now > expires) {
      return res.json({
        success: false,
        message: 'subscriptionexpired'
      })
    }

    // Gerar novo sessionid
    const newSessionId = generateSessionToken()
    
    // Obter IP do cliente (prioridade: x-forwarded-for, x-real-ip, connection.remoteAddress, socket.remoteAddress)
    let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || ''
    
    // Se x-forwarded-for contém múltiplos IPs (proxies), pegar o primeiro
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim()
    }
    
    // Limpar IPv6 localhost
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1'
    }
    
    // Verificar se as colunas hwid e ip_address existem
    let hasHwidColumn = false
    let hasIpColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users'
      )
      hasHwidColumn = columns.some(col => col.Field === 'hwid')
      hasIpColumn = columns.some(col => col.Field === 'ip_address')
    } catch (error) {
      // Se não conseguir verificar, assume que não existem
      hasHwidColumn = false
      hasIpColumn = false
    }
    
    // Atualizar session_token, last_login, IP e HWID
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ')
    
    if (hasHwidColumn && hasIpColumn) {
      // Atualizar com HWID e IP
      await connection.query(
        'UPDATE users SET session_token = ?, last_login = ?, ip_address = ?, hwid = ? WHERE id = ?',
        [newSessionId, nowStr, clientIp, hwid || user.hwid || '', user.id]
      )
    } else if (hasIpColumn) {
      // Atualizar apenas com IP
      await connection.query(
        'UPDATE users SET session_token = ?, last_login = ?, ip_address = ? WHERE id = ?',
        [newSessionId, nowStr, clientIp, user.id]
      )
    } else if (hasHwidColumn) {
      // Atualizar apenas com HWID
      await connection.query(
        'UPDATE users SET session_token = ?, last_login = ?, hwid = ? WHERE id = ?',
        [newSessionId, nowStr, hwid || user.hwid || '', user.id]
      )
    } else {
      // Atualizar apenas session_token e last_login
      await connection.query(
        'UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
        [newSessionId, nowStr, user.id]
      )
    }

    // Buscar licença do usuário para esta aplicação (se houver)
    const [licenseRows] = await connection.query(
      'SELECT * FROM licenses WHERE user_id = ? AND app_id = ? LIMIT 1',
      [user.id, app.id]
    )

    // Buscar dados atualizados do usuário (incluindo HWID e IP atualizados)
    const [updatedUserRows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [user.id]
    )
    const updatedUser = updatedUserRows[0] || user
    
    res.json({
      success: true,
      message: 'successfullyloggedin',
      info: {
        username: updatedUser.username,
        subscriptions: licenseRows.length > 0 ? [{
          subscription: licenseRows[0].subscription,
          key: licenseRows[0].license_key,
          expiry: licenseRows[0].expires
        }] : [],
        ip: updatedUser.ip_address || clientIp || '',
        hwid: updatedUser.hwid || hwid || '',
        createdate: updatedUser.created_at,
        lastlogin: updatedUser.last_login || updatedUser.created_at
      },
      sessionid: newSessionId
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.json({
      success: false,
      message: 'error'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Register
app.post('/api/1.3/register', async (req, res) => {
  if (useSupabase) {
    try {
      const { type, name, ownerid, username, password, email, license, hash } = req.body
      if (!type || !name || !ownerid || !username || !password || !email || !license || !hash) {
        return res.json({ success: false, message: 'missingrequired' })
      }
      const { supabase } = require('./db_supabase')
      let { data: appRows, error: appErr } = await supabase
        .from('applications')
        .select('*')
        .eq('name', name)
        .eq('owner_id', ownerid)
        .limit(1)
        .maybeSingle()
      if (appErr) throw new Error(appErr.message)
      let app = appRows
      if (!app) {
        const appSecret = generateSessionToken()
        const version = req.body.version || '1.0'
        const insertRes = await supabase
          .from('applications')
          .insert({ name, owner_id: ownerid, app_secret: appSecret, version, status: 'active', paused: false })
          .select('*')
          .limit(1)
        if (insertRes.error) throw new Error(insertRes.error.message)
        app = insertRes.data && insertRes.data[0]
      }
      const { data: existsUser } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .limit(1)
      if (existsUser && existsUser.length > 0) {
        return res.json({ success: false, message: 'usernameoremailalreadyexists' })
      }
      const { data: licenseRows, error: licErr } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', license)
        .or(`app_id.eq.${app.id},app_id.is.null`)
        .eq('used', false)
        .limit(1)
      if (licErr) throw new Error(licErr.message)
      if (!licenseRows || licenseRows.length === 0) {
        return res.json({ success: false, message: 'invalidlicense' })
      }
      const lic = licenseRows[0]
      if (!lic.app_id) {
        await supabase.from('licenses').update({ app_id: app.id }).eq('id', lic.id)
      }
      const passwordHash = generateHash(password)
      const sessionToken = generateSessionToken()
      const nowStr = new Date().toISOString().slice(0,19).replace('T',' ')
      const clientIp = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || ''
      const { data: inserted, error: insErr } = await supabase
        .from('users')
        .insert({ username, email, password_hash: passwordHash, subscription: lic.subscription, expires: lic.expires, session_token: sessionToken, app_id: app.id, verified: true, ip_address: clientIp, created_at: nowStr, last_login: nowStr })
        .select('*')
        .limit(1)
      if (insErr) throw new Error(insErr.message)
      const newUser = inserted && inserted[0]
      await supabase.from('licenses').update({ used: true, user_id: newUser.id }).eq('id', lic.id)
      return res.json({
        success: true,
        message: 'successfullyregistered',
        info: {
          username,
          subscriptions: [{ subscription: lic.subscription, key: lic.license_key, expiry: lic.expires }],
          ip: clientIp,
          hwid: '',
          createdate: nowStr,
          lastlogin: nowStr
        },
        sessionid: sessionToken
      })
    } catch (error) {
      console.error('Erro no register (Supabase):', error)
      return res.json({ success: false, message: 'error' })
    }
  }
  if (DEMO_MODE) {
    const { username, password, email, license } = req.body
    if (!username || !password || !email || !license) return res.json({ success: false, message: 'missingrequired' })
    if (memory.users.find(u => u.username === username || u.email === email)) {
      return res.json({ success: false, message: 'usernameoremailalreadyexists' })
    }
    const id = memory.users.length + 1
    const now = new Date().toISOString().slice(0,19).replace('T',' ')
    const sessionToken = generateSessionToken()
    memory.users.push({ id, username, email, password_hash: generateHash(password), subscription: 'default', expires: now, session_token: sessionToken, created_at: now, last_login: now })
    const licId = memory.licenses.length + 1
    memory.licenses.push({ id: licId, license_key: license, subscription: 'default', expires: now, used: true, user_id: id })
    return res.json({
      success: true,
      message: 'successfullyregistered',
      info: { username, subscriptions: [{ subscription: 'default', key: license, expiry: now }], ip: '', hwid: '', createdate: now, lastlogin: now },
      sessionid: sessionToken
    })
  }
  let connection
  try {
    const { type, name, ownerid, username, password, email, license, hash, sessionid, enckey } = req.body

    if (!type || !name || !ownerid || !username || !password || !email || !license || !hash) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Buscar aplicação
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE name = ? AND owner_id = ?',
      [name, ownerid]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidapp'
      })
    }

    const app = appRows[0]

    // Verificar se aplicação está pausada
    if (app.paused) {
      return res.json({
        success: false,
        message: 'apppaused'
      })
    }

    // Verificar se usuário já existe PARA ESTA APLICAÇÃO
    // Mesmo username pode existir em aplicações diferentes
    let existingUserQuery = 'SELECT id FROM users WHERE (username = ? OR email = ?)'
    let existingUserParams = [username, email]
    
    // Verificar se a coluna app_id existe
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }
    
    if (hasAppIdColumn) {
      existingUserQuery += ' AND app_id = ?'
      existingUserParams.push(app.id)
    }
    
    const [existingUser] = await connection.query(
      existingUserQuery,
      existingUserParams
    )

    if (existingUser.length > 0) {
      return res.json({
        success: false,
        message: 'usernameoremailalreadyexists'
      })
    }

    // Verificar licença (deve pertencer à aplicação)
    const [licenseRows] = await connection.query(
      'SELECT * FROM licenses WHERE license_key = ? AND (app_id = ? OR app_id IS NULL) AND used = FALSE',
      [license, app.id]
    )

    if (licenseRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidlicense'
      })
    }

    const licenseData = licenseRows[0]

    // Se licença não tem app_id, associar à aplicação atual
    if (!licenseData.app_id) {
      await connection.query(
        'UPDATE licenses SET app_id = ? WHERE id = ?',
        [app.id, licenseData.id]
      )
    }

    // Criar usuário - associado à aplicação
    const passwordHash = generateHash(password)
    const sessionToken = generateSessionToken()
    const expiresDate = new Date(licenseData.expires)
    const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')
    
    const now = new Date()
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ')
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || ''
    
    let result
    if (hasAppIdColumn) {
      [result] = await connection.query(
        'INSERT INTO users (username, email, password_hash, subscription, expires, session_token, app_id, verified, ip_address, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, email, passwordHash, licenseData.subscription, expiresStr, sessionToken, app.id, true, clientIp, nowStr, nowStr]
      )
    } else {
      [result] = await connection.query(
        'INSERT INTO users (username, email, password_hash, subscription, expires, session_token, verified, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, email, passwordHash, licenseData.subscription, expiresStr, sessionToken, true, nowStr, nowStr]
      )
    }

    const userId = result.insertId

    // Marcar licença como usada
    await connection.query(
      'UPDATE licenses SET used = TRUE, user_id = ? WHERE id = ?',
      [userId, licenseData.id]
    )
    
    res.json({
      success: true,
      message: 'successfullyregistered',
      info: {
        username: username,
        subscriptions: [{
          subscription: licenseData.subscription,
          key: licenseData.license_key,
          expiry: licenseData.expires
        }],
        ip: clientIp,
        hwid: '',
        createdate: nowStr,
        lastlogin: nowStr
      },
      sessionid: sessionToken
    })
  } catch (error) {
    console.error('Erro no register:', error)
    res.json({
      success: false,
      message: 'error'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: License (Verificar licença)
app.post('/api/1.3/license', async (req, res) => {
  if (useSupabase) {
    try {
      const { type, name, ownerid, key, hash, sessionid, enckey } = req.body
      if (!type || !name || !ownerid || !key || !hash || !sessionid) {
        return res.json({ success: false, message: 'missingrequired' })
      }
      const { supabase } = require('./db_supabase')
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', sessionid)
        .limit(1)
        .maybeSingle()
      if (userErr) throw new Error(userErr.message)
      if (!user) return res.json({ success: false, message: 'invalidsession' })
      let { data: appRows, error: appErr } = await supabase
        .from('applications')
        .select('*')
        .eq('name', name)
        .eq('owner_id', ownerid)
        .limit(1)
        .maybeSingle()
      if (appErr) throw new Error(appErr.message)
      let app = appRows
      if (!app) {
        const appSecret = generateSessionToken()
        const version = req.body.version || '1.0'
        const insertRes = await supabase
          .from('applications')
          .insert({ name, owner_id: ownerid, app_secret: appSecret, version, status: 'active', paused: false })
          .select('*')
          .limit(1)
        if (insertRes.error) throw new Error(insertRes.error.message)
        app = insertRes.data && insertRes.data[0]
      }
      const { data: licenseRows, error: licErr } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', key)
        .or(`app_id.eq.${app.id},app_id.is.null`)
        .limit(1)
      if (licErr) throw new Error(licErr.message)
      if (!licenseRows || licenseRows.length === 0) {
        return res.json({ success: false, message: 'invalidlicense' })
      }
      const license = licenseRows[0]
      if (license.used && license.user_id !== user.id) {
        return res.json({ success: false, message: 'licensealreadyused' })
      }
      const now = new Date()
      const expires = new Date(license.expires)
      if (now > expires) {
        return res.json({ success: false, message: 'licenseexpired' })
      }
      if (!license.used) {
        await supabase.from('licenses').update({ used: true, user_id: user.id, app_id: app.id }).eq('id', license.id)
        await supabase.from('users').update({ subscription: license.subscription, expires: license.expires }).eq('id', user.id)
      }
      return res.json({
        success: true,
        message: 'licenseactivated',
        info: { subscription: license.subscription, key: license.license_key, expiry: license.expires }
      })
    } catch (error) {
      console.error('Erro no license (Supabase):', error)
      return res.json({ success: false, message: 'error' })
    }
  }
  let connection
  try {
    const { type, name, ownerid, key, hash, sessionid, enckey } = req.body
    if (!type || !name || !ownerid || !key || !hash || !sessionid) {
      return res.json({ success: false, message: 'missingrequired' })
    }
    connection = await pool.getConnection()
    const [userRows] = await connection.query('SELECT * FROM users WHERE session_token = ?', [sessionid])
    if (userRows.length === 0) {
      return res.json({ success: false, message: 'invalidsession' })
    }
    const user = userRows[0]
    const [appRows] = await connection.query('SELECT * FROM applications WHERE name = ? AND owner_id = ?', [name, ownerid])
    if (appRows.length === 0) {
      return res.json({ success: false, message: 'invalidapp' })
    }
    const app = appRows[0]
    const [licenseRows] = await connection.query('SELECT * FROM licenses WHERE license_key = ? AND (app_id = ? OR app_id IS NULL)', [key, app.id])
    if (licenseRows.length === 0) {
      return res.json({ success: false, message: 'invalidlicense' })
    }
    const license = licenseRows[0]
    if (!license.app_id) {
      await connection.query('UPDATE licenses SET app_id = ? WHERE id = ?', [app.id, license.id])
    }
    if (license.used && license.user_id !== user.id) {
      return res.json({ success: false, message: 'licensealreadyused' })
    }
    const expires = new Date(license.expires)
    const now = new Date()
    if (now > expires) {
      return res.json({ success: false, message: 'licenseexpired' })
    }
    if (!license.used) {
      await connection.query('UPDATE licenses SET used = TRUE, user_id = ?, app_id = ? WHERE id = ?', [user.id, app.id, license.id])
      await connection.query('UPDATE users SET subscription = ?, expires = ? WHERE id = ?', [license.subscription, license.expires, user.id])
    }
    res.json({ success: true, message: 'licenseactivated', info: { subscription: license.subscription, key: license.license_key, expiry: license.expires } })
  } catch (error) {
    console.error('Erro no license:', error)
    res.json({ success: false, message: 'error' })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: User Data (Obter dados do usuário)
app.post('/api/1.3/user_data', async (req, res) => {
  if (useSupabase) {
    try {
      const { sessionid } = req.body
      if (!sessionid) return res.json({ success: false, message: 'missingrequired' })
      const { supabase } = require('./db_supabase')
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', sessionid)
        .limit(1)
        .maybeSingle()
      if (!user) return res.json({ success: false, message: 'invalidsession' })
      const { data: licenses } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
      return res.json({
        success: true,
        message: 'success',
        info: {
          username: user.username,
          subscriptions: (licenses || []).map(l => ({ subscription: l.subscription, key: l.license_key, expiry: l.expires })),
          ip: user.ip_address || '',
          hwid: user.hwid || '',
          createdate: user.created_at,
          lastlogin: user.last_login || user.created_at
        }
      })
    } catch (error) {
      console.error('Erro no user_data (Supabase):', error)
      return res.json({ success: false, message: 'error' })
    }
  }
  if (DEMO_MODE) {
    const { sessionid } = req.body
    const user = memory.users.find(u => u.session_token === sessionid)
    if (!user) return res.json({ success: false, message: 'invalidsession' })
    const licenses = memory.licenses.filter(l => l.user_id === user.id)
    return res.json({
      success: true,
      message: 'success',
      info: {
        username: user.username,
        subscriptions: licenses.map(l => ({ subscription: l.subscription, key: l.license_key, expiry: l.expires })),
        ip: '', hwid: '', createdate: user.created_at, lastlogin: user.last_login
      }
    })
  }
  let connection
  try {
    const { type, name, ownerid, sessionid, hash, enckey } = req.body

    if (!type || !name || !ownerid || !sessionid || !hash) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidsession'
      })
    }

    const user = userRows[0]

    // Buscar licenças do usuário
    const [licenseRows] = await connection.query(
      'SELECT * FROM licenses WHERE user_id = ?',
      [user.id]
    )

    res.json({
      success: true,
      message: 'success',
      info: {
        username: user.username,
        subscriptions: licenseRows.map(license => ({
          subscription: license.subscription,
          key: license.license_key,
          expiry: license.expires
        })),
        ip: req.ip || req.connection.remoteAddress,
        hwid: '',
        createdate: user.created_at,
        lastlogin: user.last_login
      }
    })
  } catch (error) {
    console.error('Erro no user_data:', error)
    res.json({
      success: false,
      message: 'error'
    })
  } finally {
    if (connection) connection.release()
  }
})

// ========================================
// ENDPOINTS DE USUÁRIOS
// ========================================

// Endpoint: Obter usuários de uma aplicação
app.post('/api/get-users', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    if (useSupabase && supabase) {
      const adminUser = await db.getUserBySessionToken(sessionid)
      if (!adminUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      let users = []
      if (appId) {
        const app = await db.getApplicationByIdForUser(appId, adminUser.id)
        if (!app) {
          return res.json({ success: false, message: 'Aplicação não encontrada' })
        }
        const { data, error } = await supabase
          .from('users')
          .select('id,username,email,subscription,expires,created_at,last_login,hwid,ip_address,banned,verified')
          .eq('app_id', appId)
          .order('created_at', { ascending: false })
        if (error) {
          return res.json({ success: false, message: 'Erro ao buscar usuários: ' + error.message })
        }
        users = (data || []).map(u => ({
          id: u.id,
          username: u.username,
          email: u.email || '',
          subscription: u.subscription,
          expires: u.expires,
          created_at: u.created_at || null,
          last_login: u.last_login || null,
          hwid: u.hwid || '',
          ip_address: u.ip_address || '',
          banned: u.banned || false,
          license_key: '',
          verified: u.verified || false
        }))
      } else {
        const appIds = await db.getApplicationIdsByUserId(adminUser.id)
        if (appIds && appIds.length > 0) {
          const { data, error } = await supabase
            .from('users')
            .select('id,username,email,subscription,expires,created_at,last_login,hwid,ip_address,banned,verified,app_id')
            .in('app_id', appIds)
            .order('created_at', { ascending: false })
          if (error) {
            return res.json({ success: false, message: 'Erro ao buscar usuários: ' + error.message })
          }
          users = (data || []).map(u => ({
            id: u.id,
            username: u.username,
            email: u.email || '',
            subscription: u.subscription,
            expires: u.expires,
            created_at: u.created_at || null,
            last_login: u.last_login || null,
            hwid: u.hwid || '',
            ip_address: u.ip_address || '',
            banned: u.banned || false,
            license_key: '',
            app_name: '',
            verified: u.verified || false
          }))
        }
      }
      return res.json({ success: true, users })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = userRows[0]

    // Buscar usuários da aplicação
    let users = []
    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, adminUser.id]
      )

      if (appRows.length === 0) {
        return res.json({
          success: false,
          message: 'Aplicação não encontrada'
        })
      }

      // Verificar se app_id existe na tabela users
      let hasAppIdColumn = false
      try {
        const [columns] = await connection.query(
          'SHOW COLUMNS FROM users LIKE "app_id"'
        )
        hasAppIdColumn = columns.length > 0
      } catch (error) {
        hasAppIdColumn = false
      }

      let userRowsData = []
      if (hasAppIdColumn) {
        [userRowsData] = await connection.query(
          `SELECT u.*, l.license_key 
           FROM users u 
           LEFT JOIN licenses l ON u.id = l.user_id 
           WHERE u.app_id = ? 
           ORDER BY u.created_at DESC`,
          [appId]
        )
      } else {
        // Se não há app_id, buscar usuários que têm licenças da aplicação
        [userRowsData] = await connection.query(
          `SELECT u.*, l.license_key 
           FROM users u 
           INNER JOIN licenses l ON u.id = l.user_id 
           WHERE l.app_id = ? 
           ORDER BY u.created_at DESC`,
          [appId]
        )
      }

      users = userRowsData.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email || '',
        subscription: user.subscription,
        expires: user.expires,
        created_at: user.created_at,
        last_login: user.last_login || null,
        hwid: user.hwid || '',
        ip_address: user.ip_address || '',
        banned: user.banned || false,
        license_key: user.license_key || '',
        verified: user.verified || false
      }))
    } else {
      // Buscar todos os usuários de todas as aplicações do admin
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [adminUser.id]
      )

      if (appRows.length > 0) {
        const appIds = appRows.map(app => app.id)
        const placeholders = appIds.map(() => '?').join(',')
        
        // Buscar usuários através de licenças
        const [userRowsData] = await connection.query(
          `SELECT DISTINCT u.*, l.license_key, a.name as app_name 
           FROM users u 
           INNER JOIN licenses l ON u.id = l.user_id 
           LEFT JOIN applications a ON l.app_id = a.id 
           WHERE l.app_id IN (${placeholders}) 
           ORDER BY u.created_at DESC`,
          appIds
        )

        users = userRowsData.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email || '',
          subscription: user.subscription,
          expires: user.expires,
          created_at: user.created_at,
          last_login: user.last_login || null,
          hwid: user.hwid || '',
          ip_address: user.ip_address || '',
          banned: user.banned || false,
          license_key: user.license_key || '',
          app_name: user.app_name || '',
          verified: user.verified || false
        }))
      }
    }

    res.json({
      success: true,
      users: users
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    res.json({
      success: false,
      message: 'Erro ao buscar usuários'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Criar usuário
app.post('/api/create-user', async (req, res) => {
  let connection
  try {
    console.log('📥 Recebendo requisição para criar usuário:', JSON.stringify(req.body, null, 2))
    
    const { sessionid, appId, username, password, email, subscription, expiration } = req.body

    if (!sessionid || !appId || !username || !password || !subscription || !expiration) {
      console.log('❌ Dados incompletos:', { sessionid: !!sessionid, appId: !!appId, username: !!username, password: !!password, subscription: !!subscription, expiration: !!expiration })
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    if (useSupabase && supabase) {
      const adminUser = await db.getUserBySessionToken(sessionid)
      if (!adminUser) {
        return res.json({ success: false, message: 'Sessão inválida' })
      }
      const app = await db.getApplicationByIdForUser(appId, adminUser.id)
      if (!app) {
        return res.json({ success: false, message: 'Aplicação não encontrada' })
      }
      const userPlan = adminUser.plan || 'tester'
      const userLimitCheck = await checkUserLimit(null, appId, userPlan, 1)
      if (!userLimitCheck.allowed) {
        return res.json({ success: false, message: userLimitCheck.message, limit: userLimitCheck.limit, current: userLimitCheck.current })
      }
      const { data: existingByUsername, error: existUserErr } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .eq('app_id', appId)
        .limit(1)
      if (existUserErr) console.error('Supabase check username error:', existUserErr.message)
      if (existingByUsername && existingByUsername.length > 0) {
        return res.json({ success: false, message: 'Usuário já existe para esta aplicação' })
      }
      if (email && email.trim() !== '') {
        const { data: existingByEmail, error: existEmailErr } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.trim())
          .eq('app_id', appId)
          .limit(1)
        if (existEmailErr) console.error('Supabase check email error:', existEmailErr.message)
        if (existingByEmail && existingByEmail.length > 0) {
          return res.json({ success: false, message: 'Email já existe para esta aplicação' })
        }
      }
      const passwordHash = generateHash(password)
      const expiresDate = new Date(expiration)
      const expiresStr = expiresDate.toISOString()
      const insertPayload = {
        username,
        email: (email && email.trim() !== '') ? email.trim() : null,
        password_hash: passwordHash,
        subscription,
        expires: expiresStr,
        app_id: appId,
        verified: true
      }
      const { data: inserted, error: insertError } = await supabase.from('users').insert(insertPayload).select('*').limit(1)
      if (insertError) {
        console.error('Supabase insert user error:', insertError.message)
        return res.json({ success: false, message: 'Erro ao criar usuário: ' + insertError.message })
      }
      const user = inserted && inserted[0]
      return res.json({
        success: true,
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email || '',
          subscription: user.subscription,
          expires: user.expires
        }
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    const app = appRows[0]

    // Verificar limite de usuários baseado no plano
    const userPlan = await getUserPlan(connection, adminUser.id)
    const userLimitCheck = await checkUserLimit(connection, appId, userPlan, 1)
    
    if (!userLimitCheck.allowed) {
      connection.release()
      return res.json({
        success: false,
        message: userLimitCheck.message,
        limit: userLimitCheck.limit,
        current: userLimitCheck.current
      })
    }

    // Verificar se usuário já existe PARA ESTA APLICAÇÃO
    // Mesmo username pode existir em aplicações diferentes
    console.log('🔍 Verificando se usuário já existe para esta aplicação...')
    let existingUserQuery = 'SELECT id FROM users WHERE username = ? AND app_id = ?'
    let existingUserParams = [username, appId]
    
    // Verificar email apenas se fornecido e não vazio (também dentro do contexto da aplicação)
    if (email && email.trim() !== '') {
      existingUserQuery += ' OR (email IS NOT NULL AND email = ? AND email != "" AND app_id = ?)'
      existingUserParams.push(email.trim(), appId)
    }
    
    const [existingUser] = await connection.query(
      existingUserQuery,
      existingUserParams
    )

    if (existingUser.length > 0) {
      console.log('❌ Usuário ou email já existe para esta aplicação')
      return res.json({
        success: false,
        message: 'Usuário ou email já existe para esta aplicação'
      })
    }

    console.log('✅ Usuário não existe, prosseguindo com criação...')

    // Criar usuário
    const passwordHash = generateHash(password)
    const expiresDate = new Date(expiration)
    const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')

    // Usar email fornecido ou null se vazio
    const userEmail = (email && email.trim() !== '') ? email.trim() : null

    console.log('🔍 Verificando se coluna app_id existe...')
    // Verificar se a coluna app_id existe
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
      console.log(`✅ Coluna app_id ${hasAppIdColumn ? 'existe' : 'não existe'}`)
    } catch (error) {
      console.error('❌ Erro ao verificar coluna app_id:', error.message)
      hasAppIdColumn = false
    }

    console.log('💾 Inserindo usuário no banco de dados...')
    let result
    try {
      if (hasAppIdColumn) {
        [result] = await connection.query(
          'INSERT INTO users (username, email, password_hash, subscription, expires, app_id, verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [username, userEmail, passwordHash, subscription, expiresStr, appId, true]
        )
      } else {
        [result] = await connection.query(
          'INSERT INTO users (username, email, password_hash, subscription, expires, verified) VALUES (?, ?, ?, ?, ?, ?)',
          [username, userEmail, passwordHash, subscription, expiresStr, true]
        )
      }
      console.log(`✅ Usuário inserido com sucesso (ID: ${result.insertId})`)
    } catch (dbError) {
      console.error('❌ Erro ao inserir usuário:', dbError.message)
      console.error('Stack trace:', dbError.stack)
      return res.json({
        success: false,
        message: 'Erro ao criar usuário: ' + dbError.message
      })
    }

    console.log('📤 Enviando resposta de sucesso...')
    res.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: result.insertId,
        username: username,
        email: userEmail || '',
        subscription: subscription,
        expires: expiresStr
      }
    })
    console.log('✅ Resposta enviada com sucesso')
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    console.error('Stack trace:', error.stack)
    res.json({
      success: false,
      message: 'Erro ao criar usuário: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Estender tempo de usuários
app.post('/api/extend-users', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userIds, days } = req.body

    if (!sessionid || !appId || !days) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se app_id existe na tabela users
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    let result
    if (hasAppIdColumn) {
      // Atualizar usuários
      let query = 'UPDATE users SET expires = DATE_ADD(expires, INTERVAL ? DAY) WHERE app_id = ?'
      let params = [days, appId]

      if (userIds && userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',')
        query += ` AND id IN (${placeholders})`
        params = [days, appId, ...userIds]
      }

      [result] = await connection.query(query, params)
    } else {
      // Se não há app_id, atualizar através de licenças
      let query = `UPDATE users u 
                   INNER JOIN licenses l ON u.id = l.user_id 
                   SET u.expires = DATE_ADD(u.expires, INTERVAL ? DAY) 
                   WHERE l.app_id = ?`
      let params = [days, appId]

      if (userIds && userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',')
        query += ` AND u.id IN (${placeholders})`
        params = [days, appId, ...userIds]
      }

      [result] = await connection.query(query, params)
    }

    res.json({
      success: true,
      message: `${result.affectedRows} usuário(s) atualizado(s) com sucesso`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao estender usuários:', error)
    res.json({
      success: false,
      message: 'Erro ao estender usuários'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Reduzir tempo de usuários
app.post('/api/subtract-users', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userIds, days } = req.body

    if (!sessionid || !appId || !days) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se app_id existe na tabela users
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    let result
    if (hasAppIdColumn) {
      // Atualizar usuários
      let query = 'UPDATE users SET expires = DATE_SUB(expires, INTERVAL ? DAY) WHERE app_id = ?'
      let params = [days, appId]

      if (userIds && userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',')
        query += ` AND id IN (${placeholders})`
        params = [days, appId, ...userIds]
      }

      [result] = await connection.query(query, params)
    } else {
      // Se não há app_id, atualizar através de licenças
      let query = `UPDATE users u 
                   INNER JOIN licenses l ON u.id = l.user_id 
                   SET u.expires = DATE_SUB(u.expires, INTERVAL ? DAY) 
                   WHERE l.app_id = ?`
      let params = [days, appId]

      if (userIds && userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',')
        query += ` AND u.id IN (${placeholders})`
        params = [days, appId, ...userIds]
      }

      [result] = await connection.query(query, params)
    }

    res.json({
      success: true,
      message: `${result.affectedRows} usuário(s) atualizado(s) com sucesso`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao reduzir tempo de usuários:', error)
    res.json({
      success: false,
      message: 'Erro ao reduzir tempo de usuários'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Exportar usuários
app.post('/api/export-users', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, format = 'json' } = req.body

    if (!sessionid) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Buscar usuários
    let users = []
    if (appId) {
      const [appRows] = await connection.query(
        'SELECT * FROM applications WHERE id = ? AND user_id = ?',
        [appId, adminUser.id]
      )

      if (appRows.length === 0) {
        return res.json({
          success: false,
          message: 'Aplicação não encontrada'
        })
      }

      // Verificar se app_id existe
      let hasAppIdColumn = false
      try {
        const [columns] = await connection.query(
          'SHOW COLUMNS FROM users LIKE "app_id"'
        )
        hasAppIdColumn = columns.length > 0
      } catch (error) {
        hasAppIdColumn = false
      }

      let userRows = []
      if (hasAppIdColumn) {
        [userRows] = await connection.query(
          `SELECT u.*, l.license_key 
           FROM users u 
           LEFT JOIN licenses l ON u.id = l.user_id 
           WHERE u.app_id = ? 
           ORDER BY u.created_at DESC`,
          [appId]
        )
      } else {
        [userRows] = await connection.query(
          `SELECT u.*, l.license_key 
           FROM users u 
           INNER JOIN licenses l ON u.id = l.user_id 
           WHERE l.app_id = ? 
           ORDER BY u.created_at DESC`,
          [appId]
        )
      }

      users = userRows
    } else {
      const [appRows] = await connection.query(
        'SELECT id FROM applications WHERE user_id = ?',
        [adminUser.id]
      )

      if (appRows.length > 0) {
        const appIds = appRows.map(app => app.id)
        const placeholders = appIds.map(() => '?').join(',')
        
        const [userRows] = await connection.query(
          `SELECT DISTINCT u.*, l.license_key, a.name as app_name 
           FROM users u 
           INNER JOIN licenses l ON u.id = l.user_id 
           LEFT JOIN applications a ON l.app_id = a.id 
           WHERE l.app_id IN (${placeholders}) 
           ORDER BY u.created_at DESC`,
          appIds
        )

        users = userRows
      }
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.csv`)
      
      let csv = 'Username,Email,Subscription,Expires,Created At,Last Login,License Key,HWID,IP Address,Banned\n'
      users.forEach(user => {
        csv += `"${user.username}","${user.email || ''}","${user.subscription}","${user.expires}","${user.created_at || ''}","${user.last_login || ''}","${user.license_key || ''}","${user.hwid || ''}","${user.ip_address || ''}","${user.banned ? 'Yes' : 'No'}"\n`
      })
      
      res.send(csv)
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.json`)
      res.json(users)
    }
  } catch (error) {
    console.error('Erro ao exportar usuários:', error)
    res.json({
      success: false,
      message: 'Erro ao exportar usuários'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar todos os usuários
app.post('/api/delete-all-users', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se app_id existe
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    let result
    if (hasAppIdColumn) {
      // Deletar usuários
      [result] = await connection.query(
        'DELETE FROM users WHERE app_id = ?',
        [appId]
      )
    } else {
      // Deletar através de licenças
      [result] = await connection.query(
        `DELETE u FROM users u 
         INNER JOIN licenses l ON u.id = l.user_id 
         WHERE l.app_id = ?`,
        [appId]
      )
    }

    res.json({
      success: true,
      message: `${result.affectedRows} usuário(s) deletado(s) com sucesso`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao deletar usuários:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar usuários'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar usuários expirados
app.post('/api/delete-expired-users', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se app_id existe
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    let result
    if (hasAppIdColumn) {
      // Deletar usuários expirados
      [result] = await connection.query(
        'DELETE FROM users WHERE app_id = ? AND expires < NOW()',
        [appId]
      )
    } else {
      // Deletar através de licenças
      [result] = await connection.query(
        `DELETE u FROM users u 
         INNER JOIN licenses l ON u.id = l.user_id 
         WHERE l.app_id = ? AND u.expires < NOW()`,
        [appId]
      )
    }

    res.json({
      success: true,
      message: `${result.affectedRows} usuário(s) expirado(s) deletado(s) com sucesso`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao deletar usuários expirados:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar usuários expirados'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Resetar HWID de todos os usuários
app.post('/api/reset-users-hwid', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se a coluna hwid existe
    let hasHwidColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "hwid"'
      )
      hasHwidColumn = columns.length > 0
    } catch (error) {
      hasHwidColumn = false
    }

    if (!hasHwidColumn) {
      return res.json({
        success: false,
        message: 'Coluna HWID não existe na tabela users'
      })
    }

    // Verificar se app_id existe
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    let result
    if (hasAppIdColumn) {
      // Resetar HWID
      [result] = await connection.query(
        'UPDATE users SET hwid = NULL WHERE app_id = ?',
        [appId]
      )
    } else {
      // Resetar através de licenças
      [result] = await connection.query(
        `UPDATE users u 
         INNER JOIN licenses l ON u.id = l.user_id 
         SET u.hwid = NULL 
         WHERE l.app_id = ?`,
        [appId]
      )
    }

    res.json({
      success: true,
      message: `${result.affectedRows} usuário(s) atualizado(s) com sucesso`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao resetar HWID:', error)
    res.json({
      success: false,
      message: 'Erro ao resetar HWID'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Resetar HWID e IP de um usuário específico
app.post('/api/reset-user-hwid-ip', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userId } = req.body

    if (!sessionid || !appId || !userId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se o usuário pertence à aplicação
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    if (hasAppIdColumn) {
      // Verificar se o usuário pertence à aplicação
      const [userRows] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND app_id = ?',
        [userId, appId]
      )
      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado ou não pertence à aplicação'
        })
      }
    } else {
      // Verificar através de licenças
      const [userRows] = await connection.query(
        `SELECT u.id FROM users u 
         INNER JOIN licenses l ON u.id = l.user_id 
         WHERE u.id = ? AND l.app_id = ?`,
        [userId, appId]
      )
      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado ou não pertence à aplicação'
        })
      }
    }

    // Verificar se as colunas hwid e ip_address existem
    let hasHwidColumn = false
    let hasIpColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users'
      )
      hasHwidColumn = columns.some(col => col.Field === 'hwid')
      hasIpColumn = columns.some(col => col.Field === 'ip_address')
    } catch (error) {
      hasHwidColumn = false
      hasIpColumn = false
    }

    // Atualizar HWID e IP
    let updateQuery = 'UPDATE users SET '
    let updateParams = []
    let updates = []

    if (hasHwidColumn) {
      updates.push('hwid = NULL')
    }
    if (hasIpColumn) {
      updates.push('ip_address = NULL')
    }

    if (updates.length === 0) {
      return res.json({
        success: false,
        message: 'Colunas HWID e IP não existem na tabela users'
      })
    }

    updateQuery += updates.join(', ') + ' WHERE id = ?'
    updateParams.push(userId)

    const [result] = await connection.query(updateQuery, updateParams)

    res.json({
      success: true,
      message: 'HWID e IP resetados com sucesso',
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao resetar HWID e IP:', error)
    res.json({
      success: false,
      message: 'Erro ao resetar HWID e IP'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Resetar apenas HWID de um usuário específico
app.post('/api/reset-user-hwid', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userId } = req.body

    if (!sessionid || !appId || !userId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se o usuário pertence à aplicação
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    if (hasAppIdColumn) {
      const [userRows] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND app_id = ?',
        [userId, appId]
      )
      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado ou não pertence à aplicação'
        })
      }
    } else {
      const [userRows] = await connection.query(
        `SELECT u.id FROM users u 
         INNER JOIN licenses l ON u.id = l.user_id 
         WHERE u.id = ? AND l.app_id = ?`,
        [userId, appId]
      )
      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado ou não pertence à aplicação'
        })
      }
    }

    // Verificar se a coluna hwid existe
    let hasHwidColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "hwid"'
      )
      hasHwidColumn = columns.length > 0
    } catch (error) {
      hasHwidColumn = false
    }

    if (!hasHwidColumn) {
      return res.json({
        success: false,
        message: 'Coluna HWID não existe na tabela users'
      })
    }

    // Resetar apenas HWID
    const [result] = await connection.query(
      'UPDATE users SET hwid = NULL WHERE id = ?',
      [userId]
    )

    res.json({
      success: true,
      message: 'HWID resetado com sucesso',
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao resetar HWID:', error)
    res.json({
      success: false,
      message: 'Erro ao resetar HWID'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Resetar apenas IP de um usuário específico
app.post('/api/reset-user-ip', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userId } = req.body

    if (!sessionid || !appId || !userId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se a aplicação pertence ao admin
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, adminUser.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se o usuário pertence à aplicação
    let hasAppIdColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "app_id"'
      )
      hasAppIdColumn = columns.length > 0
    } catch (error) {
      hasAppIdColumn = false
    }

    if (hasAppIdColumn) {
      const [userRows] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND app_id = ?',
        [userId, appId]
      )
      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado ou não pertence à aplicação'
        })
      }
    } else {
      const [userRows] = await connection.query(
        `SELECT u.id FROM users u 
         INNER JOIN licenses l ON u.id = l.user_id 
         WHERE u.id = ? AND l.app_id = ?`,
        [userId, appId]
      )
      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado ou não pertence à aplicação'
        })
      }
    }

    // Verificar se a coluna ip_address existe
    let hasIpColumn = false
    try {
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE "ip_address"'
      )
      hasIpColumn = columns.length > 0
    } catch (error) {
      hasIpColumn = false
    }

    if (!hasIpColumn) {
      return res.json({
        success: false,
        message: 'Coluna IP não existe na tabela users'
      })
    }

    // Resetar apenas IP
    const [result] = await connection.query(
      'UPDATE users SET ip_address = NULL WHERE id = ?',
      [userId]
    )

    res.json({
      success: true,
      message: 'IP resetado com sucesso',
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao resetar IP:', error)
    res.json({
      success: false,
      message: 'Erro ao resetar IP'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Obter variáveis de usuário
app.post('/api/get-user-variables', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userId } = req.body

    if (!sessionid || !appId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    // Buscar variáveis
    let query = 'SELECT * FROM user_variables WHERE app_id = ?'
    let params = [appId]

    if (userId) {
      query += ' AND user_id = ?'
      params.push(userId)
    }

    const [variables] = await connection.query(query, params)

    res.json({
      success: true,
      variables: variables
    })
  } catch (error) {
    console.error('Erro ao buscar variáveis de usuário:', error)
    res.json({
      success: false,
      message: 'Erro ao buscar variáveis de usuário'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Definir variável de usuário
app.post('/api/set-user-variable', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userId, variableName, variableValue } = req.body

    if (!sessionid || !appId || !userId || !variableName) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      connection.release()
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const adminUser = adminRows[0]

    // Verificar se é variável global (userId é null) e se o plano permite
    if (!userId || userId === null) {
      const userPlan = await getUserPlan(connection, adminUser.id)
      const globalVarLimitCheck = await checkGlobalVariableLimit(connection, adminUser.id, appId, userPlan)
      
      if (!globalVarLimitCheck.allowed) {
        connection.release()
        return res.json({
          success: false,
          message: globalVarLimitCheck.message,
          limit: globalVarLimitCheck.limit,
          current: globalVarLimitCheck.current
        })
      }
    } else {
      // Verificar se plano permite variáveis de usuário
      const userPlan = await getUserPlan(connection, adminUser.id)
      if (!hasUserVariables(userPlan)) {
        connection.release()
        return res.json({
          success: false,
          message: `Seu plano (${userPlan}) não permite variáveis de usuário. Faça upgrade para usar esta funcionalidade.`
        })
      }
    }

    // Inserir ou atualizar variável
    await connection.query(
      'INSERT INTO user_variables (user_id, app_id, variable_name, variable_value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE variable_value = ?',
      [userId, appId, variableName, variableValue || '', variableValue || '']
    )

    res.json({
      success: true,
      message: 'Variável definida com sucesso'
    })
  } catch (error) {
    console.error('Erro ao definir variável:', error)
    res.json({
      success: false,
      message: 'Erro ao definir variável'
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar variável de usuário
app.post('/api/delete-user-variable', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, userId, variableName } = req.body

    if (!sessionid || !appId || !userId || !variableName) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (adminRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    // Deletar variável
    const [result] = await connection.query(
      'DELETE FROM user_variables WHERE user_id = ? AND app_id = ? AND variable_name = ?',
      [userId, appId, variableName]
    )

    res.json({
      success: true,
      message: 'Variável deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar variável:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar variável'
    })
  } finally {
    if (connection) connection.release()
  }
})

// ========================================
// ENDPOINTS DE ARQUIVOS (FILES)
// ========================================

// Endpoint: Listar arquivos de uma aplicação
app.post('/api/get-files', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Buscar arquivos da aplicação
    const [files] = await connection.query(
      `SELECT * FROM app_files 
       WHERE app_id = ? 
       ORDER BY uploaded_at DESC`,
      [appId]
    )

    res.json({
      success: true,
      files: files
    })
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error)
    res.json({
      success: false,
      message: 'Erro ao buscar arquivos: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Upload/Adicionar arquivo
app.post('/api/add-file', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, fileUrl, filename, authenticated = false } = req.body

    if (!sessionid || !appId || !fileUrl || !filename) {
      return res.json({
        success: false,
        message: 'Dados incompletos (sessionid, appId, fileUrl e filename são obrigatórios)'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )

    if (appRows.length === 0) {
      connection.release()
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Obter tamanho do arquivo (se possível, fazendo HEAD request)
    let fileSize = 0
    try {
      const https = require('https')
      const http = require('http')
      const url = require('url')
      const parsedUrl = url.parse(fileUrl)
      const client = parsedUrl.protocol === 'https:' ? https : http
      
      await new Promise((resolve, reject) => {
        const req = client.request(fileUrl, { method: 'HEAD' }, (res) => {
          const contentLength = res.headers['content-length']
          if (contentLength) {
            fileSize = parseInt(contentLength, 10)
          }
          resolve()
        })
        req.on('error', reject)
        req.end()
      })
    } catch (error) {
      // Ignorar erro ao obter tamanho
      console.warn('Não foi possível obter tamanho do arquivo:', error.message)
    }

    // Verificar limite de tamanho de upload baseado no plano
    const userPlan = await getUserPlan(connection, user.id)
    if (fileSize > 0) {
      const uploadLimitCheck = checkUploadSizeLimit(userPlan, fileSize)
      
      if (!uploadLimitCheck.allowed) {
        connection.release()
        return res.json({
          success: false,
          message: uploadLimitCheck.message,
          maxSize: uploadLimitCheck.maxSize,
          fileSize: uploadLimitCheck.fileSize
        })
      }
    }

    // Inserir arquivo no banco
    const [result] = await connection.query(
      'INSERT INTO app_files (app_id, filename, file_url, file_size, authenticated) VALUES (?, ?, ?, ?, ?)',
      [appId, filename, fileUrl, fileSize, authenticated === true]
    )

    const [newFile] = await connection.query(
      'SELECT * FROM app_files WHERE id = ?',
      [result.insertId]
    )

    res.json({
      success: true,
      message: 'Arquivo adicionado com sucesso',
      file: newFile[0]
    })
  } catch (error) {
    console.error('Erro ao adicionar arquivo:', error)
    res.json({
      success: false,
      message: 'Erro ao adicionar arquivo: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar arquivo
app.post('/api/delete-file', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, fileId } = req.body

    if (!sessionid || !appId || !fileId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Verificar se o arquivo pertence à aplicação
    const [fileRows] = await connection.query(
      'SELECT * FROM app_files WHERE id = ? AND app_id = ?',
      [fileId, appId]
    )

    if (fileRows.length === 0) {
      return res.json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    // Deletar arquivo
    const [result] = await connection.query(
      'DELETE FROM app_files WHERE id = ? AND app_id = ?',
      [fileId, appId]
    )

    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
      deletedCount: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar arquivo: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Deletar todos os arquivos
app.post('/api/delete-all-files', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body

    if (!sessionid || !appId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Verificar se a aplicação pertence ao usuário
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    // Deletar todos os arquivos da aplicação
    const [result] = await connection.query(
      'DELETE FROM app_files WHERE app_id = ?',
      [appId]
    )

    res.json({
      success: true,
      message: `${result.affectedRows} arquivo(s) deletado(s) com sucesso`,
      deletedCount: result.affectedRows
    })
  } catch (error) {
    console.error('Erro ao deletar todos os arquivos:', error)
    res.json({
      success: false,
      message: 'Erro ao deletar todos os arquivos: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Download de arquivo (para clientes autenticados)
app.post('/api/1.3/download-file', async (req, res) => {
  let connection
  try {
    const { name, ownerid, hwid, fileId } = req.body

    if (!name || !ownerid || !fileId) {
      return res.json({
        success: false,
        message: 'Dados incompletos'
      })
    }

    connection = await pool.getConnection()

    // Verificar aplicação
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE name = ? AND owner_id = ?',
      [name, ownerid]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'Aplicação não encontrada'
      })
    }

    const app = appRows[0]

    // Buscar arquivo
    const [fileRows] = await connection.query(
      'SELECT * FROM app_files WHERE id = ? AND app_id = ?',
      [fileId, app.id]
    )

    if (fileRows.length === 0) {
      return res.json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    const file = fileRows[0]

    // Se o arquivo requer autenticação, verificar usuário
    if (file.authenticated) {
      if (!hwid) {
        return res.json({
          success: false,
          message: 'Autenticação necessária para baixar este arquivo'
        })
      }

      // Verificar se o usuário está autenticado e pertence à aplicação
      let hasAppIdColumn = false
      try {
        const [columns] = await connection.query(
          'SHOW COLUMNS FROM users LIKE "app_id"'
        )
        hasAppIdColumn = columns.length > 0
      } catch (error) {
        hasAppIdColumn = false
      }

      let userRows
      if (hasAppIdColumn) {
        [userRows] = await connection.query(
          'SELECT * FROM users WHERE hwid = ? AND app_id = ? AND banned = FALSE',
          [hwid, app.id]
        )
      } else {
        [userRows] = await connection.query(
          `SELECT u.* FROM users u 
           INNER JOIN licenses l ON u.id = l.user_id 
           WHERE u.hwid = ? AND l.app_id = ? AND u.banned = FALSE AND l.used = TRUE`,
          [hwid, app.id]
        )
      }

      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'Usuário não autenticado ou banido'
        })
      }

      // Verificar se a expiração ainda é válida
      const user = userRows[0]
      if (user.expires && new Date(user.expires) < new Date()) {
        return res.json({
          success: false,
          message: 'Sua assinatura expirou'
        })
      }
    }

    // Retornar URL do arquivo
    res.json({
      success: true,
      file_url: file.file_url,
      filename: file.filename,
      file_size: file.file_size
    })
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    res.json({
      success: false,
      message: 'Erro ao baixar arquivo: ' + error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// ========================================
// ENDPOINTS DE ADMINISTRAÇÃO
// ========================================

// Endpoint: Login Admin
app.post('/api/admin/login', async (req, res) => {
  let connection
  try {
    const { username, password } = req.body

    console.log('🔐 [SERVER] POST /api/admin/login - Username:', username)

    if (!username || !password) {
      console.log('❌ [SERVER] Username ou password não fornecidos')
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      })
    }

    connection = await pool.getConnection()
    
    // Primeiro, verificar se o usuário existe
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    
    console.log('👤 [SERVER] Usuário encontrado:', userRows.length > 0 ? 'sim' : 'não')
    if (userRows.length > 0) {
      console.log('👤 [SERVER] is_admin:', userRows[0].is_admin, 'tipo:', typeof userRows[0].is_admin)
    }
    
    // Buscar usuário com is_admin = TRUE
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE username = ? AND is_admin = TRUE',
      [username]
    )
    
    console.log('🔍 [SERVER] Usuários admin encontrados:', rows.length)
    
    if (rows.length === 0) {
      connection.release()
      console.log('❌ [SERVER] Usuário não é administrador ou não existe')
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      })
    }

    const user = rows[0]
    console.log('✅ [SERVER] Usuário admin encontrado:', user.username, 'ID:', user.id)
    
    const passwordHash = generateHash(password)
    
    if (user.password_hash !== passwordHash) {
      connection.release()
      console.log('❌ [SERVER] Senha incorreta')
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      })
    }

    // Criar session token
    const sessionToken = generateSessionToken()
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    console.log('🔑 [SERVER] Gerando session token:', sessionToken.substring(0, 20) + '...')
    console.log('💾 [SERVER] Atualizando session_token no banco de dados...')
    
    await connection.query(
      'UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
      [sessionToken, now, user.id]
    )

    // Verificar se foi atualizado corretamente
    const [verifyRows] = await connection.query(
      'SELECT session_token, is_admin FROM users WHERE id = ?',
      [user.id]
    )
    
    if (verifyRows.length > 0) {
      console.log('✅ [SERVER] Session token atualizado no banco:', verifyRows[0].session_token === sessionToken ? 'sim' : 'não')
      console.log('✅ [SERVER] is_admin no banco:', verifyRows[0].is_admin, 'tipo:', typeof verifyRows[0].is_admin)
    }

    connection.release()
    
    console.log('✅ [SERVER] Login admin bem-sucedido. Retornando resposta...')
    console.log('📦 [SERVER] Response info:', {
      username: user.username,
      email: user.email,
      sessionid: sessionToken.substring(0, 20) + '...',
      is_admin: true
    })
    
    res.json({
      success: true,
      message: 'Login de administrador realizado com sucesso',
      info: {
        username: user.username,
        email: user.email,
        sessionid: sessionToken,
        is_admin: true
      }
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ [SERVER] Erro no login admin:', error)
    console.error('❌ [SERVER] Error stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    })
  }
})

// Endpoint: Verificar se é admin
app.post('/api/admin/verify', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    // Verificar admin (usa cache interno para evitar queries repetidas)
    const { user, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    connection.release()
    res.json({
      success: true,
      is_admin: true,
      user: {
        username: user.username,
        email: user.email,
        id: user.id,
        profile_picture_url: user.profile_picture_url || null,
        verified: user.verified || false,
        two_factor_enabled: user.two_factor_enabled || false,
        created_at: user.created_at || null
      }
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ [SERVER] Erro ao verificar admin:', error.message)
    console.error('❌ [SERVER] Error stack:', error.stack)
    
    // Verificar no banco o que está acontecendo
    try {
      const debugConnection = await pool.getConnection()
      const [debugRows] = await debugConnection.query(
        'SELECT id, username, session_token, is_admin FROM users WHERE session_token = ?',
        [req.body.sessionid]
      )
      debugConnection.release()
      
      if (debugRows.length > 0) {
        console.log('🔍 [SERVER] Debug - Usuário encontrado com session_token:')
        console.log('  - ID:', debugRows[0].id)
        console.log('  - Username:', debugRows[0].username)
        console.log('  - is_admin:', debugRows[0].is_admin, 'tipo:', typeof debugRows[0].is_admin)
        console.log('  - session_token match:', debugRows[0].session_token === req.body.sessionid ? 'sim' : 'não')
      } else {
        console.log('❌ [SERVER] Debug - Nenhum usuário encontrado com session_token fornecido')
      }
    } catch (debugError) {
      console.error('❌ [SERVER] Erro ao fazer debug:', debugError.message)
    }
    
    res.status(401).json({
      success: false,
      is_admin: false,
      message: error.message || 'Acesso negado'
    })
  }
})

// Endpoint: Listar todos os usuários (apenas admin)
app.post('/api/admin/users', async (req, res) => {
  let connection
  try {
    const { sessionid, search, page = 1, limit = 50 } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    let query = 'SELECT id, username, email, subscription, expires, created_at, last_login, verified, two_factor_enabled, banned, is_admin, profile_picture_url FROM users WHERE 1=1'
    const params = []

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const offset = (page - 1) * limit
    params.push(limit, offset)

    const [users] = await connection.query(query, params)

    // Contar total de usuários
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const countParams = []
    if (search) {
      countQuery += ' AND (username LIKE ? OR email LIKE ?)'
      const searchPattern = `%${search}%`
      countParams.push(searchPattern, searchPattern)
    }
    const [countResult] = await connection.query(countQuery, countParams)
    const total = countResult[0].total

    connection.release()
    res.json({
      success: true,
      users: users.map(u => ({
        ...u,
        expires: u.expires ? new Date(u.expires).toISOString() : null,
        created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
        last_login: u.last_login ? new Date(u.last_login).toISOString() : null
      })),
      total,
      page,
      limit
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar usuários'
    })
  }
})

// Endpoint: Editar usuário (apenas admin)
app.post('/api/admin/users/edit', async (req, res) => {
  let connection
  try {
    const { sessionid, userId, username, email, subscription, expires, banned, is_admin } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!userId) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      })
    }

    // Buscar usuário
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    )

    if (userRows.length === 0) {
      connection.release()
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      })
    }

    const updates = []
    const values = []

    if (username !== undefined) {
      updates.push('username = ?')
      values.push(username)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      values.push(email)
    }
    if (subscription !== undefined) {
      updates.push('subscription = ?')
      values.push(subscription)
    }
    if (expires !== undefined) {
      updates.push('expires = ?')
      values.push(expires)
    }
    if (banned !== undefined) {
      updates.push('banned = ?')
      values.push(banned)
    }
    if (is_admin !== undefined) {
      updates.push('is_admin = ?')
      values.push(is_admin)
    }

    if (updates.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      })
    }

    values.push(userId)
    await connection.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    connection.release()
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao editar usuário'
    })
  }
})

// Endpoint: Deletar usuário (apenas admin)
app.post('/api/admin/users/delete', async (req, res) => {
  let connection
  try {
    const { sessionid, userId } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!userId) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      })
    }

    // Não permitir deletar a si mesmo
    if (admin.id === userId) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Você não pode deletar sua própria conta'
      })
    }

    await connection.query('DELETE FROM users WHERE id = ?', [userId])

    connection.release()
    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao deletar usuário'
    })
  }
})

// Endpoint: Banir/Desbanir usuário (apenas admin)
app.post('/api/admin/users/ban', async (req, res) => {
  let connection
  try {
    const { sessionid, userId, banned } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!userId || banned === undefined) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'ID do usuário e status de ban são obrigatórios'
      })
    }

    // Não permitir banir a si mesmo
    if (admin.id === userId) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Você não pode banir sua própria conta'
      })
    }

    await connection.query(
      'UPDATE users SET banned = ? WHERE id = ?',
      [banned, userId]
    )

    connection.release()
    res.json({
      success: true,
      message: banned ? 'Usuário banido com sucesso' : 'Usuário desbanido com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao banir/desbanir usuário'
    })
  }
})

// Endpoint: Tornar usuário admin (apenas admin)
app.post('/api/admin/users/make-admin', async (req, res) => {
  let connection
  try {
    const { sessionid, userId, is_admin } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!userId || is_admin === undefined) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'ID do usuário e status de admin são obrigatórios'
      })
    }

    // Não permitir remover admin de si mesmo
    if (admin.id === userId && !is_admin) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Você não pode remover seus próprios privilégios de admin'
      })
    }

    await connection.query(
      'UPDATE users SET is_admin = ? WHERE id = ?',
      [is_admin, userId]
    )

    connection.release()
    res.json({
      success: true,
      message: is_admin ? 'Usuário tornou-se administrador' : 'Privilégios de admin removidos do usuário'
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao alterar privilégios de admin'
    })
  }
})

// Endpoint: Obter estatísticas (apenas admin)
app.post('/api/admin/stats', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    // Contar usuários
    const [userCount] = await connection.query('SELECT COUNT(*) as total FROM users')
    const [adminCount] = await connection.query('SELECT COUNT(*) as total FROM users WHERE is_admin = TRUE')
    const [bannedCount] = await connection.query('SELECT COUNT(*) as total FROM users WHERE banned = TRUE')
    const [verifiedCount] = await connection.query('SELECT COUNT(*) as total FROM users WHERE verified = TRUE')
    const [twoFactorCount] = await connection.query('SELECT COUNT(*) as total FROM users WHERE two_factor_enabled = TRUE')

    // Contar aplicações
    const [appCount] = await connection.query('SELECT COUNT(*) as total FROM applications')
    const [licenseCount] = await connection.query('SELECT COUNT(*) as total FROM licenses')
    const [usedLicenseCount] = await connection.query('SELECT COUNT(*) as total FROM licenses WHERE used = TRUE')

    connection.release()
    res.json({
      success: true,
      stats: {
        users: {
          total: userCount[0].total,
          admins: adminCount[0].total,
          banned: bannedCount[0].total,
          verified: verifiedCount[0].total,
          twoFactor: twoFactorCount[0].total
        },
        applications: {
          total: appCount[0].total
        },
        licenses: {
          total: licenseCount[0].total,
          used: usedLicenseCount[0].total,
          unused: licenseCount[0].total - usedLicenseCount[0].total
        }
      }
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter estatísticas'
    })
  }
})

// ========================================
// ENDPOINTS DE CHAT - USUÁRIOS
// ========================================

// Criar novo ticket de suporte
app.post('/api/chat/create-ticket', async (req, res) => {
  let connection
  try {
    const { sessionid, subject, message } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Assunto e mensagem são obrigatórios'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id, username FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // Criar ticket
    const [result] = await connection.query(
      `INSERT INTO support_tickets (user_id, subject, status, priority, created_at, updated_at, last_message_at)
       VALUES (?, ?, 'open', 'normal', ?, ?, ?)`,
      [user.id, subject, now, now, now]
    )

    const ticketId = result.insertId

    // Criar primeira mensagem
    await connection.query(
      `INSERT INTO chat_messages (ticket_id, user_id, message, is_staff, created_at)
       VALUES (?, ?, ?, FALSE, ?)`,
      [ticketId, user.id, message, now]
    )

    connection.release()

    res.json({
      success: true,
      message: 'Ticket criado com sucesso',
      ticket: {
        id: ticketId,
        subject,
        status: 'open'
      }
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao criar ticket:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar ticket',
      error: error.message
    })
  }
})

// Enviar mensagem em um ticket (com suporte a imagem)
app.post('/api/chat/send-message', upload.single('image'), async (req, res) => {
  let connection
  try {
    const { sessionid, ticket_id, message } = req.body

    if (!sessionid || !ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e ticket ID são obrigatórios'
      })
    }

    // Mensagem ou imagem deve estar presente
    if (!message && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem ou imagem é obrigatória'
      })
    }

    if (useSupabase) {
      const user = await db.getUserBySessionToken(sessionid)
      if (!user) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const bucket = process.env.SUPABASE_BUCKET_CHAT_IMAGES || 'chat-images'
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      let imageUrl = null
      if (req.file) {
        const ext = path.extname(req.file.originalname) || ''
        const objectPath = `tickets/${ticket_id}/${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`
        const uploadRes = await require('./db_supabase').supabase
          .storage.from(bucket)
          .upload(objectPath, req.file.buffer, { contentType: req.file.mimetype })
        if (uploadRes.error) throw new Error(uploadRes.error.message)
        const { data: publicData } = require('./db_supabase').supabase
          .storage.from(bucket)
          .getPublicUrl(objectPath)
        imageUrl = publicData.publicUrl
      }
      // Inserir mensagem via Supabase
      const { error } = require('./db_supabase').supabase
        .from('chat_messages')
        .insert({ ticket_id, user_id: user.id, message: message || '', image_url: imageUrl, is_staff: false, created_at: now })
      if (error) throw new Error(error.message)
      await require('./db_supabase').supabase
        .from('support_tickets')
        .update({ last_message_at: now, updated_at: now })
        .eq('id', ticket_id)
      return res.json({ success: true, message: 'Mensagem enviada com sucesso' })
    }

    connection = await pool.getConnection()

    // Verificar se o ticket pertence ao usuário
    const [ticketRows] = await connection.query(
      'SELECT id, status FROM support_tickets WHERE id = ? AND user_id = ?',
      [ticket_id, user.id]
    )

    if (ticketRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket não encontrado'
      })
    }

    const ticket = ticketRows[0]

    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível enviar mensagens em tickets fechados'
      })
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    let imageUrl = null
    if (req.file) {
      imageUrl = `/uploads/chat-images/${req.file.filename}`
    }

    // Adicionar mensagem
    await connection.query(
      `INSERT INTO chat_messages (ticket_id, user_id, message, image_url, is_staff, created_at)
       VALUES (?, ?, ?, ?, FALSE, ?)`,
      [ticket_id, user.id, message || '', imageUrl, now]
    )

    // Atualizar last_message_at do ticket
    await connection.query(
      'UPDATE support_tickets SET last_message_at = ?, updated_at = ? WHERE id = ?',
      [now, now, ticket_id]
    )

    connection.release()

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    // Se houver erro de upload, deletar arquivo se foi criado
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('Erro ao deletar arquivo:', unlinkError)
      }
    }
    console.error('Erro ao enviar mensagem:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar mensagem',
      error: error.message
    })
  }
})

// Listar tickets do usuário
app.post('/api/chat/tickets', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id, username FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Buscar tickets do usuário
    const [tickets] = await connection.query(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM chat_messages m WHERE m.ticket_id = t.id AND m.is_staff = TRUE AND m.read_at IS NULL) as unread_count
       FROM support_tickets t
       WHERE t.user_id = ?
       ORDER BY t.last_message_at DESC`,
      [user.id]
    )

    connection.release()

    res.json({
      success: true,
      tickets: tickets
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar tickets:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tickets',
      error: error.message
    })
  }
})

// Obter mensagens de um ticket
app.post('/api/chat/messages', async (req, res) => {
  let connection
  try {
    const { sessionid, ticket_id } = req.body

    if (!sessionid || !ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e ticket ID são obrigatórios'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT id, username FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida'
      })
    }

    const user = userRows[0]

    // Verificar se o ticket pertence ao usuário
    const [ticketRows] = await connection.query(
      'SELECT id FROM support_tickets WHERE id = ? AND user_id = ?',
      [ticket_id, user.id]
    )

    if (ticketRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket não encontrado'
      })
    }

    // Buscar mensagens
    const [messages] = await connection.query(
      `SELECT m.*, u.username, u.profile_picture_url
       FROM chat_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.ticket_id = ?
       ORDER BY m.created_at ASC`,
      [ticket_id]
    )

    // Marcar mensagens do staff como lidas
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    await connection.query(
      'UPDATE chat_messages SET read_at = ? WHERE ticket_id = ? AND is_staff = TRUE AND read_at IS NULL',
      [now, ticket_id]
    )

    connection.release()

    res.json({
      success: true,
      messages: messages
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao obter mensagens:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter mensagens',
      error: error.message
    })
  }
})

// ========================================
// ENDPOINTS DE CHAT - ADMIN
// ========================================

// Listar todos os tickets (admin)
app.post('/api/admin/chat/tickets', async (req, res) => {
  let connection
  try {
    const { sessionid, status, assigned_to } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    let query = `
      SELECT t.*, 
             u.username, 
             u.email,
             (SELECT COUNT(*) FROM chat_messages m WHERE m.ticket_id = t.id AND m.is_staff = FALSE AND m.read_at IS NULL) as unread_count,
             (SELECT username FROM users WHERE id = t.assigned_to) as assigned_to_username
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ' AND t.status = ?'
      params.push(status)
    }

    if (assigned_to) {
      query += ' AND t.assigned_to = ?'
      params.push(assigned_to)
    }

    query += ' ORDER BY t.last_message_at DESC'

    const [tickets] = await connection.query(query, params)

    connection.release()

    res.json({
      success: true,
      tickets: tickets
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar tickets (admin):', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tickets',
      error: error.message
    })
  }
})

// Atribuir ticket a um admin
app.post('/api/admin/chat/assign', async (req, res) => {
  let connection
  try {
    const { sessionid, ticket_id, assigned_to } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID é obrigatório'
      })
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    await connection.query(
      'UPDATE support_tickets SET assigned_to = ?, updated_at = ? WHERE id = ?',
      [assigned_to || null, now, ticket_id]
    )

    connection.release()

    res.json({
      success: true,
      message: 'Ticket atribuído com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao atribuir ticket:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atribuir ticket',
      error: error.message
    })
  }
})

// Atualizar status do ticket
app.post('/api/admin/chat/update-status', async (req, res) => {
  let connection
  try {
    const { sessionid, ticket_id, status } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!ticket_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID e status são obrigatórios'
      })
    }

    const validStatuses = ['open', 'in_progress', 'closed', 'waiting']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      })
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    await connection.query(
      'UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?',
      [status, now, ticket_id]
    )

    connection.release()

    res.json({
      success: true,
      message: 'Status atualizado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao atualizar status:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status',
      error: error.message
    })
  }
})

// Obter mensagens de um ticket (admin)
app.post('/api/admin/chat/messages', async (req, res) => {
  let connection
  try {
    const { sessionid, ticket_id } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID é obrigatório'
      })
    }

    // Buscar mensagens
    const [messages] = await connection.query(
      `SELECT m.*, u.username, u.profile_picture_url
       FROM chat_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.ticket_id = ?
       ORDER BY m.created_at ASC`,
      [ticket_id]
    )

    // Marcar mensagens do usuário como lidas
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    await connection.query(
      'UPDATE chat_messages SET read_at = ? WHERE ticket_id = ? AND is_staff = FALSE AND read_at IS NULL',
      [now, ticket_id]
    )

    connection.release()

    res.json({
      success: true,
      messages: messages
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao obter mensagens (admin):', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter mensagens',
      error: error.message
    })
  }
})

// Enviar mensagem como staff
app.post('/api/admin/chat/send-message', upload.single('image'), async (req, res) => {
  let connection
  try {
    const { sessionid, ticket_id, message } = req.body

    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn

    if (!ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID é obrigatório'
      })
    }

    // Mensagem ou imagem deve estar presente
    if (!message && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem ou imagem é obrigatória'
      })
    }

    // Verificar se o ticket existe
    const [ticketRows] = await connection.query(
      'SELECT id, status FROM support_tickets WHERE id = ?',
      [ticket_id]
    )

    if (ticketRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket não encontrado'
      })
    }

    const ticket = ticketRows[0]

    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível enviar mensagens em tickets fechados'
      })
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    // Construir URL da imagem se houver
    let imageUrl = null
    if (req.file) {
      imageUrl = `/uploads/chat-images/${req.file.filename}`
    }

    // Adicionar mensagem como staff
    await connection.query(
      `INSERT INTO chat_messages (ticket_id, user_id, message, image_url, is_staff, created_at)
       VALUES (?, ?, ?, ?, TRUE, ?)`,
      [ticket_id, admin.id, message || '', imageUrl, now]
    )

    // Atualizar status para in_progress se estiver open
    if (ticket.status === 'open') {
      await connection.query(
        'UPDATE support_tickets SET status = ?, assigned_to = ?, last_message_at = ?, updated_at = ? WHERE id = ?',
        ['in_progress', admin.id, now, now, ticket_id]
      )
    } else {
      await connection.query(
        'UPDATE support_tickets SET last_message_at = ?, updated_at = ? WHERE id = ?',
        [now, now, ticket_id]
      )
    }

    connection.release()

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    // Se houver erro de upload, deletar arquivo se foi criado
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('Erro ao deletar arquivo:', unlinkError)
      }
    }
    console.error('Erro ao enviar mensagem (admin):', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar mensagem',
      error: error.message
    })
  }
})

// ========================================
// ENDPOINTS DE VÍDEOS - PÚBLICOS
// ========================================

// Endpoint: Listar vídeos (público)
app.get('/api/videos', async (req, res) => {
  let connection
  try {
    const { category, featured, published } = req.query
    
    connection = await pool.getConnection()
    
    let query = 'SELECT * FROM videos WHERE 1=1'
    const params = []
    
    if (published !== 'false') {
      query += ' AND published = TRUE'
    }
    
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    
    if (featured === 'true') {
      query += ' AND featured = TRUE'
    }
    
    query += ' ORDER BY order_index ASC, featured DESC, created_at DESC'
    
    const [rows] = await connection.query(query, params)
    
    connection.release()
    res.json({
      success: true,
      videos: rows
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar vídeos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar vídeos',
      error: error.message
    })
  }
})

// Endpoint: Incrementar visualizações
app.post('/api/videos/:id/view', async (req, res) => {
  let connection
  try {
    const videoId = req.params.id
    
    connection = await pool.getConnection()
    
    await connection.query(
      'UPDATE videos SET views = views + 1 WHERE id = ?',
      [videoId]
    )
    
    connection.release()
    res.json({
      success: true
    })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({
      success: false,
      message: 'Erro ao incrementar visualizações',
      error: error.message
    })
  }
})

// ========================================
// ENDPOINTS DE VÍDEOS - ADMIN
// ========================================

// Endpoint: Criar vídeo (admin)
app.post('/api/admin/videos', async (req, res) => {
  let connection
  try {
    const { sessionid, title, description, video_url, thumbnail_url, category, language, duration, featured, published, order_index } = req.body
    
    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn
    
    if (!title || !video_url) {
      return res.status(400).json({
        success: false,
        message: 'Título e URL do vídeo são obrigatórios'
      })
    }
    
    const [result] = await connection.query(
      `INSERT INTO videos (title, description, video_url, thumbnail_url, category, language, duration, featured, published, order_index, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        video_url,
        thumbnail_url || null,
        category || 'tutorial',
        language || 'pt-BR',
        duration || null,
        featured || false,
        published !== false,
        order_index || 0,
        admin.id
      ]
    )
    
    connection.release()
    res.json({
      success: true,
      message: 'Vídeo criado com sucesso',
      video: {
        id: result.insertId,
        title,
        video_url
      }
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao criar vídeo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar vídeo',
      error: error.message
    })
  }
})

// Endpoint: Atualizar vídeo (admin)
app.put('/api/admin/videos/:id', async (req, res) => {
  let connection
  try {
    const videoId = req.params.id
    const { sessionid, title, description, video_url, thumbnail_url, category, language, duration, featured, published, order_index } = req.body
    
    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn
    
    // Verificar se o vídeo existe
    const [videoRows] = await connection.query(
      'SELECT id FROM videos WHERE id = ?',
      [videoId]
    )
    
    if (videoRows.length === 0) {
      connection.release()
      return res.status(404).json({
        success: false,
        message: 'Vídeo não encontrado'
      })
    }
    
    // Construir query de atualização dinamicamente
    const updates = []
    const params = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (video_url !== undefined) {
      updates.push('video_url = ?')
      params.push(video_url)
    }
    if (thumbnail_url !== undefined) {
      updates.push('thumbnail_url = ?')
      params.push(thumbnail_url)
    }
    if (category !== undefined) {
      updates.push('category = ?')
      params.push(category)
    }
    if (language !== undefined) {
      updates.push('language = ?')
      params.push(language)
    }
    if (duration !== undefined) {
      updates.push('duration = ?')
      params.push(duration)
    }
    if (featured !== undefined) {
      updates.push('featured = ?')
      params.push(featured)
    }
    if (published !== undefined) {
      updates.push('published = ?')
      params.push(published)
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?')
      params.push(order_index)
    }
    
    if (updates.length === 0) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      })
    }
    
    params.push(videoId)
    
    await connection.query(
      `UPDATE videos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    )
    
    connection.release()
    res.json({
      success: true,
      message: 'Vídeo atualizado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao atualizar vídeo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar vídeo',
      error: error.message
    })
  }
})

// Endpoint: Deletar vídeo (admin)
app.delete('/api/admin/videos/:id', async (req, res) => {
  let connection
  try {
    const videoId = req.params.id
    const { sessionid } = req.body
    
    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn
    
    // Verificar se o vídeo existe
    const [videoRows] = await connection.query(
      'SELECT id FROM videos WHERE id = ?',
      [videoId]
    )
    
    if (videoRows.length === 0) {
      connection.release()
      return res.status(404).json({
        success: false,
        message: 'Vídeo não encontrado'
      })
    }
    
    await connection.query(
      'DELETE FROM videos WHERE id = ?',
      [videoId]
    )
    
    connection.release()
    res.json({
      success: true,
      message: 'Vídeo deletado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao deletar vídeo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar vídeo',
      error: error.message
    })
  }
})

// Endpoint: Listar todos os vídeos (admin)
app.post('/api/admin/videos/list', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body
    
    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn
    
    const [rows] = await connection.query(
      'SELECT * FROM videos ORDER BY order_index ASC, created_at DESC'
    )
    
    connection.release()
    res.json({
      success: true,
      videos: rows
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar vídeos (admin):', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar vídeos',
      error: error.message
    })
  }
})

// ========================================
// ENDPOINT ADMIN: LISTAR PAGAMENTOS
// ========================================
app.post('/api/admin/payments', async (req, res) => {
  let connection
  try {
    const { sessionid, search = '', status = '', page = 1, limit = 50 } = req.body
    
    const { user: admin, connection: conn } = await verifyAdmin(sessionid)
    connection = conn
    
    let query = `
      SELECT p.*, 
             u.username, 
             u.email
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `
    const params = []
    
    if (search) {
      query += ' AND (u.username LIKE ? OR u.email LIKE ? OR p.external_reference LIKE ? OR p.payment_id LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    if (status) {
      query += ' AND p.status = ?'
      params.push(status)
    }
    
    // Contar total (sem paginação)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `
    const countParams = []
    
    if (search) {
      countQuery += ' AND (u.username LIKE ? OR u.email LIKE ? OR p.external_reference LIKE ? OR p.payment_id LIKE ?)'
      const searchPattern = `%${search}%`
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    if (status) {
      countQuery += ' AND p.status = ?'
      countParams.push(status)
    }
    
    const [countResult] = await connection.query(countQuery, countParams)
    const total = countResult[0].total
    
    // Adicionar paginação
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    const offset = (page - 1) * limit
    params.push(limit, offset)
    
    const [payments] = await connection.query(query, params)
    
    connection.release()
    res.json({
      success: true,
      payments: payments,
      total: total,
      page: page,
      limit: limit
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar pagamentos (admin):', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pagamentos',
      error: error.message
    })
  }
})

// ========================================
// ENDPOINTS DE PAGAMENTO - MERCADO PAGO
// ========================================

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')

// Inicializar Mercado Pago
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

if (!accessToken) {
  console.warn('⚠️ MERCADO_PAGO_ACCESS_TOKEN não configurado!')
}

const client = new MercadoPagoConfig({ 
  accessToken: accessToken,
  options: { timeout: 5000 }
})

const preference = new Preference(client)
const payment = new Payment(client)

console.log('✅ Mercado Pago SDK inicializado com sucesso')

// Criar preferência de pagamento
app.post('/api/payment/create-preference', async (req, res) => {
  if (!accessToken) {
    return res.status(500).json({ success: false, message: 'MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente' })
  }
  let connection
  try {
    const { sessionid, plan, period } = req.body // plan: 'tester', 'weekly', 'monthly', 'quarterly', 'annual', 'lifetime', 'test_5m'

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    if (!plan || !['tester', 'weekly', 'monthly', 'quarterly', 'annual', 'lifetime', 'test_5m'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Plano inválido. Deve ser "tester", "weekly", "monthly", "quarterly", "annual" ou "lifetime"'
      })
    }

    if (!period || !['weekly', 'monthly', 'quarterly', 'annual', 'lifetime', 'minutes5'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Período inválido. Deve ser "weekly", "monthly", "quarterly", "annual" ou "lifetime"'
      })
    }

    // Verificar sessão
    let user
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      user = { id: suUser.id, username: suUser.username, email: suUser.email }
    } else {
      connection = await pool.getConnection()
      const [userRows] = await connection.query(
        'SELECT id, username, email FROM users WHERE session_token = ?',
        [sessionid]
      )
      if (userRows.length === 0) {
        connection.release()
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      user = userRows[0]
    }

    // Definir preços
    const prices = {
      tester: { weekly: 0, monthly: 0, quarterly: 0, annual: 0, lifetime: 0 },
      weekly: { weekly: 7.90 },
      monthly: { monthly: 19.90 },
      quarterly: { quarterly: 49.90 },
      annual: { annual: 100.00 },
      lifetime: { lifetime: 399.00 },
      test_5m: { minutes5: 2.00 }
    }

    const amount = prices[plan][period] || 0
    const planNames = {
      tester: 'Teste',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      lifetime: 'Lifetime',
      test_5m: '5 Minutos'
    }
    const planName = planNames[plan] || plan
    const periodNames = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      lifetime: 'Vitalício',
      minutes5: '5 Minutos'
    }
    const periodName = periodNames[period] || period

    // Criar preferência de pagamento
    const frontendUrl = process.env.FRONTEND_URL || 'http://keyunit.online:3000'
    const apiUrl = process.env.API_URL || 'https://api.keyunit.online:3001'
    
    const preferenceData = {
      items: [
        {
          id: `${plan}-${period}-${user.id}`,
          title: `Plano ${planName} - ${periodName}`,
          description: `Upgrade para o plano ${planName} (${periodName})`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount
        }
      ],
      payer: {
        name: user.username,
        email: user.email || 'sem-email@exemplo.com'
      },
      back_urls: {
        success: `${frontendUrl}/dashboard?payment=success`,
        failure: `${frontendUrl}/dashboard?payment=failure`,
        pending: `${frontendUrl}/dashboard?payment=pending`
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12
      },
      notification_url: `${apiUrl}/api/payment/webhook`,
      statement_descriptor: `PLANO ${planName.toUpperCase()}`,
      external_reference: `user_${user.id}_${plan}_${period}_${Date.now()}`
    }

    // Criar preferência usando a API correta do SDK
    let response
    try {
      console.log('Criando preferência com dados:', JSON.stringify(preferenceData, null, 2))
      response = await preference.create({ body: preferenceData })
      console.log('Resposta do Mercado Pago recebida:', JSON.stringify(response, null, 2))
    } catch (mpError) {
      console.error('Erro do Mercado Pago:', mpError)
      console.error('Erro completo:', JSON.stringify(mpError, Object.getOwnPropertyNames(mpError), 2))
      if (mpError.cause) {
        console.error('Causa do erro:', mpError.cause)
      }
      throw new Error(`Erro ao criar preferência no Mercado Pago: ${mpError.message || JSON.stringify(mpError)}`)
    }

    // Persistir pagamento
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      if (useSupabase) {
        await db.insertPayment({
          user_id: user.id,
          plan,
          period,
          amount,
          preference_id: response.id,
          external_reference: preferenceData.external_reference,
          status: 'pending',
          created_at: now
        })
      } else {
        await connection.query(
          `INSERT INTO payments (user_id, plan, period, amount, preference_id, external_reference, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [user.id, plan, period, amount, response.id, preferenceData.external_reference, now]
        )
        connection.release()
      }
    } catch (persistErr) {
      console.error('Erro ao persistir pagamento:', persistErr.message)
    }

    // Buscar dados do PIX se disponível
    // Nota: O Mercado Pago pode retornar dados PIX na preferência ou precisar criar um pagamento PIX separado
    let pixData = null
    
    // Tentar obter dados PIX da resposta da preferência
    if (response && response.point_of_interaction && response.point_of_interaction.transaction_data) {
      const txData = response.point_of_interaction.transaction_data
      if (txData.qr_code) {
        pixData = {
          qr_code: txData.qr_code,
          qr_code_base64: txData.qr_code_base64 || null,
          ticket_url: response.init_point || response.sandbox_init_point
        }
      }
    }

    // Verificar se temos os dados necessários da resposta
    if (!response || !response.id) {
      throw new Error('Resposta inválida do Mercado Pago')
    }

    // Se não tiver dados PIX na preferência, retornar init_point para checkout
    // O usuário pode escolher PIX no checkout do Mercado Pago
    res.json({
      success: true,
      preference_id: response.id,
      init_point: response.init_point || response.sandbox_init_point,
      sandbox_init_point: response.sandbox_init_point,
      pix_data: pixData,
      external_reference: preferenceData.external_reference
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao criar preferência de pagamento:', error)
    console.error('Stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar preferência de pagamento',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Criar pagamento PIX direto (com QR Code e chave copiar/colar)
app.post('/api/payment/create-pix', async (req, res) => {
  if (!accessToken) {
    return res.status(500).json({ success: false, message: 'MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente' })
  }
  let connection
  try {
    const { sessionid, plan, period } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    if (!plan || !['tester', 'weekly', 'monthly', 'quarterly', 'annual', 'lifetime', 'test_5m'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Plano inválido. Deve ser "tester", "weekly", "monthly", "quarterly", "annual" ou "lifetime"'
      })
    }

    if (!period || !['weekly', 'monthly', 'quarterly', 'annual', 'lifetime', 'minutes5'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Período inválido. Deve ser "weekly", "monthly", "quarterly", "annual" ou "lifetime"'
      })
    }

    // Verificar sessão
    let user
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      user = { id: suUser.id, username: suUser.username, email: suUser.email }
    } else {
      connection = await pool.getConnection()
      const [userRows] = await connection.query(
        'SELECT id, username, email FROM users WHERE session_token = ?',
        [sessionid]
      )
      if (userRows.length === 0) {
        connection.release()
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      user = userRows[0]
    }

    // Definir preços
    const prices = {
      tester: { weekly: 0, monthly: 0, quarterly: 0, annual: 0, lifetime: 0 },
      weekly: { weekly: 7.90 },
      monthly: { monthly: 19.90 },
      quarterly: { quarterly: 49.90 },
      annual: { annual: 100.00 },
      lifetime: { lifetime: 399.00 },
      test_5m: { minutes5: 2.00 }
    }

    const amount = prices[plan][period] || 0
    const planNames = {
      tester: 'Teste',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      lifetime: 'Lifetime',
      test_5m: '5 Minutos'
    }
    const planName = planNames[plan] || plan
    const periodNames = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      lifetime: 'Vitalício',
      minutes5: '5 Minutos'
    }
    const periodName = periodNames[period] || period
    const externalRef = `user_${user.id}_${plan}_${period}_${Date.now()}`

    // Criar pagamento PIX direto
    const paymentData = {
      transaction_amount: amount,
      description: `Plano ${planName} - ${periodName}`,
      payment_method_id: 'pix',
      payer: {
        email: user.email || 'sem-email@exemplo.com',
        first_name: user.username.split(' ')[0] || user.username,
        last_name: user.username.split(' ').slice(1).join(' ') || ''
      },
      external_reference: externalRef
    }
    
    // Adicionar notification_url apenas se for uma URL HTTP/HTTPS válida (não localhost)
    const apiUrl = process.env.API_URL || 'https://api.keyunit.online:3001'
    if ((apiUrl.startsWith('https://') || apiUrl.startsWith('http://')) && !apiUrl.includes('localhost')) {
      paymentData.notification_url = `${apiUrl}/api/payment/webhook`
    }

    console.log('Criando pagamento PIX com dados:', JSON.stringify(paymentData, null, 2))

    let pixPayment
    try {
      pixPayment = await payment.create({ body: paymentData })
      console.log('Pagamento PIX criado:', JSON.stringify(pixPayment, null, 2))
    } catch (mpError) {
      console.error('Erro do Mercado Pago ao criar PIX:', mpError)
      throw new Error(`Erro ao criar pagamento PIX: ${mpError.message || JSON.stringify(mpError)}`)
    }

    // Extrair dados PIX da resposta
    let pixQrCode = null
    let pixCode = null

    if (pixPayment && pixPayment.point_of_interaction && pixPayment.point_of_interaction.transaction_data) {
      const txData = pixPayment.point_of_interaction.transaction_data
      pixCode = txData.qr_code || null
      pixQrCode = txData.qr_code_base64 || null
    }

    if (!pixCode || !pixQrCode) {
      return res.status(500).json({ success: false, message: 'Erro ao gerar QR Code PIX. Tente novamente.' })
    }

    // Persistir pagamento (não bloquear resposta)
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      if (useSupabase) {
        await db.insertPayment({
          user_id: user.id,
          plan,
          period,
          amount,
          payment_id: pixPayment.id ? String(pixPayment.id) : null,
          external_reference: externalRef,
          status: pixPayment.status || 'pending',
          created_at: now
        })
      } else {
        await connection.query(
          `INSERT INTO payments (user_id, plan, period, amount, payment_id, external_reference, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, plan, period, amount, pixPayment.id ? String(pixPayment.id) : null, externalRef, pixPayment.status || 'pending', now]
        )
        connection.release()
      }
    } catch (persistErr) {
      console.error('Erro ao persistir pagamento PIX:', persistErr.message)
    }

    console.log('✅ Pagamento PIX criado com sucesso:', {
      payment_id: pixPayment.id,
      external_reference: externalRef,
      status: pixPayment.status
    })

    res.json({
      success: true,
      payment_id: String(pixPayment.id), // Garantir que é string
      qr_code: pixCode,
      qr_code_base64: pixQrCode,
      external_reference: externalRef,
      status: pixPayment.status || 'pending'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao criar pagamento PIX:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar pagamento PIX',
      error: error.message
    })
  }
})

// Webhook do Mercado Pago
app.post('/api/payment/webhook', async (req, res) => {
  let connection
  try {
    const { type, data } = req.body

    if (type === 'payment') {
      const paymentId = data.id

      // Buscar informações do pagamento
      const paymentInfo = await payment.get({ id: paymentId })

      if (!paymentInfo || !paymentInfo.external_reference) {
        return res.status(400).json({ success: false, message: 'Referência externa não encontrada' })
      }

      const externalRef = paymentInfo.external_reference
      const status = paymentInfo.status // 'approved', 'pending', 'rejected', etc.

      let paymentRecord
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      if (useSupabase) {
        paymentRecord = await db.findPaymentByExternalReference(externalRef)
        if (!paymentRecord) {
          return res.status(404).json({ success: false, message: 'Pagamento não encontrado' })
        }
        await db.updatePaymentByExternalReference(externalRef, { status, payment_id: String(paymentId), updated_at: now })
      } else {
        connection = await pool.getConnection()
        const [paymentRows] = await connection.query('SELECT * FROM payments WHERE external_reference = ?', [externalRef])
        if (paymentRows.length === 0) {
          connection.release()
          return res.status(404).json({ success: false, message: 'Pagamento não encontrado' })
        }
        paymentRecord = paymentRows[0]
        await connection.query(
          `UPDATE payments 
           SET status = ?, payment_id = ?, updated_at = ? 
           WHERE external_reference = ?`,
          [status, paymentId, now, externalRef]
        )
      }

      // Se pagamento aprovado, atualizar plano do usuário
      if (status === 'approved') {
        const expiryDate = new Date()
        if (paymentRecord.period === 'weekly') {
          expiryDate.setDate(expiryDate.getDate() + 7)
        } else if (paymentRecord.period === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1)
        } else if (paymentRecord.period === 'quarterly') {
          expiryDate.setMonth(expiryDate.getMonth() + 3)
        } else if (paymentRecord.period === 'annual') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1)
        } else if (paymentRecord.period === 'lifetime') {
          
        } else if (paymentRecord.period === 'minutes5') {
          expiryDate.setMinutes(expiryDate.getMinutes() + 5)
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1)
        }

        const expiryDateStr = expiryDate.toISOString().slice(0, 19).replace('T', ' ')

        console.log(`🔄 Atualizando plano do usuário ${paymentRecord.user_id} para ${paymentRecord.plan}`)
        try {
          if (useSupabase) {
            await db.updateUserFields(paymentRecord.user_id, { plan: paymentRecord.plan, plan_expires_at: paymentRecord.period === 'lifetime' ? null : expiryDateStr })
          } else {
            if (paymentRecord.period === 'lifetime') {
              await connection.query(
                `UPDATE users 
                 SET plan = ?, plan_expires_at = NULL 
                 WHERE id = ?`,
                [paymentRecord.plan, paymentRecord.user_id]
              )
            } else {
              await connection.query(
                `UPDATE users 
                 SET plan = ?, plan_expires_at = ? 
                 WHERE id = ?`,
                [paymentRecord.plan, expiryDateStr, paymentRecord.user_id]
              )
            }
          }
          console.log(`✅ Plano atualizado com sucesso para usuário ${paymentRecord.user_id}`)
        } catch (error) {
          console.error(`❌ Erro ao atualizar plano do usuário ${paymentRecord.user_id}:`, error.message)
          if (!useSupabase) {
            try {
              await connection.query('UPDATE users SET plan = ? WHERE id = ?', [paymentRecord.plan, paymentRecord.user_id])
              console.log(`✅ Plano atualizado (sem plan_expires_at) para usuário ${paymentRecord.user_id}`)
            } catch (error2) {
              console.error(`❌ Erro ao atualizar plano (sem plan_expires_at):`, error2.message)
            }
          }
        }
      }

      if (connection) connection.release()
    }

    res.status(200).json({ success: true })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro no webhook do Mercado Pago:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar webhook'
    })
  }
})

// Verificar status do pagamento
app.post('/api/payment/check-status', async (req, res) => {
  let connection
  try {
    const { sessionid, external_reference, payment_id } = req.body

    console.log('🔍 Verificando status do pagamento:', {
      external_reference,
      payment_id,
      has_sessionid: !!sessionid
    })

    if (!sessionid || (!external_reference && !payment_id)) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e external_reference ou payment_id são obrigatórios'
      })
    }

    let userId
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      userId = suUser.id
    } else {
      connection = await pool.getConnection()
      const [userRows] = await connection.query('SELECT id FROM users WHERE session_token = ?', [sessionid])
      if (userRows.length === 0) {
        connection.release()
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      userId = userRows[0].id
    }

    // Buscar pagamento por external_reference ou payment_id
    let paymentRecord
    if (useSupabase) {
      if (external_reference) {
        const rec = await db.findPaymentByExternalReference(external_reference)
        if (rec && rec.user_id === userId) paymentRecord = rec
      }
      // Se não encontrou por referência externa, não tem busca por payment_id no Supabase SDK aqui
    } else {
      let paymentRows
      if (external_reference && payment_id) {
        [paymentRows] = await connection.query(
          'SELECT * FROM payments WHERE (external_reference = ? OR payment_id = ?) AND user_id = ?',
          [external_reference, String(payment_id), userId]
        )
        console.log('🔍 Busca com ambos os campos:', { external_reference, payment_id: String(payment_id), found: paymentRows.length })
      } else if (external_reference) {
        [paymentRows] = await connection.query('SELECT * FROM payments WHERE external_reference = ? AND user_id = ?', [external_reference, userId])
        console.log('🔍 Busca por external_reference:', { external_reference, found: paymentRows.length })
      } else if (payment_id) {
        [paymentRows] = await connection.query('SELECT * FROM payments WHERE payment_id = ? AND user_id = ?', [String(payment_id), userId])
        console.log('🔍 Busca por payment_id:', { payment_id: String(payment_id), found: paymentRows.length })
      }
      connection.release()
      if (paymentRows && paymentRows.length > 0) paymentRecord = paymentRows[0]
    }

    if (!paymentRecord) {
      console.error('❌ Pagamento não encontrado:', {
        external_reference,
        payment_id,
        user_id: userId
      })
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado',
        debug: process.env.NODE_ENV === 'development' ? {
          external_reference,
          payment_id,
          user_id: userId
        } : undefined
      })
    }

    // paymentRecord obtido

    // Se tiver payment_id, buscar status atualizado do Mercado Pago
    let currentStatus = paymentRecord.status
    if (paymentRecord.payment_id) {
      try {
        const paymentInfo = await payment.get({ id: paymentRecord.payment_id })
        currentStatus = paymentInfo.status

        // Atualizar status no banco se mudou
        if (currentStatus !== paymentRecord.status) {
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
          if (useSupabase) {
            await db.updatePaymentByExternalReference(paymentRecord.external_reference, { status: currentStatus, updated_at: now })
          } else {
            connection = await pool.getConnection()
            await connection.query('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', [currentStatus, now, paymentRecord.id])
            connection.release()
          }

          // Se aprovado, atualizar plano do usuário
          if (currentStatus === 'approved') {
            const expiryDate = new Date()
            if (paymentRecord.period === 'weekly') {
              expiryDate.setDate(expiryDate.getDate() + 7)
            } else if (paymentRecord.period === 'monthly') {
              expiryDate.setMonth(expiryDate.getMonth() + 1)
            } else if (paymentRecord.period === 'quarterly') {
              expiryDate.setMonth(expiryDate.getMonth() + 3)
            } else if (paymentRecord.period === 'annual') {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1)
            } else if (paymentRecord.period === 'lifetime') {
            } else {
              if (paymentRecord.period === 'minutes5') {
                expiryDate.setMinutes(expiryDate.getMinutes() + 5)
              } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1)
              }
            }
            const expiryDateStr = expiryDate.toISOString().slice(0, 19).replace('T', ' ')

            console.log(`🔄 Atualizando plano do usuário ${paymentRecord.user_id} para ${paymentRecord.plan} (check-status)`)
            try {
              if (useSupabase) {
                await db.updateUserFields(paymentRecord.user_id, { plan: paymentRecord.plan, plan_expires_at: paymentRecord.period === 'lifetime' ? null : expiryDateStr })
              } else {
                connection = await pool.getConnection()
                if (paymentRecord.period === 'lifetime') {
                  await connection.query(`UPDATE users SET plan = ?, plan_expires_at = NULL WHERE id = ?`, [paymentRecord.plan, paymentRecord.user_id])
                } else {
                  await connection.query(`UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?`, [paymentRecord.plan, expiryDateStr, paymentRecord.user_id])
                }
                connection.release()
              }
              console.log(`✅ Plano atualizado com sucesso para usuário ${paymentRecord.user_id} (check-status)`)
              
              // Verificar se foi atualizado corretamente
              const [verifyRows] = await connection.query(
                'SELECT plan, plan_expires_at FROM users WHERE id = ?',
                [paymentRecord.user_id]
              )
              if (verifyRows.length > 0) {
                console.log(`✅ Verificação: usuário ${paymentRecord.user_id} agora tem plano ${verifyRows[0].plan} (check-status)`)
              }
            } catch (error) {
              console.error(`❌ Erro ao atualizar plano do usuário ${paymentRecord.user_id}:`, error.message)
              // Tentar sem plan_expires_at se a coluna não existir
              try {
                await connection.query(
                  `UPDATE users SET plan = ? WHERE id = ?`,
                  [paymentRecord.plan, paymentRecord.user_id]
                )
                console.log(`✅ Plano atualizado (sem plan_expires_at) para usuário ${paymentRecord.user_id} (check-status)`)
              } catch (error2) {
                console.error(`❌ Erro ao atualizar plano (sem plan_expires_at):`, error2.message)
              }
            }
          }
          connection.release()
        }
      } catch (error) {
        console.error('Erro ao buscar status do pagamento:', error)
      }
    }

    res.json({
      success: true,
      status: currentStatus,
      plan: paymentRecord.plan,
      period: paymentRecord.period,
      amount: paymentRecord.amount
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao verificar status do pagamento:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao verificar status do pagamento'
    })
  }
})

app.post('/api/test-plan-5m/activate', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body
    if (!sessionid) {
      return res.status(401).json({ success: false, message: 'Sessão inválida' })
    }
    if (useSupabase) {
      const suUser = await db.getUserBySessionToken(sessionid)
      if (!suUser) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' })
      }
      const expiryDateStr = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      await db.updateUserFields(suUser.id, { plan: 'test_5m', plan_expires_at: expiryDateStr })
      return res.json({ success: true, message: 'Plano teste 5min ativado', plan: 'test_5m', expiresAt: expiryDateStr })
    }
    connection = await pool.getConnection()
    const [userRows] = await connection.query('SELECT * FROM users WHERE session_token = ?', [sessionid])
    if (userRows.length === 0) {
      connection.release()
      return res.status(401).json({ success: false, message: 'Sessão inválida' })
    }
    const user = userRows[0]
    const expiryDateStr = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    await connection.query('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?', ['test_5m', expiryDateStr, user.id])
    connection.release()
    res.json({ success: true, message: 'Plano teste 5min ativado', plan: 'test_5m', expiresAt: expiryDateStr })
  } catch (error) {
    if (connection) connection.release()
    res.status(500).json({ success: false, message: error.message || 'Erro ao ativar plano teste' })
  }
})

// ========================================
// ENDPOINTS DISCORD OAUTH
// ========================================

// Endpoint: Obter URL de OAuth do Discord
app.get('/api/discord/oauth-url', async (req, res) => {
  try {
    const { clientId, redirectUri } = config.discord

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'Discord OAuth não configurado. Configure DISCORD_CLIENT_ID no arquivo .env'
      })
    }

    // Gerar state para segurança
    const state = crypto.randomBytes(32).toString('hex')
    
    // URL de OAuth do Discord
    const scope = 'identify email'
    const discordOAuthUrl = `${config.discord.oauthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`

    res.json({
      success: true,
      url: discordOAuthUrl,
      state: state
    })
  } catch (error) {
    console.error('Erro ao gerar URL OAuth Discord:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar URL de autenticação Discord'
    })
  }
})

// Endpoint GET: Callback do Discord OAuth (redirecionamento do Discord)
app.get('/api/discord/callback', async (req, res) => {
  let connection
  try {
    console.log('🔵 [Discord Callback] Recebido callback do Discord')
    console.log('🔵 [Discord Callback] Frontend URL configurado:', config.discord.frontendUrl)
    console.log('🔵 [Discord Callback] Query params:', req.query)
    
    const { code, error } = req.query

    // Se houver erro, redirecionar para frontend com erro
    if (error) {
      console.error('❌ [Discord Callback] Erro recebido do Discord:', error)
      const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent(error)}`
      console.log('🔵 [Discord Callback] Redirecionando para:', redirectUrl)
      return res.redirect(redirectUrl)
    }

    if (!code) {
      console.error('❌ [Discord Callback] Código de autorização não fornecido')
      const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent('Código de autorização não fornecido')}`
      console.log('🔵 [Discord Callback] Redirecionando para:', redirectUrl)
      return res.redirect(redirectUrl)
    }

    console.log('✅ [Discord Callback] Código recebido, trocando por token...')

    // Verificar se Discord está configurado
    if (!config.discord.clientId || !config.discord.clientSecret) {
      console.error('❌ [Discord Callback] Discord OAuth não configurado')
      const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent('Discord OAuth não configurado no servidor')}`
      console.log('🔵 [Discord Callback] Redirecionando para:', redirectUrl)
      return res.redirect(redirectUrl)
    }

    // Trocar código por token de acesso
    const tokenResponse = await fetch(config.discord.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.discord.redirectUri,
        scope: 'identify email'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('❌ [Discord Callback] Erro ao trocar código por token:', errorData)
      
      // Tratamento especial para rate limit
      let errorMessage = errorData.error_description || errorData.error || 'Erro ao autenticar com Discord'
      if (errorData.error === 'rate_limit' || errorMessage.includes('rate limit')) {
        errorMessage = 'Muitas tentativas de login. Por favor, aguarde alguns minutos e tente novamente.'
      }
      
      const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent(errorMessage)}`
      console.log('🔵 [Discord Callback] Redirecionando para (erro de token):', redirectUrl)
      return res.redirect(redirectUrl)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('❌ [Discord Callback] Token de acesso não recebido')
      const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent('Token de acesso não recebido do Discord')}`
      console.log('🔵 [Discord Callback] Redirecionando para:', redirectUrl)
      return res.redirect(redirectUrl)
    }

    console.log('✅ [Discord Callback] Token recebido, buscando informações do usuário...')

    // Buscar informações do usuário no Discord
    const userResponse = await fetch(config.discord.apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!userResponse.ok) {
      console.error('❌ [Discord Callback] Erro ao buscar informações do usuário')
      const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent('Erro ao buscar informações do usuário no Discord')}`
      console.log('🔵 [Discord Callback] Redirecionando para:', redirectUrl)
      return res.redirect(redirectUrl)
    }

    const discordUser = await userResponse.json()
    console.log('✅ [Discord Callback] Informações do usuário recebidas:', {
      id: discordUser.id,
      username: discordUser.username,
      email: discordUser.email ? '***' : 'não fornecido'
    })

    // Verificar se usuário já existe (por Discord ID ou email)
    connection = await pool.getConnection()

    // Primeiro, verificar se já existe usuário com este Discord ID (se tivermos a coluna)
    // Por enquanto, vamos verificar por email ou username baseado no Discord username
    const discordUsername = discordUser.username
    const discordEmail = discordUser.email
    const discordId = discordUser.id

    // Tentar encontrar usuário existente
    let existingUser = null

    if (discordEmail) {
      const [emailRows] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [discordEmail]
      )
      if (emailRows.length > 0) {
        existingUser = emailRows[0]
      }
    }

    // Se não encontrou por email, tentar por username
    if (!existingUser) {
      const [usernameRows] = await connection.query(
        'SELECT * FROM users WHERE username = ?',
        [discordUsername]
      )
      if (usernameRows.length > 0) {
        existingUser = usernameRows[0]
      }
    }

    // Se usuário existe, fazer login
    if (existingUser) {
      const sessionToken = generateSessionToken()
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      
      // Atualizar email se não tinha
      if (discordEmail && !existingUser.email) {
        await connection.query(
          'UPDATE users SET email = ?, session_token = ?, last_login = ? WHERE id = ?',
          [discordEmail, sessionToken, now, existingUser.id]
        )
      } else {
        await connection.query(
          'UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
          [sessionToken, now, existingUser.id]
        )
      }

      connection.release()

      // Redirecionar para frontend com sucesso
      const redirectUrl = `${config.discord.frontendUrl}?discord_success=true&sessionid=${sessionToken}&username=${encodeURIComponent(existingUser.username)}&isNewUser=false`
      console.log('✅ [Discord Callback] Login bem-sucedido, redirecionando para:', redirectUrl)
      return res.redirect(redirectUrl)
    }

    console.log('📝 [Discord Callback] Usuário não existe, criando nova conta...')

    // Se usuário não existe, criar novo usuário
    const sessionToken = generateSessionToken()
    const expiresDate = new Date(Date.now() + config.subscriptionDefaultDays * 24 * 60 * 60 * 1000)
    const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    // Gerar senha aleatória (usuário pode mudar depois)
    const randomPassword = crypto.randomBytes(16).toString('hex')
    const passwordHash = generateHash(randomPassword)

    // Usar avatar do Discord se disponível
    const avatarUrl = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
      : null

    await connection.query(
      `INSERT INTO users (username, email, password_hash, subscription, expires, session_token, created_at, last_login, verified, profile_picture_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [discordUsername, discordEmail || null, passwordHash, 'standard', expiresStr, sessionToken, nowStr, nowStr, 1, avatarUrl]
    )

    connection.release()

    // Redirecionar para frontend com sucesso
    const redirectUrl = `${config.discord.frontendUrl}?discord_success=true&sessionid=${sessionToken}&username=${encodeURIComponent(discordUsername)}&isNewUser=true`
    console.log('✅ [Discord Callback] Conta criada com sucesso, redirecionando para:', redirectUrl)
    return res.redirect(redirectUrl)
  } catch (error) {
    if (connection) connection.release()
    console.error('❌ [Discord Callback] Erro no callback Discord:', error)
    const redirectUrl = `${config.discord.frontendUrl}?discord_error=${encodeURIComponent('Erro ao processar autenticação Discord: ' + error.message)}`
    console.log('🔵 [Discord Callback] Redirecionando para (erro):', redirectUrl)
    return res.redirect(redirectUrl)
  }
})

// Endpoint POST: Callback do Discord OAuth (trocar código por token) - mantido para compatibilidade
app.post('/api/discord/callback', async (req, res) => {
  let connection
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código de autorização não fornecido'
      })
    }

    // Verificar se Discord está configurado
    if (!config.discord.clientId || !config.discord.clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'Discord OAuth não configurado. Configure DISCORD_CLIENT_ID e DISCORD_CLIENT_SECRET no arquivo .env'
      })
    }

    // Trocar código por token de acesso
    const tokenResponse = await fetch(config.discord.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.discord.redirectUri,
        scope: 'identify email'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Erro ao trocar código por token:', errorData)
      return res.status(400).json({
        success: false,
        message: 'Erro ao autenticar com Discord: ' + (errorData.error_description || errorData.error || 'Erro desconhecido')
      })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Token de acesso não recebido do Discord'
      })
    }

    // Buscar informações do usuário no Discord
    const userResponse = await fetch(config.discord.apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!userResponse.ok) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao buscar informações do usuário no Discord'
      })
    }

    const discordUser = await userResponse.json()

    // Verificar se usuário já existe (por Discord ID ou email)
    connection = await pool.getConnection()

    // Primeiro, verificar se já existe usuário com este Discord ID (se tivermos a coluna)
    // Por enquanto, vamos verificar por email ou username baseado no Discord username
    const discordUsername = discordUser.username
    const discordEmail = discordUser.email
    const discordId = discordUser.id

    // Tentar encontrar usuário existente
    let existingUser = null

    if (discordEmail) {
      const [emailRows] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [discordEmail]
      )
      if (emailRows.length > 0) {
        existingUser = emailRows[0]
      }
    }

    // Se não encontrou por email, tentar por username
    if (!existingUser) {
      const [usernameRows] = await connection.query(
        'SELECT * FROM users WHERE username = ?',
        [discordUsername]
      )
      if (usernameRows.length > 0) {
        existingUser = usernameRows[0]
      }
    }

    // Se usuário existe, fazer login
    if (existingUser) {
      const sessionToken = generateSessionToken()
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      
      // Atualizar email se não tinha
      if (discordEmail && !existingUser.email) {
        await connection.query(
          'UPDATE users SET email = ?, session_token = ?, last_login = ? WHERE id = ?',
          [discordEmail, sessionToken, now, existingUser.id]
        )
      } else {
        await connection.query(
          'UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
          [sessionToken, now, existingUser.id]
        )
      }

      connection.release()

      return res.json({
        success: true,
        message: 'Login realizado com sucesso via Discord!',
        info: {
          username: existingUser.username,
          email: discordEmail || existingUser.email,
          sessionid: sessionToken
        },
        isNewUser: false
      })
    }

    // Se usuário não existe, criar novo usuário
    const sessionToken = generateSessionToken()
    const expiresDate = new Date(Date.now() + config.subscriptionDefaultDays * 24 * 60 * 60 * 1000)
    const expiresStr = expiresDate.toISOString().slice(0, 19).replace('T', ' ')
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    // Gerar senha aleatória (usuário pode mudar depois)
    const randomPassword = crypto.randomBytes(16).toString('hex')
    const passwordHash = generateHash(randomPassword)

    // Usar avatar do Discord se disponível
    const avatarUrl = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
      : null

    await connection.query(
      `INSERT INTO users (username, email, password_hash, subscription, expires, session_token, created_at, last_login, verified, profile_picture_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [discordUsername, discordEmail || null, passwordHash, 'standard', expiresStr, sessionToken, nowStr, nowStr, 1, avatarUrl]
    )

    connection.release()

    res.json({
      success: true,
      message: 'Conta criada com sucesso via Discord!',
      info: {
        username: discordUsername,
        email: discordEmail || null,
        sessionid: sessionToken
      },
      isNewUser: true
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro no callback Discord:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao processar autenticação Discord: ' + error.message
    })
  }
})

// Endpoint: Login/Registro direto com código Discord (para uso direto do frontend)
app.post('/api/discord/auth', async (req, res) => {
  // Este endpoint funciona da mesma forma que o callback
  // Chama a mesma lógica do callback
  const callbackRoute = app._router.stack.find(layer => layer.route && layer.route.path === '/api/discord/callback')
  if (callbackRoute) {
    return callbackRoute.route.stack[0].handle(req, res)
  }
  return res.status(500).json({ success: false, message: 'Endpoint não encontrado' })
})

// ========================================
// ENDPOINTS DE WEBHOOKS
// ========================================

// Função auxiliar para verificar se o usuário tem acesso ao app
const verifyAppAccess = async (sessionid, appId) => {
  if (useSupabase && supabase) {
    const user = await db.getUserBySessionToken(sessionid)
    if (!user) throw new Error('Sessão inválida')
    const app = await db.getApplicationByIdForUser(appId, user.id)
    if (!app) throw new Error('Aplicação não encontrada ou sem permissão')
    return { user, app, connection: null }
  }
  const connection = await pool.getConnection()
  try {
    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE session_token = ?',
      [sessionid]
    )
    if (userRows.length === 0) {
      throw new Error('Sessão inválida')
    }
    const user = userRows[0]
    const [appRows] = await connection.query(
      'SELECT id, user_id FROM applications WHERE id = ? AND user_id = ?',
      [appId, user.id]
    )
    if (appRows.length === 0) {
      throw new Error('Aplicação não encontrada ou sem permissão')
    }
    return { user, app: appRows[0], connection }
  } catch (error) {
    connection.release()
    throw error
  }
}

// URLs da logo e banner profissional
const DISCORD_LOGO_URL = 'https://i.pinimg.com/736x/cd/53/98/cd53980b72e28261f04417c219d7651e.jpg'
const DISCORD_BANNER_URL = 'https://i.pinimg.com/736x/fc/a7/d0/fca7d05fa90505c62a338889cd934739.jpg'

// Função auxiliar para formatar mensagem do Discord com logo e banner profissional
const formatDiscordMessage = (options = {}) => {
  const {
    content = '',
    title = '',
    description = '',
    color = 0x5865F2, // Azul Discord padrão
    fields = [],
    thumbnail = null,
    customImage = null
  } = options

  const now = new Date()
  
  const embed = {
    color: color,
    timestamp: now.toISOString(),
    image: {
      url: customImage || DISCORD_BANNER_URL
    },
    footer: {
      text: 'KeyUnit Platform',
      icon_url: DISCORD_LOGO_URL
    }
  }

  if (title) {
    embed.title = title
  }

  if (description) {
    embed.description = description
  }

  if (fields && fields.length > 0) {
    embed.fields = fields
  }

  if (thumbnail) {
    embed.thumbnail = { url: thumbnail }
  }

  const message = {
    username: 'KeyUnit Platform',
    avatar_url: DISCORD_LOGO_URL,
    embeds: [embed]
  }

  if (content) {
    message.content = content
  }

  return message
}

// Função auxiliar para enviar webhook para Discord
const sendDiscordWebhook = async (webhookUrl, data) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KeyUnit-Webhook/1.0'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Discord webhook error: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  } catch (error) {
    throw new Error(`Erro ao enviar webhook para Discord: ${error.message}`)
  }
}

// Endpoint: Listar webhooks
app.post('/api/webhooks/list', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body
    
    if (!sessionid || !appId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e App ID são obrigatórios'
      })
    }
    
    if (useSupabase && supabase) {
      await verifyAppAccess(sessionid, appId)
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return res.json({ success: true, webhooks: data || [] })
    }
    const { connection: conn } = await verifyAppAccess(sessionid, appId)
    connection = conn
    const [webhooks] = await connection.query(
      'SELECT * FROM webhooks WHERE app_id = ? ORDER BY created_at DESC',
      [appId]
    )
    connection.release()
    res.json({ success: true, webhooks: webhooks })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar webhooks:', error)
    res.status(401).json({
      success: false,
      message: error.message || 'Erro ao listar webhooks'
    })
  }
})

// Endpoint: Criar webhook
app.post('/api/webhooks/create', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, endpoint, userAgent } = req.body
    
    if (!sessionid || !appId || !endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, App ID e Endpoint são obrigatórios'
      })
    }
    
    // Validar URL do Discord
    if (!endpoint.startsWith('https://discord.com/api/webhooks/') && 
        !endpoint.startsWith('https://discordapp.com/api/webhooks/')) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint deve ser uma URL de webhook do Discord'
      })
    }
    
    if (useSupabase && supabase) {
      const { user } = await verifyAppAccess(sessionid, appId)
      const userPlan = user.plan || 'tester'
      const webhookLimitCheck = await checkWebhookLimit(null, appId, userPlan)
      if (!webhookLimitCheck.allowed) {
        return res.status(403).json({ success: false, message: webhookLimitCheck.message, limit: webhookLimitCheck.limit, current: webhookLimitCheck.current })
      }
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('webhooks')
        .insert({ app_id: appId, endpoint, user_agent: userAgent || 'KeyUnit-Webhook/1.0', authenticated: false, created_at: nowIso })
        .select('*')
        .limit(1)
      if (error) throw new Error(error.message)
      return res.json({ success: true, webhook: data && data[0], message: 'Webhook criado com sucesso' })
    }
    const { connection: conn, user } = await verifyAppAccess(sessionid, appId)
    connection = conn
    const userPlan = await getUserPlan(connection, user.id)
    const webhookLimitCheck = await checkWebhookLimit(connection, appId, userPlan)
    if (!webhookLimitCheck.allowed) {
      connection.release()
      return res.status(403).json({ success: false, message: webhookLimitCheck.message, limit: webhookLimitCheck.limit, current: webhookLimitCheck.current })
    }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const [result] = await connection.query(
      'INSERT INTO webhooks (app_id, endpoint, user_agent, authenticated, created_at) VALUES (?, ?, ?, ?, ?)',
      [appId, endpoint, userAgent || 'KeyUnit-Webhook/1.0', false, now]
    )
    const [webhooks] = await connection.query(
      'SELECT * FROM webhooks WHERE id = ?',
      [result.insertId]
    )
    connection.release()
    res.json({ success: true, webhook: webhooks[0], message: 'Webhook criado com sucesso' })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao criar webhook:', error)
    res.status(401).json({
      success: false,
      message: error.message || 'Erro ao criar webhook'
    })
  }
})

// Endpoint: Deletar webhook
app.post('/api/webhooks/delete', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, webhookId } = req.body
    
    if (!sessionid || !appId || !webhookId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, App ID e Webhook ID são obrigatórios'
      })
    }
    
    if (useSupabase && supabase) {
      await verifyAppAccess(sessionid, appId)
      const { data: exists, error: existErr } = await supabase
        .from('webhooks')
        .select('id')
        .eq('id', webhookId)
        .eq('app_id', appId)
        .limit(1)
      if (existErr) throw new Error(existErr.message)
      if (!exists || exists.length === 0) {
        return res.status(404).json({ success: false, message: 'Webhook não encontrado' })
      }
      const { error: delErr } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('app_id', appId)
      if (delErr) throw new Error(delErr.message)
      return res.json({ success: true, message: 'Webhook deletado com sucesso' })
    }
    const { connection: conn } = await verifyAppAccess(sessionid, appId)
    connection = conn
    const [webhookRows] = await connection.query(
      'SELECT id FROM webhooks WHERE id = ? AND app_id = ?',
      [webhookId, appId]
    )
    if (webhookRows.length === 0) {
      connection.release()
      return res.status(404).json({ success: false, message: 'Webhook não encontrado' })
    }
    await connection.query(
      'DELETE FROM webhooks WHERE id = ? AND app_id = ?',
      [webhookId, appId]
    )
    connection.release()
    res.json({ success: true, message: 'Webhook deletado com sucesso' })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao deletar webhook:', error)
    res.status(401).json({
      success: false,
      message: error.message || 'Erro ao deletar webhook'
    })
  }
})

// Endpoint: Deletar todos os webhooks
app.post('/api/webhooks/delete-all', async (req, res) => {
  let connection
  try {
    const { sessionid, appId } = req.body
    
    if (!sessionid || !appId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e App ID são obrigatórios'
      })
    }
    
    if (useSupabase && supabase) {
      await verifyAppAccess(sessionid, appId)
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('app_id', appId)
      if (error) throw new Error(error.message)
      return res.json({ success: true, message: 'Webhooks deletados com sucesso' })
    }
    const { connection: conn } = await verifyAppAccess(sessionid, appId)
    connection = conn
    const [result] = await connection.query(
      'DELETE FROM webhooks WHERE app_id = ?',
      [appId]
    )
    connection.release()
    res.json({ success: true, message: `${result.affectedRows} webhook(s) deletado(s) com sucesso`, deletedCount: result.affectedRows })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao deletar webhooks:', error)
    res.status(401).json({
      success: false,
      message: error.message || 'Erro ao deletar webhooks'
    })
  }
})

// Endpoint: Testar webhook (enviar para Discord)
app.post('/api/webhooks/test', async (req, res) => {
  let connection
  try {
    const { sessionid, appId, webhookId, testMessage } = req.body
    
    if (!sessionid || !appId || !webhookId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, App ID e Webhook ID são obrigatórios'
      })
    }
    
    if (useSupabase && supabase) {
      await verifyAppAccess(sessionid, appId)
      const { data: webhookRows, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('app_id', appId)
        .limit(1)
      if (error) throw new Error(error.message)
      if (!webhookRows || webhookRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Webhook não encontrado' })
      }
      const webhook = webhookRows[0]
      const discordMessage = formatDiscordMessage({
        content: testMessage || 'Teste de webhook do KeyUnit',
        title: '🔔 Teste de Webhook',
        description: testMessage || 'Esta é uma mensagem de teste do sistema KeyUnit',
        color: 0x5865F2
      })
      await sendDiscordWebhook(webhook.endpoint, discordMessage)
      const nowIso = new Date().toISOString()
      await supabase
        .from('webhooks')
        .update({ last_triggered_at: nowIso })
        .eq('id', webhookId)
        .eq('app_id', appId)
      return res.json({ success: true, message: 'Webhook testado e enviado com sucesso para o Discord' })
    }
    const { connection: conn } = await verifyAppAccess(sessionid, appId)
    connection = conn
    const [webhookRows] = await connection.query(
      'SELECT * FROM webhooks WHERE id = ? AND app_id = ?',
      [webhookId, appId]
    )
    if (webhookRows.length === 0) {
      connection.release()
      return res.status(404).json({ success: false, message: 'Webhook não encontrado' })
    }
    const webhook = webhookRows[0]
    const discordMessage = formatDiscordMessage({
      content: testMessage || 'Teste de webhook do KeyUnit',
      title: '🔔 Teste de Webhook',
      description: testMessage || 'Esta é uma mensagem de teste do sistema KeyUnit',
      color: 0x5865F2
    })
    try {
      await sendDiscordWebhook(webhook.endpoint, discordMessage)
      const now = new Date()
      const nowStr = now.toISOString().slice(0, 19).replace('T', ' ')
      await connection.query(
        'UPDATE webhooks SET last_triggered_at = ? WHERE id = ?',
        [nowStr, webhookId]
      )
      connection.release()
      res.json({ success: true, message: 'Webhook testado e enviado com sucesso para o Discord' })
    } catch (webhookError) {
      connection.release()
      throw webhookError
    }
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao testar webhook:', error)
    res.status(401).json({
      success: false,
      message: error.message || 'Erro ao testar webhook'
    })
  }
})

// ========================================
// ENDPOINTS DE REVENDEDORES
// ========================================

// Função para gerar código único de revendedor
const generateResellerCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'RSL-'
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Endpoint: Listar códigos de revendedor do usuário
app.post('/api/reseller/codes', async (req, res) => {
  let connection
  try {
    const { sessionid } = req.body

    if (!sessionid) {
      return res.status(400).json({
        success: false,
        message: 'Session ID é obrigatório'
      })
    }

    let user
    try {
      const result = await verifySession(sessionid)
      user = result.user
      connection = result.connection
    } catch (sessionError) {
      return res.status(401).json({
        success: false,
        message: sessionError.message || 'Sessão inválida'
      })
    }

    // Verificar se a tabela existe
    try {
      await connection.query('SELECT 1 FROM reseller_codes LIMIT 1')
    } catch (tableError) {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Tabela de revendedores não encontrada. Execute a migration: api/migration_add_reseller_codes.sql',
        error: 'Table reseller_codes does not exist'
      })
    }

    // Buscar códigos criados pelo usuário
    const [codes] = await connection.query(
      `SELECT 
        rc.*,
        u.username as used_by_username
      FROM reseller_codes rc
      LEFT JOIN users u ON rc.used_by = u.id
      WHERE rc.created_by = ?
      ORDER BY rc.created_at DESC`,
      [user.id]
    )

    // Verificar expiração e atualizar status
    const now = new Date()
    for (const code of codes) {
      if (code.status === 'active' && code.expires_at) {
        const expiresAt = new Date(code.expires_at)
        if (expiresAt < now) {
          await connection.query(
            'UPDATE reseller_codes SET status = ? WHERE id = ?',
            ['expired', code.id]
          )
          code.status = 'expired'
        }
      }
    }

    connection.release()
    res.json({
      success: true,
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        plan: code.plan,
        period: code.period,
        status: code.status,
        created_at: code.created_at ? new Date(code.created_at).toISOString() : null,
        expires_at: code.expires_at ? new Date(code.expires_at).toISOString() : null,
        used_at: code.used_at ? new Date(code.used_at).toISOString() : null,
        used_by_username: code.used_by_username,
        note: code.note
      }))
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao listar códigos de revendedor:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar códigos de revendedor',
      error: error.message
    })
  }
})

// Endpoint: Criar código de revendedor (APENAS ADMIN)
app.post('/api/reseller/create-code', async (req, res) => {
  let connection
  try {
    const { sessionid, plan, period, expiresAt, note } = req.body

    if (!sessionid || !plan || !period) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, plano e período são obrigatórios'
      })
    }

    if (!['developer', 'seller'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Plano inválido. Use "developer" ou "seller"'
      })
    }

    if (!['monthly', 'annual'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Período inválido. Use "monthly" ou "annual"'
      })
    }

    // Verificar se é admin
    let user
    try {
      const result = await verifyAdmin(sessionid)
      user = result.user
      connection = result.connection
    } catch (adminError) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem criar códigos de revendedor.'
      })
    }

    // Verificar se a tabela existe
    try {
      await connection.query('SELECT 1 FROM reseller_codes LIMIT 1')
    } catch (tableError) {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Tabela de revendedores não encontrada. Execute a migration: api/migration_add_reseller_codes.sql',
        error: 'Table reseller_codes does not exist'
      })
    }

    // Gerar código único
    let code = generateResellerCode()
    let attempts = 0
    while (attempts < 10) {
      const [existing] = await connection.query(
        'SELECT id FROM reseller_codes WHERE code = ?',
        [code]
      )
      if (existing.length === 0) {
        break
      }
      code = generateResellerCode()
      attempts++
    }

    if (attempts >= 10) {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar código único. Tente novamente.'
      })
    }

    // Preparar data de expiração
    let expiresAtStr = null
    if (expiresAt) {
      expiresAtStr = new Date(expiresAt).toISOString().slice(0, 19).replace('T', ' ')
    }

    // Criar código
    await connection.query(
      `INSERT INTO reseller_codes (code, plan, period, created_by, expires_at, note, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [code, plan, period, user.id, expiresAtStr, note || null]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Código de revendedor criado com sucesso',
      code: code
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao criar código de revendedor:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar código de revendedor',
      error: error.message
    })
  }
})

// Endpoint: Deletar código de revendedor
app.post('/api/reseller/delete-code', async (req, res) => {
  let connection
  try {
    const { sessionid, codeId } = req.body

    if (!sessionid || !codeId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e ID do código são obrigatórios'
      })
    }

    let user, connection
    try {
      const result = await verifySession(sessionid)
      user = result.user
      connection = result.connection
    } catch (sessionError) {
      return res.status(401).json({
        success: false,
        message: sessionError.message || 'Sessão inválida'
      })
    }

    // Verificar se a tabela existe
    try {
      await connection.query('SELECT 1 FROM reseller_codes LIMIT 1')
    } catch (tableError) {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Tabela de revendedores não encontrada. Execute a migration: api/migration_add_reseller_codes.sql',
        error: 'Table reseller_codes does not exist'
      })
    }

    // Verificar se o código pertence ao usuário
    const [codes] = await connection.query(
      'SELECT id, status FROM reseller_codes WHERE id = ? AND created_by = ?',
      [codeId, user.id]
    )

    if (codes.length === 0) {
      connection.release()
      return res.status(404).json({
        success: false,
        message: 'Código não encontrado ou você não tem permissão para deletá-lo'
      })
    }

    const code = codes[0]

    // Só pode deletar códigos ativos
    if (code.status !== 'active') {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Apenas códigos ativos podem ser deletados'
      })
    }

    // Deletar código
    await connection.query(
      'DELETE FROM reseller_codes WHERE id = ?',
      [codeId]
    )

    connection.release()
    res.json({
      success: true,
      message: 'Código deletado com sucesso'
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao deletar código de revendedor:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao deletar código de revendedor',
      error: error.message
    })
  }
})

// Endpoint: Ativar código de revendedor (para uso futuro no site)
app.post('/api/reseller/activate-code', async (req, res) => {
  let connection
  try {
    const { sessionid, code } = req.body

    if (!sessionid || !code) {
      return res.status(400).json({
        success: false,
        message: 'Session ID e código são obrigatórios'
      })
    }

    let user, connection
    try {
      const result = await verifySession(sessionid)
      user = result.user
      connection = result.connection
    } catch (sessionError) {
      return res.status(401).json({
        success: false,
        message: sessionError.message || 'Sessão inválida'
      })
    }

    // Verificar se a tabela existe
    try {
      await connection.query('SELECT 1 FROM reseller_codes LIMIT 1')
    } catch (tableError) {
      connection.release()
      return res.status(500).json({
        success: false,
        message: 'Tabela de revendedores não encontrada. Execute a migration: api/migration_add_reseller_codes.sql',
        error: 'Table reseller_codes does not exist'
      })
    }

    // Buscar código
    const [codes] = await connection.query(
      'SELECT * FROM reseller_codes WHERE code = ?',
      [code]
    )

    if (codes.length === 0) {
      connection.release()
      return res.status(404).json({
        success: false,
        message: 'Código não encontrado'
      })
    }

    const resellerCode = codes[0]

    // Verificar se código está ativo
    if (resellerCode.status !== 'active') {
      connection.release()
      return res.status(400).json({
        success: false,
        message: `Código já foi ${resellerCode.status === 'used' ? 'usado' : 'expirado'}`
      })
    }

    // Verificar expiração
    if (resellerCode.expires_at) {
      const expiresAt = new Date(resellerCode.expires_at)
      if (expiresAt < new Date()) {
        await connection.query(
          'UPDATE reseller_codes SET status = ? WHERE id = ?',
          ['expired', resellerCode.id]
        )
        connection.release()
        return res.status(400).json({
          success: false,
          message: 'Código expirado'
        })
      }
    }

    // Verificar se usuário não está tentando usar seu próprio código
    if (resellerCode.created_by === user.id) {
      connection.release()
      return res.status(400).json({
        success: false,
        message: 'Você não pode usar seu próprio código de revendedor'
      })
    }

    // Aplicar plano ao usuário
    const expiryDate = new Date()
    if (resellerCode.period === 'weekly') {
      expiryDate.setDate(expiryDate.getDate() + 7)
    } else if (resellerCode.period === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else if (resellerCode.period === 'quarterly') {
      expiryDate.setMonth(expiryDate.getMonth() + 3)
    } else if (resellerCode.period === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    } else if (resellerCode.period === 'lifetime') {
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }
    const expiryDateStr = expiryDate.toISOString().slice(0, 19).replace('T', ' ')

    // Atualizar plano do usuário
    try {
      if (resellerCode.period === 'lifetime') {
        await connection.query(
          `UPDATE users 
           SET plan = ?, plan_expires_at = NULL 
           WHERE id = ?`,
          [resellerCode.plan, user.id]
        )
      } else {
        await connection.query(
          `UPDATE users 
           SET plan = ?, plan_expires_at = ? 
           WHERE id = ?`,
          [resellerCode.plan, expiryDateStr, user.id]
        )
      }
    } catch (error) {
      await connection.query(
        `UPDATE users SET plan = ? WHERE id = ?`,
        [resellerCode.plan, user.id]
      )
    }

    // Marcar código como usado
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    await connection.query(
      `UPDATE reseller_codes 
       SET status = 'used', used_by = ?, used_at = ? 
       WHERE id = ?`,
      [user.id, now, resellerCode.id]
    )

    connection.release()
    res.json({
      success: true,
      message: `Plano ${resellerCode.plan} ativado com sucesso!`,
      plan: resellerCode.plan,
      period: resellerCode.period,
      expiresAt: expiryDateStr
    })
  } catch (error) {
    if (connection) connection.release()
    console.error('Erro ao ativar código de revendedor:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao ativar código de revendedor',
      error: error.message
    })
  }
})

// ========================================
// ENDPOINT ANTI-CRACK
// ========================================

// Endpoint: Verificar status Anti-Crack
app.post('/api/1.3/anticrack/status', async (req, res) => {
  let connection
  try {
    const { type, name, ownerid, sessionid, hash, enckey } = req.body

    if (!type || !name || !ownerid || !hash) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Buscar aplicação
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE name = ? AND owner_id = ?',
      [name, ownerid]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidapp'
      })
    }

    const app = appRows[0]

    // Se sessionid fornecido, verificar sessão
    if (sessionid) {
      const [userRows] = await connection.query(
        'SELECT * FROM users WHERE session_token = ? AND app_id = ?',
        [sessionid, app.id]
      )

      if (userRows.length === 0) {
        return res.json({
          success: false,
          message: 'invalidsession'
        })
      }
    }

    // Retornar status do Anti-Crack
    res.json({
      success: true,
      message: 'success',
      anticrack: {
        enabled: true,
        version: '1.0.0',
        features: {
          debugger_detection: true,
          process_monitoring: true,
          memory_protection: true,
          shutdown_protection: true
        }
      }
    })
  } catch (error) {
    console.error('❌ Erro no endpoint Anti-Crack Status:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status Anti-Crack',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Reportar ameaça detectada
app.post('/api/1.3/anticrack/report', async (req, res) => {
  let connection
  try {
    const { type, name, ownerid, sessionid, hash, enckey, threat_type, threat_data } = req.body

    if (!type || !name || !ownerid || !hash || !threat_type) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Buscar aplicação
    const [appRows] = await connection.query(
      'SELECT * FROM applications WHERE name = ? AND owner_id = ?',
      [name, ownerid]
    )

    if (appRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidapp'
      })
    }

    const app = appRows[0]

    // Obter IP do cliente
    let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'unknown'
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim()
    }
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1'
    }

    // Salvar log no banco de dados
    try {
      const severity = threat_type === 'critical' ? 'critical' : threat_type === 'debugger' ? 'critical' : 'high'
      await connection.query(
        'INSERT INTO anticrack_logs (app_name, owner_id, threat_type, threat_data, ip_address, session_id, severity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [app.name, ownerid, threat_type, threat_data || '', clientIp, sessionid || '', severity]
      )
    } catch (dbError) {
      console.error('Erro ao salvar log no banco:', dbError)
    }

    // Log da ameaça
    console.log('⚠️ [Anti-Crack] Ameaça reportada:', {
      app: app.name,
      threat_type,
      threat_data,
      ip: clientIp,
      timestamp: new Date().toISOString()
    })

    // Retornar resposta
    res.json({
      success: true,
      message: 'Threat reported successfully',
      action: threat_type === 'critical' ? 'shutdown' : 'monitor'
    })
  } catch (error) {
    console.error('❌ Erro no endpoint Anti-Crack Report:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao reportar ameaça',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Salvar log de detecção
app.post('/api/anticrack/save-log', async (req, res) => {
  let connection
  try {
    const { sessionid, app_name, owner_id, threat_type, threat_data, severity } = req.body

    if (!sessionid || !app_name || !owner_id || !threat_type) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidsession'
      })
    }

    // Obter IP do cliente
    let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'unknown'
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim()
    }
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1'
    }

    // Salvar log no banco de dados
    await connection.query(
      'INSERT INTO anticrack_logs (app_name, owner_id, threat_type, threat_data, ip_address, session_id, severity) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [app_name, owner_id, threat_type, threat_data || '', clientIp, sessionid, severity || 'high']
    )

    res.json({
      success: true,
      message: 'Log salvo com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro ao salvar log Anti-Crack:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar log',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint: Carregar logs de detecção
app.post('/api/anticrack/get-logs', async (req, res) => {
  let connection
  try {
    const { sessionid, app_name, owner_id } = req.body

    if (!sessionid || !app_name || !owner_id) {
      return res.json({
        success: false,
        message: 'missingrequired'
      })
    }

    connection = await pool.getConnection()

    // Verificar sessão
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE session_token = ?',
      [sessionid]
    )

    if (userRows.length === 0) {
      return res.json({
        success: false,
        message: 'invalidsession'
      })
    }

    // Buscar logs do banco de dados (últimos 100)
    const [logs] = await connection.query(
      'SELECT * FROM anticrack_logs WHERE app_name = ? AND owner_id = ? ORDER BY created_at DESC LIMIT 100',
      [app_name, owner_id]
    )

    // Converter para formato do frontend
    const formattedLogs = logs.map(log => {
      // Formatar mensagem baseada no tipo de ameaça
      let message = ''
      
      if (log.threat_type === 'suspicious_process') {
        message = log.threat_data 
          ? `⚠️ Processo suspeito detectado: ${log.threat_data}`
          : '⚠️ Processo suspeito detectado'
      } else if (log.threat_type === 'debugger') {
        message = '🔍 Debugger/DevTools detectado'
      } else if (log.threat_type === 'system') {
        message = log.threat_data || '🛡️ Sistema protegido'
      } else {
        message = log.threat_data 
          ? `⚠️ Ameaça detectada: ${log.threat_data}`
          : `⚠️ Ameaça detectada: ${log.threat_type}`
      }
      
      return {
        id: log.id,
        type: log.threat_type,
        message: message,
        timestamp: log.created_at ? new Date(log.created_at).toISOString() : new Date().toISOString(),
        severity: log.severity || 'high'
      }
    })
    
    console.log('📝 [Anti-Crack] Retornando logs:', {
      total: formattedLogs.length,
      logs: formattedLogs
    })

    res.json({
      success: true,
      logs: formattedLogs
    })
  } catch (error) {
    console.error('❌ Erro ao carregar logs Anti-Crack:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar logs',
      error: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

const HOST = process.env.HOST || '0.0.0.0' // Escutar em todas as interfaces de rede

// Configuração SSL/HTTPS (opcional)
const SSL_ENABLED = process.env.SSL_ENABLED === 'true'
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, 'ssl', 'key.pem')
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, 'ssl', 'cert.pem')

// Função para iniciar o servidor
async function startServer() {
  const serverCallback = async () => {
    const protocol = SSL_ENABLED ? 'https' : 'http'
    console.log(`🚀 API Server rodando em ${protocol}://${HOST}:${PORT}`)
  console.log(`📡 Endpoints disponíveis:`)
  console.log(`   POST /api/login`)
  console.log(`   POST /api/send-verification-code`)
  console.log(`   POST /api/register`)
  console.log(`   POST /api/verify`)
  console.log(`   POST /api/logout`)
  console.log(`   POST /api/save-settings`)
  console.log(`   POST /api/get-settings`)
  console.log(`   POST /api/generate-2fa`)
  console.log(`   POST /api/enable-2fa`)
  console.log(`   POST /api/send-2fa-email`)
  console.log(`   POST /api/verify-2fa-email`)
  console.log(`   POST /api/change-password`)
  console.log(`   POST /api/change-email`)
  console.log(`   POST /api/change-username`)
  console.log(`   POST /api/disable-2fa`)
  console.log(`   POST /api/get-applications`)
  console.log(`   POST /api/create-application`)
  console.log(`   POST /api/rename-application`)
  console.log(`   POST /api/delete-application`)
  console.log(`   POST /api/pause-application`)
  console.log(`   POST /api/refresh-app-secret`)
  console.log(`\n📡 Endpoints de Licenças:`)
  console.log(`   POST /api/get-licenses`)
  console.log(`   POST /api/create-license`)
  console.log(`   POST /api/add-time-to-unused-licenses`)
  console.log(`   POST /api/export-licenses`)
  console.log(`   POST /api/delete-all-licenses`)
  console.log(`   POST /api/delete-used-licenses`)
  console.log(`   POST /api/delete-unused-licenses`)
  console.log(`\n📡 Endpoints de Usuários:`)
  console.log(`   POST /api/get-users`)
  console.log(`   POST /api/create-user`)
  console.log(`   POST /api/extend-users`)
  console.log(`   POST /api/subtract-users`)
  console.log(`   POST /api/export-users`)
  console.log(`   POST /api/delete-all-users`)
  console.log(`   POST /api/delete-expired-users`)
  console.log(`   POST /api/reset-users-hwid`)
  console.log(`   POST /api/reset-user-hwid-ip`)
  console.log(`   POST /api/reset-user-hwid`)
  console.log(`   POST /api/reset-user-ip`)
  console.log(`   POST /api/get-user-variables`)
  console.log(`   POST /api/set-user-variable`)
  console.log(`   POST /api/delete-user-variable`)
  console.log(`\n📡 Endpoints de Arquivos:`)
  console.log(`   POST /api/get-files`)
  console.log(`   POST /api/add-file`)
  console.log(`   POST /api/delete-file`)
  console.log(`   POST /api/delete-all-files`)
  console.log(`   POST /api/1.3/download-file`)
  console.log(`\n📡 Endpoints KeyUnit API (v1.3):`)
  console.log(`   POST /api/1.3/init`)
  console.log(`   POST /api/1.3/login`)
  console.log(`   POST /api/1.3/register`)
  console.log(`   POST /api/1.3/license`)
  console.log(`   POST /api/1.3/user_data`)
  console.log(`\n🛡️  Endpoints Anti-Crack:`)
  console.log(`   POST /api/1.3/anticrack/status`)
  console.log(`   POST /api/1.3/anticrack/report`)
  console.log(`   POST /api/anticrack/save-log`)
  console.log(`   POST /api/anticrack/get-logs`)
  console.log(`\n📡 Endpoints de Administração:`)
  console.log(`   POST /api/admin/login`)
  console.log(`   POST /api/admin/verify`)
  console.log(`   POST /api/admin/users`)
  console.log(`   POST /api/admin/users/edit`)
  console.log(`   POST /api/admin/users/delete`)
  console.log(`   POST /api/admin/users/ban`)
  console.log(`   POST /api/admin/users/make-admin`)
  console.log(`   POST /api/admin/stats`)
  console.log(`   POST /api/admin/chat/tickets`)
  console.log(`   POST /api/admin/chat/assign`)
  console.log(`   POST /api/admin/chat/update-status`)
  console.log(`   POST /api/admin/chat/messages`)
  console.log(`\n💬 Endpoints de Chat:`)
  console.log(`   POST /api/chat/create-ticket`)
  console.log(`   POST /api/chat/send-message`)
  console.log(`   POST /api/chat/tickets`)
  console.log(`   POST /api/chat/messages`)
  console.log(`\n💾 Banco de dados MySQL: ${config.database.host}:${config.database.port}/${config.database.database}`)
  console.log(`🌐 API URL: ${config.apiUrl}`)
  
  if (SSL_ENABLED) {
    console.log(`🔒 SSL/HTTPS: Habilitado`)
  } else {
    console.log(`⚠️  SSL/HTTPS: Desabilitado (usando HTTP)`)
    console.log(`⚠️  Para habilitar HTTPS, configure SSL_ENABLED=true e forneça certificados SSL`)
  }
  
  // Testar conexão
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    console.log('✅ Conexão com MySQL estabelecida com sucesso')
    connection.release()
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message)
    console.error('⚠️  Verifique as configurações do banco de dados no arquivo .env')
  }
  }

  // Verificar se SSL está habilitado e se os certificados existem
  if (SSL_ENABLED) {
    if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
      try {
        const options = {
          key: fs.readFileSync(SSL_KEY_PATH),
          cert: fs.readFileSync(SSL_CERT_PATH)
        }
        https.createServer(options, app).listen(PORT, HOST, serverCallback)
        console.log(`✅ Servidor HTTPS iniciado com certificados SSL`)
      } catch (error) {
        console.error('❌ Erro ao iniciar servidor HTTPS:', error.message)
        console.error('⚠️  Iniciando servidor HTTP como fallback...')
        http.createServer(app).listen(PORT, HOST, serverCallback)
      }
    } else {
      console.warn(`⚠️  SSL habilitado mas certificados não encontrados:`)
      console.warn(`   Key: ${SSL_KEY_PATH}`)
      console.warn(`   Cert: ${SSL_CERT_PATH}`)
      console.warn(`⚠️  Iniciando servidor HTTP como fallback...`)
      http.createServer(app).listen(PORT, HOST, serverCallback)
    }
  } else {
    // Servidor HTTP padrão
    http.createServer(app).listen(PORT, HOST, serverCallback)
  }
}

// Iniciar servidor
if (require.main === module && !IS_VERCEL) {
  startServer().catch(error => {
    console.error('❌ Erro fatal ao iniciar servidor:', error)
    process.exit(1)
  })
}

// Fechar pool ao encerrar
process.on('SIGINT', async () => {
  await pool.end()
  process.exit(0)
})

module.exports = app
