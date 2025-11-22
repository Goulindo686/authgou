// Serviço de API para comunicação com backend
import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// Função para detectar se está rodando no Android
const isAndroid = () => {
  return Capacitor.getPlatform() === 'android'
}

// Função para obter a URL da API
const getApiUrl = () => {
  // Se houver variável de ambiente configurada, usar ela (tem prioridade)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Android (Capacitor) usa sempre domínio da API em produção
  if (isAndroid()) {
    return 'https://api.gouc.com.br'
  }

  // Ambiente de desenvolvimento (Vite)
  const isViteDev = import.meta.env.DEV ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.port === '3000'

  if (isViteDev) {
    // Usar caminhos relativos para funcionar com proxy do dev server
    return ''
  }

  // Produção: se o frontend estiver em keyunit.online ou gouc.com.br, apontar para a API pública
  const host = window.location.hostname
  if (host && host.endsWith('keyunit.online')) {
    return 'https://api.keyunit.online'
  }
  if (host && host.endsWith('gouc.com.br')) {
    return 'https://api.gouc.com.br'
  }

  // Fallback seguro: caminhos relativos (caso haja proxy/CDN no mesmo domínio)
  return ''
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 segundos de timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    console.error('❌ [Axios] Erro na requisição:', error)
    return Promise.reject(error)
  }
)

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Tratamento especial para erros de timeout
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      console.error('⏱️ [Axios] Timeout na requisição:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
        message: error.message
      })
      // Criar um erro customizado mais amigável
      const timeoutError = new Error('Tempo de espera esgotado. O servidor demorou muito para responder. Por favor, verifique sua conexão e tente novamente.')
      timeoutError.code = error.code
      timeoutError.isTimeout = true
      timeoutError.config = error.config
      timeoutError.request = error.request
      timeoutError.isAxiosError = error.isAxiosError
      console.error('❌ [Axios] Erro de timeout transformado:', timeoutError)
      return Promise.reject(timeoutError)
    }

    console.error('❌ [Axios] Erro na resposta (interceptor):', {
      message: error.message,
      code: error.code,
      name: error.name,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : null,
      request: error.request ? {
        status: error.request.status,
        statusText: error.request.statusText,
        readyState: error.request.readyState
      } : null,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL
      } : null
    })
    // Garantir que o erro original seja rejeitado com todas as informações
    return Promise.reject(error)
  }
)

