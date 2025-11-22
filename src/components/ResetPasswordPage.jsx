import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import './ResetPasswordPage.css'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Solicitar reset, 2: Inserir código e nova senha
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [codeSent, setCodeSent] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar mensagens ao digitar
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!formData.username && !formData.email) {
        setMessage({ type: 'error', text: 'Por favor, informe username ou email' })
        setIsLoading(false)
        return
      }

      const result = await authService.forgotPassword(
        formData.username || null,
        formData.email || null
      )

      if (result.success) {
        setCodeSent(true)
        setMessage({ type: 'success', text: result.message || 'Código de recuperação enviado! Verifique seu email.' })
        setStep(2)
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao solicitar recuperação de senha' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao solicitar recuperação de senha' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Validações
      if (!formData.code || formData.code.length !== 6) {
        setMessage({ type: 'error', text: 'Por favor, informe o código de 6 dígitos' })
        setIsLoading(false)
        return
      }

      if (!formData.newPassword || formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' })
        setIsLoading(false)
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'As senhas não coincidem' })
        setIsLoading(false)
        return
      }

      if (!formData.username && !formData.email) {
        setMessage({ type: 'error', text: 'Username ou email é obrigatório' })
        setIsLoading(false)
        return
      }

      const result = await authService.resetPassword(
        formData.username || null,
        formData.email || null,
        formData.code,
        formData.newPassword
      )

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Senha redefinida com sucesso! Redirecionando...' })
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao resetar senha' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao resetar senha' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/')
  }

  return (
    <div className="reset-password-container">
      <header className="reset-password-header">
        <div className="reset-password-header-content">
          <div className="reset-password-logo">
            <span className="logo-key">Gou</span>
            <span className="logo-unit">Auth</span>
          </div>
          <nav className="reset-password-nav">
            <a href="/" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/') }}>Home</a>
            <a href="/termos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/termos') }}>Termos</a>
            <a href="/planos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/planos') }}>Planos</a>
            <a href="/videos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/videos') }}>Videos</a>
          </nav>
        </div>
      </header>

      <div className="reset-password-content">
        <div className="reset-password-card">
          <div className="reset-password-header-section">
            <button 
              className="reset-password-back-btn"
              onClick={handleBackToLogin}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Voltar para Login
            </button>
            <h1 className="reset-password-title">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Recuperar Senha
            </h1>
            <p className="reset-password-subtitle">
              {step === 1 
                ? 'Informe seu username ou email para receber um código de recuperação'
                : 'Digite o código enviado por email e sua nova senha'}
            </p>
          </div>

          {message.text && (
            <div className={`reset-password-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestReset} className="reset-password-form">
              <div className="reset-password-input-group">
                <label htmlFor="username">Username</label>
                <div className="reset-password-input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Digite seu username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <p className="reset-password-input-help">OU</p>
              </div>

              <div className="reset-password-input-group">
                <label htmlFor="email">Email</label>
                <div className="reset-password-input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="reset-password-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    Enviar Código de Recuperação
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="reset-password-form">
              <div className="reset-password-input-group">
                <label htmlFor="code">Código de Verificação</label>
                <div className="reset-password-input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    placeholder="Digite o código de 6 dígitos"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    maxLength="6"
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>

              <div className="reset-password-input-group">
                <label htmlFor="newPassword">Nova Senha</label>
                <div className="reset-password-input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="Digite sua nova senha"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    minLength="6"
                  />
                </div>
              </div>

              <div className="reset-password-input-group">
                <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                <div className="reset-password-input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    minLength="6"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="reset-password-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Redefinindo...</span>
                ) : (
                  <>
                    Redefinir Senha
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                className="reset-password-resend-btn"
                onClick={() => {
                  setStep(1)
                  setFormData(prev => ({ ...prev, code: '', newPassword: '', confirmPassword: '' }))
                  setCodeSent(false)
                  setMessage({ type: '', text: '' })
                }}
                disabled={isLoading}
              >
                Solicitar novo código
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

