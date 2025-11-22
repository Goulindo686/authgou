// Configurações do sistema
// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config()

module.exports = {
  // Configurações de email (Nodemailer)
  email: {
    // Configuração para Gmail
    // Para usar Gmail, você precisa criar uma "Senha de App" em:
    // https://myaccount.google.com/apppasswords
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER || 'seu-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'sua-senha-de-app'
    },
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'seu-email@gmail.com'
  },
  
  // Configurações do banco de dados MySQL
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'auth_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // Configurações gerais
  verificationCodeExpiry: 10 * 60 * 1000, // 10 minutos em milissegundos
  subscriptionDefaultDays: 30, // Dias padrão de assinatura
  apiUrl: process.env.API_URL || 'https://api.gouc.com.br',
  apiVersion: '1.3.1',
  // Configuração SSL/HTTPS
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true',
    keyPath: process.env.SSL_KEY_PATH || './ssl/key.pem',
    certPath: process.env.SSL_CERT_PATH || './ssl/cert.pem'
  },
  // Configurações Discord OAuth
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'https://www.gouc.com.br/api/discord/callback',
    frontendUrl: process.env.FRONTEND_URL || 'https://www.gouc.com.br',
    oauthUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    apiUrl: 'https://discord.com/api/users/@me'
  }
}