export const adminService = {
  // Login Admin
  login: async (username, password) => {
    try {
      const response = await api.post('/api/admin/login', {
        username,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao fazer login de administrador' }
    }
  },

  // Verificar se é admin
  verify: async (sessionid) => {
    try {
      const response = await api.post('/api/admin/verify', {
        sessionid
      })
      return response.data
    } catch (error) {
      // Se o erro é 401 (não autorizado), retornar um objeto com success: false ao invés de lançar exceção
      if (error.response?.status === 401) {
        return error.response?.data || { success: false, is_admin: false, message: 'Acesso negado' }
      }
      
      // Para outros erros, lançar exceção
      throw error.response?.data || { success: false, is_admin: false, message: 'Erro ao verificar administrador' }
    }
  },

  // Listar usuários
  getUsers: async (sessionid, search = '', page = 1, limit = 50) => {
    try {
      const response = await api.post('/api/admin/users', {
        sessionid,
        search,
        page,
        limit
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar usuários' }
    }
  },

  // Editar usuário
  editUser: async (sessionid, userId, data) => {
    try {
      const response = await api.post('/api/admin/users/edit', {
        sessionid,
        userId,
        ...data
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao editar usuário' }
    }
  },

  // Deletar usuário
  deleteUser: async (sessionid, userId) => {
    try {
      const response = await api.post('/api/admin/users/delete', {
        sessionid,
        userId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar usuário' }
    }
  },

  // Banir/Desbanir usuário
  banUser: async (sessionid, userId, banned) => {
    try {
      const response = await api.post('/api/admin/users/ban', {
        sessionid,
        userId,
        banned
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao banir/desbanir usuário' }
    }
  },

  // Tornar usuário admin
  makeAdmin: async (sessionid, userId, is_admin) => {
    try {
      const response = await api.post('/api/admin/users/make-admin', {
        sessionid,
        userId,
        is_admin
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao alterar privilégios de admin' }
    }
  },

  // Obter estatísticas
  getStats: async (sessionid) => {
    try {
      const response = await api.post('/api/admin/stats', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter estatísticas' }
    }
  },

  // Listar pagamentos (logs)
  getPayments: async (sessionid, search = '', status = '', page = 1, limit = 50) => {
    try {
      const response = await api.post('/api/admin/payments', {
        sessionid,
        search,
        status,
        page,
        limit
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar pagamentos' }
    }
  },

  // Gerenciar vídeos
  getVideos: async (sessionid) => {
    try {
      const response = await api.post('/api/admin/videos/list', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar vídeos' }
    }
  },

  createVideo: async (sessionid, videoData) => {
    try {
      const response = await api.post('/api/admin/videos', {
        sessionid,
        ...videoData
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar vídeo' }
    }
  },

  updateVideo: async (sessionid, videoId, videoData) => {
    try {
      const response = await api.put(`/api/admin/videos/${videoId}`, {
        sessionid,
        ...videoData
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar vídeo' }
    }
  },

  deleteVideo: async (sessionid, videoId) => {
    try {
      const response = await api.delete(`/api/admin/videos/${videoId}`, {
        data: { sessionid }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar vídeo' }
    }
  }
}

 

export const videoService = {
  // Listar vídeos públicos
  getVideos: async (category, featured) => {
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (featured) params.append('featured', 'true')
      const response = await api.get(`/api/videos?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar vídeos' }
    }
  },

  // Incrementar visualizações
  incrementView: async (videoId) => {
    try {
      const response = await api.post(`/api/videos/${videoId}/view`)
      return response.data
    } catch (error) {
      // Ignorar erro silenciosamente
      return { success: false }
    }
  }
}

export const authService = {
  // Login
  login: async (username, password, twoFactor = '') => {
    try {
      const response = await api.post('/api/login', {
        username,
        password,
        twoFactor: twoFactor || undefined
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao fazer login' }
    }
  },

  // Enviar código de verificação por email
  sendVerificationCode: async (email, username, password) => {
    try {
      const response = await api.post('/api/send-verification-code', {
        email,
        username,
        password
      })
      return response.data
    } catch (error) {
      // Extrair informações detalhadas do erro
      const responseData = error?.response?.data
      const hasEmptyResponse = error?.response?.status === 500 && (!responseData || responseData === '' || (typeof responseData === 'string' && responseData.trim() === ''))
      
      let errorMessage = 'Erro ao enviar código de verificação'
      if (hasEmptyResponse) {
        errorMessage = 'Erro interno do servidor. O servidor não conseguiu processar a solicitação. Verifique os logs do servidor ou tente novamente mais tarde.'
      } else if (responseData?.message) {
        errorMessage = responseData.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      const errorData = {
        message: errorMessage,
        error: responseData?.error || error?.message || 'Erro desconhecido',
        code: error?.code || responseData?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        isNetworkError: !error?.response && !!error?.request,
        isTimeout: error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT',
        isServerError: error?.response?.status >= 500,
        hasEmptyResponse: hasEmptyResponse,
        responseData: responseData || null,
        originalError: {
          message: error?.message,
          code: error?.code,
          name: error?.name
        }
      }
      
      // Se houver dados de resposta do servidor, incluir todas as informações
      if (error?.response?.data) {
        Object.assign(errorData, {
          ...error.response.data,
          message: error.response.data.message || errorData.message
        })
      }
      
      // Preservar TODAS as propriedades do erro original
      const allErrorProps = {}
      if (error) {
        Object.keys(error).forEach(key => {
          try {
            allErrorProps[key] = error[key]
          } catch (e) {
            // Ignorar propriedades que não podem ser acessadas
          }
        })
        
        if (error.isAxiosError) {
          allErrorProps.isAxiosError = true
        }
        if (error.response) {
          allErrorProps.response = error.response
        }
        if (error.request) {
          allErrorProps.request = error.request
        }
        if (error.config) {
          allErrorProps.config = error.config
        }
      }
      
      // Mesclar todas as propriedades no errorData
      const finalError = {
        ...errorData,
        ...allErrorProps,
        message: errorData.message,
        status: errorData.status,
        statusText: errorData.statusText,
        responseData: errorData.responseData
      }
      
      throw finalError
    }
  },

  // Registro com código de verificação
  register: async (username, password, email, verificationCode) => {
    try {
      const response = await api.post('/api/register', {
        username,
        password,
        email,
        verificationCode
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao registrar' }
    }
  },

  // Verificar sessão
  verify: async (sessionid) => {
    try {
      const response = await api.post('/api/verify', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao verificar sessão' }
    }
  },

  // Logout
  logout: async (sessionid) => {
    try {
      const response = await api.post('/api/logout', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao fazer logout' }
    }
  },

  // Salvar configurações
  saveSettings: async (sessionid, settings) => {
    try {
      const response = await api.post('/api/save-settings', {
        sessionid,
        ...settings
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao salvar configurações' }
    }
  },

  // Buscar configurações
  getSettings: async (sessionid) => {
    try {
      const response = await api.post('/api/get-settings', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar configurações' }
    }
  },

  activateTestPlan5m: async (sessionid) => {
    try {
      const response = await api.post('/api/test-plan-5m/activate', { sessionid })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao ativar plano de teste' }
    }
  },

  // Gerar QR Code para 2FA
  generate2FA: async (sessionid) => {
    try {
      const response = await api.post('/api/generate-2fa', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao gerar QR code 2FA' }
    }
  },

  // Ativar 2FA
  enable2FA: async (sessionid, token) => {
    try {
      const response = await api.post('/api/enable-2fa', {
        sessionid,
        token
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao ativar 2FA' }
    }
  },

  // Enviar código 2FA por email
  send2FAEmail: async (sessionid) => {
    try {
      const response = await api.post('/api/send-2fa-email', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao enviar código 2FA' }
    }
  },

  // Enviar código 2FA durante login
  sendLogin2FA: async (tempSession) => {
    try {
      const response = await api.post('/api/login-send-2fa', {
        temp_session: tempSession
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao enviar código 2FA' }
    }
  },

  // Verificar código 2FA e finalizar login
  verifyLogin2FA: async (tempSession, code, method = 'email') => {
    try {
      const response = await api.post('/api/login-verify-2fa', {
        temp_session: tempSession,
        code,
        method
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao verificar código 2FA' }
    }
  },

  // Verificar código 2FA via email
  verify2FAEmail: async (sessionid, code) => {
    try {
      const response = await api.post('/api/verify-2fa-email', {
        sessionid,
        code
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao verificar código 2FA' }
    }
  },

  // Alterar senha
  changePassword: async (sessionid, currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/change-password', {
        sessionid,
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao alterar senha' }
    }
  },

  // ========================================
  // DISCORD OAUTH
  // ========================================
  
  // Obter URL de OAuth do Discord
  getDiscordOAuthUrl: async () => {
    try {
      const response = await api.get('/api/discord/oauth-url')
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter URL de autenticação Discord' }
    }
  },

  // Autenticar com Discord (callback)
  discordAuth: async (code) => {
    try {
      const response = await api.post('/api/discord/callback', {
        code
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao autenticar com Discord' }
    }
  },

  // Solicitar reset de senha (forgot password)
  // Buscar emails associados a um username ou email
  getUserEmails: async (username, email) => {
    try {
      const response = await api.post('/api/get-user-emails', {
        username: username || undefined,
        email: email || undefined
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar emails cadastrados' }
    }
  },

  forgotPassword: async (username, email) => {
    try {
      const response = await api.post('/api/forgot-password', {
        username: username || undefined,
        email: email || undefined
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao solicitar recuperação de senha' }
    }
  },

  // Resetar senha com código
  resetPassword: async (username, email, code, newPassword) => {
    try {
      const response = await api.post('/api/reset-password', {
        username: username || undefined,
        email: email || undefined,
        code,
        newPassword
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao redefinir senha' }
    }
  },

  // Alterar email
  changeEmail: async (sessionid, newEmail, password) => {
    try {
      const response = await api.post('/api/change-email', {
        sessionid,
        newEmail,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao alterar email' }
    }
  },

  // Upload banner
  uploadBanner: async (sessionid, formData) => {
    try {
      // Adicionar sessionid ao FormData se ainda não estiver presente
      if (!formData.has('sessionid')) {
        formData.append('sessionid', sessionid)
      }
      const response = await api.post('/api/upload-banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao fazer upload do banner' }
    }
  },

  // Revendedores
  getResellerCodes: async (sessionid) => {
    try {
      const response = await api.post('/api/reseller/codes', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar códigos de revendedor' }
    }
  },

  createResellerCode: async (sessionid, codeData) => {
    try {
      const response = await api.post('/api/reseller/create-code', {
        sessionid,
        ...codeData
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar código de revendedor' }
    }
  },

  deleteResellerCode: async (sessionid, codeId) => {
    try {
      const response = await api.post('/api/reseller/delete-code', {
        sessionid,
        codeId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar código de revendedor' }
    }
  },

  // Solicitar reset de senha (forgot password)
  forgotPassword: async (username, email) => {
    try {
      const response = await api.post('/api/forgot-password', {
        username,
        email
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao solicitar recuperação de senha' }
    }
  },

  // Resetar senha com código
  resetPassword: async (username, email, code, newPassword) => {
    try {
      const response = await api.post('/api/reset-password', {
        username,
        email,
        code,
        newPassword
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao resetar senha' }
    }
  },

  // Alterar username
  changeUsername: async (sessionid, newUsername, password) => {
    try {
      const response = await api.post('/api/change-username', {
        sessionid,
        newUsername,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao alterar username' }
    }
  },

  // Desativar 2FA
  disable2FA: async (sessionid, password) => {
    try {
      const response = await api.post('/api/disable-2fa', {
        sessionid,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao desativar 2FA' }
    }
  },

  // Obter aplicações
  getApplications: async (sessionid) => {
    try {
      const response = await api.post('/api/get-applications', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar aplicações' }
    }
  },

  // Criar aplicação
  createApplication: async (sessionid, applicationData) => {
    try {
      const response = await api.post('/api/create-application', {
        sessionid,
        ...applicationData
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar aplicação' }
    }
  },

  // Renomear aplicação
  renameApplication: async (sessionid, appId, newName) => {
    try {
      const response = await api.post('/api/rename-application', {
        sessionid,
        appId,
        newName
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao renomear aplicação' }
    }
  },

  // Deletar aplicação
  deleteApplication: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/delete-application', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar aplicação' }
    }
  },

  // Pausar/Retomar aplicação
  pauseApplication: async (sessionid, appId, paused) => {
    try {
      const response = await api.post('/api/pause-application', {
        sessionid,
        appId,
        paused
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao pausar aplicação' }
    }
  },

  // Atualizar secret da aplicação
  refreshAppSecret: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/refresh-app-secret', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar secret' }
    }
  },

  // Obter licenças
  getLicenses: async (sessionid, appId = null) => {
    try {
      const response = await api.post('/api/get-licenses', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar licenças' }
    }
  },

  // Criar licença
  createLicense: async (sessionid, appId, amount, duration, mask, useLowercase, useUppercase, note) => {
    try {
      const response = await api.post('/api/create-license', {
        sessionid,
        appId,
        amount,
        duration,
        mask,
        useLowercase,
        useUppercase,
        note
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar licença' }
    }
  },

  // Adicionar tempo a licenças não usadas
  addTimeToUnusedLicenses: async (sessionid, appId, days) => {
    try {
      const response = await api.post('/api/add-time-to-unused-licenses', {
        sessionid,
        appId,
        days
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao adicionar tempo às licenças' }
    }
  },

  // Exportar licenças
  exportLicenses: async (sessionid, appId = null, format = 'json') => {
    try {
      if (format === 'csv') {
        const response = await api.post('/api/export-licenses', {
          sessionid,
          appId,
          format: 'csv'
        }, {
          responseType: 'blob'
        })
        return response.data
      } else {
        const response = await api.post('/api/export-licenses', {
          sessionid,
          appId,
          format: 'json'
        })
        return response.data
      }
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao exportar licenças' }
    }
  },

  // Deletar todas as licenças
  deleteAllLicenses: async (sessionid, appId = null) => {
    try {
      const response = await api.post('/api/delete-all-licenses', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar licenças' }
    }
  },

  // Deletar licenças usadas
  deleteUsedLicenses: async (sessionid, appId = null) => {
    try {
      const response = await api.post('/api/delete-used-licenses', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar licenças usadas' }
    }
  },

  // Deletar licenças não usadas
  deleteUnusedLicenses: async (sessionid, appId = null) => {
    try {
      const response = await api.post('/api/delete-unused-licenses', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar licenças não usadas' }
    }
  },

  // ========================================
  // ENDPOINTS DE USUÁRIOS
  // ========================================

  // Obter usuários
  getUsers: async (sessionid, appId = null) => {
    try {
      const response = await api.post('/api/get-users', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar usuários' }
    }
  },

  // Criar usuário
  createUser: async (sessionid, appId, userData) => {
    try {
      const response = await api.post('/api/create-user', {
        sessionid,
        appId,
        ...userData
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar usuário' }
    }
  },

  // Estender tempo de usuários
  extendUsers: async (sessionid, appId, days, userIds = null) => {
    try {
      const response = await api.post('/api/extend-users', {
        sessionid,
        appId,
        days,
        userIds
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao estender tempo de usuários' }
    }
  },

  // Reduzir tempo de usuários
  subtractUsers: async (sessionid, appId, days, userIds = null) => {
    try {
      const response = await api.post('/api/subtract-users', {
        sessionid,
        appId,
        days,
        userIds
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao reduzir tempo de usuários' }
    }
  },

  // Exportar usuários
  exportUsers: async (sessionid, appId = null, format = 'json') => {
    try {
      if (format === 'csv') {
        const response = await api.post('/api/export-users', {
          sessionid,
          appId,
          format: 'csv'
        }, {
          responseType: 'blob'
        })
        return response.data
      } else {
        const response = await api.post('/api/export-users', {
          sessionid,
          appId,
          format: 'json'
        })
        return response.data
      }
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao exportar usuários' }
    }
  },

  // Deletar todos os usuários
  deleteAllUsers: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/delete-all-users', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar usuários' }
    }
  },

  // Deletar usuários expirados
  deleteExpiredUsers: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/delete-expired-users', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar usuários expirados' }
    }
  },

  // Resetar HWID de usuários
  resetUsersHwid: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/reset-users-hwid', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao resetar HWID' }
    }
  },

  // Resetar HWID e IP de um usuário específico
  resetUserHwidIp: async (sessionid, appId, userId) => {
    try {
      const response = await api.post('/api/reset-user-hwid-ip', {
        sessionid,
        appId,
        userId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao resetar HWID e IP' }
    }
  },

  // Resetar apenas HWID de um usuário específico
  resetUserHwid: async (sessionid, appId, userId) => {
    try {
      const response = await api.post('/api/reset-user-hwid', {
        sessionid,
        appId,
        userId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao resetar HWID' }
    }
  },

  // Resetar apenas IP de um usuário específico
  resetUserIp: async (sessionid, appId, userId) => {
    try {
      const response = await api.post('/api/reset-user-ip', {
        sessionid,
        appId,
        userId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao resetar IP' }
    }
  },

  // Obter variáveis de usuário
  getUserVariables: async (sessionid, appId, userId = null) => {
    try {
      const response = await api.post('/api/get-user-variables', {
        sessionid,
        appId,
        userId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar variáveis de usuário' }
    }
  },

  // Definir variável de usuário
  setUserVariable: async (sessionid, appId, userId, variableName, variableValue) => {
    try {
      const response = await api.post('/api/set-user-variable', {
        sessionid,
        appId,
        userId,
        variableName,
        variableValue
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao definir variável de usuário' }
    }
  },

  // Deletar variável de usuário
  deleteUserVariable: async (sessionid, appId, userId, variableName) => {
    try {
      const response = await api.post('/api/delete-user-variable', {
        sessionid,
        appId,
        userId,
        variableName
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar variável de usuário' }
    }
  },

  // ========================================
  // ENDPOINTS DE WEBHOOKS
  // ========================================

  // Listar webhooks
  getWebhooks: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/webhooks/list', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar webhooks' }
    }
  },

  // Criar webhook
  createWebhook: async (sessionid, appId, endpoint, userAgent) => {
    try {
      const response = await api.post('/api/webhooks/create', {
        sessionid,
        appId,
        endpoint,
        userAgent
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar webhook' }
    }
  },

  // Deletar webhook
  deleteWebhook: async (sessionid, appId, webhookId) => {
    try {
      const response = await api.post('/api/webhooks/delete', {
        sessionid,
        appId,
        webhookId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar webhook' }
    }
  },

  // Deletar todos os webhooks
  deleteAllWebhooks: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/webhooks/delete-all', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar webhooks' }
    }
  },

  // Testar webhook
  testWebhook: async (sessionid, appId, webhookId, testMessage) => {
    try {
      const response = await api.post('/api/webhooks/test', {
        sessionid,
        appId,
        webhookId,
        testMessage
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao testar webhook' }
    }
  },

  // ========================================
  // ANTI-CRACK API
  // ========================================

  // Verificar status Anti-Crack
  getAntiCrackStatus: async (type, name, ownerid, sessionid, hash, enckey) => {
    try {
      const response = await api.post('/api/1.3/anticrack/status', {
        type,
        name,
        ownerid,
        sessionid,
        hash,
        enckey
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao verificar status Anti-Crack' }
    }
  },

  // Reportar ameaça detectada
  reportAntiCrackThreat: async (type, name, ownerid, sessionid, hash, enckey, threat_type, threat_data) => {
    try {
      const response = await api.post('/api/1.3/anticrack/report', {
        type,
        name,
        ownerid,
        sessionid,
        hash,
        enckey,
        threat_type,
        threat_data
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao reportar ameaça' }
    }
  },

  // Salvar log de detecção no banco de dados
  saveAntiCrackLog: async (sessionid, appName, ownerId, threatType, threatData, severity) => {
    try {
      const response = await api.post('/api/anticrack/save-log', {
        sessionid,
        app_name: appName,
        owner_id: ownerId,
        threat_type: threatType,
        threat_data: threatData,
        severity
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao salvar log' }
    }
  },

  // Carregar logs de detecção do banco de dados
  getAntiCrackLogs: async (sessionid, appName, ownerId) => {
    try {
      const response = await api.post('/api/anticrack/get-logs', {
        sessionid,
        app_name: appName,
        owner_id: ownerId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao carregar logs' }
    }
  }
}

// Serviço de Chat
export const chatService = {
  // Criar novo ticket
  createTicket: async (sessionid, subject, message) => {
    try {
      const response = await api.post('/api/chat/create-ticket', {
        sessionid,
        subject,
        message
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar ticket' }
    }
  },

  // Enviar mensagem
  sendMessage: async (sessionid, ticket_id, message, imageFile = null) => {
    try {
      const formData = new FormData()
      formData.append('sessionid', sessionid)
      formData.append('ticket_id', ticket_id)
      formData.append('message', message || '')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await api.post('/api/chat/send-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao enviar mensagem' }
    }
  },

  // Listar tickets do usuário
  getTickets: async (sessionid) => {
    try {
      const response = await api.post('/api/chat/tickets', {
        sessionid
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar tickets' }
    }
  },

  // Obter mensagens de um ticket
  getMessages: async (sessionid, ticket_id) => {
    try {
      const response = await api.post('/api/chat/messages', {
        sessionid,
        ticket_id
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter mensagens' }
    }
  }
}

// Serviço de Chat Admin
export const adminChatService = {
  // Listar todos os tickets
  getTickets: async (sessionid, status, assigned_to) => {
    try {
      const response = await api.post('/api/admin/chat/tickets', {
        sessionid,
        status,
        assigned_to
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar tickets' }
    }
  },

  // Atribuir ticket
  assignTicket: async (sessionid, ticket_id, assigned_to) => {
    try {
      const response = await api.post('/api/admin/chat/assign', {
        sessionid,
        ticket_id,
        assigned_to
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atribuir ticket' }
    }
  },

  // Atualizar status
  updateStatus: async (sessionid, ticket_id, status) => {
    try {
      const response = await api.post('/api/admin/chat/update-status', {
        sessionid,
        ticket_id,
        status
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar status' }
    }
  },

  // Obter mensagens
  getMessages: async (sessionid, ticket_id) => {
    try {
      const response = await api.post('/api/admin/chat/messages', {
        sessionid,
        ticket_id
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter mensagens' }
    }
  },

  // Enviar mensagem como staff
  sendMessage: async (sessionid, ticket_id, message, imageFile = null) => {
    try {
      const formData = new FormData()
      formData.append('sessionid', sessionid)
      formData.append('ticket_id', ticket_id)
      formData.append('message', message || '')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await api.post('/api/admin/chat/send-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao enviar mensagem' }
    }
  }
}

// Serviço de Pagamento
export const paymentService = {
  // Criar preferência de pagamento
  createPreference: async (sessionid, plan, period) => {
    try {
      const response = await api.post('/api/payment/create-preference', {
        sessionid,
        plan,
        period
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar preferência de pagamento' }
    }
  },

  // Verificar status do pagamento
  checkStatus: async (sessionid, external_reference, payment_id = null) => {
    try {
      const response = await api.post('/api/payment/check-status', {
        sessionid,
        external_reference,
        payment_id
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao verificar status do pagamento' }
    }
  },

  // Criar pagamento PIX direto (com QR Code)
  createPix: async (sessionid, plan, period) => {
    try {
      const response = await api.post('/api/payment/create-pix', {
        sessionid,
        plan,
        period
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar pagamento PIX' }
    }
  }
}

// Serviço de Arquivos
export const fileService = {
  // Listar arquivos de uma aplicação
  getFiles: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/get-files', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao listar arquivos' }
    }
  },

  // Adicionar arquivo
  addFile: async (sessionid, appId, fileUrl, filename, authenticated = false) => {
    try {
      const response = await api.post('/api/add-file', {
        sessionid,
        appId,
        fileUrl,
        filename,
        authenticated
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao adicionar arquivo' }
    }
  },

  // Deletar arquivo
  deleteFile: async (sessionid, appId, fileId) => {
    try {
      const response = await api.post('/api/delete-file', {
        sessionid,
        appId,
        fileId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar arquivo' }
    }
  },

  // Deletar todos os arquivos
  deleteAllFiles: async (sessionid, appId) => {
    try {
      const response = await api.post('/api/delete-all-files', {
        sessionid,
        appId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao deletar todos os arquivos' }
    }
  }
}

export default api

