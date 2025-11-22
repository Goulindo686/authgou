import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente do arquivo .env
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determinar o target da API
  const apiTarget = env.VITE_API_TARGET || (
    // Se estiver em modo dev (npm run dev), usar localhost
    // Caso contrário, usar o domínio HTTPS da API
    mode === 'development'
      ? 'http://localhost:3001'
      : 'https://api.gouc.com.br'
  )

  console.log('🔧 [Vite Config] API Target configurado:', apiTarget)
  console.log('🔧 [Vite Config] VITE_API_TARGET:', env.VITE_API_TARGET || 'não definido')
  console.log('🔧 [Vite Config] Mode:', mode)
  console.log('🔧 [Vite Config] Process.cwd():', process.cwd())

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Escutar em todas as interfaces de rede
      port: 3000,
      open: true,
      historyApiFallback: true,
      allowedHosts: ['keyunit.online', 'gouc.com.br', 'www.gouc.com.br'],
      // Proxy para evitar Mixed Content (HTTPS → HTTP)
      proxy: {
        '/api': {
          // Detectar automaticamente se está em desenvolvimento ou produção
          // Em desenvolvimento local (npm run dev): usar localhost:3001
          // Em produção (via domínio gouc.com.br): usar https://api.gouc.com.br
          // Para forçar um target específico, defina a variável de ambiente VITE_API_TARGET
          target: apiTarget,
          changeOrigin: true,
          secure: true, // Habilitar SSL para HTTPS
          rewrite: (path) => path,
          // Configurações adicionais para melhorar a conexão
          timeout: 60000,
          proxyTimeout: 60000,
          // Log de erros do proxy
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('❌ [Vite Proxy] Erro:', err.message)
              console.error('❌ [Vite Proxy] Tentando conectar em:', options.target)
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('📤 [Vite Proxy] Proxying:', req.method, req.url, '→', options.target)
            })
          }
        }
      }
    }
  }
})

