import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/api'
import './AdminAuthPage.css'

const AdminAuthPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await adminService.login(formData.username, formData.password)
      
      if (response && response.success) {
        if (response.info && response.info.sessionid) {
          const sessionId = response.info.sessionid
          const username = response.info.username
          
          // Salvar no localStorage
          localStorage.setItem('admin_sessionid', sessionId)
          localStorage.setItem('admin_username', username)
          
          setMessage({ type: 'success', text: 'Login realizado com sucesso! Redirecionando...' })
          
          // Usar navigate ao invés de window.location.href para melhor integração com React Router
          navigate('/secure/dashboard', { replace: true })
        } else {
          setMessage({ type: 'error', text: 'Sessão não retornada pelo servidor. Verifique se o usuário é administrador.' })
          setIsLoading(false)
        }
      } else {
        const errorMessage = response?.message || 'Erro desconhecido'
        setMessage({ type: 'error', text: errorMessage })
        setIsLoading(false)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao processar requisição'
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-content">
        <div className="admin-auth-header">
          <div className="admin-auth-logo">
            <span className="logo-key">Gou</span>
            <span className="logo-unit">Auth</span>
            <span className="logo-admin">Admin</span>
          </div>
          <h1 className="admin-auth-title">Painel de Administração</h1>
          <p className="admin-auth-subtitle">Acesso restrito a administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <div className="admin-input-group">
            <div className="admin-input-wrapper">
              <div className="admin-input-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Username Admin"
                className="admin-professional-input"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <div className="admin-input-wrapper">
              <div className="admin-input-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Password"
                className="admin-professional-input"
              />
            </div>
          </div>

          {message.text && (
            <div className={`admin-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="admin-auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="admin-loading-spinner">
                <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                  <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                </svg>
                Verificando...
              </span>
            ) : (
              <>
                Entrar como Admin
                <svg className="admin-arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                  <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="admin-auth-footer">
          <p className="admin-auth-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Apenas usuários com privilégios de administrador podem acessar
          </p>
          <a href="/" className="admin-back-link">← Voltar para o site</a>
        </div>
      </div>
    </div>
  )
}

export default AdminAuthPage

