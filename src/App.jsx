import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import AdminAuthPage from './components/AdminAuthPage'
import AdminDashboard from './components/AdminDashboard'
import AccessDenied from './components/AccessDenied'
import TermosPage from './components/TermosPage'
import PlanosPage from './components/PlanosPage'
import VideosPage from './components/VideosPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import PaymentPage from './components/PaymentPage'
import { authService, adminService } from './services/api'
import './App.css'

// Componente para verificar autenticação e mostrar Dashboard ou AuthPage
function HomeRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const sessionid = localStorage.getItem('sessionid')
      const username = localStorage.getItem('username')
      
      if (sessionid && username) {
        try {
          const response = await authService.verify(sessionid)
          if (response.success) {
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
            localStorage.removeItem('sessionid')
            localStorage.removeItem('username')
          }
        } catch (error) {
          setIsAuthenticated(false)
          localStorage.removeItem('sessionid')
          localStorage.removeItem('username')
        }
      } else {
        setIsAuthenticated(false)
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner-large">
          <svg className="spinner-svg" viewBox="0 0 50 50">
            <circle className="spinner-circle" cx="25" cy="25" r="20" />
          </svg>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Dashboard /> : <AuthPage />
}

// Singleton para verificação de admin - garante apenas uma verificação por vez
// Usa sessionStorage para persistir entre renderizações
const adminVerificationManager = {
  CACHE_DURATION: 30000, // 30 segundos de cache
  
  async verify() {
    const now = Date.now()
    const cacheKey = 'admin_verification_cache'
    const cacheTimeKey = 'admin_verification_time'
    const verifyingKey = 'admin_verification_in_progress'
    
    // Verificar cache no sessionStorage
    try {
      const cachedTime = sessionStorage.getItem(cacheTimeKey)
      const cachedResult = sessionStorage.getItem(cacheKey)
      const isVerifying = sessionStorage.getItem(verifyingKey) === 'true'
      
      if (cachedTime && cachedResult) {
        const timeSinceVerification = now - parseInt(cachedTime)
        if (timeSinceVerification < this.CACHE_DURATION) {
          // Retornar resultado do cache
          return cachedResult === 'true'
        }
      }
      
      // Se já está verificando, aguardar um pouco e verificar novamente
      if (isVerifying) {
        // Aguardar 100ms e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 100))
        return this.verify() // Retry
      }
    } catch (error) {
      console.error('Erro ao verificar cache:', error)
    }
    
    // Marcar como verificando
    try {
      sessionStorage.setItem(verifyingKey, 'true')
    } catch (error) {
      console.error('Erro ao marcar como verificando:', error)
    }
    
    const sessionid = localStorage.getItem('admin_sessionid')
    const username = localStorage.getItem('admin_username')
    
    if (!sessionid || !username) {
      try {
        sessionStorage.removeItem(verifyingKey)
        sessionStorage.setItem(cacheKey, 'false')
        sessionStorage.setItem(cacheTimeKey, now.toString())
      } catch (error) {
        console.error('Erro ao atualizar cache:', error)
      }
      return false
    }
    
    try {
      // Fazer verificação
      const response = await adminService.verify(sessionid)
      const isAuthenticated = response && response.success === true && response.is_admin === true
      
      // Atualizar cache
      try {
        sessionStorage.setItem(cacheKey, isAuthenticated.toString())
        sessionStorage.setItem(cacheTimeKey, now.toString())
        sessionStorage.removeItem(verifyingKey)
      } catch (error) {
        console.error('Erro ao atualizar cache:', error)
      }
      
      return isAuthenticated
    } catch (error) {
      console.error('❌ [AdminProtectedRoute] Erro ao verificar admin:', error)
      try {
        sessionStorage.setItem(cacheKey, 'false')
        sessionStorage.setItem(cacheTimeKey, now.toString())
        sessionStorage.removeItem(verifyingKey)
      } catch (e) {
        console.error('Erro ao atualizar cache:', e)
      }
      return false
    }
  },
  
  clearCache() {
    try {
      sessionStorage.removeItem('admin_verification_cache')
      sessionStorage.removeItem('admin_verification_time')
      sessionStorage.removeItem('admin_verification_in_progress')
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
    }
  }
}

