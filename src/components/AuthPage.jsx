import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import './AuthPage.css'

const AuthPage = () => {
  const navigate = useNavigate()
  const [showHome, setShowHome] = useState(true) // Estado para controlar Home/Login
  const [isLogin, setIsLogin] = useState(true)
  
  // Detecção automática do tamanho da tela
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }
    
    // Verificar na montagem
    checkScreenSize()
    
    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    verificationCode: '',
    twoFactor: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const [message, setMessage] = useState({ type: '', text: '' })
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [showSendingAnimation, setShowSendingAnimation] = useState(false)
  
  // Sistema de etapas para registro
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrors, setStepErrors] = useState({})
  
  // Estados para 2FA no login
  const [requires2FA, setRequires2FA] = useState(false)
  const [tempSession, setTempSession] = useState(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [isSending2FA, setIsSending2FA] = useState(false)
  const [hasEmail, setHasEmail] = useState(false)
  
  // Estados para recuperação de senha
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1) // 1: solicitar usuário/email, 2: escolher email, 3: resetar senha
  const [forgotPasswordData, setForgotPasswordData] = useState({
    usernameOrEmail: '',
    selectedEmail: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [resetCodeSent, setResetCodeSent] = useState(false)
  const [isLoadingEmails, setIsLoadingEmails] = useState(false)
  const [availableEmails, setAvailableEmails] = useState([])
  

  
  // Função para mostrar o formulário de login
  const handleShowLogin = () => {
    setShowHome(false)
    setIsLogin(true)
    setRequires2FA(false)
    setTempSession(null)
    setTwoFactorCode('')
    setHasEmail(false)
  }
  
  // Componentes SVG animados para cada etapa
  const StepIconSVG = ({ stepId, isActive, isCompleted }) => {
    if (isCompleted) {
      return (
        <svg className="step-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle className="check-circle" cx="12" cy="12" r="10"/>
          <polyline className="check-mark" points="9 12 11 14 15 10"/>
        </svg>
      )
    }

    if (stepId === 1) {
      // Ícone de documento com animação
      return (
        <svg className="step-icon-svg document-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className="document-path" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline className="document-fold" points="14 2 14 8 20 8"/>
          <line className="document-line line1" x1="9" y1="12" x2="15" y2="12" strokeLinecap="round"/>
          <line className="document-line line2" x1="9" y1="16" x2="15" y2="16" strokeLinecap="round"/>
          <line className="document-line line3" x1="9" y1="20" x2="13" y2="20" strokeLinecap="round"/>
        </svg>
      )
    }

    if (stepId === 2) {
      // Ícone de email com animação
      return (
        <svg className="step-icon-svg email-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect className="email-path" x="2" y="4" width="20" height="16" rx="2"/>
          <path className="email-fold" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          <circle className="email-dot" cx="12" cy="9.5" r="1" fill="currentColor"/>
        </svg>
      )
    }

    if (stepId === 3) {
      // Ícone de confirmação/check
      return (
        <svg className="step-icon-svg confirm-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle className="confirm-circle" cx="12" cy="12" r="10"/>
          <path className="confirm-mark" d="m9 12 2 2 4-4"/>
        </svg>
      )
    }

    return null
  }

  // Etapas do registro
  const REGISTER_STEPS = [
    { id: 1, title: 'Informações Básicas', description: 'Crie seu usuário e senha' },
    { id: 2, title: 'Verificação de Email', description: 'Confirme seu endereço de email' },
    { id: 3, title: 'Confirmação', description: 'Finalize seu cadastro' }
  ]

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setMessage({ type: '', text: '' })
  }

  // Validação de cada etapa
  const validateStep = (step) => {
    const errors = {}
    
    if (step === 1) {
      if (!formData.username || formData.username.length < 3) {
        errors.username = 'Username deve ter pelo menos 3 caracteres'
      }
      if (!formData.password || formData.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres'
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email inválido'
      }
    } else if (step === 2) {
      if (!formData.verificationCode || formData.verificationCode.length !== 6) {
        errors.verificationCode = 'Código de verificação deve ter 6 dígitos'
      }
    }
    
    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Avançar para próxima etapa
  const handleNextStep = async () => {
    if (!validateStep(currentStep)) {
      return
    }
    
    // Se está na etapa 1, avançar para etapa 2 e enviar código
    if (currentStep === 1) {
      // Primeiro, mostrar animação de envio e esconder campos
      setShowSendingAnimation(true)
      setIsSendingCode(true)
      setMessage({ type: '', text: '' })
      
      // Aguardar um pouco para mostrar a animação antes de fazer a requisição
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        const response = await authService.sendVerificationCode(
          formData.email, 
          formData.username, 
          formData.password
        )
        
        if (response.success) {
          setMessage({ 
            type: 'success', 
            text: response.debug?.code 
              ? `Código enviado! Use: ${response.debug.code}` 
              : response.message || 'Código de verificação enviado para seu email!' 
          })
          setCodeSent(true)
          // Aguardar um pouco antes de mudar de etapa para mostrar a mensagem de sucesso
          setTimeout(() => {
            setShowSendingAnimation(false)
            setCurrentStep(2)
          }, 1000)
        } else {
          setMessage({ 
            type: 'error', 
            text: response.message || 'Erro ao enviar código de verificação' 
          })
        }
      } catch (error) {
        // Construir mensagem de erro mais informativa
        let errorMessage = 'Erro ao enviar código de verificação'
        
        if (error?.message) {
          errorMessage = error.message
        } else if (error?.error) {
          errorMessage = error.error
        } else if (error?.responseData?.message) {
          errorMessage = error.responseData.message
        }
        
        // Mensagens específicas para diferentes tipos de erro
        if (error?.isTimeout || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout') || error?.message?.includes('Tempo de espera esgotado')) {
          errorMessage = error?.message || 'Tempo de espera esgotado. O servidor demorou muito para responder. Por favor, verifique sua conexão e tente novamente.'
        } else if (error?.hasEmptyResponse) {
          errorMessage = 'Erro interno do servidor. O servidor não conseguiu processar a solicitação. Verifique se o servidor está rodando e tente novamente.'
        } else if (error?.isServerError && error?.status === 500) {
          if (!errorMessage.includes('servidor')) {
            errorMessage = `Erro interno do servidor: ${errorMessage}`
          }
        } else if (error?.isNetworkError) {
          errorMessage = 'Erro de conexão. Verifique sua internet e se o servidor está acessível.'
        } else if (error?.status === 400) {
          errorMessage = errorMessage || 'Dados inválidos. Verifique os campos preenchidos.'
        } else if (error?.status === 401) {
          errorMessage = errorMessage || 'Não autorizado. Verifique suas credenciais.'
        } else if (error?.status === 404) {
          errorMessage = 'Endpoint não encontrado. Verifique se o servidor está configurado corretamente.'
        } else if (error?.status) {
          errorMessage += ` (Status HTTP: ${error.status})`
        }
        setMessage({ 
          type: 'error', 
          text: errorMessage
        })
        setShowSendingAnimation(false)
      } finally {
        setIsSendingCode(false)
      }
    } else if (currentStep === 2) {
      // Se está na etapa 2, avançar para etapa 3 e finalizar registro
      setCurrentStep(3)
      handleFinalRegistration()
    }
  }

  // Voltar para etapa anterior
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setMessage({ type: '', text: '' })
      setStepErrors({})
    }
  }

  // Finalizar registro
  const handleFinalRegistration = async () => {
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authService.register(
        formData.username,
        formData.password,
        formData.email,
        formData.verificationCode
      )

      if (response.success) {
        setMessage({ type: 'success', text: response.message })
        if (response.info?.sessionid) {
          localStorage.setItem('sessionid', response.info.sessionid)
          localStorage.setItem('username', response.info.username)
        }
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao processar registro' 
      })
      setCurrentStep(2) // Voltar para etapa 2 em caso de erro
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerificationCode = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    await handleNextStep()
  }

  // Enviar código 2FA durante login
  const handleSendLogin2FA = async () => {
    if (!tempSession) return
    
    setIsSending2FA(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authService.sendLogin2FA(tempSession)
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: response.debug?.code 
            ? `Código enviado! Use: ${response.debug.code}` 
            : response.message || 'Código de verificação enviado para seu email!' 
        })
        setCodeSent(true)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao enviar código 2FA' 
      })
    } finally {
      setIsSending2FA(false)
    }
  }

  // Verificar código 2FA e finalizar login
  const handleVerifyLogin2FA = async (e) => {
    e.preventDefault()
    
    if (!tempSession || !twoFactorCode) {
      setMessage({ type: 'error', text: 'Por favor, insira o código de verificação' })
      return
    }
    
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authService.verifyLogin2FA(tempSession, twoFactorCode, 'email')
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Login realizado com sucesso' })
        if (response.info?.sessionid) {
          localStorage.setItem('sessionid', response.info.sessionid)
          localStorage.setItem('username', response.info.username)
        }
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Código de verificação inválido' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar emails associados ao username/email
  const handleSearchEmails = async (e) => {
    e.preventDefault()
    
    if (!forgotPasswordData.usernameOrEmail) {
      setMessage({ type: 'error', text: 'Por favor, informe seu username ou email' })
      return
    }
    
    setIsLoadingEmails(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authService.getUserEmails(
        forgotPasswordData.usernameOrEmail.includes('@') ? undefined : forgotPasswordData.usernameOrEmail,
        forgotPasswordData.usernameOrEmail.includes('@') ? forgotPasswordData.usernameOrEmail : undefined
      )
      
      if (response.success) {
        if (response.emails && Array.isArray(response.emails) && response.emails.length > 0) {
          setAvailableEmails(response.emails)
          setForgotPasswordStep(2)
        } else {
          setMessage({ 
            type: 'error', 
            text: 'Nenhum email cadastrado encontrado para este usuário' 
          })
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao buscar emails cadastrados' 
      })
    } finally {
      setIsLoadingEmails(false)
    }
  }

  // Enviar código para email selecionado
  const handleSendCodeToEmail = async (selectedEmail) => {
    setForgotPasswordData({ ...forgotPasswordData, selectedEmail })
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authService.forgotPassword(
        forgotPasswordData.usernameOrEmail.includes('@') ? undefined : forgotPasswordData.usernameOrEmail,
        selectedEmail
      )
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Código de recuperação enviado para seu email' })
        setResetCodeSent(true)
        setForgotPasswordStep(3)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao enviar código de recuperação' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Resetar senha com código
  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!forgotPasswordData.code) {
      setMessage({ type: 'error', text: 'Por favor, informe o código de recuperação' })
      return
    }
    
    if (!forgotPasswordData.newPassword) {
      setMessage({ type: 'error', text: 'Por favor, informe a nova senha' })
      return
    }
    
    if (forgotPasswordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' })
      return
    }
    
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }
    
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await authService.resetPassword(
        forgotPasswordData.usernameOrEmail.includes('@') ? undefined : forgotPasswordData.usernameOrEmail,
        forgotPasswordData.selectedEmail,
        forgotPasswordData.code,
        forgotPasswordData.newPassword
      )
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Senha redefinida com sucesso! Redirecionando para login...' })
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotPasswordStep(1)
          setForgotPasswordData({
            usernameOrEmail: '',
            selectedEmail: '',
            code: '',
            newPassword: '',
            confirmPassword: ''
          })
          setAvailableEmails([])
          setResetCodeSent(false)
          setMessage({ type: '', text: '' })
        }, 2000)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao redefinir senha' 
      })
    } finally {
      setIsLoading(false)
    }
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isLogin) {
      // Se já está aguardando 2FA, verificar código
      if (requires2FA) {
        await handleVerifyLogin2FA(e)
        return
      }
      
      setIsLoading(true)
      setMessage({ type: '', text: '' })
      
      try {
        const response = await authService.login(formData.username, formData.password)
        
        if (response.success) {
          // Verificar se precisa de 2FA
          if (response.requires_2fa) {
            setRequires2FA(true)
            setTempSession(response.temp_session)
            setHasEmail(response.has_email || false)
            setMessage({ 
              type: 'info', 
              text: response.message || 'Código 2FA necessário para completar o login' 
            })
            
            // Enviar código 2FA automaticamente se tiver email
            if (response.has_email) {
              setTimeout(() => {
                handleSendLogin2FA()
              }, 500)
            }
          } else {
            // Login sem 2FA
            setMessage({ type: 'success', text: response.message })
            if (response.info?.sessionid) {
              localStorage.setItem('sessionid', response.info.sessionid)
              localStorage.setItem('username', response.info.username)
            }
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
        }
      } catch (error) {
        // Verificar se é erro de timeout
        let errorMessage = error.message || 'Erro ao processar requisição'
        if (error?.isTimeout || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout') || error?.message?.includes('Tempo de espera esgotado')) {
          errorMessage = error?.message || 'Tempo de espera esgotado. O servidor demorou muito para responder. Por favor, verifique sua conexão e tente novamente.'
        }
        setMessage({ 
          type: 'error', 
          text: errorMessage
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      // No modo registro, usar sistema de etapas
      handleNextStep()
    }
  }

  // Componente da Página Home
  const HomePage = () => (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-main-content">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span>BEM-VINDO AO</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-title-key">GOU</span>
              <span className="hero-title-unit">AUTH</span>
            </h1>
            <p className="hero-description">
              Sistema profissional de autenticação e gerenciamento de licenças. 
              Controle total sobre seus usuários, aplicações e assinaturas.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary" onClick={handleShowLogin}>
                <span>Entrar</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="hero-btn-secondary" onClick={() => { setShowHome(false); setIsLogin(false) }}>
                <span>Criar Conta</span>
              </button>
            </div>
          </div>
          
          {/* Hero Illustration */}
          <div className="hero-illustration">
            <div className="dashboard-image-container">
              <div className="dashboard-image-frame">
                {(() => {
                  const heroImageEnv = import.meta.env.VITE_HERO_IMAGE_URL;
                  const defaultHero = 'https://i.imgur.com/oKgEGtk.png';
                  const heroSrc = heroImageEnv && heroImageEnv.trim().length > 0 
                    ? heroImageEnv 
                    : defaultHero;
                  return (
                    <img 
                      src={heroSrc}
                      alt="Preview"
                      className="dashboard-preview-image"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  );
                })()}
                <div className="dashboard-image-border"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Languages Carousel Container */}
        <div className="languages-carousel-container">
          <h2 className="languages-carousel-title">Integre em qualquer linguagem de programação</h2>
          <div className="languages-carousel-wrapper">
            <div className="languages-carousel-track">
              {/* Primeira cópia das linguagens */}
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" />
                <span>JavaScript</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" />
                <span>TypeScript</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" />
                <span>Python</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" />
                <span>Java</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" />
                <span>C#</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" />
                <span>C++</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg" alt="C" />
                <span>C</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original-wordmark.svg" alt="Go" />
                <span>Go</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" />
                <span>Ruby</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" />
                <span>PHP</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg" alt="Rust" />
                <span>Rust</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" />
                <span>Kotlin</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" />
                <span>Swift</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg" alt="Dart" />
                <span>Dart</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/lua/lua-original.svg" alt="Lua" />
                <span>Lua</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/r/r-original.svg" alt="R" />
                <span>R</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="Node.js" />
                <span>Node.js</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/elixir/elixir-original.svg" alt="Elixir" />
                <span>Elixir</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/clojure/clojure-original.svg" alt="Clojure" />
                <span>Clojure</span>
              </div>
              {/* Segunda cópia das linguagens para loop infinito */}
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" />
                <span>JavaScript</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" />
                <span>TypeScript</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" />
                <span>Python</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" />
                <span>Java</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" />
                <span>C#</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" />
                <span>C++</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg" alt="C" />
                <span>C</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original-wordmark.svg" alt="Go" />
                <span>Go</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" />
                <span>Ruby</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" />
                <span>PHP</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg" alt="Rust" />
                <span>Rust</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" />
                <span>Kotlin</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" />
                <span>Swift</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg" alt="Dart" />
                <span>Dart</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/lua/lua-original.svg" alt="Lua" />
                <span>Lua</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/r/r-original.svg" alt="R" />
                <span>R</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="Node.js" />
                <span>Node.js</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/elixir/elixir-original.svg" alt="Elixir" />
                <span>Elixir</span>
              </div>
              <div className="language-item">
                <img className="h-8 opacity-80" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/clojure/clojure-original.svg" alt="Clojure" />
                <span>Clojure</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Funcionalidades Principais</h2>
            <p className="features-subtitle">Tudo que você precisa para gerenciar suas aplicações</p>
          </div>
          
          <div className="features-grid">
            {/* Feature 1: Gerenciamento de Aplicações */}
            <div className="feature-card">
              <div className="feature-card-number">01</div>
              <div className="feature-card-icon">
                <svg className="feature-card-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <path d="M7 8h10M7 19h10M8 7v12M17 7v12"/>
                </svg>
              </div>
              <h3 className="feature-card-title">Gerenciamento de Aplicações</h3>
              <p className="feature-card-description">
                Crie e gerencie múltiplas aplicações de forma centralizada. 
                Controle completo sobre cada aplicação com credenciais únicas.
              </p>
              <div className="feature-card-glow"></div>
            </div>
            
            {/* Feature 2: Sistema de Licenças */}
            <div className="feature-card">
              <div className="feature-card-number">02</div>
              <div className="feature-card-icon">
                <svg className="feature-card-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                </svg>
              </div>
              <h3 className="feature-card-title">Sistema de Licenças</h3>
              <p className="feature-card-description">
                Gere e gerencie licenças de forma automática. 
                Controle de expiração, renovação e ativação de licenças.
              </p>
              <div className="feature-card-glow"></div>
            </div>
            
            {/* Feature 3: Controle de Usuários */}
            <div className="feature-card">
              <div className="feature-card-number">03</div>
              <div className="feature-card-icon">
                <svg className="feature-card-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  <path d="M12 11h.01"/>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8"/>
                </svg>
              </div>
              <h3 className="feature-card-title">Controle de Usuários</h3>
              <p className="feature-card-description">
                Gerencie usuários de forma eficiente. 
                Controle de acesso, permissões e monitoramento de atividades.
              </p>
              <div className="feature-card-glow"></div>
            </div>
            
            {/* Feature 4: Segurança Avançada */}
            <div className="feature-card">
              <div className="feature-card-number">04</div>
              <div className="feature-card-icon">
                <svg className="feature-card-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10" opacity="0.2"/>
                </svg>
              </div>
              <h3 className="feature-card-title">Segurança Avançada</h3>
              <p className="feature-card-description">
                Proteção completa com criptografia de ponta a ponta. 
                Autenticação de dois fatores e controle de acesso.
              </p>
              <div className="feature-card-glow"></div>
            </div>
            
            {/* Feature 5: API Otimizada */}
            <div className="feature-card">
              <div className="feature-card-number">05</div>
              <div className="feature-card-icon">
                <svg className="feature-card-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1M20.66 4.34l-4.24 4.24m0 6.84l4.24 4.24M3.34 19.66l4.24-4.24m0-6.84L3.34 4.34"/>
                  <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                </svg>
              </div>
              <h3 className="feature-card-title">API Otimizada</h3>
              <p className="feature-card-description">
                API rápida e eficiente para integração. 
                Suporte para múltiplas linguagens de programação.
              </p>
              <div className="feature-card-glow"></div>
            </div>
            
            {/* Feature 6: Dashboard Completo */}
            <div className="feature-card">
              <div className="feature-card-number">06</div>
              <div className="feature-card-icon">
                <svg className="feature-card-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <line x1="10" y1="10" x2="10" y2="14"/>
                  <line x1="10" y1="10" x2="7" y2="10"/>
                  <line x1="21" y1="10" x2="17" y2="10"/>
                  <line x1="21" y1="10" x2="21" y2="7"/>
                  <line x1="14" y1="21" x2="14" y2="17"/>
                  <line x1="14" y1="21" x2="10" y2="21"/>
                  <line x1="3" y1="14" x2="7" y2="14"/>
                  <line x1="3" y1="14" x2="3" y2="17"/>
                </svg>
              </div>
              <h3 className="feature-card-title">Dashboard Completo</h3>
              <p className="feature-card-description">
                Interface intuitiva e moderna. 
                Visualização de dados em tempo real e relatórios detalhados.
              </p>
              <div className="feature-card-glow"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  return (
    <div className={`auth-container ${showHome ? 'showing-home' : ''}`}>
      {/* Header de Navegação */}
      <header className={`auth-header ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}>
        <div className="auth-header-content">
          <div className="auth-logo">
            <span className="logo-key">GOU</span>
            <span className="logo-unit">AUTH</span>
          </div>
          <nav className={`auth-nav ${isMobile ? 'mobile-nav' : ''} ${isTablet ? 'tablet-nav' : ''}`}>
            <a href="#" className={`nav-link ${showHome ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setShowHome(true) }}>Home</a>
            <a href="/termos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/termos') }}>Termos</a>
            <a href="/planos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/planos') }}>Planos</a>
            <a href="/videos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/videos') }}>Videos</a>
          </nav>
        </div>
      </header>
      
      {/* Mostrar Home ou Login */}
      {showHome ? (
        <HomePage />
      ) : (
        <div className="auth-split-layout">
        {/* Formulário Centralizado */}
        <div className="auth-right-panel auth-right-panel-centered">
          <div className="auth-card">
          {/* Logo SVG acima do formulário */}
          <div className="login-logo-container">
            <svg viewBox="0 0 280 60" className="login-logo-svg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-key-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="1"/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="1"/>
                </linearGradient>
                <linearGradient id="logo-unit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#e0e7ff" stopOpacity="1"/>
                </linearGradient>
                <filter id="logo-glow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Texto "GOU" */}
              <text x="20" y="42" 
                    fill="url(#logo-key-gradient)" 
                    fontSize="42" 
                    fontWeight="800" 
                    fontFamily="Arial, sans-serif" 
                    className="logo-key-text">
                GOU
              </text>
              
              {/* Texto "AUTH" */}
              <text x="130" y="42" 
                    fill="url(#logo-unit-gradient)" 
                    fontSize="42" 
                    fontWeight="800" 
                    fontFamily="Arial, sans-serif" 
                    className="logo-unit-text">
                AUTH
              </text>
            </svg>
          </div>
          
          {/* Sistema de Etapas para Registro */}
          {!isLogin && (
            <div className="registration-steps">
              <div className="steps-indicator">
                {REGISTER_STEPS.map((step, index) => (
                  <div key={step.id} className="step-wrapper">
                    <div className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                      <div className="step-icon">
                        <StepIconSVG 
                          stepId={step.id} 
                          isActive={currentStep === step.id} 
                          isCompleted={currentStep > step.id}
                        />
                      </div>
                      <div className="step-content">
                        <div className="step-title">{step.title}</div>
                        <div className="step-description">{step.description}</div>
                      </div>
                    </div>
                    {index < REGISTER_STEPS.length - 1 && (
                      <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de Recuperação de Senha */}
          {showForgotPassword ? (
            <form className="auth-form" onSubmit={forgotPasswordStep === 1 ? handleSearchEmails : forgotPasswordStep === 3 ? handleResetPassword : (e) => e.preventDefault()}>
              {forgotPasswordStep === 1 ? (
                // Etapa 1: Solicitar username ou email
                <>
                  <div className="step-header">
                    <h3 className="step-title-large">Recuperar Senha</h3>
                    <p className="step-subtitle">Informe seu username ou email para receber o código de recuperação</p>
                  </div>

                  <div className="input-group">
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={forgotPasswordData.usernameOrEmail}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, usernameOrEmail: e.target.value })}
                        placeholder="Username ou Email"
                        className="professional-input"
                        disabled={isLoadingEmails}
                      />
                      {isLoadingEmails && (
                        <div className="input-loading-spinner">
                          <svg className="spinner-svg" viewBox="0 0 50 50" width="20" height="20">
                            <circle className="spinner-circle" cx="25" cy="25" r="20" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {message.text && (
                    <div className={`message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

                  <div className="step-navigation">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordStep(1)
                        setForgotPasswordData({
                          usernameOrEmail: '',
                          selectedEmail: '',
                          code: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                        setAvailableEmails([])
                        setMessage({ type: '', text: '' })
                      }}
                      className="step-btn step-btn-secondary"
                      disabled={isLoadingEmails}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Voltar
                    </button>
                    <button 
                      type="submit" 
                      className="step-btn step-btn-primary-reset"
                      disabled={isLoadingEmails}
                    >
                      Enviar Código
                      <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : forgotPasswordStep === 2 ? (
                // Etapa 2: Escolher email
                <>
                  <div className="step-header">
                    <h3 className="step-title-large">Escolha o Email</h3>
                    <p className="step-subtitle">Selecione o email para onde deseja receber o código de recuperação</p>
                  </div>

                  <div className="email-selection-container">
                    {availableEmails.map((email, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSendCodeToEmail(email)}
                        className="email-option-btn"
                        disabled={isLoading}
                      >
                        <div className="email-option-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                        </div>
                        <span className="email-option-text">{email}</span>
                        {isLoading && forgotPasswordData.selectedEmail === email && (
                          <svg className="spinner-svg" viewBox="0 0 50 50" width="16" height="16">
                            <circle className="spinner-circle" cx="25" cy="25" r="20" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>

                  {message.text && (
                    <div className={`message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

                  <div className="step-navigation">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordStep(1)
                        setAvailableEmails([])
                        setMessage({ type: '', text: '' })
                      }}
                      className="step-btn step-btn-secondary"
                      disabled={isLoading}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Voltar
                    </button>
                  </div>
                </>
              ) : (
                // Etapa 2: Resetar senha
                <>
                  <div className="step-header">
                    <h3 className="step-title-large">Redefinir Senha</h3>
                    <p className="step-subtitle">Digite o código recebido por email e sua nova senha</p>
                  </div>

                  <div className="input-group">
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={forgotPasswordData.code}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, code: e.target.value })}
                        placeholder="Código de recuperação (6 dígitos)"
                        maxLength="6"
                        className="professional-input"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <input
                        type="password"
                        value={forgotPasswordData.newPassword}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value })}
                        placeholder="Nova senha"
                        className="professional-input"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <input
                        type="password"
                        value={forgotPasswordData.confirmPassword}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, confirmPassword: e.target.value })}
                        placeholder="Confirmar nova senha"
                        className="professional-input"
                      />
                    </div>
                  </div>

                  {message.text && (
                    <div className={`message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

                  <div className="step-navigation">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordStep(2)
                        setForgotPasswordData({
                          ...forgotPasswordData,
                          code: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                        setMessage({ type: '', text: '' })
                      }}
                      className="step-btn step-btn-secondary"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Voltar
                    </button>
                    <button 
                      type="submit" 
                      className="step-btn step-btn-primary-reset"
                      disabled={isLoading}
                    >
                      Redefinir Senha
                      <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* Formulário Normal (Login/Registro) */
            <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin ? (
              // Formulário de Registro por Etapas
              <>
                {/* Etapa 1: Informações Básicas */}
                {currentStep === 1 && (
                  <div className="step-content-wrapper">
                    <div className="step-header">
                      <h3 className="step-title-large">Crie sua conta</h3>
                      <p className="step-subtitle">Preencha suas informações básicas</p>
                    </div>
                    
                    {/* Animação de Enviando Código */}
                    {showSendingAnimation && (
                      <div className="sending-code-animation">
                        <div className="sending-code-content">
                          <div className="sending-code-spinner">
                            <svg className="spinner-svg" viewBox="0 0 50 50">
                              <circle className="spinner-circle" cx="25" cy="25" r="20" />
                            </svg>
                          </div>
                          <h3 className="sending-code-title">Enviando código</h3>
                          <p className="sending-code-text">Aguarde enquanto enviamos o código de verificação para seu email...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Campos de entrada - escondidos durante animação */}
                    <div className={`step-fields-container ${showSendingAnimation ? 'fade-out' : ''}`}>

                      
                      <div className="input-group">
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            placeholder="Username"
                            className={`professional-input ${stepErrors.username ? 'input-error' : ''}`}
                          />
                        </div>
                        {stepErrors.username && (
                          <span className="error-message">{stepErrors.username}</span>
                        )}
                      </div>

                      <div className="input-group">
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            className={`professional-input ${stepErrors.password ? 'input-error' : ''}`}
                          />
                        </div>
                        {stepErrors.password && (
                          <span className="error-message">{stepErrors.password}</span>
                        )}
                      </div>

                      <div className="input-group">
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="4" width="20" height="16" rx="2"/>
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                            </svg>
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="Email"
                            className={`professional-input ${stepErrors.email ? 'input-error' : ''}`}
                          />
                        </div>
                        {stepErrors.email && (
                          <span className="error-message">{stepErrors.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 2: Verificação de Email */}
                {currentStep === 2 && (
                  <div className="step-content-wrapper">
                    <div className="step-header">
                      <h3 className="step-title-large">Verifique seu email</h3>
                      <p className="step-subtitle">Digite o código enviado para {formData.email}</p>
                    </div>

                    <div className="input-group">
                      <div className="input-wrapper verification-code-wrapper">
                        <input
                          type="text"
                          id="verificationCode"
                          name="verificationCode"
                          value={formData.verificationCode}
                          onChange={handleInputChange}
                          required
                          placeholder="Código de verificação (6 dígitos)"
                          maxLength="6"
                          className={`professional-input verification-code-input ${stepErrors.verificationCode ? 'input-error' : ''}`}
                        />
                      </div>
                      {stepErrors.verificationCode && (
                        <span className="error-message">{stepErrors.verificationCode}</span>
                      )}
                    </div>

                    {message.text && message.type === 'success' && (
                      <div className="resend-code-container">
                        <button
                          type="button"
                          onClick={handleSendVerificationCode}
                          disabled={isSendingCode}
                          className="resend-code-btn"
                        >
                          {isSendingCode ? 'Reenviando...' : 'Reenviar código'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Etapa 3: Confirmação */}
                {currentStep === 3 && (
                  <div className="step-content-wrapper">
                    <div className="step-header">
                      <h3 className="step-title-large">Finalizando...</h3>
                      <p className="step-subtitle">Estamos criando sua conta</p>
                    </div>
                    
                    <div className="confirmation-content">
                      <div className="confirmation-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      <p className="confirmation-text">Aguarde enquanto processamos suas informações...</p>
                    </div>
                  </div>
                )}

                {message.text && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                {/* Botões de Navegação */}
                {currentStep === 1 && !showSendingAnimation && (
                  <div className="step-navigation">
                    <button 
                      type="submit" 
                      className="step-btn step-btn-primary"
                      disabled={isLoading || isSendingCode}
                    >
                    {isLoading ? (
                      <span className="loading-spinner">
                        Processando...
                      </span>
                    ) : currentStep === 1 ? (
                      <>
                        Continuar
                        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                          <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    ) : currentStep === 2 ? (
                      <>
                        Verificar e Finalizar
                        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                          <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    ) : (
                      'Concluído'
                    )}
                    </button>
                  </div>
                )}
                
                {currentStep > 1 && (
                  <div className="step-navigation">
                    {currentStep < 3 && (
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="step-btn step-btn-secondary"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        Voltar
                      </button>
                    )}
                    
                    <button 
                      type="submit" 
                      className={`step-btn step-btn-primary ${currentStep === 2 ? 'verify-finish-btn' : ''} ${currentStep === 3 ? 'full-width' : ''}`}
                      disabled={isLoading || isSendingCode}
                    >
                      {isLoading ? (
                        <span className="loading-spinner">
                          Processando...
                        </span>
                      ) : currentStep === 2 ? (
                        <>
                          Verificar e Finalizar
                          <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                            <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      ) : (
                        'Concluído'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Formulário de Login
              <>
                <div className="input-group">
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      required={!requires2FA}
                      disabled={requires2FA}
                      placeholder="Username"
                      className="professional-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      required={!requires2FA}
                      disabled={requires2FA}
                      placeholder="Password"
                      className="professional-input"
                    />
                  </div>
                </div>

                {requires2FA && (
                  <>
                    <div className="input-group">
                      <div className="input-wrapper">
                        <div className="input-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="twoFactorCode"
                          name="twoFactorCode"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          required
                          placeholder="Código de Verificação 2FA"
                          className="professional-input"
                          maxLength="6"
                          pattern="[0-9]{6}"
                        />
                      </div>
                    </div>

                    {hasEmail && (
                      <div className="input-group" style={{ marginTop: '-10px', marginBottom: '10px' }}>
                        <button
                          type="button"
                          onClick={handleSendLogin2FA}
                          disabled={isSending2FA}
                          className="link-blue"
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            padding: '0', 
                            fontSize: '14px',
                            cursor: isSending2FA ? 'not-allowed' : 'pointer',
                            opacity: isSending2FA ? 0.6 : 1
                          }}
                        >
                          {isSending2FA ? 'Enviando...' : 'Reenviar código por email'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {message.text && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-button login-btn"
                  disabled={isLoading || isSending2FA}
                >
                  {isLoading ? (
                    <span>
                      {requires2FA ? 'Verificando...' : 'Processing...'}
                    </span>
                  ) : (
                    <>
                      {requires2FA ? 'Verificar e Login' : 'Login Now'}
                      <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path d="M5 12H19M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
          )}

          {/* Links */}
          <div className="auth-links">
            {isLogin && !showForgotPassword && (
              <p className="forgot-password">
                Forgot your password? <a href="#" className="link-blue" onClick={(e) => {
                  e.preventDefault()
                  setShowForgotPassword(true)
                  setForgotPasswordStep(1)
                  setForgotPasswordData({
                    usernameOrEmail: formData.username || '',
                    selectedEmail: '',
                    code: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                  setAvailableEmails([])
                  setMessage({ type: '', text: '' })
                }}>Reset It Now!</a>
              </p>
            )}
            <p className="toggle-link">
              {isLogin ? (
                <>
                  Need an Account? <a href="#" className="link-blue" onClick={(e) => { 
                    e.preventDefault()
                    setIsLogin(false)
                    setCurrentStep(1)
                    setFormData({
                      username: '',
                      password: '',
                      email: '',
                      verificationCode: '',
                      twoFactor: ''
                    })
                    setCodeSent(false)
                    setMessage({ type: '', text: '' })
                    setStepErrors({})
                  }}>Register</a>
                </>
              ) : (
                <>
                  Already have an Account? <a href="#" className="link-blue" onClick={(e) => { 
                    e.preventDefault()
                    setIsLogin(true)
                    setCurrentStep(1)
                    setFormData({
                      username: '',
                      password: '',
                      email: '',
                      verificationCode: '',
                      twoFactor: ''
                    })
                    setCodeSent(false)
                    setMessage({ type: '', text: '' })
                    setStepErrors({})
                  }}>Login</a>
                </>
              )}
            </p>
          </div>
        </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default AuthPage

