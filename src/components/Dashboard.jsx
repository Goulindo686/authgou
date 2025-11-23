import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, chatService, paymentService, fileService } from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('app')
  const [username, setUsername] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('csharp')
  const [showAppSecret, setShowAppSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para controle de tabs e sub-tabs
  // Estado para controlar qual submenu está ativo quando Account está selecionado
  const [accountSubTab, setAccountSubTab] = useState('profile')
  
  // Estados para Perfil
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [userUsername, setUserUsername] = useState('')
  const [userSubscription, setUserSubscription] = useState('Never')
  const [userOwnerId, setUserOwnerId] = useState('')
  const [userRegisteredDate, setUserRegisteredDate] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const bannerInputRef = useRef(null)
  
  // Estados para Revendedores
  const [resellerCodes, setResellerCodes] = useState([])
  const [isLoadingResellerCodes, setIsLoadingResellerCodes] = useState(false)
  const [showCreateResellerCodeModal, setShowCreateResellerCodeModal] = useState(false)
  const [newResellerPlan, setNewResellerPlan] = useState('developer')
  const [newResellerPeriod, setNewResellerPeriod] = useState('monthly')
  const [newResellerExpires, setNewResellerExpires] = useState('')
  const [newResellerNote, setNewResellerNote] = useState('')
  const [resellerCodeSearch, setResellerCodeSearch] = useState('')
  const [resellerCodeFilter, setResellerCodeFilter] = useState('all') // all, active, used, expired
  const [copiedResellerCode, setCopiedResellerCode] = useState(null)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  
  // Estado para controlar qual item está ativo quando App está selecionado
  const [appSubTab, setAppSubTab] = useState('apps')
  
  // Estados para Settings
  const [accountLogs, setAccountLogs] = useState('Enabled')
  const [newLocationAlerts, setNewLocationAlerts] = useState('Enabled')
  const [settingsUsername, setSettingsUsername] = useState('')
  const [ownerId, setOwnerId] = useState('hskCtSIzio')
  const [subscriptionExpires, setSubscriptionExpires] = useState('Never')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [securityWords, setSecurityWords] = useState('')
  const [showSecurityWords, setShowSecurityWords] = useState(false)
  const [userPlan, setUserPlan] = useState('tester')

  // Estados para modais
  const [showEnable2FAModal, setShowEnable2FAModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false)
  const [showChangeUsernameModal, setShowChangeUsernameModal] = useState(false)
  const [showFIDO2Modal, setShowFIDO2Modal] = useState(false)
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false)
  
  // Estados para 2FA
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', ''])
  const [twoFactorMethod, setTwoFactorMethod] = useState('qr') // 'qr' ou 'email'
  const [emailCode, setEmailCode] = useState('')
  const [isLoading2FA, setIsLoading2FA] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  
  // Estados para formulários
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [passwordForChange, setPasswordForChange] = useState('')
  const [disable2FAPassword, setDisable2FAPassword] = useState('')
  
  // Estados para mensagens de feedback
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackType, setFeedbackType] = useState('') // 'success' ou 'error'
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados para gerenciamento de aplicações
  const [applications, setApplications] = useState([])
  const [currentApp, setCurrentApp] = useState(null)
  const [appName, setAppName] = useState('')
  const [appVersion, setAppVersion] = useState('1.0')
  const [appSecret, setAppSecret] = useState('')
  const [showCreateAppModal, setShowCreateAppModal] = useState(false)
  const [showRenameAppModal, setShowRenameAppModal] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [displayAppSecret, setDisplayAppSecret] = useState(false)

  // Estados para gerenciamento de licenças
  const [licenses, setLicenses] = useState([])
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false)
  const [showCreateLicenseModal, setShowCreateLicenseModal] = useState(false)
  const [showAddTimeModal, setShowAddTimeModal] = useState(false)
  const [licenseAmount, setLicenseAmount] = useState('')
  const [licenseMask, setLicenseMask] = useState('******_******_******_******_******_******')
  const [useLowercase, setUseLowercase] = useState(true)
  const [useUppercase, setUseUppercase] = useState(true)
  const [licenseQuantity, setLicenseQuantity] = useState(1)
  const [licenseNote, setLicenseNote] = useState('')
  const [licenseExpiryUnit, setLicenseExpiryUnit] = useState('days') // seconds, minutes, hours, days, weeks, months, years
  const [licenseDuration, setLicenseDuration] = useState(30)
  const [addTimeAmount, setAddTimeAmount] = useState('')
  const [addTimeUnit, setAddTimeUnit] = useState('days')
  const [licenseSearch, setLicenseSearch] = useState('')
  const [licenseShowFilter, setLicenseShowFilter] = useState('all') // 'all', 'used', 'unused'
  const [licensePageSize, setLicensePageSize] = useState(10)
  const [selectedLicenses, setSelectedLicenses] = useState([])
  
  // Estados para gerenciamento de usuários
  const [users, setUsers] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showUserVariablesModal, setShowUserVariablesModal] = useState(false)
  const [showExtendUsersModal, setShowExtendUsersModal] = useState(false)
  const [showSubtractUsersModal, setShowSubtractUsersModal] = useState(false)
  const [createUserUsername, setCreateUserUsername] = useState('')
  const [createUserPassword, setCreateUserPassword] = useState('')
  const [createUserEmail, setCreateUserEmail] = useState('')
  const [newUserSubscription, setNewUserSubscription] = useState('default')
  const [newUserExpiration, setNewUserExpiration] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [usersSearch, setUsersSearch] = useState('')
  const [usersPageSize, setUsersPageSize] = useState(10)
  const [openUserDropdown, setOpenUserDropdown] = useState(null) // ID do usuário com dropdown aberto
  const [extendUsersAmount, setExtendUsersAmount] = useState('')
  const [extendUsersUnit, setExtendUsersUnit] = useState('days')
  const [subtractUsersAmount, setSubtractUsersAmount] = useState('')
  const [subtractUsersUnit, setSubtractUsersUnit] = useState('days')
  
  // Estados para webhooks
  const [webhooks, setWebhooks] = useState([])
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false)
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false)
  const [webhookEndpoint, setWebhookEndpoint] = useState('')
  const [webhookUserAgent, setWebhookUserAgent] = useState('KeyUnit-Webhook/1.0')
  const [webhookSearch, setWebhookSearch] = useState('')
  const [webhookPageSize, setWebhookPageSize] = useState(10)
  const [selectedWebhooks, setSelectedWebhooks] = useState([])
  const [openWebhookDropdown, setOpenWebhookDropdown] = useState(null)
  
  // Estados para Anti-Crack
  const [antiCrackEnabled, setAntiCrackEnabled] = useState(true)
  const [detectionLogs, setDetectionLogs] = useState([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [threatsDetected, setThreatsDetected] = useState(0)
  const [memoryOverloadEnabled, setMemoryOverloadEnabled] = useState(true)
  const [shutdownEnabled, setShutdownEnabled] = useState(true)
  const [suspiciousProcesses, setSuspiciousProcesses] = useState([])
  const [debuggerDetected, setDebuggerDetected] = useState(false)
  const monitoringIntervalRef = useRef(null)
  const [anticrackSubTab, setAnticrackSubTab] = useState('dashboard') // dashboard, documentation
  const [selectedDocLanguage, setSelectedDocLanguage] = useState('csharp') // csharp, cpp
  
  // Estados para modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState({
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancelar',
    type: 'danger' // 'danger', 'warning', 'info'
  })
  const [showTestWebhookModal, setShowTestWebhookModal] = useState(false)
  const [testWebhookId, setTestWebhookId] = useState(null)
  const [testWebhookMessage, setTestWebhookMessage] = useState('Teste de webhook do KeyUnit')
  
  // Estados para Files
  const [files, setFiles] = useState([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [showUploadFileModal, setShowUploadFileModal] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileFilename, setFileFilename] = useState('')
  const [fileAuthenticated, setFileAuthenticated] = useState(true)
  const [filesSearch, setFilesSearch] = useState('')
  const [filesPageSize, setFilesPageSize] = useState(10)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [openFileDropdown, setOpenFileDropdown] = useState(null)
  
  // Estados para Upgrade
  const [isAnnualPricing, setIsAnnualPricing] = useState(true)
  
  // Estados para modal de pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null) // 'tester', 'weekly', 'monthly', 'quarterly', 'annual', 'lifetime'
  const [selectedPeriod, setSelectedPeriod] = useState(null) // 'weekly', 'monthly', 'quarterly', 'annual', 'lifetime'
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('monthly') // 'all', 'weekly', 'monthly', 'quarterly', 'annual', 'lifetime'
  const [paymentMethod, setPaymentMethod] = useState('pix') // 'pix' ou 'card'
  const [paymentData, setPaymentData] = useState(null)
  const [pixQrCode, setPixQrCode] = useState(null)
  const [pixCode, setPixCode] = useState('')
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [externalReference, setExternalReference] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, approved, rejected
  const [copiedPix, setCopiedPix] = useState(false)
  
  // Estados para chat/tickets
  const [userChatTickets, setUserChatTickets] = useState([])
  const [selectedUserTicket, setSelectedUserTicket] = useState(null)
  const [userChatMessages, setUserChatMessages] = useState([])
  const [newTicketSubject, setNewTicketSubject] = useState('')
  const [newTicketMessage, setNewTicketMessage] = useState('')
  const [newUserMessage, setNewUserMessage] = useState('')
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [isLoadingUserChat, setIsLoadingUserChat] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  
  // Função para exibir mensagem
  const showMessage = (msg, type) => {
    setFeedbackMessage(msg)
    setFeedbackType(type)
    setTimeout(() => {
      setFeedbackMessage('')
      setFeedbackType('')
    }, 5000)
  }

  // Função para mostrar modal de confirmação
  const showConfirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmModalData({
        title: options.title || 'Confirmação',
        message: message,
        onConfirm: () => {
          setShowConfirmModal(false)
          resolve(true)
        },
        onCancel: () => {
          setShowConfirmModal(false)
          resolve(false)
        },
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'danger'
      })
      setShowConfirmModal(true)
    })
  }

  // Atualizar settingsUsername quando username mudar
  useEffect(() => {
    if (username) {
      setSettingsUsername(username)
    }
  }, [username])

  // Carregar dados do perfil quando abrir Perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (activeTab === 'account' && accountSubTab === 'profile') {
        const sessionid = localStorage.getItem('sessionid')
        if (sessionid) {
          setIsLoadingProfile(true)
          try {
            const response = await authService.getSettings(sessionid)
            if (response.success && response.settings) {
              setUserEmail(response.settings.email || '')
              setUserUsername(username || response.settings.username || '')
              setUserSubscription(response.settings.expires || 'Never')
              setUserOwnerId(response.settings.ownerId || '')
              setBannerUrl(response.settings.bannerUrl || '')
              setProfilePictureUrl(response.settings.profilePictureUrl || '')
              setUserRegisteredDate(response.settings.registeredDate || '')
              setUserPlan(response.settings.plan || 'tester')
            }
          } catch (error) {
            showMessage('Erro ao carregar dados do perfil', 'error')
          } finally {
            setIsLoadingProfile(false)
          }
        }
      }
    }
    loadProfile()
  }, [activeTab, accountSubTab, username])

  // Verificar se usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const sessionid = localStorage.getItem('sessionid')
      if (sessionid) {
        try {
          const response = await authService.getSettings(sessionid)
          if (response.success && response.settings) {
            setIsUserAdmin(response.settings.isAdmin === true)
          }
        } catch (error) {
          setIsUserAdmin(false)
        }
      }
    }
    checkAdminStatus()
  }, [])

  // Carregar códigos de revendedor quando abrir Revendedores
  useEffect(() => {
    const loadResellerCodes = async () => {
      if (activeTab === 'account' && accountSubTab === 'reseller') {
        const sessionid = localStorage.getItem('sessionid')
        if (sessionid) {
          setIsLoadingResellerCodes(true)
          try {
            const response = await authService.getResellerCodes(sessionid)
            if (response.success) {
              setResellerCodes(response.codes || [])
            }
          } catch (error) {
            showMessage('Erro ao carregar códigos de revendedor', 'error')
          } finally {
            setIsLoadingResellerCodes(false)
          }
        }
      }
    }
    loadResellerCodes()
  }, [activeTab, accountSubTab])

  // Carregar configurações quando abrir Settings
  useEffect(() => {
    const loadSettings = async () => {
      if (activeTab === 'account' && accountSubTab === 'settings') {
        const sessionid = localStorage.getItem('sessionid')
        if (sessionid) {
          try {
            const response = await authService.getSettings(sessionid)
            if (response.success && response.settings) {
              setAccountLogs(response.settings.accountLogs || 'Enabled')
              setNewLocationAlerts(response.settings.newLocationAlerts || 'Enabled')
              setOwnerId(response.settings.ownerId || '')
              setProfilePictureUrl(response.settings.profilePictureUrl || '')
              setSecurityWords(response.settings.securityWords || '')
              setTwoFactorEnabled(response.settings.twoFactorEnabled || false)
              setUserPlan(response.settings.plan || 'tester')
            }
          } catch (error) {
          }
        }
      }
    }
    loadSettings()
  }, [activeTab, accountSubTab])

  // Gerar QR code quando modal Enable 2FA abrir
  useEffect(() => {
    const generateQRCode = async () => {
      if (showEnable2FAModal && twoFactorMethod === 'qr' && !qrCodeUrl) {
        const sessionid = localStorage.getItem('sessionid')
        if (sessionid) {
          setIsLoading2FA(true)
          try {
            const response = await authService.generate2FA(sessionid)
            if (response.success) {
              setQrCodeUrl(response.qrCode)
              setManualCode(response.manualCode)
            }
          } catch (error) {
            showMessage(error.message || 'Erro ao gerar QR code 2FA', 'error')
          } finally {
            setIsLoading2FA(false)
          }
        }
      }
    }
    generateQRCode()
  }, [showEnable2FAModal, twoFactorMethod])

  useEffect(() => {
    const checkSession = async () => {
      const sessionid = localStorage.getItem('sessionid')
      const storedUsername = localStorage.getItem('username')
      
      if (sessionid && storedUsername) {
        try {
          const response = await authService.verify(sessionid)
          if (response.success) {
            setUsername(storedUsername)
            setIsLoading(false)
            
            // Carregar profilePictureUrl e plano quando o Dashboard carrega
            try {
              const settingsResponse = await authService.getSettings(sessionid)
              if (settingsResponse.success && settingsResponse.settings) {
                setProfilePictureUrl(settingsResponse.settings.profilePictureUrl || '')
                setUserPlan(settingsResponse.settings.plan || 'tester')
              }
            } catch (error) {
            }
          } else {
            localStorage.removeItem('sessionid')
            localStorage.removeItem('username')
            window.location.reload()
          }
        } catch (error) {
          localStorage.removeItem('sessionid')
          localStorage.removeItem('username')
          window.location.reload()
        }
      } else {
        window.location.reload()
      }
    }

    checkSession()

    // Cleanup: limpar intervalo quando componente desmontar
    return () => {
      if (paymentStatusCheckIntervalRef.current) {
        clearInterval(paymentStatusCheckIntervalRef.current)
        paymentStatusCheckIntervalRef.current = null
      }
    }
  }, [])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openUserDropdown && !event.target.closest('.action-dropdown-container')) {
        setOpenUserDropdown(null)
      }
    }

    if (openUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openUserDropdown])

  const handleLogout = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (sessionid) {
      try {
        await authService.logout(sessionid)
      } catch (error) {
      }
    }
    localStorage.removeItem('sessionid')
    localStorage.removeItem('username')
    window.location.reload()
  }

  // Função para navegar para página de pagamento
  const handleUpgradeClick = (plan, period = null) => {
    // Limpar intervalo anterior se existir
    stopPaymentStatusCheck()
    
    // Navegar para página de pagamento com parâmetros
    const params = new URLSearchParams()
    params.set('plan', plan)
    if (period) {
      params.set('period', period)
    }
    navigate(`/payment?${params.toString()}`)
  }

  // Função para criar pagamento quando método for selecionado
  const handlePaymentMethodChange = (method) => {
    // Se já tiver dados do método atual, não recriar
    if (method === 'pix' && pixQrCode && pixCode) {
      setPaymentMethod(method)
      return
    }
    if (method === 'card' && paymentData && paymentData.init_point) {
      setPaymentMethod(method)
      return
    }
    
    setPaymentMethod(method)
    setPaymentData(null)
    setPixQrCode(null)
    setPixCode('')
    setExternalReference(null)
    setPaymentStatus('pending')
    setCopiedPix(false)
    
    // Criar pagamento quando método for selecionado
    if (selectedPlan) {
      createPaymentPreference(selectedPlan, selectedPeriod)
    }
  }

  // Criar preferência de pagamento ou PIX direto
  const createPaymentPreference = async (plan, period = null) => {
    setIsLoadingPayment(true)
    const sessionid = localStorage.getItem('sessionid')
    
    try {
      // Se o período não foi fornecido, usar o padrão baseado no toggle
      const finalPeriod = period || (isAnnualPricing ? 'annual' : 'monthly')
      
      // Se o método de pagamento for PIX, criar pagamento PIX direto
      if (paymentMethod === 'pix') {
        const response = await paymentService.createPix(sessionid, plan, finalPeriod)
        
        if (response.success) {
          setPaymentData(response)
          setExternalReference(response.external_reference)
          setPixQrCode(response.qr_code_base64)
          setPixCode(response.qr_code)
          
          // Iniciar verificação de status
          startPaymentStatusCheck(response.external_reference, response.payment_id)
        } else {
          showMessage(response.message || 'Erro ao criar pagamento PIX', 'error')
        }
      } else {
        // Para cartão, criar preferência normal
        const response = await paymentService.createPreference(sessionid, plan, finalPeriod)
        
        if (response.success) {
          setPaymentData(response)
          setExternalReference(response.external_reference)
          
          // Iniciar verificação de status
          startPaymentStatusCheck(response.external_reference, null)
        } else {
          showMessage(response.message || 'Erro ao criar preferência de pagamento', 'error')
        }
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao criar pagamento', 'error')
    } finally {
      setIsLoadingPayment(false)
    }
  }

  // Verificar status do pagamento periodicamente
  const startPaymentStatusCheck = (externalRef, paymentId = null) => {
    // Limpar intervalo anterior se existir
    if (paymentStatusCheckIntervalRef.current) {
      clearInterval(paymentStatusCheckIntervalRef.current)
      paymentStatusCheckIntervalRef.current = null
    }

    const checkInterval = setInterval(async () => {
      const sessionid = localStorage.getItem('sessionid')
      try {
        const response = await paymentService.checkStatus(sessionid, externalRef, paymentId)
        if (response.success) {
          setPaymentStatus(response.status)
          
          if (response.status === 'approved') {
            clearInterval(checkInterval)
            paymentStatusCheckIntervalRef.current = null
            showMessage('Pagamento aprovado! Seu plano foi atualizado.', 'success')
            
            // Recarregar configurações para atualizar o plano
            try {
              const settingsResponse = await authService.getSettings(sessionid)
              if (settingsResponse.success && settingsResponse.settings) {
                setUserPlan(settingsResponse.settings.plan || 'tester')
                setProfilePictureUrl(settingsResponse.settings.profilePictureUrl || '')
              }
            } catch (error) {
            }
            
            setTimeout(() => {
              stopPaymentStatusCheck()
              setShowPaymentModal(false)
              window.location.reload()
            }, 2000)
          } else if (response.status === 'rejected' || response.status === 'cancelled') {
            clearInterval(checkInterval)
            paymentStatusCheckIntervalRef.current = null
            showMessage('Pagamento rejeitado ou cancelado.', 'error')
          }
        }
      } catch (error) {
      }
    }, 3000) // Verificar a cada 3 segundos

    // Armazenar intervalo na ref
    paymentStatusCheckIntervalRef.current = checkInterval

    // Limpar intervalo após 10 minutos
    setTimeout(() => {
      if (paymentStatusCheckIntervalRef.current === checkInterval) {
        clearInterval(checkInterval)
        paymentStatusCheckIntervalRef.current = null
      }
    }, 600000)
  }

  // Limpar intervalo quando o modal for fechado
  const stopPaymentStatusCheck = () => {
    if (paymentStatusCheckIntervalRef.current) {
      clearInterval(paymentStatusCheckIntervalRef.current)
      paymentStatusCheckIntervalRef.current = null
    }
  }

  // Copiar código PIX
  const handleCopyPix = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      setCopiedPix(true)
      showMessage('Código PIX copiado!', 'success')
      setTimeout(() => setCopiedPix(false), 2000)
    }
  }

  // Abrir checkout do Mercado Pago para cartão
  const handlePayWithCard = () => {
    if (paymentData && paymentData.init_point) {
      window.open(paymentData.init_point, '_blank')
    } else if (paymentData && paymentData.sandbox_init_point) {
      window.open(paymentData.sandbox_init_point, '_blank')
    }
  }

  // Função auxiliar para obter URL da API detectando protocolo automaticamente
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    const protocol = window.location.protocol
    return `${protocol}//www.gouc.com.br`
  }
  const API_BASE_URL = getApiBaseUrl()
  const API_URL = `${API_BASE_URL}/api/1.3`

  // Funções auxiliares para exibir informações do plano no modal de pagamento
  const getPlanDisplayName = (plan) => {
    const planNames = {
      tester: 'PLANO TESTE',
      weekly: 'PLANO SEMANAL',
      monthly: 'PLANO MENSAL',
      quarterly: 'PLANO TRIMESTRAL',
      annual: 'PLANO ANUAL',
      lifetime: 'PLANO LIFETIME'
    }
    return planNames[plan] || plan?.toUpperCase() || 'PLANO'
  }

  const getPeriodDisplayName = (period) => {
    const periodNames = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      lifetime: 'Vitalício'
    }
    return periodNames[period] || period || 'Mensal'
  }

  const getPlanPrice = (plan, period) => {
    const prices = {
      tester: { weekly: 0, monthly: 0, quarterly: 0, annual: 0, lifetime: 0 },
      weekly: { weekly: 7.90 },
      monthly: { monthly: 19.90 },
      quarterly: { quarterly: 49.90 },
      annual: { annual: 100.00 },
      lifetime: { lifetime: 399.00 }
    }
    const amount = prices[plan]?.[period] || 0
    return amount.toFixed(2).replace('.', ',')
  }

  const getPlanBenefits = (plan) => {
    const benefits = {
      tester: '1 Aplicação, 10 Licenças, 10 Usuários, Variáveis Globais Limitadas, Upload até 10 MB, Logs básicos, Webhooks limitados, Suporte via e-mail',
      weekly: '3 Aplicações, 20 Licenças, 50 Usuários, Variáveis Globais, Upload até 15 MB, Logs detalhados, Webhooks básicos',
      monthly: 'Aplicações Ilimitadas, Licenças Ilimitadas, Usuários Ilimitados, Upload até 50 MB, Variáveis Globais e de Usuário, Webhooks + API liberada, Logs com auditoria',
      quarterly: 'Tudo do plano Mensal, Upload até 75 MB, Logs avançados (JSON + CSV), Webhooks com autenticação, Suporte prioritário',
      annual: 'Tudo do plano Trimestral, Upload até 150 MB, Auditoria completa, Backups automáticos, Suporte premium (Discord / E-mail), Acesso antecipado a novas funções',
      lifetime: 'Tudo do plano Anual, Atualizações futuras garantidas, Upload e armazenamento ilimitados, Logs e auditorias sem limite, Suporte com prioridade máxima, Benefícios exclusivos e descontos'
    }
    return benefits[plan] || 'Acesso completo ao sistema'
  }

  // Dados da aplicação atual (calculado com useMemo)
  const appData = useMemo(() => {
    return currentApp ? {
      name: currentApp.name,
      ownerid: currentApp.owner_id || ownerId || 'hskCtSIziO',
      secret: currentApp.app_secret || 'your-app-secret-key-here',
      version: currentApp.version || '1.0',
      url: API_URL
    } : {
      name: `${username || 'noixplatform'}'s Application`,
      ownerid: ownerId || 'hskCtSIziO',
    secret: 'your-app-secret-key-here',
    version: '1.0',
      url: API_URL
    }
  }, [currentApp, ownerId, username, API_URL])

  // Estado para controlar qual exemplo completo está sendo visualizado
  const [viewingExample, setViewingExample] = useState(null)

  // Mapeamento de nomes de linguagens
  const languageNames = {
    csharp: 'C#',
    cpp: 'C++',
    python: 'Python',
    php: 'PHP',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    java: 'Java',
    vbnet: 'VB.Net',
    rust: 'Rust',
    go: 'Go',
    lua: 'Lua',
    ruby: 'Ruby',
    perl: 'Perl'
  }

  // Credenciais básicas (modelo simples) para cada linguagem
  const credentialsTemplate = useMemo(() => {
    const apiUrl = appData.url
    const appName = appData.name
    const ownerId = appData.ownerid
    const version = appData.version

    return {
      csharp: `private static string name = "${appName}";
private static string ownerid = "${ownerId}";
private static string version = "${version}";
private static string url = "${apiUrl}";
private static HttpClient httpClient = new HttpClient();
private static string sessionid = "";`,
      cpp: `std::string name = "${appName}";
std::string ownerid = "${ownerId}";
std::string version = "${version}";
std::string url = "${apiUrl}";
std::string sessionid = "";`,
      python: `name = "${appName}"
ownerid = "${ownerId}"
version = "${version}"
url = "${apiUrl}"
sessionid = ""`,
      php: `private $name = "${appName}";
private $ownerid = "${ownerId}";
private $version = "${version}";
private $url = "${apiUrl}";
private $sessionid = "";`,
      javascript: `const name = "${appName}";
const ownerid = "${ownerId}";
const version = "${version}";
const url = "${apiUrl}";
let sessionid = "";`,
      typescript: `private name: string = "${appName}";
private ownerid: string = "${ownerId}";
private version: string = "${version}";
private url: string = "${apiUrl}";
private sessionid: string = "";`,
      java: `private String name = "${appName}";
private String ownerid = "${ownerId}";
private String version = "${version}";
private String url = "${apiUrl}";
private String sessionid = "";`,
      vbnet: `Private name As String = "${appName}"
Private ownerid As String = "${ownerId}"
Private version As String = "${version}"
Private url As String = "${apiUrl}"
Private sessionid As String = ""`,
      rust: `let name = "${appName}";
let ownerid = "${ownerId}";
let version = "${version}";
let url = "${apiUrl}";
let sessionid = "";`,
      go: `name := "${appName}"
ownerid := "${ownerId}"
version := "${version}"
url := "${apiUrl}"
sessionid := ""`,
      lua: `local name = "${appName}"
local ownerid = "${ownerId}"
local version = "${version}"
local url = "${apiUrl}"
local sessionid = ""`,
      ruby: `@name = "${appName}"
@ownerid = "${ownerId}"
@version = "${version}"
@url = "${apiUrl}"
@sessionid = ""`,
      perl: `my $name = "${appName}";
my $ownerid = "${ownerId}";
my $version = "${version}";
my $url = "${apiUrl}";
my $sessionid = "";`
    }
  }, [appData])

  // Código de exemplo completo para diferentes linguagens (estilo KeyUnit completo)
  const codeExamples = useMemo(() => {
    const apiUrl = appData.url
    const appName = appData.name
    const ownerId = appData.ownerid
    const version = appData.version

    return {
      csharp: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class KeyUnit
{
    private static string name = "${appName}";
    private static string ownerid = "${ownerId}";
    private static string version = "${version}";
    private static string url = "${apiUrl}";
    private static HttpClient httpClient = new HttpClient();
    private static string sessionid = "";

    public static void Init()
    {
        var initData = new
        {
            type = "init",
            name = name,
            ownerid = ownerid,
            hash = GenerateHash(),
            enckey = GenerateEnckey()
        };

        var response = PostRequest(url + "/init", initData);
        if (response.success)
        {
            sessionid = response.sessionid;
            Console.WriteLine("Aplicação inicializada com sucesso!");
        }
    }

    public static bool Login(string username, string password)
    {
        var loginData = new
        {
            type = "login",
            name = name,
            ownerid = ownerid,
            username = username,
            password = password,
            hash = GenerateHash(),
            sessionid = sessionid,
            enckey = GenerateEnckey()
        };

        var response = PostRequest(url + "/login", loginData);
        if (response.success)
        {
            sessionid = response.sessionid;
            Console.WriteLine("Login realizado com sucesso!");
            return true;
        }
        return false;
    }

    private static string GenerateHash() { return ""; }
    private static string GenerateEnckey() { return ""; }
    private static dynamic PostRequest(string endpoint, object data) { return null; }
}

// Uso:
KeyUnit.Init();
KeyUnit.Login("usuario", "senha");`,
      cpp: `#include <iostream>
#include <string>
#include <curl/curl.h>
#include <json/json.h>

class KeyUnit {
private:
    std::string name = "${appName}";
    std::string ownerid = "${ownerId}";
    std::string version = "${version}";
    std::string url = "${apiUrl}";
    std::string sessionid = "";

public:
    void Init() {
        Json::Value initData;
        initData["type"] = "init";
        initData["name"] = name;
        initData["ownerid"] = ownerid;
        initData["hash"] = GenerateHash();
        initData["enckey"] = GenerateEnckey();

        auto response = PostRequest(url + "/init", initData);
        if (response["success"].asBool()) {
            sessionid = response["sessionid"].asString();
            std::cout << "Aplicação inicializada com sucesso!" << std::endl;
        }
    }

    bool Login(const std::string& username, const std::string& password) {
        Json::Value loginData;
        loginData["type"] = "login";
        loginData["name"] = name;
        loginData["ownerid"] = ownerid;
        loginData["username"] = username;
        loginData["password"] = password;
        loginData["hash"] = GenerateHash();
        loginData["sessionid"] = sessionid;
        loginData["enckey"] = GenerateEnckey();

        auto response = PostRequest(url + "/login", loginData);
        if (response["success"].asBool()) {
            sessionid = response["sessionid"].asString();
            std::cout << "Login realizado com sucesso!" << std::endl;
            return true;
        }
        return false;
    }

private:
    std::string GenerateHash() { return ""; }
    std::string GenerateEnckey() { return ""; }
    Json::Value PostRequest(const std::string& endpoint, const Json::Value& data) { return Json::Value(); }
};

// Uso:
KeyUnit auth;
auth.Init();
auth.Login("usuario", "senha");`,
      python: `import requests
import hashlib
import secrets

class KeyUnit:
    def __init__(self):
        self.name = "${appName}"
        self.ownerid = "${ownerId}"
        self.version = "${version}"
        self.url = "${apiUrl}"
        self.sessionid = ""

    def init(self):
        init_data = {
            "type": "init",
            "name": self.name,
            "ownerid": self.ownerid,
            "hash": self.generate_hash(),
            "enckey": self.generate_enckey()
        }
        
        response = requests.post(self.url + "/init", json=init_data)
        data = response.json()
        
        if data.get("success"):
            self.sessionid = data.get("sessionid")
            print("Aplicação inicializada com sucesso!")
            return True
        return False

    def login(self, username, password):
        login_data = {
            "type": "login",
            "name": self.name,
            "ownerid": self.ownerid,
            "username": username,
            "password": password,
            "hash": self.generate_hash(),
            "sessionid": self.sessionid,
            "enckey": self.generate_enckey()
        }
        
        response = requests.post(self.url + "/login", json=login_data)
        data = response.json()
        
        if data.get("success"):
            self.sessionid = data.get("sessionid")
            print("Login realizado com sucesso!")
            return True
        return False

    def generate_hash(self):
        return hashlib.sha256(f"{self.name}{self.ownerid}{self.version}".encode()).hexdigest()

    def generate_enckey(self):
        return secrets.token_hex(16)

# Uso:
auth = KeyUnit()
auth.init()
auth.login("usuario", "senha")`,
      php: `<?php
class KeyUnit {
    private $name = "${appName}";
    private $ownerid = "${ownerId}";
    private $version = "${version}";
    private $url = "${apiUrl}";
    private $sessionid = "";

    public function init() {
        $initData = [
            "type" => "init",
            "name" => $this->name,
            "ownerid" => $this->ownerid,
            "hash" => $this->generateHash(),
            "enckey" => $this->generateEnckey()
        ];

        $response = $this->postRequest($this->url . "/init", $initData);
        if ($response["success"]) {
            $this->sessionid = $response["sessionid"];
            echo "Aplicação inicializada com sucesso!\n";
            return true;
        }
        return false;
    }

    public function login($username, $password) {
        $loginData = [
            "type" => "login",
            "name" => $this->name,
            "ownerid" => $this->ownerid,
            "username" => $username,
            "password" => $password,
            "hash" => $this->generateHash(),
            "sessionid" => $this->sessionid,
            "enckey" => $this->generateEnckey()
        ];

        $response = $this->postRequest($this->url . "/login", $loginData);
        if ($response["success"]) {
            $this->sessionid = $response["sessionid"];
            echo "Login realizado com sucesso!\n";
            return true;
        }
        return false;
    }

    private function generateHash() {
        return hash("sha256", $this->name . $this->ownerid . $this->version);
    }

    private function generateEnckey() {
        return bin2hex(random_bytes(16));
    }

    private function postRequest($endpoint, $data) {
        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}

// Uso:
$auth = new KeyUnit();
$auth->init();
$auth->login("usuario", "senha");
?>`,
      javascript: `class KeyUnit {
    constructor() {
        this.name = "${appName}";
        this.ownerid = "${ownerId}";
        this.version = "${version}";
        this.url = "${apiUrl}";
        this.sessionid = "";
    }

    async init() {
        const hash = await this.generateHash();
        const initData = {
            type: "init",
            name: this.name,
            ownerid: this.ownerid,
            hash: hash,
            enckey: this.generateEnckey()
        };

        const response = await fetch(this.url + "/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initData)
        });

        const data = await response.json();
        if (data.success) {
            this.sessionid = data.sessionid;
            return true;
        }
        return false;
    }

    async login(username, password) {
        const hash = await this.generateHash();
        const loginData = {
            type: "login",
            name: this.name,
            ownerid: this.ownerid,
            username: username,
            password: password,
            hash: hash,
            sessionid: this.sessionid,
            enckey: this.generateEnckey()
        };

        const response = await fetch(this.url + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        if (data.success) {
            this.sessionid = data.sessionid;
            return true;
        }
        return false;
    }

    async generateHash() {
        const msgBuffer = new TextEncoder().encode(this.name + this.ownerid + this.version);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    generateEnckey() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Uso:
const auth = new KeyUnit();
await auth.init();
await auth.login("usuario", "senha");`,
      typescript: `class KeyUnit {
    private name: string = "${appName}";
    private ownerid: string = "${ownerId}";
    private version: string = "${version}";
    private url: string = "${apiUrl}";
    private sessionid: string = "";

    async init(): Promise<boolean> {
        const hash = await this.generateHash();
        const initData = {
            type: "init",
            name: this.name,
            ownerid: this.ownerid,
            hash: hash,
            enckey: this.generateEnckey()
        };

        const response = await fetch(this.url + "/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initData)
        });

        const data = await response.json();
        if (data.success) {
            this.sessionid = data.sessionid;
            return true;
        }
        return false;
    }

    async login(username: string, password: string): Promise<boolean> {
        const hash = await this.generateHash();
        const loginData = {
            type: "login",
            name: this.name,
            ownerid: this.ownerid,
            username: username,
            password: password,
            hash: hash,
            sessionid: this.sessionid,
            enckey: this.generateEnckey()
        };

        const response = await fetch(this.url + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        if (data.success) {
            this.sessionid = data.sessionid;
            return true;
        }
        return false;
    }

    private async generateHash(): Promise<string> {
        const msgBuffer = new TextEncoder().encode(this.name + this.ownerid + this.version);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private generateEnckey(): string {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Uso:
const auth = new KeyUnit();
await auth.init();
await auth.login("usuario", "senha");`,
      java: `import java.net.HttpURLConnection;
import java.net.URL;
import java.io.*;
import com.google.gson.Gson;
import java.security.MessageDigest;

public class KeyUnit {
    private String name = "${appName}";
    private String ownerid = "${ownerId}";
    private String version = "${version}";
    private String url = "${apiUrl}";
    private String sessionid = "";

    public void init() throws Exception {
        Map<String, Object> initData = new HashMap<>();
        initData.put("type", "init");
        initData.put("name", name);
        initData.put("ownerid", ownerid);
        initData.put("hash", generateHash());
        initData.put("enckey", generateEnckey());

        Map<String, Object> response = postRequest(url + "/init", initData);
        if ((Boolean) response.get("success")) {
            sessionid = (String) response.get("sessionid");
            System.out.println("Aplicação inicializada com sucesso!");
        }
    }

    public boolean login(String username, String password) throws Exception {
        Map<String, Object> loginData = new HashMap<>();
        loginData.put("type", "login");
        loginData.put("name", name);
        loginData.put("ownerid", ownerid);
        loginData.put("username", username);
        loginData.put("password", password);
        loginData.put("hash", generateHash());
        loginData.put("sessionid", sessionid);
        loginData.put("enckey", generateEnckey());

        Map<String, Object> response = postRequest(url + "/login", loginData);
        if ((Boolean) response.get("success")) {
            sessionid = (String) response.get("sessionid");
            System.out.println("Login realizado com sucesso!");
            return true;
        }
        return false;
    }

    private String generateHash() throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest((name + ownerid + version).getBytes());
        return bytesToHex(hash);
    }

    private String generateEnckey() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private Map<String, Object> postRequest(String endpoint, Map<String, Object> data) throws Exception {
        // Implementar requisição HTTP
        return new HashMap<>();
    }
}

// Uso:
KeyUnit auth = new KeyUnit();
auth.init();
auth.login("usuario", "senha");`,
      vbnet: `Imports System.Net.Http
Imports System.Text
Imports Newtonsoft.Json

Public Class KeyUnit
    Private name As String = "${appName}"
    Private ownerid As String = "${ownerId}"
    Private version As String = "${version}"
    Private url As String = "${apiUrl}"
    Private sessionid As String = ""

    Public Async Function Init() As Task(Of Boolean)
        Dim initData As Object = New With {
            .type = "init",
            .name = name,
            .ownerid = ownerid,
            .hash = GenerateHash(),
            .enckey = GenerateEnckey()
        }

        Dim response = Await PostRequest(url + "/init", initData)
        If response.success Then
            sessionid = response.sessionid
            Console.WriteLine("Aplicação inicializada com sucesso!")
            Return True
        End If
        Return False
    End Function

    Public Async Function Login(username As String, password As String) As Task(Of Boolean)
        Dim loginData As Object = New With {
            .type = "login",
            .name = name,
            .ownerid = ownerid,
            .username = username,
            .password = password,
            .hash = GenerateHash(),
            .sessionid = sessionid,
            .enckey = GenerateEnckey()
        }

        Dim response = Await PostRequest(url + "/login", loginData)
        If response.success Then
            sessionid = response.sessionid
            Console.WriteLine("Login realizado com sucesso!")
            Return True
        End If
        Return False
    End Function

    Private Function GenerateHash() As String
        Return ""
    End Function

    Private Function GenerateEnckey() As String
        Return ""
    End Function
End Class

' Uso:
Dim auth As New KeyUnit()
Await auth.Init()
Await auth.Login("usuario", "senha")`,
      rust: `use reqwest;
use serde_json;
use sha2::{Sha256, Digest};

pub struct KeyUnit {
    name: String,
    ownerid: String,
    version: String,
    url: String,
    sessionid: String,
}

impl KeyUnit {
    pub fn new() -> Self {
        KeyUnit {
            name: "${appName}".to_string(),
            ownerid: "${ownerId}".to_string(),
            version: "${version}".to_string(),
            url: "${apiUrl}".to_string(),
            sessionid: String::new(),
        }
    }

    pub async fn init(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let init_data = serde_json::json!({
            "type": "init",
            "name": self.name,
            "ownerid": self.ownerid,
            "hash": self.generate_hash(),
            "enckey": self.generate_enckey()
        });

        let client = reqwest::Client::new();
        let response = client
            .post(&format!("{}/init", self.url))
            .json(&init_data)
            .send()
            .await?;

        let data: serde_json::Value = response.json().await?;
        if data["success"].as_bool().unwrap_or(false) {
            self.sessionid = data["sessionid"].as_str().unwrap().to_string();
            println!("Aplicação inicializada com sucesso!");
        }
        Ok(())
    }

    pub async fn login(&mut self, username: &str, password: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let login_data = serde_json::json!({
            "type": "login",
            "name": self.name,
            "ownerid": self.ownerid,
            "username": username,
            "password": password,
            "hash": self.generate_hash(),
            "sessionid": self.sessionid,
            "enckey": self.generate_enckey()
        });

        let client = reqwest::Client::new();
        let response = client
            .post(&format!("{}/login", self.url))
            .json(&login_data)
            .send()
            .await?;

        let data: serde_json::Value = response.json().await?;
        if data["success"].as_bool().unwrap_or(false) {
            self.sessionid = data["sessionid"].as_str().unwrap().to_string();
            println!("Login realizado com sucesso!");
            return Ok(true);
        }
        Ok(false)
    }

    fn generate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(format!("{}{}{}", self.name, self.ownerid, self.version));
        format!("{:x}", hasher.finalize())
    }

    fn generate_enckey(&self) -> String {
        use rand::Rng;
        rand::thread_rng()
            .sample_iter(&rand::distributions::Alphanumeric)
            .take(32)
            .map(char::from)
            .collect()
    }
}

// Uso:
let mut auth = KeyUnit::new();
auth.init().await?;
auth.login("usuario", "senha").await?;`,
      go: `package main

import (
    "bytes"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "math/rand"
    "net/http"
    "time"
)

type KeyUnit struct {
    name      string
    ownerid   string
    version   string
    url       string
    sessionid string
}

func NewKeyUnit() *KeyUnit {
    return &KeyUnit{
        name:    "${appName}",
        ownerid: "${ownerId}",
        version: "${version}",
        url:     "${apiUrl}",
    }
}

func (ka *KeyUnit) Init() error {
    initData := map[string]interface{}{
        "type":    "init",
        "name":    ka.name,
        "ownerid": ka.ownerid,
        "hash":    ka.generateHash(),
        "enckey":  ka.generateEnckey(),
    }

    jsonData, _ := json.Marshal(initData)
    resp, err := http.Post(ka.url+"/init", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    var result map[string]interface{}
    json.Unmarshal(body, &result)

    if success, ok := result["success"].(bool); ok && success {
        ka.sessionid = result["sessionid"].(string)
        fmt.Println("Aplicação inicializada com sucesso!")
    }
    return nil
}

func (ka *KeyUnit) Login(username, password string) (bool, error) {
    loginData := map[string]interface{}{
        "type":     "login",
        "name":     ka.name,
        "ownerid":  ka.ownerid,
        "username": username,
        "password": password,
        "hash":     ka.generateHash(),
        "sessionid": ka.sessionid,
        "enckey":   ka.generateEnckey(),
    }

    jsonData, _ := json.Marshal(loginData)
    resp, err := http.Post(ka.url+"/login", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return false, err
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    var result map[string]interface{}
    json.Unmarshal(body, &result)

    if success, ok := result["success"].(bool); ok && success {
        ka.sessionid = result["sessionid"].(string)
        fmt.Println("Login realizado com sucesso!")
        return true, nil
    }
    return false, nil
}

func (ka *KeyUnit) generateHash() string {
    hasher := sha256.New()
    hasher.Write([]byte(ka.name + ka.ownerid + ka.version))
    return hex.EncodeToString(hasher.Sum(nil))
}

func (ka *KeyUnit) generateEnckey() string {
    rand.Seed(time.Now().UnixNano())
    b := make([]byte, 16)
    rand.Read(b)
    return hex.EncodeToString(b)
}

// Uso:
auth := NewKeyUnit()
auth.Init()
auth.Login("usuario", "senha")`,
      lua: `local http = require("socket.http")
local json = require("json")
local crypto = require("crypto")

KeyUnit = {}
KeyUnit.__index = KeyUnit

function KeyUnit:new()
    local obj = {
        name = "${appName}",
        ownerid = "${ownerId}",
        version = "${version}",
        url = "${apiUrl}",
        sessionid = ""
    }
    setmetatable(obj, KeyUnit)
    return obj
end

function KeyUnit:init()
    local initData = {
        type = "init",
        name = self.name,
        ownerid = self.ownerid,
        hash = self:generateHash(),
        enckey = self:generateEnckey()
    }

    local body = json.encode(initData)
    local response = http.request(self.url .. "/init", body)
    local data = json.decode(response)

    if data.success then
        self.sessionid = data.sessionid
        print("Aplicação inicializada com sucesso!")
        return true
    end
    return false
end

function KeyUnit:login(username, password)
    local loginData = {
        type = "login",
        name = self.name,
        ownerid = self.ownerid,
        username = username,
        password = password,
        hash = self:generateHash(),
        sessionid = self.sessionid,
        enckey = self:generateEnckey()
    }

    local body = json.encode(loginData)
    local response = http.request(self.url .. "/login", body)
    local data = json.decode(response)

    if data.success then
        self.sessionid = data.sessionid
        print("Login realizado com sucesso!")
        return true
    end
    return false
end

function KeyUnit:generateHash()
    return crypto.sha256(self.name .. self.ownerid .. self.version)
end

function KeyUnit:generateEnckey()
    return crypto.random(32)
end

-- Uso:
local auth = KeyUnit:new()
auth:init()
auth:login("usuario", "senha")`,
      ruby: `require 'net/http'
require 'json'
require 'digest'
require 'securerandom'

class KeyUnit
    def initialize
        @name = "${appName}"
        @ownerid = "${ownerId}"
        @version = "${version}"
        @url = "${apiUrl}"
        @sessionid = ""
    end

    def init
        init_data = {
            type: "init",
            name: @name,
            ownerid: @ownerid,
            hash: generate_hash,
            enckey: generate_enckey
        }

        response = post_request("#{@url}/init", init_data)
        if response["success"]
            @sessionid = response["sessionid"]
            puts "Aplicação inicializada com sucesso!"
            return true
        end
        false
    end

    def login(username, password)
        login_data = {
            type: "login",
            name: @name,
            ownerid: @ownerid,
            username: username,
            password: password,
            hash: generate_hash,
            sessionid: @sessionid,
            enckey: generate_enckey
        }

        response = post_request("#{@url}/login", login_data)
        if response["success"]
            @sessionid = response["sessionid"]
            puts "Login realizado com sucesso!"
            return true
        end
        false
    end

    private

    def generate_hash
        Digest::SHA256.hexdigest("#{@name}#{@ownerid}#{@version}")
    end

    def generate_enckey
        SecureRandom.hex(16)
    end

    def post_request(endpoint, data)
        uri = URI(endpoint)
        http = Net::HTTP.new(uri.host, uri.port)
        request = Net::HTTP::Post.new(uri.path)
        request["Content-Type"] = "application/json"
        request.body = data.to_json
        response = http.request(request)
        JSON.parse(response.body)
    end
end

# Uso:
auth = KeyUnit.new
auth.init
auth.login("usuario", "senha")`,
      perl: `use LWP::UserAgent;
use JSON;
use Digest::SHA qw(sha256_hex);
use Data::Random qw(rand_chars);

package KeyUnit;

sub new {
    my $class = shift;
    my $self = {
        name => "${appName}",
        ownerid => "${ownerId}",
        version => "${version}",
        url => "${apiUrl}",
        sessionid => ""
    };
    bless $self, $class;
    return $self;
}

sub init {
    my $self = shift;
    my $init_data = {
        type => "init",
        name => $self->{name},
        ownerid => $self->{ownerid},
        hash => $self->generate_hash(),
        enckey => $self->generate_enckey()
    };

    my $response = $self->post_request($self->{url} . "/init", $init_data);
    if ($response->{success}) {
        $self->{sessionid} = $response->{sessionid};
        print "Aplicação inicializada com sucesso!\n";
        return 1;
    }
    return 0;
}

sub login {
    my ($self, $username, $password) = @_;
    my $login_data = {
        type => "login",
        name => $self->{name},
        ownerid => $self->{ownerid},
        username => $username,
        password => $password,
        hash => $self->generate_hash(),
        sessionid => $self->{sessionid},
        enckey => $self->generate_enckey()
    };

    my $response = $self->post_request($self->{url} . "/login", $login_data);
    if ($response->{success}) {
        $self->{sessionid} = $response->{sessionid};
        print "Login realizado com sucesso!\n";
        return 1;
    }
    return 0;
}

sub generate_hash {
    my $self = shift;
    return sha256_hex($self->{name} . $self->{ownerid} . $self->{version});
}

sub generate_enckey {
    my $self = shift;
    return join("", rand_chars(set => 'alphanumeric', size => 32));
}

sub post_request {
    my ($self, $endpoint, $data) = @_;
    my $ua = LWP::UserAgent->new;
    my $json = encode_json($data);
    my $req = HTTP::Request->new(POST => $endpoint);
    $req->content_type('application/json');
    $req->content($json);
    my $res = $ua->request($req);
    return decode_json($res->content);
}

# Uso:
my $auth = KeyUnit->new;
$auth->init();
$auth->login("usuario", "senha");`
    }
  }, [appData])

  const copyCredentials = () => {
    const code = credentialsTemplate[selectedLanguage] || credentialsTemplate.csharp
    navigator.clipboard.writeText(code)
    showMessage('Credenciais copiadas!', 'success')
  }

  const viewExample = (language) => {
    setViewingExample(language)
  }

  const closeExampleModal = () => {
    setViewingExample(null)
  }

  const copyFullExample = (language) => {
    const code = codeExamples[language] || codeExamples.csharp
    navigator.clipboard.writeText(code)
    showMessage('Exemplo completo copiado!', 'success')
  }

  // Funções para gerenciar aplicações
  const loadApplications = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) return

    setIsLoadingApps(true)
    try {
      const response = await authService.getApplications(sessionid)
      if (response.success) {
        setApplications(response.applications || [])
        if (response.applications && response.applications.length > 0 && !currentApp) {
          setCurrentApp(response.applications[0])
        }
      }
    } catch (error) {
    } finally {
      setIsLoadingApps(false)
    }
  }

  const createApplication = async () => {
    if (!appName.trim()) {
      showMessage('Por favor, insira um nome para a aplicação', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingApps(true)
    try {
      // O owner_id será gerado automaticamente pelo backend usando o owner_id do usuário logado
      const response = await authService.createApplication(sessionid, {
        name: appName,
        version: appVersion || '1.0'
      })
      if (response.success) {
        showMessage('Aplicação criada com sucesso!', 'success')
        setShowCreateAppModal(false)
        setAppName('')
        await loadApplications()
        if (response.application) {
          setCurrentApp(response.application)
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar aplicação'
      showMessage(errorMessage, 'error')
    } finally {
      setIsLoadingApps(false)
    }
  }

  const renameApplication = async () => {
    if (!newAppName.trim() || !currentApp) {
      showMessage('Por favor, insira um novo nome para a aplicação', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingApps(true)
    try {
      const response = await authService.renameApplication(sessionid, currentApp.id, newAppName)
      if (response.success) {
        showMessage('Aplicação renomeada com sucesso!', 'success')
        setShowRenameAppModal(false)
        setNewAppName('')
        await loadApplications()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao renomear aplicação', 'error')
    } finally {
      setIsLoadingApps(false)
    }
  }

  // Funções adicionais para gerenciar aplicações
  const handlePauseApplication = async () => {
    if (!currentApp) return

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingApps(true)
    try {
      const response = await authService.pauseApplication(sessionid, currentApp.id, !currentApp.paused)
      if (response.success) {
        showMessage(response.message, 'success')
        await loadApplications()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao pausar aplicação', 'error')
    } finally {
      setIsLoadingApps(false)
    }
  }

  const handleDeleteApplication = async () => {
    if (!currentApp) return

    if (!window.confirm(`Tem certeza que deseja deletar a aplicação "${currentApp.name}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingApps(true)
    try {
      const response = await authService.deleteApplication(sessionid, currentApp.id)
      if (response.success) {
        showMessage('Aplicação deletada com sucesso!', 'success')
        setCurrentApp(null)
        await loadApplications()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar aplicação', 'error')
    } finally {
      setIsLoadingApps(false)
    }
  }

  const handleRefreshSecret = async () => {
    if (!currentApp) return

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingApps(true)
    try {
      const response = await authService.refreshAppSecret(sessionid, currentApp.id)
      if (response.success) {
        showMessage('Secret atualizado com sucesso!', 'success')
        await loadApplications()
        // Atualizar currentApp com novo secret
        if (response.app_secret) {
          setCurrentApp({ ...currentApp, app_secret: response.app_secret })
        }
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao atualizar secret', 'error')
    } finally {
      setIsLoadingApps(false)
    }
  }

  // Carregar aplicações quando abrir a aba
  useEffect(() => {
    if (activeTab === 'app' && appSubTab === 'apps') {
      loadApplications()
    }
  }, [activeTab, appSubTab])

  // Carregar licenças quando abrir a aba de licenças
  useEffect(() => {
    if (activeTab === 'app' && appSubTab === 'licenses') {
      loadLicenses()
    }
  }, [activeTab, appSubTab, currentApp])

  // Carregar usuários quando abrir a aba de usuários
  useEffect(() => {
    if (activeTab === 'app' && appSubTab === 'users') {
      loadUsers()
    }
  }, [activeTab, appSubTab, currentApp])

  // Carregar webhooks quando abrir a aba de webhooks
  useEffect(() => {
    if (activeTab === 'app' && appSubTab === 'webhooks') {
      loadWebhooks()
    }
  }, [activeTab, appSubTab, currentApp])

  // Carregar arquivos quando abrir a aba de arquivos
  useEffect(() => {
    if (activeTab === 'app' && appSubTab === 'files') {
      loadFiles()
    }
  }, [activeTab, appSubTab, currentApp])

  // Carregar logs do Anti-Crack quando abrir a aba
  const loadAntiCrackLogs = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid || !currentApp) {
      return
    }

    try {
      
      // Verificar se a função existe
      if (!authService) {
        return
      }
      
      if (!authService.getAntiCrackLogs) {
        return
      }
      
      if (typeof authService.getAntiCrackLogs !== 'function') {
        return
      }
      
      const response = await authService.getAntiCrackLogs(
        sessionid,
        currentApp.name,
        currentApp.owner_id
      )
      
      
      if (response.success && response.logs) {
        // Converter logs do banco para o formato do frontend
        // Filtrar logs do tipo 'system' (monitoramento iniciado/parado)
        const formattedLogs = response.logs
          .filter(log => log.type !== 'system')
          .map(log => {
          // Extrair nome do processo da mensagem se não estiver disponível
          let processName = log.process || 'Desconhecido'
          const message = log.message || `Ameaça detectada: ${log.type}`
          
          // Tentar extrair o nome do processo da mensagem
          if ((!processName || processName === 'Desconhecido' || processName === 'N/A') && message) {
            let processMatch = message.match(/detectado[:\s]+([^\s:]+)/i)
            if (!processMatch) {
              processMatch = message.match(/: ([^:\.\n]+?)(?:\s|$|\.|,)/)
            }
            if (!processMatch) {
              processMatch = message.match(/: ([^:]+)/)
            }
            if (processMatch && processMatch[1]) {
              processName = processMatch[1].trim().replace(/[.,;]$/, '').trim()
            }
          }
          
          // Garantir que sempre temos um nome de processo válido
          if (!processName || processName === 'N/A' || processName === 'Desconhecido') {
            if (log.type === 'suspicious_process') {
              processName = 'Processo Suspeito'
            } else if (log.type === 'debugger') {
              processName = 'Debugger'
            } else if (log.type === 'memory_overload') {
              processName = 'Sistema de Proteção'
            } else if (log.type === 'shutdown') {
              processName = 'Sistema Operacional'
            } else {
              processName = 'Sistema'
            }
          }
          
          return {
            id: log.id,
            type: log.type,
            message: message,
            process: processName,
            path: log.path || 'N/A',
            pid: log.pid || 'N/A',
            timestamp: log.timestamp,
            severity: log.severity || 'high',
            action: log.action || 'Monitorado',
            source: log.source || 'Sistema Anti-Crack'
          }
        })
        
        
        setDetectionLogs(formattedLogs)
        setThreatsDetected(formattedLogs.filter(log => log.severity !== 'info').length)
      } else {
      }
    } catch (error) {
    }
  }

  // Carregar logs e iniciar monitoramento automaticamente quando abrir a aba Anti-Crack
  useEffect(() => {
    if (activeTab === 'app' && appSubTab === 'anticrack' && currentApp) {
      loadAntiCrackLogs()
      
      // Iniciar monitoramento automaticamente se Anti-Crack estiver habilitado
      if (antiCrackEnabled && !isMonitoring) {
        // Pequeno delay para garantir que o estado está atualizado
        setTimeout(() => {
          if (antiCrackEnabled && !isMonitoring) {
            startMonitoring()
          }
        }, 100)
      }
    }
  }, [activeTab, appSubTab, currentApp, antiCrackEnabled, isMonitoring])


  // Atualizar currentApp quando applications mudar (apenas se houver mudanças)
  useEffect(() => {
    if (currentApp && applications.length > 0) {
      const updatedApp = applications.find(app => app.id === currentApp.id)
      if (updatedApp && JSON.stringify(updatedApp) !== JSON.stringify(currentApp)) {
        setCurrentApp(updatedApp)
      } else if (!updatedApp && applications.length > 0) {
        // Se a aplicação atual foi deletada, selecionar a primeira
        setCurrentApp(applications[0])
      }
    } else if (!currentApp && applications.length > 0) {
      // Se não há aplicação selecionada, selecionar a primeira
      setCurrentApp(applications[0])
    }
  }, [applications])

  // Atualizar ownerId quando currentApp mudar (usar o owner_id da aplicação)
  useEffect(() => {
    if (currentApp && currentApp.owner_id) {
      setOwnerId(currentApp.owner_id)
    }
  }, [currentApp])

  // Funções para gerenciar licenças
  const loadLicenses = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) return

    if (!currentApp) {
      // Se não há aplicação selecionada, não carregar licenças
      setLicenses([])
      return
    }

    setIsLoadingLicenses(true)
    try {
      const response = await authService.getLicenses(sessionid, currentApp.id)
      if (response.success) {
        setLicenses(response.licenses || [])
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao carregar licenças', 'error')
    } finally {
      setIsLoadingLicenses(false)
    }
  }

  const createLicense = async () => {
    const amount = parseInt(licenseAmount) || licenseQuantity || 1
    const duration = parseInt(licenseDuration) || 30
    
    if (!amount || amount < 1 || !duration || duration < 1) {
      showMessage('Por favor, preencha todos os campos obrigatórios', 'error')
      return
    }

    if (!useLowercase && !useUppercase) {
      showMessage('Selecione pelo menos um tipo de caractere', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingLicenses(true)
    try {
      // Converter duração para dias baseado na unidade
      let durationInDays = duration
      switch (licenseExpiryUnit) {
        case 'seconds':
          durationInDays = duration / (24 * 60 * 60)
          break
        case 'minutes':
          durationInDays = duration / (24 * 60)
          break
        case 'hours':
          durationInDays = duration / 24
          break
        case 'days':
          durationInDays = duration
          break
        case 'weeks':
          durationInDays = duration * 7
          break
        case 'months':
          durationInDays = duration * 30
          break
        case 'years':
          durationInDays = duration * 365
          break
        default:
          durationInDays = duration
      }


      const response = await authService.createLicense(
        sessionid,
        currentApp.id,
        amount,
        durationInDays,
        licenseMask || '******_******_******_******_******_******',
        useLowercase,
        useUppercase,
        licenseNote || ''
      )
      
      
      if (response.success) {
        showMessage(response.message || `${amount} licença(s) criada(s) com sucesso!`, 'success')
        setShowCreateLicenseModal(false)
        setLicenseAmount('')
        setLicenseMask('******_******_******_******_******_******')
        setUseLowercase(true)
        setUseUppercase(true)
        setLicenseQuantity(1)
        setLicenseNote('')
        setLicenseExpiryUnit('days')
        setLicenseDuration(30)
        await loadLicenses()
      } else {
        showMessage(response.message || 'Erro ao criar licença', 'error')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar licença'
      showMessage(errorMessage, 'error')
    } finally {
      setIsLoadingLicenses(false)
    }
  }

  const addTimeToUnusedLicenses = async () => {
    if (!addTimeAmount || addTimeAmount < 1) {
      showMessage('Por favor, insira uma quantidade válida', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingLicenses(true)
    try {
      // Converter duração para dias baseado na unidade
      let durationInDays = parseInt(addTimeAmount) || 0
      switch (addTimeUnit) {
        case 'seconds':
          durationInDays = durationInDays / (24 * 60 * 60)
          break
        case 'minutes':
          durationInDays = durationInDays / (24 * 60)
          break
        case 'hours':
          durationInDays = durationInDays / 24
          break
        case 'days':
          durationInDays = durationInDays
          break
        case 'weeks':
          durationInDays = durationInDays * 7
          break
        case 'months':
          durationInDays = durationInDays * 30
          break
        case 'years':
          durationInDays = durationInDays * 365
          break
        default:
          durationInDays = durationInDays
      }

      const response = await authService.addTimeToUnusedLicenses(
        sessionid,
        currentApp.id,
        durationInDays
      )
      if (response.success) {
        showMessage(response.message || 'Tempo adicionado com sucesso!', 'success')
        setShowAddTimeModal(false)
        setAddTimeAmount('')
        setAddTimeUnit('days')
        await loadLicenses()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao adicionar tempo', 'error')
    } finally {
      setIsLoadingLicenses(false)
    }
  }

  const exportLicenses = async (format = 'json') => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    try {
      const response = await authService.exportLicenses(sessionid, currentApp.id, format)
      
      if (format === 'csv') {
        // Criar blob e download
        const blob = new Blob([response], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `licenses_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showMessage('Licenças exportadas com sucesso!', 'success')
      } else {
        // JSON
        const dataStr = JSON.stringify(response, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `licenses_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showMessage('Licenças exportadas com sucesso!', 'success')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao exportar licenças', 'error')
    }
  }

  const handleDeleteAllLicenses = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODAS as licenças? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingLicenses(true)
    try {
      const response = await authService.deleteAllLicenses(sessionid, currentApp.id)
      if (response.success) {
        showMessage(response.message || 'Licenças deletadas com sucesso!', 'success')
        await loadLicenses()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar licenças', 'error')
    } finally {
      setIsLoadingLicenses(false)
    }
  }

  const handleDeleteUsedLicenses = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODAS as licenças USADAS? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingLicenses(true)
    try {
      const response = await authService.deleteUsedLicenses(sessionid, currentApp.id)
      if (response.success) {
        showMessage(response.message || 'Licenças usadas deletadas com sucesso!', 'success')
        await loadLicenses()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar licenças usadas', 'error')
    } finally {
      setIsLoadingLicenses(false)
    }
  }

  const handleDeleteUnusedLicenses = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODAS as licenças NÃO USADAS? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingLicenses(true)
    try {
      const response = await authService.deleteUnusedLicenses(sessionid, currentApp.id)
      if (response.success) {
        showMessage(response.message || 'Licenças não usadas deletadas com sucesso!', 'success')
        await loadLicenses()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar licenças não usadas', 'error')
    } finally {
      setIsLoadingLicenses(false)
    }
  }

  // Filtrar e pesquisar licenças
  const filteredLicenses = useMemo(() => {
    let filtered = licenses

    // Filtro por status (used/unused/all)
    if (licenseShowFilter === 'used') {
      filtered = filtered.filter(license => license.used)
    } else if (licenseShowFilter === 'unused') {
      filtered = filtered.filter(license => !license.used)
    }

    // Filtro por busca
    if (licenseSearch) {
      const searchLower = licenseSearch.toLowerCase()
      filtered = filtered.filter(license =>
        license.license_key.toLowerCase().includes(searchLower) ||
        license.subscription.toLowerCase().includes(searchLower) ||
        (license.used_by && license.used_by.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [licenses, licenseShowFilter, licenseSearch])

  // Paginar licenças
  const paginatedLicenses = useMemo(() => {
    return filteredLicenses.slice(0, licensePageSize)
  }, [filteredLicenses, licensePageSize])

  // ========================================
  // FUNÇÕES PARA GERENCIAR USUÁRIOS
  // ========================================

  // Carregar usuários
  const loadUsers = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) return

    if (!currentApp) {
      setUsers([])
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await authService.getUsers(sessionid, currentApp.id)
      if (response.success) {
        setUsers(response.users || [])
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao carregar usuários', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Criar usuário
  const createUserHandler = async (e) => {
    // Prevenir comportamento padrão se for um evento de formulário
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Prevenir múltiplos cliques
    if (isLoadingUsers) {
      return
    }


    if (!createUserUsername || !createUserPassword || !newUserSubscription || !newUserExpiration) {
      showMessage('Por favor, preencha todos os campos obrigatórios', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await authService.createUser(sessionid, currentApp.id, {
        username: createUserUsername,
        password: createUserPassword,
        email: createUserEmail || '',
        subscription: newUserSubscription,
        expiration: newUserExpiration
      })


      if (response.success) {
        showMessage(response.message || 'Usuário criado com sucesso!', 'success')
        setShowCreateUserModal(false)
        setCreateUserUsername('')
        setCreateUserPassword('')
        setCreateUserEmail('')
        setNewUserSubscription('default')
        setNewUserExpiration('')
        await loadUsers()
      } else {
        showMessage(response.message || 'Erro ao criar usuário', 'error')
      }
    } catch (error) {
      showMessage(error.response?.data?.message || error.message || 'Erro ao criar usuário', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Estender tempo de usuários
  const extendUsersHandler = async () => {
    if (!extendUsersAmount || extendUsersAmount < 1) {
      showMessage('Por favor, insira uma quantidade válida', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    try {
      // Converter para dias
      let days = parseInt(extendUsersAmount) || 0
      switch (extendUsersUnit) {
        case 'seconds':
          days = days / (24 * 60 * 60)
          break
        case 'minutes':
          days = days / (24 * 60)
          break
        case 'hours':
          days = days / 24
          break
        case 'days':
          days = days
          break
        case 'weeks':
          days = days * 7
          break
        case 'months':
          days = days * 30
          break
        case 'years':
          days = days * 365
          break
        default:
          days = days
      }

      const response = await authService.extendUsers(
        sessionid,
        currentApp.id,
        days,
        selectedUsers.length > 0 ? selectedUsers : null
      )

      if (response.success) {
        showMessage(response.message || 'Tempo estendido com sucesso!', 'success')
        setShowExtendUsersModal(false)
        setExtendUsersAmount('')
        setExtendUsersUnit('days')
        setSelectedUsers([])
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao estender tempo', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Reduzir tempo de usuários
  const subtractUsersHandler = async () => {
    if (!subtractUsersAmount || subtractUsersAmount < 1) {
      showMessage('Por favor, insira uma quantidade válida', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    try {
      // Converter para dias
      let days = parseInt(subtractUsersAmount) || 0
      switch (subtractUsersUnit) {
        case 'seconds':
          days = days / (24 * 60 * 60)
          break
        case 'minutes':
          days = days / (24 * 60)
          break
        case 'hours':
          days = days / 24
          break
        case 'days':
          days = days
          break
        case 'weeks':
          days = days * 7
          break
        case 'months':
          days = days * 30
          break
        case 'years':
          days = days * 365
          break
        default:
          days = days
      }

      const response = await authService.subtractUsers(
        sessionid,
        currentApp.id,
        days,
        selectedUsers.length > 0 ? selectedUsers : null
      )

      if (response.success) {
        showMessage(response.message || 'Tempo reduzido com sucesso!', 'success')
        setShowSubtractUsersModal(false)
        setSubtractUsersAmount('')
        setSubtractUsersUnit('days')
        setSelectedUsers([])
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao reduzir tempo', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Exportar usuários
  const exportUsersHandler = async (format = 'json') => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    try {
      const response = await authService.exportUsers(sessionid, currentApp.id, format)
      
      if (format === 'csv') {
        const blob = new Blob([response], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showMessage('Usuários exportados com sucesso!', 'success')
      } else {
        const dataStr = JSON.stringify(response, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showMessage('Usuários exportados com sucesso!', 'success')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao exportar usuários', 'error')
    }
  }

  // Deletar todos os usuários
  const handleDeleteAllUsers = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODOS os usuários? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await authService.deleteAllUsers(sessionid, currentApp.id)
      if (response.success) {
        showMessage(response.message || 'Usuários deletados com sucesso!', 'success')
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar usuários', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Deletar usuários expirados
  const handleDeleteExpiredUsers = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODOS os usuários EXPIRADOS? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await authService.deleteExpiredUsers(sessionid, currentApp.id)
      if (response.success) {
        showMessage(response.message || 'Usuários expirados deletados com sucesso!', 'success')
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar usuários expirados', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Resetar HWID de usuários
  const handleResetUsersHwid = async () => {
    if (!window.confirm('Tem certeza que deseja resetar o HWID de TODOS os usuários?')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await authService.resetUsersHwid(sessionid, currentApp.id)
      if (response.success) {
        showMessage(response.message || 'HWID resetado com sucesso!', 'success')
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao resetar HWID', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Resetar apenas HWID de um usuário específico
  const handleResetUserHwid = async (userId) => {
    const confirmed = await showConfirm('Tem certeza que deseja resetar o HWID deste usuário?', {
      type: 'warning'
    })
    if (!confirmed) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    setOpenUserDropdown(null) // Fechar dropdown
    try {
      const response = await authService.resetUserHwid(sessionid, currentApp.id, userId)
      if (response.success) {
        showMessage(response.message || 'HWID resetado com sucesso!', 'success')
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao resetar HWID', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Resetar apenas IP de um usuário específico
  const handleResetUserIp = async (userId) => {
    const confirmed = await showConfirm('Tem certeza que deseja resetar o IP deste usuário?', {
      type: 'warning'
    })
    if (!confirmed) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    setOpenUserDropdown(null) // Fechar dropdown
    try {
      const response = await authService.resetUserIp(sessionid, currentApp.id, userId)
      if (response.success) {
        showMessage(response.message || 'IP resetado com sucesso!', 'success')
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao resetar IP', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Resetar HWID e IP de um usuário específico
  const handleResetUserHwidIp = async (userId) => {
    const confirmed = await showConfirm('Tem certeza que deseja resetar o HWID e IP deste usuário?', {
      type: 'warning'
    })
    if (!confirmed) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingUsers(true)
    setOpenUserDropdown(null) // Fechar dropdown
    try {
      const response = await authService.resetUserHwidIp(sessionid, currentApp.id, userId)
      if (response.success) {
        showMessage(response.message || 'HWID e IP resetados com sucesso!', 'success')
        await loadUsers()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao resetar HWID e IP', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // ========================================
  // FUNÇÕES PARA GERENCIAR WEBHOOKS
  // ========================================

  const loadWebhooks = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) return

    if (!currentApp) {
      setWebhooks([])
      return
    }

    setIsLoadingWebhooks(true)
    try {
      const response = await authService.getWebhooks(sessionid, currentApp.id)
      if (response.success) {
        setWebhooks(response.webhooks || [])
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao carregar webhooks', 'error')
      setWebhooks([])
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  const createWebhook = async () => {
    if (!webhookEndpoint.trim()) {
      showMessage('Endpoint é obrigatório', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingWebhooks(true)
    try {
      const response = await authService.createWebhook(sessionid, currentApp.id, webhookEndpoint.trim(), webhookUserAgent)
      if (response.success) {
        showMessage('Webhook criado com sucesso!', 'success')
        setShowCreateWebhookModal(false)
        setWebhookEndpoint('')
        setWebhookUserAgent('KeyUnit-Webhook/1.0')
        await loadWebhooks()
      } else {
        showMessage(response.message || 'Erro ao criar webhook', 'error')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar webhook'
      showMessage(errorMessage, 'error')
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  const deleteWebhook = async (webhookId) => {
    if (!window.confirm('Tem certeza que deseja deletar este webhook? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingWebhooks(true)
    setOpenWebhookDropdown(null)
    try {
      const response = await authService.deleteWebhook(sessionid, currentApp.id, webhookId)
      if (response.success) {
        showMessage('Webhook deletado com sucesso!', 'success')
        await loadWebhooks()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar webhook', 'error')
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  // ========================================
  // FUNÇÕES ANTI-CRACK
  // ========================================

  // Lista de processos suspeitos comuns
  const suspiciousProcessNames = [
    'cheatengine', 'cheat engine', 'ce', 'x64dbg', 'x32dbg', 'x96dbg', 'ollydbg',
    'windbg', 'ida', 'ida64', 'ida32', 'ghidra', 'radare2', 'r2', 'immunity',
    'processhacker', 'process hacker', 'procmon', 'process monitor', 'wireshark',
    'fiddler', 'charles', 'burp', 'dnspy', 'ilspy', 'reflector', 'de4dot',
    'unpacker', 'unpack', 'patcher', 'patch', 'keygen', 'crack', 'loader',
    'injector', 'inject', 'hook', 'bypass', 'bypasser', 'hack', 'hacking',
    'trainer', 'trainer.exe', 'artmoney', 'art money', 'gameguardian',
    'game guardian', 'gamecih', 'game killer', 'gamekiller', 'speedhack',
    'speed hack', 'memory', 'memory editor', 'memedit', 'memhack', 'mem hack'
  ]

  // Detectar processos suspeitos
  const detectSuspiciousProcesses = async () => {
    if (!antiCrackEnabled || !isMonitoring) return

    try {
      // Simular detecção de processos (em produção, isso seria feito via backend/API)
      // Aumentado para 30% de chance para demonstração (pode ser ajustado)
      const randomDetection = Math.random() < 0.3 // 30% chance de detectar algo
      
      if (randomDetection) {
        const detectedProcess = suspiciousProcessNames[Math.floor(Math.random() * suspiciousProcessNames.length)]
        const threat = {
          id: Date.now(),
          type: 'suspicious_process',
          process: detectedProcess,
          path: `C:\\Windows\\System32\\${detectedProcess}.exe`,
          pid: Math.floor(Math.random() * 10000),
          timestamp: new Date().toISOString(),
          severity: 'high',
          action: 'Bloqueado e reportado',
          source: 'Monitor de Processos'
        }
        
        setSuspiciousProcesses(prev => [...prev, threat])
        setThreatsDetected(prev => prev + 1)
        addDetectionLog(threat)
        
        // Executar ações de proteção
        handleThreatDetected(threat)
      }
    } catch (error) {
    }
  }

  // Detectar debuggers
  const detectDebugger = () => {
    if (!antiCrackEnabled || !isMonitoring) return false

    try {
      // Verificar se DevTools está aberto
      const threshold = 160
      const heightDiff = window.outerHeight - window.innerHeight
      const widthDiff = window.outerWidth - window.innerWidth
      
      if (heightDiff > threshold || widthDiff > threshold) {
        // DevTools detectado
        if (!debuggerDetected) {
          const threat = {
            id: Date.now(),
            type: 'debugger',
            process: 'Browser DevTools / Debugger',
            path: 'Chrome DevTools',
            pid: 'N/A',
            timestamp: new Date().toISOString(),
            severity: 'critical',
            action: 'Ação de proteção ativada',
            source: 'Detector de Debugger'
          }
          
          setDebuggerDetected(true)
          setThreatsDetected(prev => prev + 1)
          addDetectionLog(threat)
          handleThreatDetected(threat)
          return true
        }
      } else {
        // DevTools fechado
        if (debuggerDetected) {
          setDebuggerDetected(false)
        }
      }
      
      // Verificar console (tentativa de detectar console aberto)
      try {
        let devtools = false
        const element = new Image()
        Object.defineProperty(element, 'id', {
          get: function() {
            devtools = true
            return 'devtools-detector'
          }
        })
        
        if (devtools && !debuggerDetected) {
          const threat = {
            id: Date.now(),
            type: 'debugger',
            process: 'Console / Debugger Detected',
            path: 'Browser Console',
            pid: 'N/A',
            timestamp: new Date().toISOString(),
            severity: 'critical',
            action: 'Ação de proteção ativada',
            source: 'Detector de Console'
          }
          
          setDebuggerDetected(true)
          setThreatsDetected(prev => prev + 1)
          addDetectionLog(threat)
          handleThreatDetected(threat)
          return true
        }
      } catch (e) {
        // Ignorar erros de console
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  // Adicionar log de detecção
  const addDetectionLog = (threat) => {
    // Gerar mensagens mais detalhadas baseadas no tipo
    let detailedMessage = threat.message
    let processName = threat.process || 'Desconhecido'
    let processPath = threat.path || 'N/A'
    let processId = threat.pid || Math.floor(Math.random() * 10000)
    let additionalInfo = threat.additionalInfo || {}
    
    if (!detailedMessage) {
      switch (threat.type) {
        case 'suspicious_process':
          detailedMessage = `Processo suspeito detectado: ${processName}`
          break
        case 'debugger':
          detailedMessage = `Debugger detectado: ${processName}`
          break
        case 'memory_scan':
          detailedMessage = `Varredura de memória detectada`
          break
        case 'injection':
          detailedMessage = `Tentativa de injeção de código detectada`
          break
        default:
          detailedMessage = `Ameaça detectada: ${processName}`
      }
    }
    
    // Se não temos o nome do processo mas temos a mensagem, tentar extrair da mensagem
    if ((!processName || processName === 'Desconhecido' || processName === 'N/A') && detailedMessage) {
      // Tentar extrair o nome do processo da mensagem (vários padrões)
      // Padrão: "Processo suspeito detectado: x64dbg"
      let processMatch = detailedMessage.match(/detectado[:\s]+([^\s:]+)/i)
      if (!processMatch) {
        // Padrão: "Debugger detectado: Chrome DevTools"
        processMatch = detailedMessage.match(/: ([^:\.\n]+?)(?:\s|$|\.|,)/)
      }
      if (!processMatch) {
        // Padrão: qualquer coisa após ": "
        processMatch = detailedMessage.match(/: ([^:]+)/)
      }
      if (processMatch && processMatch[1]) {
        processName = processMatch[1].trim()
        // Remover pontos finais e vírgulas
        processName = processName.replace(/[.,;]$/, '').trim()
      }
    }
    
    // Garantir que sempre temos um nome de processo válido
    if (!processName || processName === 'N/A' || processName === 'Desconhecido') {
      // Se ainda não temos, usar baseado no tipo
      if (threat.type === 'suspicious_process') {
        processName = 'Processo Suspeito'
      } else if (threat.type === 'debugger') {
        processName = 'Debugger'
      } else if (threat.type === 'memory_overload') {
        processName = 'Sistema de Proteção'
      } else if (threat.type === 'shutdown') {
        processName = 'Sistema Operacional'
      } else if (threat.type === 'system') {
        processName = 'Sistema Anti-Crack'
      } else {
        processName = 'Sistema'
      }
    }
    
    const log = {
      id: threat.id || Date.now(),
      type: threat.type,
      message: detailedMessage,
      process: processName,
      path: processPath,
      pid: processId,
      timestamp: threat.timestamp || new Date().toISOString(),
      severity: threat.severity || 'info',
      additionalInfo: additionalInfo,
      action: threat.action || 'Monitorado',
      source: threat.source || 'Sistema Anti-Crack'
    }
    
    setDetectionLogs(prev => {
      const newLogs = [log, ...prev].slice(0, 100) // Manter apenas os últimos 100 logs
      return newLogs
    })
    
    // Salvar no banco de dados se tiver app e session
    if (currentApp && threat.type !== 'system') {
      const sessionid = localStorage.getItem('sessionid')
      if (sessionid) {
        // Salvar log no backend (assíncrono, não bloquear UI)
        authService.saveAntiCrackLog(
          sessionid,
          currentApp.name,
          currentApp.owner_id,
          threat.type,
          threat.process || threat.message || '',
          threat.severity || 'info'
        ).catch(err => {
        })
      }
    }
  }

  // Lidar com ameaça detectada
  const handleThreatDetected = (threat) => {
    showMessage(`⚠️ AMEAÇA DETECTADA: ${threat.process}`, 'error')
    
    // Sobrecarga de memória se habilitado (para qualquer ameaça)
    if (memoryOverloadEnabled && antiCrackEnabled) {
      overloadMemory()
    }
    
    // Desligar PC se habilitado (apenas para ameaças críticas)
    if (shutdownEnabled && antiCrackEnabled && threat.severity === 'critical') {
      shutdownPC()
    }
  }

  // Sobrecarga de memória
  const overloadMemory = () => {
    try {
      if (!memoryOverloadEnabled) return
      
      // Criar múltiplos arrays grandes para consumir memória
      const arrays = []
      const arraySize = 10000000 // 10 milhões de elementos
      
      // Criar arrays em lotes para evitar travamento imediato
      for (let i = 0; i < 30; i++) {
        try {
          arrays.push(new Array(arraySize).fill(Math.random()))
        } catch (e) {
          // Se não conseguir criar mais, para
          break
        }
      }
      
      // Manter referência global para evitar garbage collection
      window._antiCrackMemoryArrays = window._antiCrackMemoryArrays || []
      window._antiCrackMemoryArrays.push(...arrays)
      
      // Processar arrays para manter na memória
      setTimeout(() => {
        arrays.forEach(arr => {
          if (arr && arr.length > 0) {
            // Processar para manter na memória
            arr.forEach((val, idx) => {
              if (idx % 100000 === 0) {
                arr[idx] = val * 1.1 // Modificar valores periodicamente
              }
            })
          }
        })
      }, 100)
      
      addDetectionLog({
        id: Date.now(),
        type: 'memory_overload',
        message: 'Sobrecarga de memória ativada - Sistema protegido',
        process: 'Sistema de Proteção',
        path: 'N/A',
        pid: 'N/A',
        timestamp: new Date().toISOString(),
        severity: 'high',
        action: 'Memória sobrecarregada',
        source: 'Sistema Anti-Crack'
      })
      
      showMessage('💾 Sobrecarga de memória ativada!', 'error')
    } catch (error) {
      addDetectionLog({
        id: Date.now(),
        type: 'memory_overload',
        message: 'Erro ao ativar sobrecarga de memória',
        process: 'Sistema de Proteção',
        path: 'N/A',
        pid: 'N/A',
        timestamp: new Date().toISOString(),
        severity: 'high',
        action: 'Falha na execução',
        source: 'Sistema Anti-Crack'
      })
    }
  }

  // Desligar PC (Windows)
  const shutdownPC = () => {
    try {
      if (!shutdownEnabled) return
      
      addDetectionLog({
        id: Date.now(),
        type: 'shutdown',
        message: 'Desligamento do sistema iniciado - Ameaça crítica detectada',
        process: 'Sistema Operacional',
        path: 'N/A',
        pid: 'N/A',
        timestamp: new Date().toISOString(),
        severity: 'critical',
        action: 'Desligamento iniciado',
        source: 'Sistema Anti-Crack'
      })
      
      // Mostrar avisos progressivos
      showMessage('⚠️ AMEAÇA CRÍTICA DETECTADA!', 'error')
      
      setTimeout(() => {
        showMessage('⚠️ SISTEMA SERÁ DESLIGADO EM 5 SEGUNDOS!', 'error')
      }, 1000)
      
      setTimeout(() => {
        showMessage('⚠️ DESLIGANDO EM 3 SEGUNDOS...', 'error')
      }, 3000)
      
      setTimeout(() => {
        showMessage('⚠️ DESLIGANDO EM 1 SEGUNDO...', 'error')
      }, 4000)
      
      // Em produção, isso seria uma chamada API para o backend executar o shutdown
      // O backend executaria: shutdown /s /t 0 (Windows) ou shutdown -h now (Linux)
      setTimeout(() => {
        addDetectionLog({
          id: Date.now(),
          type: 'shutdown',
          message: 'Sistema desligando agora...',
          process: 'Sistema Operacional',
          path: 'N/A',
          pid: 'N/A',
          timestamp: new Date().toISOString(),
          severity: 'critical',
          action: 'Desligamento em execução',
          source: 'Sistema Anti-Crack'
        })
        
        // Simulação - em produção, chamar API do backend
        // const sessionid = localStorage.getItem('sessionid')
        // if (sessionid && currentApp) {
        //   authService.reportAntiCrackThreat(
        //     'status',
        //     currentApp.name,
        //     currentApp.owner_id,
        //     sessionid,
        //     'hash',
        //     '',
        //     'critical',
        //     'System shutdown triggered'
        //   )
        // }
        
        // Para demonstração, apenas mostrar alerta
        alert('⚠️ SISTEMA DESLIGANDO...\n\nAmeaça crítica detectada!\n\n(Em produção, o sistema seria desligado automaticamente)')
      }, 5000)
    } catch (error) {
      addDetectionLog({
        id: Date.now(),
        type: 'shutdown',
        message: 'Erro ao iniciar desligamento do sistema',
        process: 'Sistema Operacional',
        path: 'N/A',
        pid: 'N/A',
        timestamp: new Date().toISOString(),
        severity: 'critical',
        action: 'Falha na execução',
        source: 'Sistema Anti-Crack'
      })
    }
  }

  // Iniciar monitoramento
  const startMonitoring = () => {
    if (isMonitoring) return
    
    setIsMonitoring(true)
    
    // Verificar debugger a cada 1 segundo
    const debuggerInterval = setInterval(() => {
      if (!antiCrackEnabled || !isMonitoring) {
        clearInterval(debuggerInterval)
        return
      }
      detectDebugger()
    }, 1000)
    
    // Verificar processos suspeitos a cada 5 segundos (aumentado para dar mais tempo)
    const processInterval = setInterval(() => {
      if (!antiCrackEnabled || !isMonitoring) {
        clearInterval(processInterval)
        return
      }
      detectSuspiciousProcesses()
    }, 5000)
    
    monitoringIntervalRef.current = { debuggerInterval, processInterval }
    
    showMessage('Monitoramento Anti-Crack iniciado', 'success')
  }

  // Parar monitoramento
  const stopMonitoring = () => {
    if (!isMonitoring) return
    
    setIsMonitoring(false)
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current.debuggerInterval)
      clearInterval(monitoringIntervalRef.current.processInterval)
      monitoringIntervalRef.current = null
    }
    
    showMessage('Monitoramento Anti-Crack parado', 'success')
  }

  // Limpar logs
  const clearLogs = () => {
    setDetectionLogs([])
    setThreatsDetected(0)
    setSuspiciousProcesses([])
    setDebuggerDetected(false)
    showMessage('Logs limpos', 'success')
  }

  // Recarregar logs do banco de dados
  const reloadLogs = async () => {
    await loadAntiCrackLogs()
    showMessage('Logs recarregados', 'success')
  }

  // Parar monitoramento quando sair da aba Anti-Crack
  useEffect(() => {
    // Apenas parar o monitoramento se sair da aba, mas não iniciar automaticamente
    if (appSubTab !== 'anticrack' && isMonitoring) {
      stopMonitoring()
    }
    
    // Cleanup ao desmontar
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current.debuggerInterval)
        clearInterval(monitoringIntervalRef.current.processInterval)
      }
    }
  }, [activeTab, appSubTab])

  const deleteAllWebhooks = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODOS os webhooks? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingWebhooks(true)
    try {
      const response = await authService.deleteAllWebhooks(sessionid, currentApp.id)
      if (response.success) {
        showMessage(`${response.deletedCount || 0} webhook(s) deletado(s) com sucesso!`, 'success')
        await loadWebhooks()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar webhooks', 'error')
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  const testWebhook = async () => {
    if (!testWebhookId) return

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingWebhooks(true)
    try {
      const response = await authService.testWebhook(sessionid, currentApp.id, testWebhookId, testWebhookMessage)
      if (response.success) {
        showMessage('Webhook testado e enviado com sucesso para o Discord!', 'success')
        setShowTestWebhookModal(false)
        setTestWebhookId(null)
        setTestWebhookMessage('Teste de webhook do KeyUnit')
        await loadWebhooks()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao testar webhook', 'error')
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  const handleTestWebhookClick = (webhookId) => {
    setTestWebhookId(webhookId)
    setShowTestWebhookModal(true)
    setOpenWebhookDropdown(null)
  }

  // Funções para gerenciar arquivos
  const loadFiles = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) return

    if (!currentApp) {
      setFiles([])
      return
    }

    setIsLoadingFiles(true)
    try {
      const response = await fileService.getFiles(sessionid, currentApp.id)
      if (response.success) {
        setFiles(response.files || [])
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao carregar arquivos', 'error')
      setFiles([])
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleAddFile = async () => {
    if (!fileUrl.trim() || !fileFilename.trim()) {
      showMessage('URL e nome do arquivo são obrigatórios', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingFiles(true)
    try {
      const response = await fileService.addFile(
        sessionid,
        currentApp.id,
        fileUrl.trim(),
        fileFilename.trim(),
        fileAuthenticated
      )
      if (response.success) {
        showMessage('Arquivo adicionado com sucesso!', 'success')
        setShowUploadFileModal(false)
        setFileUrl('')
        setFileFilename('')
        setFileAuthenticated(true)
        await loadFiles()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao adicionar arquivo', 'error')
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Tem certeza que deseja deletar este arquivo? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingFiles(true)
    setOpenFileDropdown(null)
    try {
      const response = await fileService.deleteFile(sessionid, currentApp.id, fileId)
      if (response.success) {
        showMessage('Arquivo deletado com sucesso!', 'success')
        await loadFiles()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar arquivo', 'error')
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleDeleteAllFiles = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODOS os arquivos? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    if (!currentApp) {
      showMessage('Por favor, selecione uma aplicação primeiro', 'error')
      return
    }

    setIsLoadingFiles(true)
    try {
      const response = await fileService.deleteAllFiles(sessionid, currentApp.id)
      if (response.success) {
        showMessage(`${response.deletedCount || 0} arquivo(s) deletado(s) com sucesso!`, 'success')
        await loadFiles()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar arquivos', 'error')
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Filtrar e pesquisar arquivos
  const filteredFiles = useMemo(() => {
    let filtered = files
    
    if (filesSearch) {
      const searchLower = filesSearch.toLowerCase()
      filtered = filtered.filter(file => 
        file.id.toString().includes(searchLower) ||
        file.filename.toLowerCase().includes(searchLower) ||
        (file.file_url && file.file_url.toLowerCase().includes(searchLower))
      )
    }
    
    return filtered.slice(0, filesPageSize)
  }, [files, filesSearch, filesPageSize])

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Filtrar e pesquisar webhooks
  const filteredWebhooks = useMemo(() => {
    let filtered = webhooks
    
    if (webhookSearch) {
      const searchLower = webhookSearch.toLowerCase()
      filtered = filtered.filter(webhook => 
        webhook.id.toString().includes(searchLower) ||
        webhook.endpoint.toLowerCase().includes(searchLower) ||
        (webhook.user_agent && webhook.user_agent.toLowerCase().includes(searchLower))
      )
    }
    
    return filtered.slice(0, webhookPageSize)
  }, [webhooks, webhookSearch, webhookPageSize])

  // Filtrar e pesquisar usuários
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filtro por busca
    if (usersSearch) {
      const searchLower = usersSearch.toLowerCase()
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.license_key && user.license_key.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [users, usersSearch])

  // Paginar usuários
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(0, usersPageSize)
  }, [filteredUsers, usersPageSize])

  // Refs para controlar polling e evitar múltiplas chamadas
  const isLoadingUserChatRef = useRef(false)
  const userChatPollingIntervalRef = useRef(null)
  const selectedTicketIdRef = useRef(null)
  const isOnChatTabRef = useRef(false)
  const paymentStatusCheckIntervalRef = useRef(null)

  // Funções para chat/tickets
  const loadUserChatTickets = async (showLoading = true) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingUserChatRef.current && !showLoading) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      if (showLoading) {
        showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      }
      return
    }

    if (showLoading) {
      setIsLoadingUserChat(true)
    }
    isLoadingUserChatRef.current = true

    try {
      const response = await chatService.getTickets(sessionid)
      if (response.success) {
        setUserChatTickets(response.tickets || [])
      }
    } catch (error) {
      if (error.response?.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.removeItem('sessionid')
        localStorage.removeItem('username')
        if (showLoading) {
          showMessage('Sessão expirada. Por favor, faça login novamente.', 'error')
        }
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        // Não mostrar erro durante polling silencioso
        if (showLoading) {
          showMessage(error.message || 'Erro ao carregar tickets', 'error')
        }
      }
    } finally {
      isLoadingUserChatRef.current = false
      if (showLoading) {
        setIsLoadingUserChat(false)
      }
    }
  }

  const loadUserChatMessages = async (ticketId, showLoading = true) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingUserChatRef.current && !showLoading) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      if (showLoading) {
        showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      }
      return
    }

    if (showLoading) {
      setIsLoadingUserChat(true)
    }
    isLoadingUserChatRef.current = true

    try {
      const response = await chatService.getMessages(sessionid, ticketId)
      if (response.success) {
        setUserChatMessages(response.messages || [])
        // Scroll para baixo apenas se não for polling silencioso
        if (showLoading) {
          setTimeout(() => {
            scrollToBottom()
          }, 100)
        }
      }
    } catch (error) {
      if (error.response?.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.removeItem('sessionid')
        localStorage.removeItem('username')
        if (showLoading) {
          showMessage('Sessão expirada. Por favor, faça login novamente.', 'error')
        }
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        // Não mostrar erro durante polling silencioso
        if (showLoading) {
          showMessage(error.message || 'Erro ao carregar mensagens', 'error')
        }
      }
    } finally {
      isLoadingUserChatRef.current = false
      if (showLoading) {
        setIsLoadingUserChat(false)
      }
    }
  }

  // Função para fazer scroll automático para baixo
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSelectUserTicket = (ticket) => {
    setSelectedUserTicket(ticket)
    selectedTicketIdRef.current = ticket.id
    
    // Carregar mensagens com loading visível
    loadUserChatMessages(ticket.id, true)
    
    // Limpar polling anterior se existir
    if (userChatPollingIntervalRef.current) {
      clearInterval(userChatPollingIntervalRef.current)
      userChatPollingIntervalRef.current = null
    }
    
    // Iniciar polling silencioso para novas mensagens (sem mostrar loading)
    // Aumentar intervalo para 10 segundos para reduzir carga
    userChatPollingIntervalRef.current = setInterval(() => {
      // Verificar se ainda está na aba de chat usando ref (sempre atualizado)
      if (isOnChatTabRef.current && selectedTicketIdRef.current) {
        loadUserChatMessages(selectedTicketIdRef.current, false) // Polling silencioso (sem loading)
        loadUserChatTickets(false) // Polling silencioso (sem loading)
      } else {
        // Se saiu da aba ou não há ticket, parar polling
        if (userChatPollingIntervalRef.current) {
          clearInterval(userChatPollingIntervalRef.current)
          userChatPollingIntervalRef.current = null
        }
      }
    }, 10000) // 10 segundos em vez de 3
  }

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      showMessage('Assunto e mensagem são obrigatórios', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingUserChat(true)
    try {
      const response = await chatService.createTicket(sessionid, newTicketSubject, newTicketMessage)
      if (response.success) {
        showMessage('Ticket criado com sucesso!', 'success')
        setShowNewTicketModal(false)
        setNewTicketSubject('')
        setNewTicketMessage('')
        await loadUserChatTickets(true)
        if (response.ticket) {
          handleSelectUserTicket({ id: response.ticket.id, subject: response.ticket.subject, status: response.ticket.status })
        }
      }
    } catch (error) {
      if (error.response?.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.removeItem('sessionid')
        localStorage.removeItem('username')
        showMessage('Sessão expirada. Por favor, faça login novamente.', 'error')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        showMessage(error.message || 'Erro ao criar ticket', 'error')
      }
    } finally {
      setIsLoadingUserChat(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        showMessage('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)', 'error')
        return
      }
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('A imagem deve ter no máximo 5MB', 'error')
        return
      }
      setSelectedImage(file)
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendUserMessage = async () => {
    if ((!newUserMessage.trim() && !selectedImage) || !selectedUserTicket) return

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingUserChat(true)
    try {
      await chatService.sendMessage(sessionid, selectedUserTicket.id, newUserMessage, selectedImage)
      setNewUserMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // Recarregar mensagens e tickets com loading visível após enviar
      await loadUserChatMessages(selectedUserTicket.id, true)
      await loadUserChatTickets(true)
      // Scroll para baixo após enviar mensagem
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      if (error.response?.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.removeItem('sessionid')
        localStorage.removeItem('username')
        showMessage('Sessão expirada. Por favor, faça login novamente.', 'error')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        showMessage(error.message || 'Erro ao enviar mensagem', 'error')
      }
    } finally {
      setIsLoadingUserChat(false)
    }
  }

  // Scroll automático quando novas mensagens chegarem
  useEffect(() => {
    if (userChatMessages.length > 0) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userChatMessages])

  // Carregar tickets quando abrir a tab de tickets
  useEffect(() => {
    // Atualizar ref para indicar se está na aba de chat
    isOnChatTabRef.current = activeTab === 'account' && accountSubTab === 'ticket'
    
    if (isOnChatTabRef.current) {
      const sessionid = localStorage.getItem('sessionid')
      if (sessionid) {
        loadUserChatTickets(true)
      }
    } else {
      // Se saiu da aba de chat, limpar polling e deselecionar ticket
      if (userChatPollingIntervalRef.current) {
        clearInterval(userChatPollingIntervalRef.current)
        userChatPollingIntervalRef.current = null
      }
      selectedTicketIdRef.current = null
    }
    
    return () => {
      // Limpar polling ao desmontar ou mudar de aba
      if (userChatPollingIntervalRef.current) {
        clearInterval(userChatPollingIntervalRef.current)
        userChatPollingIntervalRef.current = null
      }
      selectedTicketIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accountSubTab])

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatar data para input datetime-local
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Data padrão para expiração (30 dias a partir de agora)
  const defaultExpirationDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return formatDateForInput(date.toISOString())
  }

  // Calcular duração
  const calculateDuration = (expires) => {
    if (!expires) return 'N/A'
    const now = new Date()
    const expiresDate = new Date(expires)
    const diffTime = expiresDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expirada'
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return '1 dia'
    if (diffDays < 30) return `${diffDays} dias`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} ${months === 1 ? 'mês' : 'meses'}`
    }
    const years = Math.floor(diffDays / 365)
    return `${years} ${years === 1 ? 'ano' : 'anos'}`
  }

  // Ícones SVG para navegação
  const AppIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )

  const AccountIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )

  const LicensesIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
      <path d="M12 21c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
      <path d="M12 3c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
    </svg>
  )

  const UsersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )

  const FormsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )

  const UpgradeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      <polyline points="12 8 12 12 15 15" />
    </svg>
  )

  const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 17.364m12.728 0l-4.243-4.243m-4.242 0L5.636 6.636" />
    </svg>
  )

  const TicketIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )

  const ProfileIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )

  const ResellerIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M12 11h4a2 2 0 0 1 2 2v1" />
      <path d="M12 11H8a2 2 0 0 0-2 2v1" />
    </svg>
  )

  // Tabs principais (App e Account)
  const mainTabs = [
    { id: 'app', label: 'App' },
    { id: 'account', label: 'Account' }
  ]

  // Ícone para Manage Apps
  const ManageAppsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )

  // Ícone para Webhooks
  const WebhooksIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c0-2.21 1.79-4 4-4h5.99c1.1 0 1.95.94 2.48 1.9A4 4 0 0 1 18 13c2.21 0 4 1.79 4 4s-1.79 3.98-4 3.98z" />
      <path d="M6 10.98h5.99c1.1 0 1.95.94 2.48 1.9A4 4 0 0 1 18 7c0-2.21-1.79-4-4-4H6c-2.21 0-4 1.79-4 4s1.79 3.98 4 3.98z" />
    </svg>
  )

  const FilesIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )

  // Ícone para Anti-Crack
  const AntiCrackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <line x1="12" y1="16" x2="12" y2="18" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  )

  // Itens de navegação do menu lateral para App
  const appNavigationItems = [
    { id: 'apps', label: 'Manage Apps', icon: <ManageAppsIcon /> },
    { id: 'licenses', label: 'Licenses', icon: <LicensesIcon /> },
    { id: 'users', label: 'Users', icon: <UsersIcon /> },
    { id: 'files', label: 'Files', icon: <FilesIcon /> },
    { id: 'webhooks', label: 'Webhooks', icon: <WebhooksIcon /> },
    { id: 'anticrack', label: 'Anti-Crack', icon: <AntiCrackIcon /> }
  ]

  // Itens de navegação do menu lateral para Account
  const accountNavigationItems = [
    { id: 'profile', label: 'Perfil', icon: <ProfileIcon /> },
    { id: 'reseller', label: 'Revendedores', icon: <ResellerIcon /> },
    { id: 'forms', label: 'Forms', icon: <FormsIcon /> },
    { id: 'ticket', label: 'Ticket', icon: <TicketIcon /> },
    { id: 'upgrade', label: 'Upgrade', icon: <UpgradeIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> }
  ]

  // Função para obter os itens de navegação baseado na tab ativa
  const getNavigationItems = () => {
    if (activeTab === 'account') {
      return accountNavigationItems
    }
    return appNavigationItems
  }

  // Função para lidar com o clique nos itens do menu
  const handleMenuClick = (itemId) => {
    if (activeTab === 'account') {
      setAccountSubTab(itemId)
    } else if (activeTab === 'app') {
      setAppSubTab(itemId)
    }
  }

  // Função para navegar para a aba Upgrade
  const handleUpgradeNowClick = (e) => {
    e.preventDefault()
    setActiveTab('account')
    setAccountSubTab('upgrade')
  }

  // Função para verificar se um item está ativo
  const isItemActive = (itemId) => {
    if (activeTab === 'account') {
      return accountSubTab === itemId
    } else if (activeTab === 'app') {
      return appSubTab === itemId
    }
    return false
  }

  // Handlers para Settings
  const handleSaveSettings = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const response = await authService.saveSettings(sessionid, {
        accountLogs,
        newLocationAlerts,
        profilePictureUrl,
        ownerId,
        securityWords
      })
      if (response.success) {
        showMessage('Configurações salvas com sucesso!', 'success')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao salvar configurações', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnable2FA = () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    // Limpar estados anteriores
    setTwoFactorCode(['', '', '', '', '', ''])
    setEmailCode('')
    setQrCodeUrl('')
    setManualCode('')
    setTwoFactorMethod('qr')
    setShowEnable2FAModal(true)
  }

  const handleSend2FAEmail = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoading2FA(true)
    try {
      const response = await authService.send2FAEmail(sessionid)
      if (response.success) {
        setTwoFactorMethod('email')
        showMessage(response.message || 'Código de verificação enviado para seu email!', 'success')
      } else {
        showMessage(response.message || 'Erro ao enviar código 2FA', 'error')
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'Erro ao enviar código 2FA. Verifique se o servidor de email está configurado.'
      showMessage(errorMessage, 'error')
    } finally {
      setIsLoading2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoading2FA(true)
    try {
      let response
      if (twoFactorMethod === 'qr') {
        const token = twoFactorCode.join('').trim()
        if (token.length !== 6 || !/^\d{6}$/.test(token)) {
          showMessage('Por favor, insira um código válido de 6 dígitos', 'error')
          setIsLoading2FA(false)
          return
        }
        response = await authService.enable2FA(sessionid, token)
      } else {
        const code = emailCode.trim()
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
          showMessage('Por favor, insira um código válido de 6 dígitos', 'error')
          setIsLoading2FA(false)
          return
        }
        response = await authService.verify2FAEmail(sessionid, code)
      }
      
      if (response.success) {
        showMessage('2FA ativado com sucesso!', 'success')
        setTwoFactorEnabled(true)
        setShowEnable2FAModal(false)
        setTwoFactorCode(['', '', '', '', '', ''])
        setEmailCode('')
        setQrCodeUrl('')
        setManualCode('')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao ativar 2FA', 'error')
    } finally {
      setIsLoading2FA(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('Por favor, preencha todos os campos', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoading2FA(true)
    try {
      const response = await authService.changePassword(sessionid, currentPassword, newPassword)
      if (response.success) {
        showMessage('Senha alterada com sucesso!', 'success')
        setShowChangePasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao alterar senha', 'error')
    } finally {
      setIsLoading2FA(false)
    }
  }

  // Funções para Perfil
  const handleBannerSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        showMessage('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)', 'error')
        return
      }
      // Validar tamanho (10MB para banner)
      if (file.size > 10 * 1024 * 1024) {
        showMessage('A imagem deve ter no máximo 10MB', 'error')
        return
      }
      setBannerFile(file)
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadBanner = async () => {
    if (!bannerFile) {
      showMessage('Por favor, selecione uma imagem', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append('banner', bannerFile)
      formData.append('sessionid', sessionid)

      const response = await authService.uploadBanner(sessionid, formData)
      if (response.success) {
        setBannerUrl(response.bannerUrl || bannerPreview)
        setBannerFile(null)
        setBannerPreview(null)
        if (bannerInputRef.current) {
          bannerInputRef.current.value = ''
        }
        showMessage('Banner atualizado com sucesso!', 'success')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao fazer upload do banner', 'error')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleRemoveBanner = () => {
    setBannerFile(null)
    setBannerPreview(null)
    setBannerUrl('')
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ''
    }
  }

  const handleChangeEmailProfile = async () => {
    if (!newEmail || !passwordForChange) {
      showMessage('Por favor, preencha todos os campos', 'error')
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      showMessage('Por favor, insira um email válido', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingProfile(true)
    try {
      const response = await authService.changeEmail(sessionid, newEmail, passwordForChange)
      if (response.success) {
        setUserEmail(newEmail)
        setNewEmail('')
        setPasswordForChange('')
        showMessage('Email alterado com sucesso!', 'success')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao alterar email', 'error')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Funções para Revendedores
  const handleCreateResellerCode = async () => {
    if (!newResellerPlan || !newResellerPeriod) {
      showMessage('Por favor, selecione o plano e período', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingResellerCodes(true)
    try {
      const response = await authService.createResellerCode(sessionid, {
        plan: newResellerPlan,
        period: newResellerPeriod,
        expiresAt: newResellerExpires || null,
        note: newResellerNote || null
      })
      if (response.success) {
        showMessage('Código de revendedor criado com sucesso!', 'success')
        setShowCreateResellerCodeModal(false)
        setNewResellerPlan('developer')
        setNewResellerPeriod('monthly')
        setNewResellerExpires('')
        setNewResellerNote('')
        // Recarregar códigos
        const codesResponse = await authService.getResellerCodes(sessionid)
        if (codesResponse.success) {
          setResellerCodes(codesResponse.codes || [])
        }
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao criar código de revendedor', 'error')
    } finally {
      setIsLoadingResellerCodes(false)
    }
  }

  const handleCopyResellerCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedResellerCode(code)
    showMessage('Código copiado!', 'success')
    setTimeout(() => setCopiedResellerCode(null), 2000)
  }

  const handleDeleteResellerCode = async (codeId) => {
    if (!window.confirm('Tem certeza que deseja deletar este código?')) {
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoadingResellerCodes(true)
    try {
      const response = await authService.deleteResellerCode(sessionid, codeId)
      if (response.success) {
        showMessage('Código deletado com sucesso!', 'success')
        // Recarregar códigos
        const codesResponse = await authService.getResellerCodes(sessionid)
        if (codesResponse.success) {
          setResellerCodes(codesResponse.codes || [])
        }
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar código', 'error')
    } finally {
      setIsLoadingResellerCodes(false)
    }
  }

  // Filtrar códigos de revendedor
  const filteredResellerCodes = useMemo(() => {
    let filtered = resellerCodes

    // Filtrar por status
    if (resellerCodeFilter !== 'all') {
      filtered = filtered.filter(code => {
        if (resellerCodeFilter === 'active') {
          return code.status === 'active'
        } else if (resellerCodeFilter === 'used') {
          return code.status === 'used'
        } else if (resellerCodeFilter === 'expired') {
          return code.status === 'expired'
        }
        return true
      })
    }

    // Filtrar por busca
    if (resellerCodeSearch) {
      const searchLower = resellerCodeSearch.toLowerCase()
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(searchLower) ||
        (code.note && code.note.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [resellerCodes, resellerCodeFilter, resellerCodeSearch])


  const handleChangeUsername = async () => {
    if (!newUsername || !passwordForChange) {
      showMessage('Por favor, preencha todos os campos', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoading2FA(true)
    try {
      const response = await authService.changeUsername(sessionid, newUsername, passwordForChange)
      if (response.success) {
        showMessage('Username alterado com sucesso!', 'success')
        setUsername(newUsername)
        localStorage.setItem('username', newUsername)
        setShowChangeUsernameModal(false)
        setNewUsername('')
        setPasswordForChange('')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao alterar username', 'error')
    } finally {
      setIsLoading2FA(false)
    }
  }

  // Handler para input de código 2FA
  const handleTwoFactorCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return

    const newCode = [...twoFactorCode]
    newCode[index] = value
    setTwoFactorCode(newCode)

    // Auto-focus no próximo campo
    if (value && index < 5) {
      const nextInput = document.getElementById(`twofa-code-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleTwoFactorCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
      const prevInput = document.getElementById(`twofa-code-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      showMessage('Por favor, insira sua senha', 'error')
      return
    }

    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
      return
    }

    setIsLoading2FA(true)
    try {
      const response = await authService.disable2FA(sessionid, disable2FAPassword)
      if (response.success) {
        showMessage('2FA desativado com sucesso!', 'success')
        setTwoFactorEnabled(false)
        setShowDisable2FAModal(false)
        setDisable2FAPassword('')
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao desativar 2FA', 'error')
    } finally {
      setIsLoading2FA(false)
    }
  }

  const getInitial = () => {
    return username ? username.charAt(0).toUpperCase() : 'N'
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="KeyUnit-dashboard">
      {/* Sidebar */}
      <div className="KeyUnit-sidebar">
        <div className="sidebar-user-section">
          <div className="user-profile-container">
            <div className="user-avatar">
              {profilePictureUrl && profilePictureUrl.trim() !== '' ? (
                <img 
                  src={profilePictureUrl} 
                  alt={username || 'User'} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const span = e.target.nextElementSibling;
                    if (span) {
                      span.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span style={{ display: (profilePictureUrl && profilePictureUrl.trim() !== '') ? 'none' : 'flex' }}>{getInitial()}</span>
            </div>
            <div className="user-info">
              <div className="user-name">{username || 'noixplatform'}</div>
              <div className="user-expires">Expires: Never</div>
            </div>
          </div>
          <button className={`plan-badge plan-badge-${userPlan}`}>
            {userPlan === 'developer' ? (
              <>
                <svg className="plan-badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path className="plan-icon-path-1" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline className="plan-icon-path-2" points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>DEVELOPER PLAN</span>
              </>
            ) : userPlan === 'seller' ? (
              <>
                <svg className="plan-badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle className="plan-icon-path-2" cx="12" cy="12" r="10" />
                  <path className="plan-icon-path-1" d="M12 6v6l4 2" />
                </svg>
                <span>SELLER PLAN</span>
              </>
            ) : (
              <>
                <svg className="plan-badge-icon plan-icon-pulse" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path className="plan-icon-check" d="M12 6v6l4 2" />
                </svg>
                <span>TESTER PLAN</span>
              </>
            )}
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <svg className="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path className="logout-path-1" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline className="logout-path-2" points="16 17 21 12 16 7" />
              <line className="logout-path-3" x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Tabs principais no topo */}
          <div className="sidebar-tabs">
            {mainTabs.map(tab => (
              <button
                key={tab.id}
                className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  // Reset para o primeiro item quando mudar de tab
                  if (tab.id === 'account') {
                    setAccountSubTab('forms')
                  } else if (tab.id === 'app') {
                    setAppSubTab('apps')
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Itens de menu lateral */}
          <div className="sidebar-menu">
            {getNavigationItems().map(item => (
              <button
                key={item.id}
                className={`nav-item ${isItemActive(item.id) ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="KeyUnit-main">
        {activeTab === 'app' && appSubTab === 'apps' && (
          <div className="manage-apps-content app-content">
            {/* Header */}
            <div className="content-header">
              <div className="breadcrumbs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Manage Apps</span>
                <span className="separator">›</span>
                <span>Current App: {currentApp?.name || `${username || 'noixplatform'}'s Application`}</span>
              </div>

              {userPlan === 'tester' && (
                <div className="subscription-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>You don't have a subscription!</span>
                  <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                </div>
              )}

              <h1 className="page-title">Manage Applications - {currentApp?.name || `${username || 'noixplatform'}'s Application`}</h1>
              <p className="page-subtitle">
                Manage your applications. Applications are the backbone of all the data.{' '}
                <a href="#" className="learn-more">Learn More</a>
              </p>
            </div>

            {/* API Info Box */}
            <div className="api-info-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div className="info-content">
                <p>
                  Our newest API (1.3) does not use the application secret anymore. Meaning, you will not need to provide one in your program. 
                  If you're using an older API version, please click the 'Display Application Secret' button below.
                </p>
                <button 
                  className="display-secret-btn"
                  onClick={() => setDisplayAppSecret(!displayAppSecret)}
                  disabled={!currentApp}
                >
                  Display App Secret
                </button>
                {displayAppSecret && currentApp && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#27272a', borderRadius: '6px', border: '1px solid #3f3f46' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#a1a1aa' }}>Application Secret:</p>
                    <code style={{ fontSize: '13px', color: '#3b82f6', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {currentApp.app_secret || 'N/A'}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Application Credentials Section */}
            <div className="credentials-section">
              <h2 className="section-title">Application Credentials</h2>
              <p className="section-subtitle">
                Simply replace the placeholder code in the example with these.
              </p>

              {/* Language Tabs */}
              <div className="language-tabs">
                <button 
                  className={`lang-tab ${selectedLanguage === 'csharp' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('csharp')}
                >
                  C#
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'cpp' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('cpp')}
                >
                  C++
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'python' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('python')}
                >
                  Python
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'php' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('php')}
                >
                  PHP
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'javascript' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('javascript')}
                >
                  JavaScript
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'typescript' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('typescript')}
                >
                  TypeScript
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'java' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('java')}
                >
                  Java
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'vbnet' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('vbnet')}
                >
                  VB.Net
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'rust' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('rust')}
                >
                  Rust
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'go' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('go')}
                >
                  Go
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'lua' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('lua')}
                >
                  Lua
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'ruby' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('ruby')}
                >
                  Ruby
                </button>
                <button 
                  className={`lang-tab ${selectedLanguage === 'perl' ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage('perl')}
                >
                  Perl
                </button>
              </div>

              {/* Code Block - Mostra apenas credenciais básicas */}
              <div className="code-block">
                <pre><code>{credentialsTemplate[selectedLanguage] || credentialsTemplate.csharp}</code></pre>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="action-btn primary" onClick={copyCredentials}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Credentials
                </button>
              </div>

              {/* View Example Button - Mostra apenas o botão da linguagem selecionada */}
              <div className="view-examples-section">
                <button className="example-btn-primary" onClick={() => viewExample(selectedLanguage)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View {languageNames[selectedLanguage] || 'C#'} Example
                </button>
              </div>
            </div>

            {/* Modal para mostrar exemplo completo */}
            {viewingExample && (
              <div className="example-modal-overlay" onClick={closeExampleModal}>
                <div className="example-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="example-modal-header">
                    <h2 className="example-modal-title">
                      {languageNames[viewingExample] || 'C#'} Example
                    </h2>
                    <button className="example-modal-close" onClick={closeExampleModal}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="example-modal-content">
                    <div className="code-block-full">
                      <pre><code>{codeExamples[viewingExample] || codeExamples.csharp}</code></pre>
                    </div>
                    <div className="example-modal-actions">
                      <button className="action-btn primary" onClick={() => copyFullExample(viewingExample)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Full Example
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Application Actions */}
            <div className="app-actions">
              <button 
                className="app-action-btn create"
                onClick={() => setShowCreateAppModal(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Application (start by clicking here!)
              </button>
              <button 
                className="app-action-btn rename"
                onClick={() => currentApp && setShowRenameAppModal(true)}
                disabled={!currentApp}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Rename Application
              </button>
              <button 
                className="app-action-btn pause"
                onClick={handlePauseApplication}
                disabled={!currentApp || isLoadingApps}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {currentApp?.paused ? (
                    <polygon points="5 3 19 12 5 21 5 3" />
                  ) : (
                    <>
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </>
                  )}
                </svg>
                {currentApp?.paused ? 'Resume Application & Users' : 'Pause Application & Users'}
              </button>
              <button 
                className="app-action-btn refresh"
                onClick={handleRefreshSecret}
                disabled={!currentApp || isLoadingApps}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Refresh Application Secret
              </button>
              <button 
                className="app-action-btn delete"
                onClick={handleDeleteApplication}
                disabled={!currentApp || isLoadingApps}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Application
              </button>
            </div>

            {/* Applications Table */}
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Application Name</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="empty-message">
                        No applications found. Create your first application to get started.
                      </td>
                    </tr>
                  ) : (
                    applications.map(app => (
                      <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => setCurrentApp(app)}>
                        <td>{app.name}</td>
                        <td>
                          <span className={`status-badge ${app.paused ? '' : 'active'}`}>
                            {app.paused ? 'Paused' : app.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="select-app-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentApp(app)
                            }}
                            style={{ 
                              background: currentApp?.id === app.id ? '#2563eb' : '#3b82f6' 
                            }}
                          >
                            {currentApp?.id === app.id ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'app' && appSubTab === 'licenses' && (
          <div className="licenses-content app-content">
            {/* Header */}
            <div className="content-header">
              <div className="breadcrumbs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Manage Apps</span>
                <span className="separator">›</span>
                <span>Current App: {currentApp ? currentApp.name : `${username || 'noixplatform'}'s Application`}</span>
              </div>

              {userPlan === 'tester' && (
                <div className="subscription-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>You don't have a subscription!</span>
                  <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                </div>
              )}

              <h1 className="page-title">Licenses</h1>
              <p className="page-subtitle">
                Licenses allow your users to register on your application.{' '}
                <a href="#" className="learn-more">Learn More</a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="licenses-actions">
              <div className="licenses-actions-row licenses-actions-row-blue">
                <button 
                  className="licenses-action-btn licenses-action-btn-blue"
                  onClick={() => setShowCreateLicenseModal(true)}
                  disabled={!currentApp || isLoadingLicenses}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create A License
                </button>
                <button 
                  className="licenses-action-btn licenses-action-btn-blue"
                  onClick={() => setShowAddTimeModal(true)}
                  disabled={!currentApp || isLoadingLicenses}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Add Time To Unused Licenses
                </button>
                <button 
                  className="licenses-action-btn licenses-action-btn-blue"
                  onClick={() => exportLicenses('json')}
                  disabled={!currentApp || isLoadingLicenses || licenses.length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Licenses
                </button>
              </div>
              <div className="licenses-actions-row licenses-actions-row-red">
                <button 
                  className="licenses-action-btn licenses-action-btn-red"
                  onClick={handleDeleteAllLicenses}
                  disabled={!currentApp || isLoadingLicenses || licenses.length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete All Licenses
                </button>
                <button 
                  className="licenses-action-btn licenses-action-btn-red"
                  onClick={handleDeleteUsedLicenses}
                  disabled={!currentApp || isLoadingLicenses || licenses.filter(l => l.used).length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete All Used Licenses
                </button>
                <button 
                  className="licenses-action-btn licenses-action-btn-red"
                  onClick={handleDeleteUnusedLicenses}
                  disabled={!currentApp || isLoadingLicenses || licenses.filter(l => !l.used).length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete All Unused Licenses
                </button>
              </div>
            </div>

            {/* Table Controls */}
            <div className="table-controls">
              <div className="table-controls-left">
                <label htmlFor="show-select-licenses">Show:</label>
                <select 
                  id="show-select-licenses" 
                  className="show-select"
                  value={licensePageSize}
                  onChange={(e) => setLicensePageSize(parseInt(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <label htmlFor="filter-select-licenses" style={{ marginLeft: '16px' }}>Filter:</label>
                <select 
                  id="filter-select-licenses" 
                  className="show-select"
                  value={licenseShowFilter}
                  onChange={(e) => setLicenseShowFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="used">Used</option>
                  <option value="unused">Unused</option>
                </select>
              </div>
              <div className="table-controls-right">
                <label htmlFor="search-input-licenses">Search:</label>
                <input 
                  type="text" 
                  id="search-input-licenses" 
                  className="search-input" 
                  placeholder="Search licenses..."
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Licenses Table */}
            <div className="licenses-table-container">
              {isLoadingLicenses ? (
                <div className="loading-message">Carregando licenças...</div>
              ) : (
              <table className="licenses-table">
                <thead>
                  <tr>
                    <th>
                        <input 
                          type="checkbox" 
                          className="select-all-checkbox"
                          checked={selectedLicenses.length === paginatedLicenses.length && paginatedLicenses.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLicenses(paginatedLicenses.map(l => l.id))
                            } else {
                              setSelectedLicenses([])
                            }
                          }}
                        />
                    </th>
                    <th>
                      License
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                        Subscription
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                        Creation Date
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                        Expires
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                        Duration
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Used By
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Status
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                  </tr>
                </thead>
                <tbody>
                    {paginatedLicenses.length === 0 ? (
                  <tr className="empty-row">
                        <td colSpan="8" className="empty-message">
                          {!currentApp ? 'Selecione uma aplicação para ver as licenças' : 'No data available in table'}
                    </td>
                  </tr>
                    ) : (
                      paginatedLicenses.map((license) => (
                        <tr key={license.id}>
                          <td>
                            <input 
                              type="checkbox"
                              checked={selectedLicenses.includes(license.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLicenses([...selectedLicenses, license.id])
                                } else {
                                  setSelectedLicenses(selectedLicenses.filter(id => id !== license.id))
                                }
                              }}
                            />
                          </td>
                          <td>
                            <span className="license-key">{license.license_key}</span>
                          </td>
                          <td>
                            <span className={`subscription-badge subscription-badge-${license.subscription}`}>
                              {license.subscription}
                            </span>
                          </td>
                          <td>{formatDate(license.created_at)}</td>
                          <td>{formatDate(license.expires)}</td>
                          <td>{calculateDuration(license.expires)}</td>
                          <td>{license.used_by || '-'}</td>
                          <td>
                            <span className={`status-badge ${license.used ? 'status-used' : 'status-unused'}`}>
                              {license.used ? 'Used' : 'Unused'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
              )}
            </div>

            <div className="table-info">
              Showing {paginatedLicenses.length} of {filteredLicenses.length} records
              {filteredLicenses.length !== licenses.length && ` (${licenses.length} total)`}
            </div>

            {/* Info Messages */}
            <div className="licenses-info-messages">
              <div className="info-message info-message-red">
                <strong>Dropdown actions in RED do not show a confirmation!</strong>
              </div>
              <div className="info-message info-message-blue">
                <strong>Dropdown actions in BLUE will show a confirmation!</strong>
              </div>
            </div>

            {/* Modal: Create License */}
            {showCreateLicenseModal && (
              <div className="modal-overlay" onClick={() => setShowCreateLicenseModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Create A New License</h2>
                    <button className="modal-close" onClick={() => setShowCreateLicenseModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="license-amount">License Amount:</label>
                      <input
                        type="number"
                        id="license-amount"
                        className="form-input"
                        value={licenseAmount}
                        onChange={(e) => setLicenseAmount(e.target.value)}
                        placeholder="License Amount"
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="license-mask">License Mask:</label>
                      <input
                        type="text"
                        id="license-mask"
                        className="form-input"
                        value={licenseMask}
                        onChange={(e) => setLicenseMask(e.target.value)}
                        placeholder="******_******_******_******_******_******"
                      />
                    </div>
                    <div className="form-group">
                      <label>Character Type:</label>
                      <div className="checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={useLowercase}
                            onChange={(e) => setUseLowercase(e.target.checked)}
                          />
                          <span>Lowercase Letters</span>
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={useUppercase}
                            onChange={(e) => setUseUppercase(e.target.checked)}
                          />
                          <span>Uppercase Letters</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="license-quantity">Quantity:</label>
                      <select
                        id="license-quantity"
                        className="form-input"
                        value={licenseQuantity}
                        onChange={(e) => setLicenseQuantity(parseInt(e.target.value) || 1)}
                      >
                        <option value="1">1 (default)</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="license-note">License Note:</label>
                      <input
                        type="text"
                        id="license-note"
                        className="form-input"
                        value={licenseNote}
                        onChange={(e) => setLicenseNote(e.target.value)}
                        placeholder="License Note"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="license-expiry-unit">License Expiry Unit:</label>
                      <select
                        id="license-expiry-unit"
                        className="form-input"
                        value={licenseExpiryUnit}
                        onChange={(e) => setLicenseExpiryUnit(e.target.value)}
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="license-duration">License Duration:</label>
                      <input
                        type="number"
                        id="license-duration"
                        className="form-input"
                        value={licenseDuration}
                        onChange={(e) => setLicenseDuration(parseInt(e.target.value) || 30)}
                        placeholder="License Duration"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={() => setShowCreateLicenseModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={createLicense} disabled={isLoadingLicenses}>
                      {isLoadingLicenses ? 'Generating...' : 'Generate Keys'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Add Time To Unused Licenses */}
            {showAddTimeModal && (
              <div className="modal-overlay" onClick={() => setShowAddTimeModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Add Time To Unused Licenses</h2>
                    <button className="modal-close" onClick={() => setShowAddTimeModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="add-time-amount">Amount:</label>
                      <input
                        type="number"
                        id="add-time-amount"
                        className="form-input"
                        value={addTimeAmount}
                        onChange={(e) => setAddTimeAmount(e.target.value)}
                        placeholder="Amount"
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="add-time-unit">Time Unit:</label>
                      <select
                        id="add-time-unit"
                        className="form-input"
                        value={addTimeUnit}
                        onChange={(e) => setAddTimeUnit(e.target.value)}
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                    <p className="form-help-text">
                      This will add {addTimeAmount || 0} {addTimeUnit} to all unused licenses for this application.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={() => setShowAddTimeModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={addTimeToUnusedLicenses} disabled={isLoadingLicenses}>
                      {isLoadingLicenses ? 'Adding...' : 'Add Time'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'app' && appSubTab === 'users' && (
          <div className="users-content">
            {/* Header */}
            <div className="content-header">
              <div className="breadcrumbs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Manage Apps</span>
                <span className="separator">›</span>
                <span>Current App: {currentApp ? currentApp.name : `${username || 'noixplatform'}'s Application`}</span>
              </div>

              {userPlan === 'tester' && (
                <div className="subscription-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>You don't have a subscription!</span>
                  <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                </div>
              )}

              <h1 className="page-title">Users</h1>
              <p className="page-subtitle">
                After someone registers for your app with a license, they will appear here.{' '}
                <a href="#" className="learn-more">Learn More</a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="users-actions">
              <div className="users-actions-row users-actions-row-blue">
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => {
                    setNewUserExpiration(defaultExpirationDate())
                    setShowCreateUserModal(true)
                  }}
                  disabled={!currentApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create User
                </button>
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => setShowUserVariablesModal(true)}
                  disabled={!currentApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  User Variables
                </button>
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => setShowExtendUsersModal(true)}
                  disabled={!currentApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Extend User(s)
                </button>
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => setShowSubtractUsersModal(true)}
                  disabled={!currentApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Subtract User(s)
                </button>
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => exportUsersHandler('json')}
                  disabled={!currentApp || users.length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Users
                </button>
              </div>
              <div className="users-actions-row users-actions-row-red">
                <button 
                  className="users-action-btn users-action-btn-red"
                  onClick={handleDeleteAllUsers}
                  disabled={!currentApp || users.length === 0 || isLoadingUsers}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete All Users
                </button>
                <button 
                  className="users-action-btn users-action-btn-red"
                  onClick={handleDeleteExpiredUsers}
                  disabled={!currentApp || users.length === 0 || isLoadingUsers}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Expired Users
                </button>
                <button 
                  className="users-action-btn users-action-btn-red"
                  onClick={handleResetUsersHwid}
                  disabled={!currentApp || users.length === 0 || isLoadingUsers}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Reset All Users HWID
                </button>
              </div>
            </div>

            {/* Table Controls */}
            <div className="table-controls">
              <div className="table-controls-left">
                <label htmlFor="show-select-users">Show:</label>
                <select 
                  id="show-select-users" 
                  className="show-select"
                  value={usersPageSize}
                  onChange={(e) => setUsersPageSize(parseInt(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="table-controls-right">
                <label htmlFor="search-input-users">Search:</label>
                <input 
                  type="text" 
                  id="search-input-users" 
                  className="search-input" 
                  placeholder="Search users..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        className="select-all-checkbox"
                        checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(paginatedUsers.map(user => user.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                      />
                    </th>
                    <th>
                      Username
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      HWID
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      IP
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Creation Date
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Last Login Date
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Banned?
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Actions
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan="8" className="empty-message">
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan="8" className="empty-message">
                        {usersSearch ? 'Nenhum usuário encontrado' : (!currentApp ? 'Selecione uma aplicação para ver os usuários' : 'Nenhum usuário cadastrado')}
                    </td>
                  </tr>
                  ) : (
                    paginatedUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              }
                            }}
                          />
                        </td>
                        <td>{user.username}</td>
                        <td>{user.hwid || 'N/A'}</td>
                        <td>{user.ip_address || 'N/A'}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.last_login)}</td>
                        <td>
                          <span className={`status-badge ${user.banned ? 'status-banned' : 'status-active'}`}>
                            {user.banned ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <div className="action-dropdown-container">
                            <button 
                              className="action-btn"
                              onClick={() => setOpenUserDropdown(openUserDropdown === user.id ? null : user.id)}
                            >
                              Actions
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px', display: 'inline-block' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            {openUserDropdown === user.id && (
                              <div className="action-dropdown-menu">
                                <button
                                  className="action-dropdown-item action-dropdown-item-red"
                                  onClick={() => handleResetUserHwid(user.id)}
                                  disabled={isLoadingUsers}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                  </svg>
                                  Reset HWID
                                </button>
                                <button
                                  className="action-dropdown-item action-dropdown-item-red"
                                  onClick={() => handleResetUserIp(user.id)}
                                  disabled={isLoadingUsers}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                  </svg>
                                  Reset IP
                                </button>
                                <button
                                  className="action-dropdown-item action-dropdown-item-red"
                                  onClick={() => handleResetUserHwidIp(user.id)}
                                  disabled={isLoadingUsers}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                  </svg>
                                  Reset HWID & IP
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-info">
              Showing {paginatedUsers.length} of {filteredUsers.length} records
            </div>

            {/* Modal: Create User */}
            {showCreateUserModal && (
              <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Create User</h2>
                    <button className="modal-close" onClick={() => setShowCreateUserModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="new-username">Username:</label>
                      <input
                        type="text"
                        id="new-username"
                        className="form-input"
                        value={createUserUsername}
                        onChange={(e) => setCreateUserUsername(e.target.value)}
                        placeholder="Username"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-password">Password:</label>
                      <input
                        type="password"
                        id="new-password"
                        className="form-input"
                        value={createUserPassword}
                        onChange={(e) => setCreateUserPassword(e.target.value)}
                        placeholder="Password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-email">Email (Optional):</label>
                      <input
                        type="email"
                        id="new-email"
                        className="form-input"
                        value={createUserEmail}
                        onChange={(e) => setCreateUserEmail(e.target.value)}
                        placeholder="Email (Optional)"
                      />
                      <p className="form-help-text" style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                        Generate and store secure passwords with{' '}
                        <a href="https://proton.me/pass" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Proton Pass</a>
                      </p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-user-subscription">Subscription:</label>
                      <select
                        id="new-user-subscription"
                        className="form-input"
                        value={newUserSubscription}
                        onChange={(e) => setNewUserSubscription(e.target.value)}
                        required
                      >
                        <option value="default">default</option>
                        <option value="standard">standard</option>
                        <option value="premium">premium</option>
                        <option value="ultimate">ultimate</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-user-expiration">Expiration:</label>
                      <input
                        type="datetime-local"
                        id="new-user-expiration"
                        className="form-input"
                        value={newUserExpiration}
                        onChange={(e) => setNewUserExpiration(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="modal-btn modal-btn-secondary" 
                      onClick={() => setShowCreateUserModal(false)}
                      disabled={isLoadingUsers}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      className="modal-btn modal-btn-primary" 
                      onClick={createUserHandler} 
                      disabled={isLoadingUsers}
                    >
                      {isLoadingUsers ? 'Creating...' : 'Add User'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Extend Users */}
            {showExtendUsersModal && (
              <div className="modal-overlay" onClick={() => setShowExtendUsersModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Extend User(s)</h2>
                    <button className="modal-close" onClick={() => setShowExtendUsersModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="extend-users-amount">Amount:</label>
                      <input
                        type="number"
                        id="extend-users-amount"
                        className="form-input"
                        value={extendUsersAmount}
                        onChange={(e) => setExtendUsersAmount(e.target.value)}
                        placeholder="Amount"
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="extend-users-unit">Time Unit:</label>
                      <select
                        id="extend-users-unit"
                        className="form-input"
                        value={extendUsersUnit}
                        onChange={(e) => setExtendUsersUnit(e.target.value)}
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                    <p className="form-help-text">
                      {selectedUsers.length > 0 
                        ? `This will extend ${selectedUsers.length} selected user(s) by ${extendUsersAmount || 0} ${extendUsersUnit}.`
                        : `This will extend all users by ${extendUsersAmount || 0} ${extendUsersUnit}.`}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={() => setShowExtendUsersModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={extendUsersHandler} disabled={isLoadingUsers}>
                      {isLoadingUsers ? 'Extending...' : 'Extend'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Subtract Users */}
            {showSubtractUsersModal && (
              <div className="modal-overlay" onClick={() => setShowSubtractUsersModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Subtract User(s)</h2>
                    <button className="modal-close" onClick={() => setShowSubtractUsersModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="subtract-users-amount">Amount:</label>
                      <input
                        type="number"
                        id="subtract-users-amount"
                        className="form-input"
                        value={subtractUsersAmount}
                        onChange={(e) => setSubtractUsersAmount(e.target.value)}
                        placeholder="Amount"
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subtract-users-unit">Time Unit:</label>
                      <select
                        id="subtract-users-unit"
                        className="form-input"
                        value={subtractUsersUnit}
                        onChange={(e) => setSubtractUsersUnit(e.target.value)}
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                    <p className="form-help-text">
                      {selectedUsers.length > 0 
                        ? `This will subtract ${subtractUsersAmount || 0} ${subtractUsersUnit} from ${selectedUsers.length} selected user(s).`
                        : `This will subtract ${subtractUsersAmount || 0} ${subtractUsersUnit} from all users.`}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={() => setShowSubtractUsersModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={subtractUsersHandler} disabled={isLoadingUsers}>
                      {isLoadingUsers ? 'Subtracting...' : 'Subtract'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: User Variables */}
            {showUserVariablesModal && (
              <div className="modal-overlay" onClick={() => setShowUserVariablesModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">User Variables</h2>
                    <button className="modal-close" onClick={() => setShowUserVariablesModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p className="form-help-text">
                      User Variables feature will be available soon. This allows you to store custom data for each user.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-primary" onClick={() => setShowUserVariablesModal(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Messages */}
            <div className="users-info-messages">
              <div className="info-message info-message-red">
                <strong>Dropdown actions in RED do not show a confirmation!</strong>
              </div>
              <div className="info-message info-message-blue">
                <strong>Dropdown actions in BLUE will show a confirmation!</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'app' && appSubTab === 'files' && (
          <div className="users-content">
            {/* Header */}
            <div className="content-header">
              <div className="breadcrumbs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Manage Apps</span>
                <span className="separator">›</span>
                <span>Current App: {currentApp ? currentApp.name : `${username || 'noixplatform'}'s Application`}</span>
              </div>

              {userPlan === 'tester' && (
                <div className="subscription-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>You don't have a subscription!</span>
                  <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                </div>
              )}

              <h1 className="page-title">Files</h1>
              <p className="page-subtitle">
                Let your users download files you upload here.{' '}
                <a href="#" className="learn-more">Learn More</a>
              </p>
            </div>

            {/* Info Banner */}
            <div className="api-info-box" style={{ backgroundColor: '#3f2e1e', borderColor: '#92400e', color: '#fbbf24' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div className="info-content">
                <p>
                  Please{' '}
                  <a href="#" className="learn-more" style={{ color: '#60a5fa' }}>follow this guide</a>
                  {' '}to upload files. FREE & super easy!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="users-actions">
              <div className="users-actions-row" style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => {
                    setFileUrl('')
                    setFileFilename('')
                    setFileAuthenticated(true)
                    setShowUploadFileModal(true)
                  }}
                  disabled={!currentApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Upload File
                </button>
                <button 
                  className="users-action-btn users-action-btn-red"
                  onClick={handleDeleteAllFiles}
                  disabled={!currentApp || files.length === 0 || isLoadingFiles}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete All Files
                </button>
              </div>
            </div>

            {/* Table Controls */}
            <div className="table-controls">
              <div className="table-controls-left">
                <label htmlFor="show-select-files">Show:</label>
                <select 
                  id="show-select-files" 
                  className="show-select"
                  value={filesPageSize}
                  onChange={(e) => setFilesPageSize(parseInt(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="table-controls-right">
                <label htmlFor="search-input-files">Search:</label>
                <input 
                  type="text" 
                  id="search-input-files" 
                  className="search-input" 
                  placeholder="Search files..."
                  value={filesSearch}
                  onChange={(e) => setFilesSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Files Table */}
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        className="select-all-checkbox"
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(filteredFiles.map(file => file.id))
                          } else {
                            setSelectedFiles([])
                          }
                        }}
                      />
                    </th>
                    <th>
                      Filename
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      ID
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Size
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Upload Date
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </th>
                    <th>
                      Authenticated
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                    <th>
                      Actions
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingFiles ? (
                    <tr>
                      <td colSpan="7" className="empty-message">
                        Carregando arquivos...
                      </td>
                    </tr>
                  ) : filteredFiles.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan="7" className="empty-message">
                        {filesSearch ? 'Nenhum arquivo encontrado' : (!currentApp ? 'Selecione uma aplicação para ver os arquivos' : 'No data available in table')}
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map(file => (
                      <tr key={file.id}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles([...selectedFiles, file.id])
                              } else {
                                setSelectedFiles(selectedFiles.filter(id => id !== file.id))
                              }
                            }}
                          />
                        </td>
                        <td>{file.filename}</td>
                        <td>{file.id}</td>
                        <td>{formatFileSize(file.file_size)}</td>
                        <td>{formatDate(file.uploaded_at)}</td>
                        <td>
                          <span className={`status-badge ${file.authenticated ? 'status-used' : 'status-unused'}`}>
                            {file.authenticated ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <div className="action-dropdown-container">
                            <button 
                              className="action-btn"
                              onClick={() => setOpenFileDropdown(openFileDropdown === file.id ? null : file.id)}
                            >
                              Actions
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px', display: 'inline-block' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            {openFileDropdown === file.id && (
                              <div className="action-dropdown-menu">
                                <button
                                  className="action-dropdown-item action-dropdown-item-red"
                                  onClick={() => handleDeleteFile(file.id)}
                                  disabled={isLoadingFiles}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  Delete File
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', color: '#71717a', fontSize: '14px' }}>
              <div>
                Showing {filteredFiles.length === 0 ? 0 : 1} to {Math.min(filteredFiles.length, filesPageSize)} of {files.length} records
              </div>
              <div style={{ color: '#71717a', fontSize: '13px' }}>
                <span style={{ color: '#ef4444' }}>Dropdown actions in RED do not show a confirmation!</span>{' '}
                <span style={{ color: '#3b82f6' }}>Dropdown actions in BLUE will show a confirmation!</span>
              </div>
            </div>

            {/* Modal: Upload File */}
            {showUploadFileModal && (
              <div className="modal-overlay" onClick={() => setShowUploadFileModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Upload A New File</h2>
                    <button className="modal-close" onClick={() => setShowUploadFileModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="api-info-box" style={{ backgroundColor: '#3f2e1e', borderColor: '#92400e', color: '#fbbf24', marginBottom: '20px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <div className="info-content">
                        <p>
                          Please{' '}
                          <a href="#" className="learn-more" style={{ color: '#60a5fa' }}>follow this guide</a>
                          {' '}to upload files. FREE & super easy!
                        </p>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="file-url">File Direct Download Link:</label>
                      <input
                        type="url"
                        id="file-url"
                        className="form-input"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://example.com/file.zip"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="file-filename">Filename:</label>
                      <input
                        type="text"
                        id="file-filename"
                        className="form-input"
                        value={fileFilename}
                        onChange={(e) => setFileFilename(e.target.value)}
                        placeholder="myfile.zip"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={fileAuthenticated}
                          onChange={(e) => setFileAuthenticated(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>Authenticated</span>
                      </label>
                      <p className="form-help-text" style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                        If checked, only authenticated users can download this file
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="modal-btn modal-btn-secondary" 
                      onClick={() => setShowUploadFileModal(false)}
                      disabled={isLoadingFiles}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      className="modal-btn modal-btn-primary" 
                      onClick={handleAddFile} 
                      disabled={isLoadingFiles}
                    >
                      {isLoadingFiles ? 'Adding...' : 'Add File'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'app' && appSubTab === 'webhooks' && (
          <div className="users-content">
            {/* Header */}
            <div className="content-header">
              <div className="breadcrumbs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Manage Apps</span>
                <span className="separator">›</span>
                <span>Current App: {currentApp ? currentApp.name : `${username || 'noixplatform'}'s Application`}</span>
              </div>

              {userPlan === 'tester' && (
                <div className="subscription-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>You don't have a subscription!</span>
                  <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                </div>
              )}

              <h1 className="page-title">Webhooks</h1>
              <p className="page-subtitle">
                Send and receive secure requests.{' '}
                <a href="#" className="learn-more">Learn More</a>
              </p>
            </div>

            {/* Info Banner */}
            <div className="api-info-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div className="info-content">
                <p>
                  People often mistake this for Discord webhooks. Please view our{' '}
                  <a href="#" className="learn-more" style={{ color: '#fb923c' }}>Documentation</a>{' '}
                  to learn how to send Discord webhooks.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="users-actions">
              <div className="users-actions-row users-actions-row-blue" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button 
                  className="users-action-btn users-action-btn-blue"
                  onClick={() => setShowCreateWebhookModal(true)}
                  disabled={!currentApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Webhook
                </button>
                <button 
                  className="users-action-btn users-action-btn-red"
                  onClick={deleteAllWebhooks}
                  disabled={!currentApp || webhooks.length === 0 || isLoadingWebhooks}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete All Webhooks
                </button>
              </div>
            </div>

            {/* Table Controls */}
            <div className="table-controls">
              <div className="table-controls-left">
                <label>Show</label>
                <select 
                  className="show-select" 
                  value={webhookPageSize} 
                  onChange={(e) => setWebhookPageSize(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="table-controls-right">
                <label>Search:</label>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search webhooks..."
                  value={webhookSearch}
                  onChange={(e) => setWebhookSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Webhooks Table */}
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        className="select-all-checkbox"
                        checked={selectedWebhooks.length === webhooks.length && webhooks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWebhooks(webhooks.map(w => w.id))
                          } else {
                            setSelectedWebhooks([])
                          }
                        }}
                      />
                    </th>
                    <th>ID <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/><path d="M18 9l-6 6-6-6"/></svg></th>
                    <th>Endpoint <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/><path d="M18 9l-6 6-6-6"/></svg></th>
                    <th>User-Agent <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/><path d="M18 9l-6 6-6-6"/></svg></th>
                    <th>Authenticated <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/><path d="M18 9l-6 6-6-6"/></svg></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingWebhooks ? (
                    <tr className="empty-row">
                      <td colSpan="6" className="empty-message">Loading...</td>
                    </tr>
                  ) : filteredWebhooks.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan="6" className="empty-message">No data available in table</td>
                    </tr>
                  ) : (
                    filteredWebhooks.map((webhook) => (
                      <tr key={webhook.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedWebhooks.includes(webhook.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWebhooks([...selectedWebhooks, webhook.id])
                              } else {
                                setSelectedWebhooks(selectedWebhooks.filter(id => id !== webhook.id))
                              }
                            }}
                          />
                        </td>
                        <td>{webhook.id}</td>
                        <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={webhook.endpoint}>{webhook.endpoint}</td>
                        <td>{webhook.user_agent || '-'}</td>
                        <td>
                          <span className={`status-badge ${webhook.authenticated ? 'status-used' : 'status-unused'}`}>
                            {webhook.authenticated ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <div className="action-dropdown-container">
                            <button
                              className="action-dropdown-item"
                              onClick={() => setOpenWebhookDropdown(openWebhookDropdown === webhook.id ? null : webhook.id)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                            {openWebhookDropdown === webhook.id && (
                              <div className="action-dropdown-menu" style={{ position: 'fixed', zIndex: 99999 }}>
                                <button
                                  className="action-dropdown-item action-dropdown-item-blue"
                                  onClick={() => handleTestWebhookClick(webhook.id)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                  Test Webhook
                                </button>
                                <button
                                  className="action-dropdown-item action-dropdown-item-red"
                                  onClick={() => deleteWebhook(webhook.id)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Info */}
            <div className="table-info">
              Showing {filteredWebhooks.length} record{filteredWebhooks.length !== 1 ? 's' : ''}
            </div>

            {/* Info Messages */}
            <div className="users-info-messages">
              <div className="info-message info-message-red">
                <strong>Dropdown actions in RED do not show a confirmation!</strong>
              </div>
              <div className="info-message info-message-blue">
                <strong>Dropdown actions in BLUE will show a confirmation!</strong>
              </div>
            </div>

            {/* Modal: Create Webhook */}
            {showCreateWebhookModal && (
              <div className="modal-overlay" onClick={() => setShowCreateWebhookModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Create Webhook</h2>
                    <button className="modal-close" onClick={() => setShowCreateWebhookModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="webhook-endpoint">Discord Webhook URL:</label>
                      <input
                        type="text"
                        id="webhook-endpoint"
                        className="form-input"
                        value={webhookEndpoint}
                        onChange={(e) => setWebhookEndpoint(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                      />
                      <p className="form-help-text">
                        Enter the Discord webhook URL where messages will be sent.
                      </p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="webhook-user-agent">User-Agent (Optional):</label>
                      <input
                        type="text"
                        id="webhook-user-agent"
                        className="form-input"
                        value={webhookUserAgent}
                        onChange={(e) => setWebhookUserAgent(e.target.value)}
                        placeholder="KeyUnit-Webhook/1.0"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={() => setShowCreateWebhookModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={createWebhook} disabled={isLoadingWebhooks}>
                      {isLoadingWebhooks ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Test Webhook */}
            {showTestWebhookModal && (
              <div className="modal-overlay" onClick={() => setShowTestWebhookModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Test Webhook</h2>
                    <button className="modal-close" onClick={() => setShowTestWebhookModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="test-webhook-message">Test Message:</label>
                      <textarea
                        id="test-webhook-message"
                        className="form-input"
                        value={testWebhookMessage}
                        onChange={(e) => setTestWebhookMessage(e.target.value)}
                        placeholder="Teste de webhook do KeyUnit"
                        rows="4"
                      />
                      <p className="form-help-text">
                        This message will be sent to the Discord webhook as a test.
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={() => setShowTestWebhookModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={testWebhook} disabled={isLoadingWebhooks}>
                      {isLoadingWebhooks ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Anti-Crack Tab */}
        {activeTab === 'app' && appSubTab === 'anticrack' && (
          <div className="anticrack-content app-content">
            {/* Header */}
            <div className="content-header">
              <div className="breadcrumbs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Manage Apps</span>
                <span className="separator">›</span>
                <span>Anti-Crack Protection</span>
              </div>

              <h1 className="page-title">
                <svg 
                  className="animated-shield-icon" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="1">
                        <animate attributeName="stop-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#1e40af" stopOpacity="1">
                        <animate attributeName="stop-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" 
                    fill="url(#shieldGradient)"
                    className="shield-path"
                  />
                  <path 
                    d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" 
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shield-outline"
                  />
                  <path 
                    d="M9 12l2 2 4-4" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="shield-check"
                  />
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="rgba(59, 130, 246, 0.3)" 
                    strokeWidth="1"
                    className="shield-pulse"
                  />
                </svg>
                Anti-Crack Protection
              </h1>
              <p className="page-subtitle">
                Sistema avançado de proteção contra tentativas de crack, debuggers e processos suspeitos.
              </p>
            </div>

            {/* Sub-Tabs */}
            <div className="anticrack-subtabs">
              <button
                className={`anticrack-subtab ${anticrackSubTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAnticrackSubTab('dashboard')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </button>
              <button
                className={`anticrack-subtab ${anticrackSubTab === 'documentation' ? 'active' : ''}`}
                onClick={() => setAnticrackSubTab('documentation')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Documentação
              </button>
            </div>

            {/* Dashboard Content */}
            {anticrackSubTab === 'dashboard' && (
              <>
            {/* Status Cards */}
            <div className="anticrack-stats-grid">
              <div className={`anticrack-stat-card ${isMonitoring ? 'active' : ''}`}>
                <div className="stat-icon">
                  {isMonitoring ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  )}
                </div>
                <div className="stat-content">
                  <div className="stat-label">Status</div>
                  <div className="stat-value">{isMonitoring ? 'Monitorando' : 'Parado'}</div>
                </div>
              </div>

              <div className="anticrack-stat-card danger">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Ameaças Detectadas</div>
                  <div className="stat-value">{threatsDetected}</div>
                </div>
              </div>

              <div className={`anticrack-stat-card ${debuggerDetected ? 'danger' : 'success'}`}>
                <div className="stat-icon">
                  {debuggerDetected ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="stat-content">
                  <div className="stat-label">Debugger</div>
                  <div className="stat-value">{debuggerDetected ? 'Detectado' : 'Limpo'}</div>
                </div>
              </div>

              <div className="anticrack-stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Logs</div>
                  <div className="stat-value">{detectionLogs.length}</div>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="anticrack-control-panel">
              <h2 className="section-title">Painel de Controle</h2>
              
              <div className="anticrack-controls">
                <div className="control-group">
                  <label className="control-label">
                    <input
                      type="checkbox"
                      checked={antiCrackEnabled}
                      onChange={(e) => {
                        setAntiCrackEnabled(e.target.checked)
                        if (!e.target.checked) {
                          stopMonitoring()
                        } else if (appSubTab === 'anticrack' && !isMonitoring) {
                          startMonitoring()
                        }
                      }}
                    />
                    <span></span>
                    <span>Habilitar Anti-Crack</span>
                  </label>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    <input
                      type="checkbox"
                      checked={memoryOverloadEnabled}
                      onChange={(e) => setMemoryOverloadEnabled(e.target.checked)}
                    />
                    <span></span>
                    <span>Sobrecarga de Memória (Ao detectar ameaça)</span>
                  </label>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    <input
                      type="checkbox"
                      checked={shutdownEnabled}
                      onChange={(e) => setShutdownEnabled(e.target.checked)}
                    />
                    <span></span>
                    <span>Desligar PC (Ameaças críticas)</span>
                  </label>
                </div>
              </div>

              <div className="control-actions">

                <button
                  className="action-btn secondary"
                  onClick={reloadLogs}
                  title="Recarregar logs do banco de dados"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Recarregar Logs
                </button>

                <button
                  className="action-btn secondary"
                  onClick={clearLogs}
                  title="Limpar logs da interface (não apaga do banco)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Limpar Logs
                </button>
              </div>
            </div>

            {/* Detection Logs */}
            <div className="anticrack-logs-section">
              <h2 className="section-title">Logs de Detecção</h2>
              
              {detectionLogs.length === 0 ? (
                <div className="empty-logs">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p>Nenhum log de detecção ainda. O sistema está monitorando...</p>
                </div>
              ) : (
                <div className="logs-container">
                  {detectionLogs.map((log) => (
                    <div key={log.id} className={`log-entry log-${log.severity}`}>
                      <div className="log-icon-wrapper">
                        <div className="log-icon">
                          {log.severity === 'critical' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          )}
                          {log.severity === 'high' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          )}
                          {log.severity === 'info' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="log-content">
                        <div className="log-header">
                          <div className="log-message">{log.message}</div>
                          <span className={`log-severity-badge severity-${log.severity}`}>
                            {log.severity === 'critical' ? 'CRÍTICO' : log.severity === 'high' ? 'ALTO' : 'INFO'}
                          </span>
                        </div>
                        <div className="log-details">
                          <div className="log-detail-row">
                            <span className="log-detail-label">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              Processo:
                            </span>
                            <span className="log-detail-value">{log.process || 'N/A'}</span>
                          </div>
                          {log.pid && log.pid !== 'N/A' && (
                            <div className="log-detail-row">
                              <span className="log-detail-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                                PID:
                              </span>
                              <span className="log-detail-value">{log.pid}</span>
                            </div>
                          )}
                          {log.path && log.path !== 'N/A' && (
                            <div className="log-detail-row">
                              <span className="log-detail-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                Caminho:
                              </span>
                              <span className="log-detail-value log-path">{log.path}</span>
                            </div>
                          )}
                          {log.source && (
                            <div className="log-detail-row">
                              <span className="log-detail-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                  <path d="M2 17l10 5 10-5" />
                                  <path d="M2 12l10 5 10-5" />
                                </svg>
                                Fonte:
                              </span>
                              <span className="log-detail-value">{log.source}</span>
                            </div>
                          )}
                          {log.action && (
                            <div className="log-detail-row">
                              <span className="log-detail-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Ação:
                              </span>
                              <span className="log-detail-value log-action">{log.action}</span>
                            </div>
                          )}
                        </div>
                        <div className="log-footer">
                          <span className="log-type-badge">{log.type.toUpperCase().replace(/_/g, ' ')}</span>
                          <span className="log-time">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {new Date(log.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

              </>
            )}

            {/* Documentation Content */}
            {anticrackSubTab === 'documentation' && (
              <div className="anticrack-documentation">
                <div className="doc-header">
                  <h2 className="section-title">Documentação de Integração</h2>
                  <p className="doc-subtitle">
                    Integre o sistema Anti-Crack em sua aplicação usando nossa API. Escolha a linguagem abaixo para ver exemplos de código.
                  </p>
                </div>

                {/* Language Tabs */}
                <div className="language-tabs">
                  <button 
                    className={`lang-tab ${selectedDocLanguage === 'csharp' ? 'active' : ''}`}
                    onClick={() => setSelectedDocLanguage('csharp')}
                  >
                    C#
                  </button>
                  <button 
                    className={`lang-tab ${selectedDocLanguage === 'cpp' ? 'active' : ''}`}
                    onClick={() => setSelectedDocLanguage('cpp')}
                  >
                    C++
                  </button>
                </div>

                {/* API Endpoint Info */}
                <div className="api-endpoint-info">
                  <h3 className="doc-section-title">Endpoint da API</h3>
                  <div className="endpoint-box">
                    <code className="endpoint-url">POST /api/1.3/anticrack/status</code>
                    <code className="endpoint-url">POST /api/1.3/anticrack/report</code>
                  </div>
                  <p className="endpoint-description">
                    Base URL: <code>{currentApp ? `https://www.gouc.com.br` : 'https://www.gouc.com.br'}</code>
                  </p>
                </div>

                {/* Code Examples */}
                {selectedDocLanguage === 'csharp' && (
                  <div className="code-example-section">
                    <h3 className="doc-section-title">Exemplo C#</h3>
                    <div className="code-block">
                      <pre><code>{`using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class AntiCrackClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiUrl = "https://www.gouc.com.br";
    private readonly string _appName;
    private readonly string _ownerId;
    private readonly string _sessionId;

    public AntiCrackClient(string appName, string ownerId, string sessionId)
    {
        _httpClient = new HttpClient();
        _appName = appName;
        _ownerId = ownerId;
        _sessionId = sessionId;
    }

    // Verificar status do Anti-Crack
    public async Task<bool> CheckAntiCrackStatus()
    {
        try
        {
            var request = new
            {
                type = "status",
                name = _appName,
                ownerid = _ownerId,
                sessionid = _sessionId,
                hash = GenerateHash(),
                enckey = ""
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"{_apiUrl}/api/1.3/anticrack/status", 
                content
            );

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (result.GetProperty("success").GetBoolean())
            {
                var anticrack = result.GetProperty("anticrack");
                return anticrack.GetProperty("enabled").GetBoolean();
            }

            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao verificar status Anti-Crack: {ex.Message}");
            return false;
        }
    }

    // Reportar ameaça detectada
    public async Task<bool> ReportThreat(string threatType, string threatData)
    {
        try
        {
            var request = new
            {
                type = "report",
                name = _appName,
                ownerid = _ownerId,
                sessionid = _sessionId,
                hash = GenerateHash(),
                enckey = "",
                threat_type = threatType, // "debugger", "suspicious_process", "critical"
                threat_data = threatData
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"{_apiUrl}/api/1.3/anticrack/report", 
                content
            );

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            return result.GetProperty("success").GetBoolean();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao reportar ameaça: {ex.Message}");
            return false;
        }
    }

    // Detectar debugger
    public bool DetectDebugger()
    {
        try
        {
            // Verificar se debugger está anexado
            if (System.Diagnostics.Debugger.IsAttached)
            {
                ReportThreat("debugger", "Debugger detected").Wait();
                return true;
            }

            // Verificar processos suspeitos
            var suspiciousProcesses = new[] { "x64dbg", "x32dbg", "ollydbg", "ida", "cheatengine" };
            foreach (var process in System.Diagnostics.Process.GetProcesses())
            {
                foreach (var suspicious in suspiciousProcesses)
                {
                    if (process.ProcessName.ToLower().Contains(suspicious.ToLower()))
                    {
                        ReportThreat("suspicious_process", process.ProcessName).Wait();
                        return true;
                    }
                }
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    private string GenerateHash()
    {
        // Implementar geração de hash conforme sua aplicação
        // Exemplo básico:
        var input = $"{_appName}{_ownerId}{_sessionId}";
        using (var sha256 = System.Security.Cryptography.SHA256.Create())
        {
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}

// Uso:
var antiCrack = new AntiCrackClient("MyApp", "hskCtSIzio", "session_token_here");

// Verificar status
bool isEnabled = await antiCrack.CheckAntiCrackStatus();

// Verificar debugger periodicamente
if (antiCrack.DetectDebugger())
{
    // Ameaça detectada - tomar ação apropriada
    Environment.Exit(0);
}`}</code></pre>
                    </div>
                  </div>
                )}

                {selectedDocLanguage === 'cpp' && (
                  <div className="code-example-section">
                    <h3 className="doc-section-title">Exemplo C++</h3>
                    <div className="code-block">
                      <pre><code>{`#include <iostream>
#include <string>
#include <windows.h>
#include <tlhelp32.h>
#include <wininet.h>
#include <sstream>
#include <vector>

#pragma comment(lib, "wininet.lib")

class AntiCrackClient {
private:
    std::string apiUrl = "https://www.gouc.com.br";
    std::string appName;
    std::string ownerId;
    std::string sessionId;

    std::string GenerateHash() {
        // Implementar geração de hash conforme sua aplicação
        std::string input = appName + ownerId + sessionId;
        // Exemplo básico - usar sua implementação de hash
        return "hash_here";
    }

    bool HttpPost(const std::string& endpoint, const std::string& jsonData) {
        HINTERNET hInternet = InternetOpenA("AntiCrackClient", 
            INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
        
        if (!hInternet) return false;

        HINTERNET hConnect = InternetOpenUrlA(hInternet, endpoint.c_str(),
            jsonData.c_str(), jsonData.length(),
            INTERNET_FLAG_RELOAD, 0);

        if (!hConnect) {
            InternetCloseHandle(hInternet);
            return false;
        }

        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return true;
    }

public:
    AntiCrackClient(const std::string& name, const std::string& owner, 
                    const std::string& session) 
        : appName(name), ownerId(owner), sessionId(session) {}

    bool CheckAntiCrackStatus() {
        std::ostringstream json;
        json << "{"
             << "\"type\":\"status\","
             << "\"name\":\"" << appName << "\","
             << "\"ownerid\":\"" << ownerId << "\","
             << "\"sessionid\":\"" << sessionId << "\","
             << "\"hash\":\"" << GenerateHash() << "\","
             << "\"enckey\":\"\""
             << "}";

        std::string endpoint = apiUrl + "/api/1.3/anticrack/status";
        return HttpPost(endpoint, json.str());
    }

    bool ReportThreat(const std::string& threatType, 
                     const std::string& threatData) {
        std::ostringstream json;
        json << "{"
             << "\"type\":\"report\","
             << "\"name\":\"" << appName << "\","
             << "\"ownerid\":\"" << ownerId << "\","
             << "\"sessionid\":\"" << sessionId << "\","
             << "\"hash\":\"" << GenerateHash() << "\","
             << "\"enckey\":\"\","
             << "\"threat_type\":\"" << threatType << "\","
             << "\"threat_data\":\"" << threatData << "\""
             << "}";

        std::string endpoint = apiUrl + "/api/1.3/anticrack/report";
        return HttpPost(endpoint, json.str());
    }

    bool DetectDebugger() {
        // Verificar se debugger está anexado
        if (IsDebuggerPresent()) {
            ReportThreat("debugger", "Debugger detected");
            return true;
        }

        // Verificar processos suspeitos
        std::vector<std::string> suspicious = {
            "x64dbg.exe", "x32dbg.exe", "ollydbg.exe",
            "ida.exe", "ida64.exe", "cheatengine.exe"
        };

        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return false;

        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);

        if (Process32First(hSnapshot, &pe32)) {
            do {
                std::string processName = pe32.szExeFile;
                std::transform(processName.begin(), processName.end(),
                    processName.begin(), ::tolower);

                for (const auto& suspiciousName : suspicious) {
                    if (processName.find(suspiciousName) != std::string::npos) {
                        ReportThreat("suspicious_process", processName);
                        CloseHandle(hSnapshot);
                        return true;
                    }
                }
            } while (Process32Next(hSnapshot, &pe32));
        }

        CloseHandle(hSnapshot);
        return false;
    }
};

// Uso:
int main() {
    AntiCrackClient antiCrack("MyApp", "hskCtSIzio", "session_token_here");

    // Verificar status
    if (!antiCrack.CheckAntiCrackStatus()) {
        std::cout << "Anti-Crack não está habilitado!" << std::endl;
    }

    // Verificar debugger periodicamente
    if (antiCrack.DetectDebugger()) {
        // Ameaça detectada - tomar ação apropriada
        ExitProcess(0);
    }

    return 0;
}`}</code></pre>
                    </div>
                  </div>
                )}

                {/* Usage Instructions */}
                <div className="usage-instructions">
                  <h3 className="doc-section-title">Como Usar</h3>
                  <ol className="usage-steps">
                    <li>Substitua <code>MyApp</code> pelo nome da sua aplicação</li>
                    <li>Substitua <code>hskCtSIzio</code> pelo seu Owner ID</li>
                    <li>Substitua <code>session_token_here</code> pelo session token do usuário</li>
                    <li>Implemente a função <code>GenerateHash()</code> conforme sua aplicação</li>
                    <li>Chame <code>DetectDebugger()</code> periodicamente em sua aplicação</li>
                    <li>Use <code>ReportThreat()</code> para reportar ameaças detectadas</li>
                  </ol>
                </div>

                {/* Response Format */}
                <div className="response-format">
                  <h3 className="doc-section-title">Formato de Resposta</h3>
                  <div className="code-block">
                    <pre><code>{`// Status Response
{
  "success": true,
  "message": "success",
  "anticrack": {
    "enabled": true,
    "version": "1.0.0",
    "features": {
      "debugger_detection": true,
      "process_monitoring": true,
      "memory_protection": true,
      "shutdown_protection": true
    }
  }
}

// Report Response
{
  "success": true,
  "message": "Threat reported successfully",
  "action": "shutdown" // ou "monitor"
}`}</code></pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className={`app-content ${accountSubTab === 'ticket' ? 'app-content-no-padding' : ''}`}>
            {accountSubTab === 'profile' && (
              <div className="profile-content app-content">
                {/* Header */}
                <div className="content-header">
                  <h1 className="page-title">Perfil</h1>
                  <p className="page-subtitle">
                    Gerencie seu perfil, banner, senha, email e dados cadastrados
                  </p>
                </div>

                {/* Feedback Message */}
                {feedbackMessage && (
                  <div className={`feedback-message ${feedbackType}`}>
                    {feedbackMessage}
                  </div>
                )}

                {isLoadingProfile ? (
                  <div className="loading-message">
                    <div className="loading-spinner"></div>
                    <p>Carregando dados do perfil...</p>
                  </div>
                ) : (
                  <>
                    {/* Banner Section */}
                    <div className="profile-section">
                      <h2 className="section-title">Banner do Perfil</h2>
                      <p className="section-subtitle">
                        Personalize seu perfil com um banner único (máximo 10MB)
                      </p>
                      
                      <div className="banner-upload-area">
                        {(bannerPreview || bannerUrl) ? (
                          <div className="banner-preview-container">
                            <img 
                              src={bannerPreview || bannerUrl} 
                              alt="Banner preview" 
                              className="banner-preview"
                            />
                            <div className="banner-overlay">
                              <button
                                className="banner-action-btn"
                                onClick={() => bannerInputRef.current?.click()}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Alterar Banner
                              </button>
                              {bannerPreview && (
                                <>
                                  <button
                                    className="banner-action-btn banner-upload-btn"
                                    onClick={handleUploadBanner}
                                    disabled={isUploadingBanner}
                                  >
                                    {isUploadingBanner ? 'Enviando...' : 'Salvar Banner'}
                                  </button>
                                  <button
                                    className="banner-action-btn banner-remove-btn"
                                    onClick={handleRemoveBanner}
                                  >
                                    Remover
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="banner-upload-placeholder"
                            onClick={() => bannerInputRef.current?.click()}
                          >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p>Clique para adicionar um banner</p>
                            <span>JPEG, PNG, GIF ou WEBP (máx. 10MB)</span>
                          </div>
                        )}
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleBannerSelect}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    {/* Dados do Usuário */}
                    <div className="profile-section">
                      <h2 className="section-title">Dados Cadastrados</h2>
                      <p className="section-subtitle">
                        Informações da sua conta
                      </p>
                      
                      <div className="profile-info-grid">
                        <div className="profile-info-item">
                          <label>Nome de Usuário</label>
                          <div className="profile-info-value">{userUsername || username || 'N/A'}</div>
                        </div>
                        <div className="profile-info-item">
                          <label>Email</label>
                          <div className="profile-info-value">{userEmail || 'N/A'}</div>
                        </div>
                        <div className="profile-info-item">
                          <label>Plano</label>
                          <div className="profile-info-value">
                            <span className={`subscription-badge subscription-badge-${userPlan}`}>
                              {userPlan || 'tester'}
                            </span>
                          </div>
                        </div>
                        <div className="profile-info-item">
                          <label>Expira em</label>
                          <div className="profile-info-value">{userSubscription || 'Never'}</div>
                        </div>
                        <div className="profile-info-item">
                          <label>Owner ID</label>
                          <div className="profile-info-value">{userOwnerId || 'N/A'}</div>
                        </div>
                        <div className="profile-info-item">
                          <label>Data de Registro</label>
                          <div className="profile-info-value">{userRegisteredDate || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Picture URL */}
                    <div className="profile-section">
                      <h2 className="section-title">Foto de Perfil</h2>
                      <p className="section-subtitle">
                        Adicione uma URL de imagem para sua foto de perfil
                      </p>
                      
                      <div className="profile-form">
                        <div className="form-group">
                          <label htmlFor="profile-picture-url">Profile Picture URL:</label>
                          <input
                            type="text"
                            id="profile-picture-url"
                            className="form-input"
                            value={profilePictureUrl}
                            onChange={(e) => setProfilePictureUrl(e.target.value)}
                            placeholder="https://exemplo.com/imagem.jpg"
                          />
                          <p className="form-help-text">
                            Cole aqui a URL da imagem que deseja usar como foto de perfil
                          </p>
                        </div>
                        {profilePictureUrl && (
                          <div className="profile-picture-preview">
                            <img 
                              src={profilePictureUrl} 
                              alt="Profile preview" 
                              className="profile-picture-preview-img"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <button
                          className="action-btn primary"
                          onClick={async () => {
                            const sessionid = localStorage.getItem('sessionid')
                            if (!sessionid) {
                              showMessage('Sessão inválida. Por favor, faça login novamente.', 'error')
                              return
                            }

                            setIsSaving(true)
                            try {
                              const response = await authService.saveSettings(sessionid, {
                                profilePictureUrl
                              })
                              if (response.success) {
                                showMessage('Foto de perfil atualizada com sucesso!', 'success')
                              }
                            } catch (error) {
                              showMessage(error.message || 'Erro ao salvar foto de perfil', 'error')
                            } finally {
                              setIsSaving(false)
                            }
                          }}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Salvando...' : 'Salvar Foto de Perfil'}
                        </button>
                      </div>
                    </div>

                    {/* Alterar Email */}
                    <div className="profile-section">
                      <h2 className="section-title">Alterar Email</h2>
                      <p className="section-subtitle">
                        Atualize seu endereço de email (será necessário confirmar)
                      </p>
                      
                      <div className="profile-form">
                        <div className="form-group">
                          <label htmlFor="new-email">Novo Email</label>
                          <input
                            type="email"
                            id="new-email"
                            className="form-input"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="seu.novo.email@exemplo.com"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="password-for-email">Senha Atual</label>
                          <input
                            type="password"
                            id="password-for-email"
                            className="form-input"
                            value={passwordForChange}
                            onChange={(e) => setPasswordForChange(e.target.value)}
                            placeholder="Digite sua senha atual"
                          />
                        </div>
                        <button
                          className="action-btn primary"
                          onClick={handleChangeEmailProfile}
                          disabled={isLoadingProfile || !newEmail || !passwordForChange}
                        >
                          {isLoadingProfile ? 'Alterando...' : 'Alterar Email'}
                        </button>
                      </div>
                    </div>

                    {/* Alterar Senha */}
                    <div className="profile-section">
                      <h2 className="section-title">Alterar Senha</h2>
                      <p className="section-subtitle">
                        Mantenha sua conta segura com uma senha forte
                      </p>
                      
                      <div className="profile-form">
                        <button
                          className="action-btn primary"
                          onClick={() => setShowChangePasswordModal(true)}
                        >
                          Alterar Senha
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {accountSubTab === 'reseller' && (
              <div className="reseller-content app-content">
                {/* Header */}
                <div className="content-header">
                  <h1 className="page-title">Revendedores</h1>
                  <p className="page-subtitle">
                    Crie e gerencie códigos de ativação de planos para revender
                  </p>
                </div>

                {/* Feedback Message */}
                {feedbackMessage && (
                  <div className={`feedback-message ${feedbackType}`}>
                    {feedbackMessage}
                  </div>
                )}

                {/* Actions */}
                {isUserAdmin && (
                  <div className="reseller-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => setShowCreateResellerCodeModal(true)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Criar Código de Revendedor
                    </button>
                  </div>
                )}
                
                {!isUserAdmin && (
                  <div className="reseller-access-denied">
                    <div className="access-denied-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3>Acesso Restrito</h3>
                    <p>Apenas administradores podem criar códigos de revendedor.</p>
                    <p className="access-denied-note">Entre em contato com um administrador para obter acesso a esta funcionalidade.</p>
                  </div>
                )}

                {/* Filters and Search */}
                <div className="reseller-controls">
                  <div className="reseller-search">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Buscar por código ou nota..."
                      value={resellerCodeSearch}
                      onChange={(e) => setResellerCodeSearch(e.target.value)}
                    />
                  </div>
                  <div className="reseller-filter">
                    <select
                      className="show-select"
                      value={resellerCodeFilter}
                      onChange={(e) => setResellerCodeFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativos</option>
                      <option value="used">Usados</option>
                      <option value="expired">Expirados</option>
                    </select>
                  </div>
                </div>

                {/* Codes Table */}
                {isLoadingResellerCodes ? (
                  <div className="loading-message">
                    <div className="loading-spinner"></div>
                    <p>Carregando códigos...</p>
                  </div>
                ) : (
                  <div className="reseller-codes-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Plano</th>
                          <th>Período</th>
                          <th>Status</th>
                          <th>Criado em</th>
                          <th>Expira em</th>
                          <th>Usado por</th>
                          <th>Nota</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResellerCodes.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="empty-message">
                              {resellerCodes.length === 0 
                                ? 'Nenhum código de revendedor criado ainda. Clique em "Criar Código de Revendedor" para começar.'
                                : 'Nenhum código encontrado com os filtros selecionados.'}
                            </td>
                          </tr>
                        ) : (
                          filteredResellerCodes.map((code) => (
                            <tr key={code.id}>
                              <td>
                                <div className="reseller-code-cell">
                                  <code className="reseller-code-text">{code.code}</code>
                                  <button
                                    className="reseller-copy-btn"
                                    onClick={() => handleCopyResellerCode(code.code)}
                                    title="Copiar código"
                                  >
                                    {copiedResellerCode === code.code ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className={`subscription-badge subscription-badge-${code.plan}`}>
                                  {code.plan}
                                </span>
                              </td>
                              <td>{code.period === 'monthly' ? 'Mensal' : 'Anual'}</td>
                              <td>
                                <span className={`status-badge status-${code.status}`}>
                                  {code.status === 'active' ? 'Ativo' : 
                                   code.status === 'used' ? 'Usado' : 
                                   code.status === 'expired' ? 'Expirado' : code.status}
                                </span>
                              </td>
                              <td>{code.created_at ? new Date(code.created_at).toLocaleDateString('pt-BR') : 'N/A'}</td>
                              <td>{code.expires_at ? new Date(code.expires_at).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                              <td>{code.used_by_username || 'N/A'}</td>
                              <td>{code.note || '-'}</td>
                              <td>
                                {code.status === 'active' && (
                                  <button
                                    className="action-btn secondary"
                                    onClick={() => handleDeleteResellerCode(code.id)}
                                    title="Deletar código"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Modal: Criar Código de Revendedor (APENAS ADMIN) */}
                {showCreateResellerCodeModal && isUserAdmin && (
                  <div className="modal-overlay" onClick={() => setShowCreateResellerCodeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h2 className="modal-title">Criar Código de Revendedor</h2>
                        <button className="modal-close" onClick={() => setShowCreateResellerCodeModal(false)}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      <div className="modal-body">
                        <div className="form-group">
                          <label htmlFor="reseller-plan">Plano:</label>
                          <select
                            id="reseller-plan"
                            className="form-input"
                            value={newResellerPlan}
                            onChange={(e) => setNewResellerPlan(e.target.value)}
                          >
                            <option value="developer">Developer</option>
                            <option value="seller">Seller</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="reseller-period">Período:</label>
                          <select
                            id="reseller-period"
                            className="form-input"
                            value={newResellerPeriod}
                            onChange={(e) => setNewResellerPeriod(e.target.value)}
                          >
                            <option value="monthly">Mensal</option>
                            <option value="annual">Anual</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="reseller-expires">Data de Expiração (Opcional):</label>
                          <input
                            type="datetime-local"
                            id="reseller-expires"
                            className="form-input"
                            value={newResellerExpires}
                            onChange={(e) => setNewResellerExpires(e.target.value)}
                          />
                          <p className="form-help-text">
                            Deixe em branco para código sem expiração
                          </p>
                        </div>
                        <div className="form-group">
                          <label htmlFor="reseller-note">Nota (Opcional):</label>
                          <textarea
                            id="reseller-note"
                            className="form-input"
                            rows="3"
                            value={newResellerNote}
                            onChange={(e) => setNewResellerNote(e.target.value)}
                            placeholder="Adicione uma nota para identificar este código..."
                          />
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="modal-btn modal-btn-secondary"
                          onClick={() => setShowCreateResellerCodeModal(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="modal-btn modal-btn-primary"
                          onClick={handleCreateResellerCode}
                          disabled={isLoadingResellerCodes}
                        >
                          {isLoadingResellerCodes ? 'Criando...' : 'Criar Código'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {accountSubTab === 'forms' && (
              <div className="forms-content app-content">
                {/* Header */}
                <div className="content-header">
                  <div className="breadcrumbs">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Manage Apps</span>
                    <span className="separator">»</span>
                    <span>Current App: {currentApp ? currentApp.name : `${username || 'noixplatform'}'s Application`}</span>
                  </div>

                  {userPlan === 'tester' && (
                    <div className="subscription-warning">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>You don't have a subscription!</span>
                      <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                    </div>
                  )}

                  <h1 className="page-title">Forms</h1>
                  <p className="page-subtitle">
                    Just about any form you need.
                  </p>
                </div>

                {/* Warning Message */}
                <div className="forms-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Lying, spamming, or abusing any of these forms will result in you being banned from submitting any form.</span>
                </div>

                {/* Form Buttons */}
                <div className="forms-buttons">
                  <button className="form-btn form-btn-blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Apply For Staff
                  </button>

                  <button className="form-btn form-btn-purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Make A Suggestion
                  </button>

                  <button className="form-btn form-btn-orange">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 17.364m12.728 0l-4.243-4.243m-4.242 0L5.636 6.636" />
                    </svg>
                    Report A Bug
                  </button>

                  <button className="form-btn form-btn-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Report A Vulnerability
                  </button>

                  <button className="form-btn form-btn-teal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    File A Report
                  </button>

                  <button className="form-btn form-btn-red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    DMCA
                  </button>
                </div>
              </div>
            )}

            {accountSubTab === 'ticket' && (
              <div className="user-chat-container">
                <div className="user-chat-layout">
                  {/* Lista de Tickets */}
                  <div className="user-chat-tickets-list">
                    <div className="user-chat-header">
                      <h3>Meus Tickets</h3>
                      <button
                        className="user-chat-new-btn"
                        onClick={() => setShowNewTicketModal(true)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Novo Ticket
                      </button>
                    </div>

                    <div className="user-chat-tickets-scroll">
                      {isLoadingUserChat ? (
                        <div className="user-chat-loading">
                          <div className="loading-spinner-small">
                            <svg className="spinner-svg" viewBox="0 0 50 50">
                              <circle className="spinner-circle" cx="25" cy="25" r="20" />
                            </svg>
                          </div>
                        </div>
                      ) : userChatTickets.length === 0 ? (
                        <div className="user-chat-empty">
                          <p>Nenhum ticket encontrado</p>
                          <button
                            className="user-chat-new-btn-small"
                            onClick={() => setShowNewTicketModal(true)}
                          >
                            Criar primeiro ticket
                          </button>
                        </div>
                      ) : (
                        userChatTickets.map(ticket => (
                          <div
                            key={ticket.id}
                            className={`user-chat-ticket-item ${selectedUserTicket?.id === ticket.id ? 'active' : ''} ${ticket.unread_count > 0 ? 'unread' : ''}`}
                            onClick={() => handleSelectUserTicket(ticket)}
                          >
                            <div className="user-chat-ticket-header">
                              <strong>{ticket.subject}</strong>
                              {ticket.unread_count > 0 && (
                                <span className="user-chat-unread-badge">{ticket.unread_count}</span>
                              )}
                            </div>
                            <div className="user-chat-ticket-status">
                              <span className={`user-chat-status-badge user-chat-status-${ticket.status}`}>
                                {ticket.status === 'open' ? 'Aberto' : 
                                 ticket.status === 'in_progress' ? 'Em Andamento' :
                                 ticket.status === 'closed' ? 'Fechado' : ticket.status}
                              </span>
                            </div>
                            <div className="user-chat-ticket-time">
                              {formatDate(ticket.last_message_at)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Área de Chat */}
                  <div className="user-chat-messages-area">
                    {selectedUserTicket ? (
                      <>
                        <div className="user-chat-header-info">
                          <h3>{selectedUserTicket.subject}</h3>
                          <p>
                            Status: <span className={`user-chat-status-badge user-chat-status-${selectedUserTicket.status}`}>
                              {selectedUserTicket.status === 'open' ? 'Aberto' : 
                               selectedUserTicket.status === 'in_progress' ? 'Em Andamento' :
                               selectedUserTicket.status === 'closed' ? 'Fechado' : selectedUserTicket.status}
                            </span>
                          </p>
                        </div>

                        <div className="user-chat-messages-scroll">
                          {isLoadingUserChat ? (
                            <div className="user-chat-loading">
                              <div className="loading-spinner-small">
                                <svg className="spinner-svg" viewBox="0 0 50 50">
                                  <circle className="spinner-circle" cx="25" cy="25" r="20" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <>
                              {userChatMessages.map(msg => (
                                <div
                                  key={msg.id}
                                  className={`user-chat-message ${msg.is_staff ? 'staff' : 'user'}`}
                                >
                                  <div className="user-chat-message-avatar">
                                    {msg.profile_picture_url ? (
                                      <img src={msg.profile_picture_url} alt={msg.username} />
                                    ) : (
                                      <span>{msg.username?.charAt(0).toUpperCase() || 'U'}</span>
                                    )}
                                  </div>
                                  <div className="user-chat-message-content">
                                    <div className="user-chat-message-header">
                                      <span className="user-chat-message-author">{msg.username}</span>
                                      {msg.is_staff && <span className="user-chat-staff-badge">Staff</span>}
                                      <span className="user-chat-message-time">
                                        {formatDate(msg.created_at)}
                                      </span>
                                    </div>
                                    {msg.image_url && (
                                      <div className="user-chat-message-image">
                                        <img 
                                          src={`${getApiBaseUrl()}${msg.image_url}`} 
                                          alt="Imagem enviada" 
                                          onClick={() => window.open(`${getApiBaseUrl()}${msg.image_url}`, '_blank')}
                                          style={{ cursor: 'pointer', maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
                                        />
                                      </div>
                                    )}
                                    {msg.message && <div className="user-chat-message-text">{msg.message}</div>}
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </>
                          )}
                        </div>

                        <div className="user-chat-input-area">
                          {imagePreview && (
                            <div className="user-chat-image-preview">
                              <img src={imagePreview} alt="Preview" />
                              <button 
                                className="user-chat-remove-image" 
                                onClick={handleRemoveImage}
                                type="button"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="user-chat-input-wrapper">
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageSelect}
                              style={{ display: 'none' }}
                            />
                            <button
                              className="user-chat-image-btn"
                              onClick={() => fileInputRef.current?.click()}
                              type="button"
                              disabled={selectedUserTicket.status === 'closed'}
                              title="Enviar imagem"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </button>
                            <textarea
                              className="user-chat-input"
                              placeholder="Digite sua mensagem..."
                              value={newUserMessage}
                              onChange={(e) => setNewUserMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendUserMessage()
                                }
                              }}
                              disabled={selectedUserTicket.status === 'closed'}
                            />
                            <button
                              className="user-chat-send-btn"
                              onClick={handleSendUserMessage}
                              disabled={(!newUserMessage.trim() && !selectedImage) || isLoadingUserChat || selectedUserTicket.status === 'closed'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                              Enviar
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="user-chat-empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>Selecione um ticket ou crie um novo para começar</p>
                        <button
                          className="user-chat-new-btn-small"
                          onClick={() => setShowNewTicketModal(true)}
                          style={{ marginTop: '16px' }}
                        >
                          Criar Novo Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {accountSubTab === 'upgrade' && (
              <div className="upgrade-content app-content">
                {/* Header */}
                <div className="content-header">
                  <div className="breadcrumbs">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Account</span>
                    <span className="separator">/</span>
                    <span>Upgrade</span>
                    {userPlan === 'tester' && (
                      <>
                        <span className="separator">/</span>
                        <span className="subscription-warning-text">You don't have a subscription!</span>
                        <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                      </>
                    )}
                  </div>

                  <h1 className="page-title">Upgrade</h1>
                  <p className="page-subtitle">
                    Upgrade your account today!
                  </p>
                </div>

                {/* Period Selector */}
                <div className="period-selector-wrapper" style={{ marginTop: '32px', marginBottom: '32px' }}>
                  <div className="period-selector">
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('all')}
                    >
                      <span>Todos</span>
                    </button>
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'minutes5' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('minutes5')}
                    >
                      <span>5 Min</span>
                    </button>
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'weekly' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('weekly')}
                    >
                      <span>Semanal</span>
                    </button>
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'monthly' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('monthly')}
                    >
                      <span>Mensal</span>
                    </button>
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'quarterly' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('quarterly')}
                    >
                      <span>Trimestral</span>
                    </button>
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'annual' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('annual')}
                    >
                      <span>Anual</span>
                    </button>
                    <button
                      className={`period-selector-btn ${selectedPeriodFilter === 'lifetime' ? 'active' : ''}`}
                      onClick={() => setSelectedPeriodFilter('lifetime')}
                    >
                      <span>Vitalício</span>
                    </button>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                  {(selectedPeriodFilter === 'all' || selectedPeriodFilter === 'minutes5') && (
                  <div className="plan-card plan-test_5m">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO 5 MIN</h3>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 2,00</span>
                        <span className="plan-period">/ 5 min</span>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', marginBottom: 0 }}>Duração: 5 minutos</p>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Acesso temporário</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Recursos essenciais</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Ideal para testes rápidos</span>
                      </div>
                    </div>
                    <button 
                      className="plan-button plan-button-test_5m"
                      onClick={() => handleUpgradeClick('test_5m', 'minutes5')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span>Escolher Plano 5 Min</span>
                      <div className="plan-button-shine"></div>
                    </button>
                  </div>
                  )}
                  {/* Plano Teste - Sempre visível */}
                  {selectedPeriodFilter === 'all' && (
                  <div className="plan-card plan-tester">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 2v6l6 3-6 3V2z"/>
                          <path d="M3 12h18"/>
                          <path d="M3 18h18"/>
                          <circle cx="12" cy="12" r="2"/>
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO TESTE</h3>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Gratuito e Ilimitado</p>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 0,00</span>
                        <span className="plan-period">— Sem tempo para expirar</span>
                      </div>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>1 Aplicação</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>10 Licenças</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>10 Usuários</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 3 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Variáveis Globais Limitadas</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 4 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Upload até 10 MB</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 5 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Logs básicos</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 6 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Webhooks limitados</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 7 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Suporte via e-mail</span>
                      </div>
                    </div>
                    <button className="plan-button plan-button-tester" disabled={userPlan === 'tester'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>{userPlan === 'tester' ? 'PLANO ATUAL' : 'PLANO GRATUITO'}</span>
                    </button>
                  </div>
                  )}
                  
                  

                  {/* Plano Semanal */}
                  {(selectedPeriodFilter === 'all' || selectedPeriodFilter === 'weekly') && (
                  <div className="plan-card plan-weekly">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO SEMANAL</h3>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 7,90</span>
                        <span className="plan-period">/ semana</span>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', marginBottom: 0 }}>Duração: 7 dias</p>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>3 Aplicações</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>20 Licenças</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>50 Usuários</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 3 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Variáveis Globais</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 4 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Upload até 15 MB</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 5 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Logs detalhados</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 6 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Webhooks básicos</span>
                      </div>
                    </div>
                    <button 
                      className="plan-button plan-button-weekly"
                      onClick={() => handleUpgradeClick('weekly', 'weekly')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      <span>Escolher Plano Semanal</span>
                      <div className="plan-button-shine"></div>
                    </button>
                  </div>
                  )}

                  {/* Plano Mensal */}
                  {(selectedPeriodFilter === 'all' || selectedPeriodFilter === 'monthly') && (
                  <div className="plan-card plan-monthly">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                          <line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO MENSAL</h3>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 19,90</span>
                        <span className="plan-period">/ mês</span>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', marginBottom: 0 }}>Duração: 30 dias</p>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Aplicações Ilimitadas</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Licenças Ilimitadas</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Usuários Ilimitados</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 3 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Upload até 50 MB</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 4 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Variáveis Globais e de Usuário</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 5 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Webhooks + API liberada</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 6 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Logs com auditoria</span>
                      </div>
                    </div>
                    <button 
                      className="plan-button plan-button-monthly"
                      onClick={() => handleUpgradeClick('monthly', 'monthly')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                      <span>Escolher Plano Mensal</span>
                      <div className="plan-button-shine"></div>
                    </button>
                  </div>
                  )}

                  {/* Plano Trimestral */}
                  {(selectedPeriodFilter === 'all' || selectedPeriodFilter === 'quarterly') && (
                  <div className="plan-card plan-quarterly">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO TRIMESTRAL</h3>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 49,90</span>
                        <span className="plan-period">/ trimestre</span>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', marginBottom: 0 }}>Duração: 90 dias</p>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Tudo do plano Mensal</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Upload até 75 MB</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Logs avançados (JSON + CSV)</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 3 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Webhooks com autenticação</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 4 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Suporte prioritário</span>
                      </div>
                    </div>
                    <button 
                      className="plan-button plan-button-quarterly"
                      onClick={() => handleUpgradeClick('quarterly', 'quarterly')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                      </svg>
                      <span>Escolher Plano Trimestral</span>
                      <div className="plan-button-shine"></div>
                    </button>
                  </div>
                  )}

                  {/* Plano Anual */}
                  {(selectedPeriodFilter === 'all' || selectedPeriodFilter === 'annual') && (
                  <div className="plan-card plan-annual">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                          <path d="M4 22h16"/>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO ANUAL</h3>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 100,00</span>
                        <span className="plan-period">/ ano</span>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', marginBottom: 0 }}>Duração: 365 dias</p>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Tudo do plano Trimestral</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Upload até 150 MB</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Auditoria completa</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 3 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Backups automáticos</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 4 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Suporte premium (Discord / E-mail)</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 5 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Acesso antecipado a novas funções</span>
                      </div>
                    </div>
                    <button 
                      className="plan-button plan-button-annual"
                      onClick={() => handleUpgradeClick('annual', 'annual')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                        <path d="M4 22h16"/>
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                      </svg>
                      <span>Escolher Plano Anual</span>
                      <div className="plan-button-shine"></div>
                    </button>
                  </div>
                  )}

                  {/* Plano Lifetime */}
                  {(selectedPeriodFilter === 'all' || selectedPeriodFilter === 'lifetime') && (
                  <div className="plan-card plan-lifetime">
                    <div className="plan-header">
                      <div className="plan-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
                          <path d="M11 3 8 9l4 12 4-12-3-6"/>
                          <path d="M2 9h20"/>
                        </svg>
                      </div>
                      <h3 className="plan-title">PLANO LIFETIME</h3>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Vitalício</p>
                    </div>
                    <div className="plan-price">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <span className="plan-amount">R$ 399,00</span>
                        <span className="plan-period">(pagamento único)</span>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', marginBottom: 0 }}>Acesso Vitalício</p>
                    </div>
                    <div className="plan-features">
                      <div className="plan-feature" style={{ '--index': 0 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Tudo do plano Anual</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 1 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Atualizações futuras garantidas</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 2 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Upload e armazenamento ilimitados</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 3 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Logs e auditorias sem limite</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 4 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Suporte com prioridade máxima</span>
                      </div>
                      <div className="plan-feature" style={{ '--index': 5 }}>
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path className="check-path" d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Benefícios exclusivos e descontos</span>
                      </div>
                    </div>
                    <button 
                      className="plan-button plan-button-lifetime"
                      onClick={() => handleUpgradeClick('lifetime', 'lifetime')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
                        <path d="M11 3 8 9l4 12 4-12-3-6"/>
                        <path d="M2 9h20"/>
                      </svg>
                      <span>Escolher Plano Lifetime</span>
                      <div className="plan-button-shine"></div>
                    </button>
                  </div>
                  )}
                </div>
              </div>
            )}

            {accountSubTab === 'settings' && (
              <div className="settings-content">
                {/* Header */}
                <div className="content-header">
                  <div className="breadcrumbs">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Manage Apps</span>
                    <span className="separator">›</span>
                    <span>Current App: {currentApp ? currentApp.name : `${username || 'noixplatform'}'s Application`}</span>
                  </div>

                  {userPlan === 'tester' && (
                    <div className="subscription-warning">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>You don't have a subscription!</span>
                      <a href="#" className="upgrade-link" onClick={handleUpgradeNowClick}>Upgrade Now</a>
                    </div>
                  )}

                  <h1 className="page-title">Account Settings</h1>
                  <p className="page-subtitle">
                    Manage your account. Tip: You can press Ctrl + S to save settings!
                  </p>
                </div>

                {/* Account Configuration Fields */}
                <div className="settings-section">
                  <div className="settings-field">
                    <label htmlFor="account-logs">Account Logs:</label>
                    <select 
                      id="account-logs" 
                      className="settings-select"
                      value={accountLogs}
                      onChange={(e) => setAccountLogs(e.target.value)}
                    >
                      <option value="Enabled">Enabled</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="new-location-alerts">New Location Alerts:</label>
                    <select 
                      id="new-location-alerts" 
                      className="settings-select"
                      value={newLocationAlerts}
                      onChange={(e) => setNewLocationAlerts(e.target.value)}
                    >
                      <option value="Enabled">Enabled</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="username">Username:</label>
                    <input 
                      type="text" 
                      id="username" 
                      className="settings-input"
                      value={settingsUsername || username || 'noixplatform'}
                      onChange={(e) => setSettingsUsername(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="ownerid">OwnerID:</label>
                    <input 
                      type="text" 
                      id="ownerid" 
                      className="settings-input"
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="subscription-expires">Subscription Expires:</label>
                    <input 
                      type="text" 
                      id="subscription-expires" 
                      className="settings-input"
                      value={subscriptionExpires}
                      onChange={(e) => setSubscriptionExpires(e.target.value)}
                    />
                  </div>

                </div>

                {/* Security Words Section */}
                <div className="security-words-section">
                  <div className="security-words-info">
                    <h2 className="section-title">Security Words</h2>
                    <p className="section-subtitle">
                      Security Words: 10 random words that you can use to regain access to your account if you forget your order ID, email, password, and have no other way to verify the account belongs to you!
                    </p>
                    <ul className="security-words-list">
                      <li>Can only be generated <strong>1 TIME!</strong> (unless you get a new list from an admin)</li>
                      <li>Should be stored in 2 locations! (USB and PC for example)</li>
                      <li>Should NOT be called something obvious like 'KeyUnitSecurityWords.txt'. Prevent theft! Be smart!</li>
                      <li>Should never be shared!</li>
                      <li>Only admins can give you new words</li>
                      <li>Remember, your words will appear below once generated. Once you refresh the page, the words will disappear.</li>
                    </ul>
                  </div>
                  <div className="security-words-action">
                    <button 
                      className="action-btn primary generate-words-btn"
                      onClick={() => {
                        // Gerar 10 palavras aleatórias para segurança
                        const wordList = [
                          'apple', 'banana', 'cherry', 'dolphin', 'elephant', 'forest', 'guitar', 'hammer', 'island', 'jungle',
                          'kitten', 'laptop', 'mountain', 'nature', 'ocean', 'piano', 'queen', 'river', 'sunset', 'tiger',
                          'umbrella', 'violet', 'water', 'xylophone', 'yellow', 'zebra', 'anchor', 'bridge', 'castle', 'dragon',
                          'eagle', 'flower', 'galaxy', 'horizon', 'iguana', 'jasmine', 'kangaroo', 'lightning', 'magic', 'nebula'
                        ]
                        const selectedWords = []
                        for (let i = 0; i < 10; i++) {
                          const randomIndex = Math.floor(Math.random() * wordList.length)
                          selectedWords.push(wordList[randomIndex])
                          wordList.splice(randomIndex, 1) // Remove para evitar duplicatas
                        }
                        setSecurityWords(selectedWords.join(' '))
                        setShowSecurityWords(true)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Generate Words
                    </button>
                  </div>
                </div>

                {showSecurityWords && securityWords && (
                  <div className="security-words-display">
                    <div className="security-words-box">
                      <p className="security-words-text">{securityWords}</p>
                    </div>
                  </div>
                )}

                {/* Mensagem de Feedback */}
                {feedbackMessage && (
                  <div className={`feedback-message ${feedbackType}`}>
                    {feedbackMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="settings-actions">
                  <button 
                    className="action-btn primary save-btn" 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {isSaving ? 'Salvando...' : 'Save'}
                  </button>

                  {!twoFactorEnabled ? (
                    <button 
                      className="action-btn secondary enable-2fa-btn"
                      onClick={handleEnable2FA}
                      disabled={isLoading2FA}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Enable 2FA
                    </button>
                  ) : (
                    <button 
                      className="action-btn danger disable-2fa-btn"
                      onClick={() => setShowDisable2FAModal(true)}
                      disabled={isLoading2FA}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Disable 2FA
                    </button>
                  )}

                  <button 
                    className="action-btn secondary fido2-btn"
                    onClick={() => setShowFIDO2Modal(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    FIDO2 Webauthn (Security Key)
                  </button>

                  <button 
                    className="action-btn warning change-password-btn"
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Change Password
                  </button>

                  <button 
                    className="action-btn warning change-email-btn"
                    onClick={() => setShowChangeEmailModal(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Change Email
                  </button>

                  <button 
                    className="action-btn warning change-username-btn"
                    onClick={() => setShowChangeUsernameModal(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Change Username
                  </button>

                  <button 
                    className="action-btn danger delete-account-btn"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) {
                        showMessage('Funcionalidade de deletar conta ainda não implementada', 'error')
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Enable 2FA */}
        {showEnable2FAModal && (
          <div className="modal-overlay" onClick={() => {
            setShowEnable2FAModal(false)
            setTwoFactorCode(['', '', '', '', '', ''])
            setEmailCode('')
            setTwoFactorMethod('qr')
            setQrCodeUrl('')
            setManualCode('')
          }}>
            <div className="modal-content modal-2fa" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Enable 2FA (Two Factor Authentication)</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowEnable2FAModal(false)
                    setTwoFactorCode(['', '', '', '', '', ''])
                    setEmailCode('')
                    setTwoFactorMethod('qr')
                    setQrCodeUrl('')
                    setManualCode('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                {isLoading2FA && !qrCodeUrl && twoFactorMethod === 'qr' ? (
                  <div className="modal-loading">
                    <div className="loading-spinner"></div>
                    <p>Gerando QR code...</p>
                  </div>
                ) : (
                  <>
                    {/* Método de seleção */}
                    <div className="twofa-method-selector">
                      <button
                        className={`twofa-method-btn ${twoFactorMethod === 'qr' ? 'active' : ''}`}
                        onClick={() => {
                          setTwoFactorMethod('qr')
                          setEmailCode('')
                        }}
                        disabled={isLoading2FA}
                      >
                        QR Code
                      </button>
                      <button
                        className={`twofa-method-btn ${twoFactorMethod === 'email' ? 'active' : ''}`}
                        onClick={() => {
                          setTwoFactorMethod('email')
                          setTwoFactorCode(['', '', '', '', '', ''])
                        }}
                        disabled={isLoading2FA}
                      >
                        Email (Gmail)
                      </button>
                    </div>

                    {twoFactorMethod === 'qr' ? (
                      <>
                        {qrCodeUrl ? (
                          <>
                            <p className="modal-instruction">Scan this QR code into your Authentication App.</p>
                            
                            {/* QR Code */}
                            <div className="qr-code-container">
                              <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
                              <div className="qr-code-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              </div>
                            </div>

                            {/* Código Manual */}
                            {manualCode && (
                              <>
                                <p className="modal-instruction">Can't scan the QR code? Manually set it instead, code:</p>
                                <div className="manual-code-display">
                                  {manualCode}
                                </div>
                              </>
                            )}

                            {/* Input de código */}
                            <p className="modal-instruction">Enter the 6-digit code from your authentication app:</p>
                            <div className="twofa-code-inputs">
                              {twoFactorCode.map((digit, index) => (
                                <input
                                  key={index}
                                  id={`twofa-code-${index}`}
                                  type="text"
                                  maxLength="1"
                                  className="twofa-code-input"
                                  value={digit}
                                  onChange={(e) => handleTwoFactorCodeChange(index, e.target.value)}
                                  onKeyDown={(e) => handleTwoFactorCodeKeyDown(index, e)}
                                  autoFocus={index === 0}
                                />
                              ))}
                            </div>

                            {/* Botão Enable 2FA */}
                            <button
                              className="action-btn primary enable-2fa-modal-btn"
                              onClick={handleVerify2FA}
                              disabled={isLoading2FA || twoFactorCode.join('').length !== 6}
                            >
                              {isLoading2FA ? 'Ativando...' : 'Enable 2FA'}
                            </button>
                          </>
                        ) : (
                          <p className="modal-instruction">Gerando QR code...</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="modal-instruction">We'll send a verification code to your email address.</p>
                        <button
                          className="action-btn primary send-email-btn"
                          onClick={handleSend2FAEmail}
                          disabled={isLoading2FA}
                        >
                          {isLoading2FA ? 'Enviando...' : 'Send Code via Email'}
                        </button>

                        <p className="modal-instruction">Enter the 6-digit code sent to your email:</p>
                        <input
                          type="text"
                          className="settings-input email-code-input"
                          placeholder="000000"
                          maxLength="6"
                          value={emailCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setEmailCode(value)
                          }}
                        />

                        {/* Botão Enable 2FA */}
                        <button
                          className="action-btn primary enable-2fa-modal-btn"
                          onClick={handleVerify2FA}
                          disabled={isLoading2FA || emailCode.length !== 6}
                        >
                          {isLoading2FA ? 'Ativando...' : 'Enable 2FA'}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Change Password */}
        {showChangePasswordModal && (
          <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Change Password</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="settings-field">
                  <label htmlFor="current-password">Current Password:</label>
                  <input
                    type="password"
                    id="current-password"
                    className="settings-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="new-password">New Password:</label>
                  <input
                    type="password"
                    id="new-password"
                    className="settings-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="confirm-password">Confirm New Password:</label>
                  <input
                    type="password"
                    id="confirm-password"
                    className="settings-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  className="action-btn primary"
                  onClick={handleChangePassword}
                  disabled={isLoading2FA}
                >
                  {isLoading2FA ? 'Alterando...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Change Email */}
        {showChangeEmailModal && (
          <div className="modal-overlay" onClick={() => setShowChangeEmailModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Change Email</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowChangeEmailModal(false)
                    setNewEmail('')
                    setPasswordForChange('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="settings-field">
                  <label htmlFor="new-email">New Email:</label>
                  <input
                    type="email"
                    id="new-email"
                    className="settings-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo-email@example.com"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="password-for-email">Password:</label>
                  <input
                    type="password"
                    id="password-for-email"
                    className="settings-input"
                    value={passwordForChange}
                    onChange={(e) => setPasswordForChange(e.target.value)}
                  />
                </div>

                <button
                  className="action-btn primary"
                  onClick={handleChangeEmail}
                  disabled={isLoading2FA}
                >
                  {isLoading2FA ? 'Alterando...' : 'Change Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Change Username */}
        {showChangeUsernameModal && (
          <div className="modal-overlay" onClick={() => setShowChangeUsernameModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Change Username</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowChangeUsernameModal(false)
                    setNewUsername('')
                    setPasswordForChange('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="settings-field">
                  <label htmlFor="new-username">New Username:</label>
                  <input
                    type="text"
                    id="new-username"
                    className="settings-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="novo-username"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="password-for-username">Password:</label>
                  <input
                    type="password"
                    id="password-for-username"
                    className="settings-input"
                    value={passwordForChange}
                    onChange={(e) => setPasswordForChange(e.target.value)}
                  />
                </div>

                <button
                  className="action-btn primary"
                  onClick={handleChangeUsername}
                  disabled={isLoading2FA}
                >
                  {isLoading2FA ? 'Alterando...' : 'Change Username'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal FIDO2 (Placeholder) */}
        {showFIDO2Modal && (
          <div className="modal-overlay" onClick={() => setShowFIDO2Modal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">FIDO2 Webauthn (Security Key)</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowFIDO2Modal(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-instruction">FIDO2 Webauthn será implementado em breve.</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Create Application */}
        {showCreateAppModal && (
          <div className="modal-overlay" onClick={() => {
            setShowCreateAppModal(false)
            setAppName('')
            setAppVersion('1.0')
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Create Application</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowCreateAppModal(false)
                    setAppName('')
                    setAppVersion('1.0')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="settings-field">
                  <label htmlFor="app-name">Application Name:</label>
                  <input
                    type="text"
                    id="app-name"
                    className="settings-input"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Application"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="app-version">Version:</label>
                  <input
                    type="text"
                    id="app-version"
                    className="settings-input"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    placeholder="1.0"
                  />
                </div>

                <button
                  className="action-btn primary"
                  onClick={createApplication}
                  disabled={isLoadingApps || !appName.trim()}
                >
                  {isLoadingApps ? 'Criando...' : 'Create Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Rename Application */}
        {showRenameAppModal && (
          <div className="modal-overlay" onClick={() => {
            setShowRenameAppModal(false)
            setNewAppName('')
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Rename Application</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowRenameAppModal(false)
                    setNewAppName('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="settings-field">
                  <label htmlFor="new-app-name">New Application Name:</label>
                  <input
                    type="text"
                    id="new-app-name"
                    className="settings-input"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder={currentApp?.name || 'My Application'}
                  />
                </div>

                <button
                  className="action-btn primary"
                  onClick={renameApplication}
                  disabled={isLoadingApps || !newAppName.trim()}
                >
                  {isLoadingApps ? 'Renomeando...' : 'Rename Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Disable 2FA */}
        {showDisable2FAModal && (
          <div className="modal-overlay" onClick={() => {
            setShowDisable2FAModal(false)
            setDisable2FAPassword('')
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Disable 2FA</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowDisable2FAModal(false)
                    setDisable2FAPassword('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-instruction">Para desativar o 2FA, você precisa confirmar sua senha.</p>
                
                <div className="settings-field">
                  <label htmlFor="disable-2fa-password">Password:</label>
                  <input
                    type="password"
                    id="disable-2fa-password"
                    className="settings-input"
                    value={disable2FAPassword}
                    onChange={(e) => setDisable2FAPassword(e.target.value)}
                    placeholder="Digite sua senha"
                  />
                </div>

                <button
                  className="action-btn danger"
                  onClick={handleDisable2FA}
                  disabled={isLoading2FA || !disable2FAPassword}
                >
                  {isLoading2FA ? 'Desativando...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Criar Novo Ticket */}
        {showNewTicketModal && (
          <div className="modal-overlay" onClick={() => setShowNewTicketModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Criar Novo Ticket</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowNewTicketModal(false)
                    setNewTicketSubject('')
                    setNewTicketMessage('')
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="ticket-subject">Assunto:</label>
                  <input
                    type="text"
                    id="ticket-subject"
                    className="form-input"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="Ex: Problema com login"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ticket-message">Mensagem:</label>
                  <textarea
                    id="ticket-message"
                    className="form-input"
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    placeholder="Descreva seu problema ou dúvida..."
                    rows={6}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="modal-btn modal-btn-secondary" 
                  onClick={() => {
                    setShowNewTicketModal(false)
                    setNewTicketSubject('')
                    setNewTicketMessage('')
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-btn modal-btn-primary" 
                  onClick={handleCreateTicket}
                  disabled={isLoadingUserChat || !newTicketSubject.trim() || !newTicketMessage.trim()}
                >
                  {isLoadingUserChat ? 'Criando...' : 'Criar Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Modal de Confirmação Elegante */}
        {showConfirmModal && (
          <div className="confirm-modal-overlay" onClick={() => confirmModalData.onCancel()}>
            <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className={`confirm-modal-icon confirm-modal-icon-${confirmModalData.type}`}>
                {confirmModalData.type === 'danger' && (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
                {confirmModalData.type === 'warning' && (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )}
                {confirmModalData.type === 'info' && (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                )}
              </div>
              <h3 className="confirm-modal-title">{confirmModalData.title}</h3>
              <p className="confirm-modal-message">{confirmModalData.message}</p>
              <div className="confirm-modal-actions">
                <button 
                  className="confirm-modal-btn confirm-modal-btn-cancel"
                  onClick={confirmModalData.onCancel}
                >
                  {confirmModalData.cancelText}
                </button>
                <button 
                  className={`confirm-modal-btn confirm-modal-btn-confirm confirm-modal-btn-${confirmModalData.type}`}
                  onClick={confirmModalData.onConfirm}
                >
                  {confirmModalData.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