// Componente para verificar autenticação do admin
function AdminProtectedRoute({ children }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // Garantir que só execute uma vez
    if (hasCheckedRef.current) {
      return
    }
    hasCheckedRef.current = true
    
    const checkAdminAuth = async () => {
      try {
        // Verificar se há sessionid de usuário normal e remover
        const normalSessionid = localStorage.getItem('sessionid')
        if (normalSessionid) {
          // Verificar se o usuário normal não é admin
          try {
            const normalResponse = await authService.verify(normalSessionid)
            if (normalResponse && normalResponse.success && !normalResponse.is_admin) {
              // Usuário normal tentando acessar admin - redirecionar
              console.warn('⚠️ [AdminProtectedRoute] Usuário normal tentou acessar área de admin')
              setIsAdminAuthenticated(false)
              localStorage.removeItem('admin_sessionid')
              localStorage.removeItem('admin_username')
              adminVerificationManager.clearCache()
              setIsLoading(false)
              return
            }
          } catch (e) {
            // Ignorar erro, continuar verificação
          }
        }

        const result = await adminVerificationManager.verify()
        
        // Verificação adicional: garantir que o resultado seja verdadeiro e que is_admin seja true
        if (!result) {
          setIsAdminAuthenticated(false)
          localStorage.removeItem('admin_sessionid')
          localStorage.removeItem('admin_username')
          adminVerificationManager.clearCache()
        } else {
          // Verificação dupla: chamar o endpoint novamente para garantir
          const adminSessionid = localStorage.getItem('admin_sessionid')
          if (adminSessionid) {
            try {
              const verifyResponse = await adminService.verify(adminSessionid)
              if (verifyResponse && verifyResponse.success === true && verifyResponse.is_admin === true) {
                setIsAdminAuthenticated(true)
              } else {
                setIsAdminAuthenticated(false)
                localStorage.removeItem('admin_sessionid')
                localStorage.removeItem('admin_username')
                adminVerificationManager.clearCache()
              }
            } catch (verifyError) {
              console.error('❌ [AdminProtectedRoute] Erro na verificação dupla:', verifyError)
              setIsAdminAuthenticated(false)
              localStorage.removeItem('admin_sessionid')
              localStorage.removeItem('admin_username')
              adminVerificationManager.clearCache()
            }
          } else {
            setIsAdminAuthenticated(false)
            adminVerificationManager.clearCache()
          }
        }
      } catch (error) {
        console.error('❌ [AdminProtectedRoute] Erro ao verificar:', error)
        setIsAdminAuthenticated(false)
        localStorage.removeItem('admin_sessionid')
        localStorage.removeItem('admin_username')
        adminVerificationManager.clearCache()
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAuth()
  }, []) // Executar apenas uma vez quando o componente montar

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner-large">
          <svg className="spinner-svg" viewBox="0 0 50 50">
            <circle className="spinner-circle" cx="25" cy="25" r="20" />
          </svg>
        </div>
      </div>
    )
  }
  
  if (!isAdminAuthenticated) {
    // Limpar qualquer sessão de usuário normal que possa estar ativa
    localStorage.removeItem('sessionid')
    localStorage.removeItem('username')
    return <Navigate to="/secure/access" replace />
  }

  return children
}

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Rota de login/admin - URL oculta para segurança */}
        <Route path="/secure/access" element={<AdminAuthPage />} />
        
        {/* Rota secreta do dashboard admin */}
        <Route 
          path="/secure/dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />
        
        {/* Rota /admin - mostrar página 404 ao invés de redirecionar */}
        <Route path="/admin" element={<AccessDenied />} />
        
        {/* Rota de Termos - página pública */}
        <Route path="/termos" element={<TermosPage />} />
        
        {/* Rota de Planos - página pública */}
        <Route path="/planos" element={<PlanosPage />} />
        
        {/* Rota de Videos - página pública */}
        <Route path="/videos" element={<VideosPage />} />

        {/* Rota de Reset de Senha - página pública */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rota de Pagamento - requer autenticação */}
        <Route path="/payment" element={<PaymentPage />} />

        {/* Rota padrão - verifica autenticação e mostra Dashboard ou AuthPage */}
        <Route path="/" element={<HomeRoute />} />
        
        {/* Redirecionar qualquer rota desconhecida para / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

