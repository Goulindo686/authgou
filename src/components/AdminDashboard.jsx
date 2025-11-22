import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, adminChatService, chatService, authService } from '../services/api'
import './AdminDashboard.css'

const UserAvatar = ({ username, profilePictureUrl }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = React.useRef(null)
  
  const getInitial = () => {
    if (!username) return 'U'
    return username.charAt(0).toUpperCase()
  }

  const getAvatarColor = (userUsername) => {
    if (!userUsername) return '#ec4899'
    const colors = [
      '#ec4899', '#dc267f', '#3b82f6', '#8b5cf6', '#10b981', 
      '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#6366f1'
    ]
    const index = userUsername.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Verificar se há uma URL válida de imagem
  const hasValidImageUrl = profilePictureUrl && 
    typeof profilePictureUrl === 'string' && 
    profilePictureUrl.trim() !== '' && 
    profilePictureUrl !== 'null' &&
    profilePictureUrl !== 'undefined'

  // Resetar estados quando a URL mudar e verificar se imagem já está carregada
  useEffect(() => {
    if (!hasValidImageUrl) {
      setImageError(false)
      setImageLoaded(false)
      return
    }

    // Verificar se a imagem já está em cache do navegador ANTES de resetar
    const img = new Image()
    
    img.onload = () => {
      setImageLoaded(true)
      setImageError(false)
    }
    img.onerror = () => {
      setImageError(true)
      setImageLoaded(false)
    }
    
    img.src = profilePictureUrl
    
    // Verificar se já está carregada (pode estar em cache)
    // Usar requestAnimationFrame para garantir que o DOM está pronto
    requestAnimationFrame(() => {
      if (img.complete && img.naturalHeight !== 0) {
        setImageLoaded(true)
        setImageError(false)
      } else {
        // Se não está em cache, resetar estados
        setImageError(false)
        setImageLoaded(false)
      }
    })
  }, [profilePictureUrl, hasValidImageUrl])

  const showImage = hasValidImageUrl && !imageError && imageLoaded
  const avatarColor = getAvatarColor(username)
  const initial = getInitial()

  return (
    <div 
      className="admin-table-avatar"
      style={{ 
        background: showImage
          ? 'transparent' 
          : `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`
      }}
    >
      {hasValidImageUrl && (
        <img 
          ref={(el) => {
            imgRef.current = el
            // Verificar se a imagem já está carregada quando o elemento é montado
            if (el) {
              // Verificar imediatamente
              if (el.complete && el.naturalHeight !== 0) {
                setImageLoaded(true)
                setImageError(false)
              } else {
                // Verificar novamente após um pequeno delay (pode estar carregando do cache)
                setTimeout(() => {
                  if (el.complete && el.naturalHeight !== 0) {
                    setImageLoaded(true)
                    setImageError(false)
                  }
                }, 50)
              }
            }
          }}
          src={profilePictureUrl} 
          alt={username || 'User'} 
          onLoad={(e) => {
            // Verificar se a imagem realmente carregou
            if (e.target.complete && e.target.naturalHeight !== 0) {
              setImageLoaded(true)
              setImageError(false)
            }
          }}
          onError={() => {
            setImageError(true)
            setImageLoaded(false)
          }}
          style={{
            display: showImage ? 'block' : 'none'
          }}
        />
      )}
      <span style={{ display: showImage ? 'none' : 'flex' }}>
        {initial}
      </span>
    </div>
  )
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('users')
  const [accountSubTab, setAccountSubTab] = useState('info') // info ou chat
  const [adminData, setAdminData] = useState(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  
  // Estados para chat
  const [userChatTickets, setUserChatTickets] = useState([])
  const [selectedUserTicket, setSelectedUserTicket] = useState(null)
  const [userChatMessages, setUserChatMessages] = useState([])
  const [newUserMessage, setNewUserMessage] = useState('')
  const [newTicketSubject, setNewTicketSubject] = useState('')
  const [newTicketMessage, setNewTicketMessage] = useState('')
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [isLoadingUserChat, setIsLoadingUserChat] = useState(false)
  const [selectedUserImage, setSelectedUserImage] = useState(null)
  const [userImagePreview, setUserImagePreview] = useState(null)
  const userFileInputRef = useRef(null)
  const [selectedChatImage, setSelectedChatImage] = useState(null)
  const [chatImagePreview, setChatImagePreview] = useState(null)
  const chatFileInputRef = useRef(null)
  const [chatTickets, setChatTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatStatusFilter, setChatStatusFilter] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [chatPollingInterval, setChatPollingInterval] = useState(null)
  
  // Estados para vídeos
  const [videos, setVideos] = useState([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('')
  const [videoCategory, setVideoCategory] = useState('tutorial')
  const [videoLanguage, setVideoLanguage] = useState('pt-BR')
  const [videoDuration, setVideoDuration] = useState('')
  const [videoFeatured, setVideoFeatured] = useState(false)
  const [videoPublished, setVideoPublished] = useState(true)
  const [videoOrderIndex, setVideoOrderIndex] = useState(0)
  
  // Estados para pagamentos
  const [payments, setPayments] = useState([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [paymentLimit] = useState(50)
  
  // Estados para modais
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSubscription, setEditSubscription] = useState('default')
  const [editExpires, setEditExpires] = useState('')
  const [editBanned, setEditBanned] = useState(false)
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  
  // Estados para mensagens
  const [message, setMessage] = useState({ type: '', text: '' })

  const isLoadingDataRef = useRef(false)
  const isLoadingUsersRef = useRef(false)
  const isLoadingStatsRef = useRef(false)
  const isLoadingChatTicketsRef = useRef(false)
  const isLoadingChatMessagesRef = useRef(false)
  const isLoadingUserChatRef = useRef(false)
  const userChatPollingIntervalRef = useRef(null)
  const selectedUserTicketIdRef = useRef(null)
  const chatMessagesEndRef = useRef(null)
  const chatMessagesScrollRef = useRef(null)
  const lastSearchRef = useRef('')
  const lastPageRef = useRef(1)
  const lastChatStatusFilterRef = useRef('')
  const lastActiveTabRef = useRef('')
  const hasLoadedChatTicketsRef = useRef(false)

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type })
    setTimeout(() => {
      setMessage({ text: '', type: '' })
    }, 5000)
  }, [])

  // Função auxiliar para obter URL da API detectando protocolo automaticamente
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    const protocol = window.location.protocol
    return `${protocol}//api.gouc.com.br`
  }

  // Carregar dados do admin apenas uma vez quando o componente montar
  // Verificação adicional de segurança: garantir que apenas admins acessem
  useEffect(() => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingDataRef.current) {
      return
    }
    
    const sessionid = localStorage.getItem('admin_sessionid')
    const storedUsername = localStorage.getItem('admin_username')
    
    // Se não tem sessão, redirecionar
    if (!sessionid || !storedUsername) {
      console.warn('⚠️ [AdminDashboard] Sem sessão de admin, redirecionando...')
      navigate('/secure/access', { replace: true })
      setIsLoading(false)
      return
    }

    // Verificação adicional de segurança: verificar se realmente é admin
    const verifyAdminAccess = async () => {
      try {
        // Verificar se há sessão de usuário normal e remover
        const normalSessionid = localStorage.getItem('sessionid')
        if (normalSessionid) {
          // Limpar sessão de usuário normal para evitar conflitos
          localStorage.removeItem('sessionid')
          localStorage.removeItem('username')
        }

        // Verificar se a sessão de admin é válida
        const verifyResponse = await adminService.verify(sessionid)
        
        if (!verifyResponse || !verifyResponse.success || !verifyResponse.is_admin) {
          console.warn('⚠️ [AdminDashboard] Usuário não é administrador, redirecionando...')
          localStorage.removeItem('admin_sessionid')
          localStorage.removeItem('admin_username')
          navigate('/secure/access', { replace: true })
          setIsLoading(false)
          return
        }

        // Tudo OK, carregar dados
        setUsername(storedUsername)
        setIsLoading(false)
        isLoadingDataRef.current = false
      } catch (error) {
        console.error('❌ [AdminDashboard] Erro ao verificar acesso de admin:', error)
        localStorage.removeItem('admin_sessionid')
        localStorage.removeItem('admin_username')
        navigate('/secure/access', { replace: true })
        setIsLoading(false)
      }
    }

    // Definir flag imediatamente
    isLoadingDataRef.current = true
    verifyAdminAccess()
  }, [navigate])

  // Carregar tickets de chat
  const loadChatTickets = useCallback(async (showLoading = true) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingChatTicketsRef.current && !showLoading) {
      return
    }
    
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    isLoadingChatTicketsRef.current = true
    if (showLoading) {
      setIsLoadingChat(true)
    }
    try {
      const response = await adminChatService.getTickets(sessionid, chatStatusFilter || null, null)
      if (response.success) {
        setChatTickets(response.tickets || [])
      }
    } catch (error) {
      // Não mostrar erro durante polling silencioso
      if (showLoading) {
        showMessage(error.message || 'Erro ao carregar tickets', 'error')
      }
    } finally {
      isLoadingChatTicketsRef.current = false
      if (showLoading) {
        setIsLoadingChat(false)
      }
    }
  }, [chatStatusFilter, showMessage])

  // Carregar mensagens de um ticket
  const loadChatMessages = async (ticketId, showLoading = true) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingChatMessagesRef.current && !showLoading) {
      return
    }

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    // Verificar se o usuário está próximo do final do chat (dentro de 100px)
    const scrollContainer = chatMessagesScrollRef.current
    const wasNearBottom = scrollContainer 
      ? scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
      : true // Se não há container ainda, assumir que está no final

    if (showLoading) {
      setIsLoadingChat(true)
    }
    isLoadingChatMessagesRef.current = true

    try {
      const response = await adminChatService.getMessages(sessionid, ticketId)
      if (response.success) {
        setChatMessages(response.messages || [])
        // Scroll para baixo apenas se:
        // 1. É um carregamento inicial (showLoading) OU
        // 2. O usuário estava próximo do final antes da atualização
        if (showLoading || wasNearBottom) {
          setTimeout(() => {
            scrollChatToBottom()
          }, 100)
        }
      }
    } catch (error) {
      // Não mostrar erro durante polling silencioso
      if (showLoading) {
        showMessage(error.message || 'Erro ao carregar mensagens', 'error')
      }
    } finally {
      isLoadingChatMessagesRef.current = false
      if (showLoading) {
        setIsLoadingChat(false)
      }
    }
  }

  // Função para fazer scroll automático para baixo no chat admin
  const scrollChatToBottom = () => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Selecionar ticket
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket)
    // Carregar mensagens com loading visível
    loadChatMessages(ticket.id, true)
    // Iniciar polling para novas mensagens
    if (chatPollingInterval) {
      clearInterval(chatPollingInterval)
    }
    const interval = setInterval(() => {
      if (ticket.id) {
        // Polling silencioso (sem mostrar loading)
        loadChatMessages(ticket.id, false)
        loadChatTickets(false)
      }
    }, 3000) // Polling a cada 3 segundos
    setChatPollingInterval(interval)
  }

  // Enviar mensagem
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedChatImage) || !selectedTicket) return

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingChat(true)
    try {
      await adminChatService.sendMessage(sessionid, selectedTicket.id, newMessage, selectedChatImage)
      setNewMessage('')
      setSelectedChatImage(null)
      setChatImagePreview(null)
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = ''
      }
      await loadChatMessages(selectedTicket.id, true)
      await loadChatTickets()
      // Scroll para baixo após enviar mensagem
      setTimeout(() => {
        scrollChatToBottom()
      }, 100)
    } catch (error) {
      showMessage(error.message || 'Erro ao enviar mensagem', 'error')
    } finally {
      setIsLoadingChat(false)
    }
  }

  // Atualizar status do ticket
  const handleUpdateTicketStatus = async (ticketId, status) => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingChat(true)
    try {
      await adminChatService.updateStatus(sessionid, ticketId, status)
      await loadChatTickets()
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status })
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao atualizar status', 'error')
    } finally {
      setIsLoadingChat(false)
    }
  }

  // Limpar polling ao desmontar ou mudar de aba
  useEffect(() => {
    return () => {
      if (chatPollingInterval) {
        clearInterval(chatPollingInterval)
      }
      if (userChatPollingIntervalRef.current) {
        clearInterval(userChatPollingIntervalRef.current)
        userChatPollingIntervalRef.current = null
      }
    }
  }, [chatPollingInterval])
  
  // Resetar flag quando mudar de aba (para permitir recarregar quando voltar)
  useEffect(() => {
    if (activeTab !== 'chat') {
      hasLoadedChatTicketsRef.current = false
    }
    // Limpar polling do chat do usuário quando sair da aba account/chat
    if (!(activeTab === 'account' && accountSubTab === 'chat')) {
      if (userChatPollingIntervalRef.current) {
        clearInterval(userChatPollingIntervalRef.current)
        userChatPollingIntervalRef.current = null
      }
      selectedUserTicketIdRef.current = null
    }
  }, [activeTab, accountSubTab])

  // Funções para chat do usuário
  const loadUserChatTickets = useCallback(async (showLoading = true) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingUserChatRef.current && !showLoading) {
      return
    }

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

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
      // Não mostrar erro durante polling silencioso
      if (showLoading) {
        showMessage(error.message || 'Erro ao carregar tickets', 'error')
      }
    } finally {
      isLoadingUserChatRef.current = false
      if (showLoading) {
        setIsLoadingUserChat(false)
      }
    }
  }, [showMessage])

  const loadUserChatMessages = useCallback(async (ticketId, showLoading = true) => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingUserChatRef.current && !showLoading) {
      return
    }

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    if (showLoading) {
      setIsLoadingUserChat(true)
    }
    isLoadingUserChatRef.current = true

    try {
      const response = await chatService.getMessages(sessionid, ticketId)
      if (response.success) {
        setUserChatMessages(response.messages || [])
      }
    } catch (error) {
      // Não mostrar erro durante polling silencioso
      if (showLoading) {
        showMessage(error.message || 'Erro ao carregar mensagens', 'error')
      }
    } finally {
      isLoadingUserChatRef.current = false
      if (showLoading) {
        setIsLoadingUserChat(false)
      }
    }
  }, [showMessage])

  const handleSelectUserTicket = (ticket) => {
    setSelectedUserTicket(ticket)
    selectedUserTicketIdRef.current = ticket.id
    
    // Carregar mensagens com loading visível
    loadUserChatMessages(ticket.id, true)
    
    // Limpar polling anterior se existir
    if (userChatPollingIntervalRef.current) {
      clearInterval(userChatPollingIntervalRef.current)
      userChatPollingIntervalRef.current = null
    }
    
    // Iniciar polling silencioso para novas mensagens (sem mostrar loading)
    userChatPollingIntervalRef.current = setInterval(() => {
      if (selectedUserTicketIdRef.current) {
        loadUserChatMessages(selectedUserTicketIdRef.current, false) // Polling silencioso (sem loading)
        loadUserChatTickets(false) // Polling silencioso (sem loading)
      } else {
        // Se não há ticket, parar polling
        if (userChatPollingIntervalRef.current) {
          clearInterval(userChatPollingIntervalRef.current)
          userChatPollingIntervalRef.current = null
        }
      }
    }, 5000) // Aumentar intervalo para 5 segundos para reduzir carga
  }

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      showMessage('Assunto e mensagem são obrigatórios', 'error')
      return
    }

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingUserChat(true)
    try {
      const response = await chatService.createTicket(sessionid, newTicketSubject, newTicketMessage)
      if (response.success) {
        showMessage('Ticket criado com sucesso!', 'success')
        setShowNewTicketModal(false)
        setNewTicketSubject('')
        setNewTicketMessage('')
        await loadUserChatTickets()
        if (response.ticket) {
          handleSelectUserTicket({ id: response.ticket.id, subject: response.ticket.subject, status: response.ticket.status })
        }
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao criar ticket', 'error')
    } finally {
      setIsLoadingUserChat(false)
    }
  }

  const handleUserImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        showMessage('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)', 'error')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showMessage('A imagem deve ter no máximo 5MB', 'error')
        return
      }
      setSelectedUserImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUserImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveUserImage = () => {
    setSelectedUserImage(null)
    setUserImagePreview(null)
    if (userFileInputRef.current) {
      userFileInputRef.current.value = ''
    }
  }

  const handleChatImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        showMessage('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)', 'error')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showMessage('A imagem deve ter no máximo 5MB', 'error')
        return
      }
      setSelectedChatImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setChatImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveChatImage = () => {
    setSelectedChatImage(null)
    setChatImagePreview(null)
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = ''
    }
  }

  const handleSendUserMessage = async () => {
    if ((!newUserMessage.trim() && !selectedUserImage) || !selectedUserTicket) return

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingUserChat(true)
    try {
      await chatService.sendMessage(sessionid, selectedUserTicket.id, newUserMessage, selectedUserImage)
      setNewUserMessage('')
      setSelectedUserImage(null)
      setUserImagePreview(null)
      if (userFileInputRef.current) {
        userFileInputRef.current.value = ''
      }
      await loadUserChatMessages(selectedUserTicket.id, false) // Recarregar sem mostrar loading
      await loadUserChatTickets(false) // Recarregar sem mostrar loading
    } catch (error) {
      showMessage(error.message || 'Erro ao enviar mensagem', 'error')
    } finally {
      setIsLoadingUserChat(false)
    }
  }


  const loadUsers = useCallback(async () => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingUsers(true)
    try {
      const response = await adminService.getUsers(sessionid, search, page, limit)
      if (response.success) {
        setUsers(response.users || [])
        setTotal(response.total || 0)
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao carregar usuários', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [search, page, limit, showMessage])

  const loadStats = useCallback(async () => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return
    
    try {
      const response = await adminService.getStats(sessionid)
      if (response.success) {
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }, [])

  // Carregar vídeos
  const loadVideos = useCallback(async () => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return
    
    setIsLoadingVideos(true)
    try {
      const response = await adminService.getVideos(sessionid)
      if (response.success) {
        setVideos(response.videos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error)
      showMessage('Erro ao carregar vídeos', 'error')
    } finally {
      setIsLoadingVideos(false)
    }
  }, [showMessage])

  // Carregar pagamentos
  const loadPayments = useCallback(async () => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return
    
    setIsLoadingPayments(true)
    try {
      const response = await adminService.getPayments(
        sessionid,
        paymentSearch,
        paymentStatusFilter || '',
        paymentPage,
        paymentLimit
      )
      if (response.success) {
        setPayments(response.payments || [])
        setPaymentTotal(response.total || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
      showMessage('Erro ao carregar pagamentos', 'error')
    } finally {
      setIsLoadingPayments(false)
    }
  }, [paymentSearch, paymentStatusFilter, paymentPage, paymentLimit, showMessage])

  // Effect para carregar pagamentos quando a aba estiver ativa ou filtros mudarem
  useEffect(() => {
    if (activeTab === 'payments') {
      loadPayments()
    }
  }, [activeTab, paymentPage, paymentSearch, paymentStatusFilter, loadPayments])

  // Abrir modal para criar/editar vídeo
  const openVideoModal = (video = null) => {
    if (video) {
      setEditingVideo(video)
      setVideoTitle(video.title || '')
      setVideoDescription(video.description || '')
      setVideoUrl(video.video_url || '')
      setVideoThumbnailUrl(video.thumbnail_url || '')
      setVideoCategory(video.category || 'tutorial')
      setVideoLanguage(video.language || 'pt-BR')
      setVideoDuration(video.duration ? video.duration.toString() : '')
      setVideoFeatured(video.featured || false)
      setVideoPublished(video.published !== false)
      setVideoOrderIndex(video.order_index || 0)
    } else {
      setEditingVideo(null)
      setVideoTitle('')
      setVideoDescription('')
      setVideoUrl('')
      setVideoThumbnailUrl('')
      setVideoCategory('tutorial')
      setVideoLanguage('pt-BR')
      setVideoDuration('')
      setVideoFeatured(false)
      setVideoPublished(true)
      setVideoOrderIndex(0)
    }
    setShowVideoModal(true)
  }

  // Salvar vídeo (criar ou editar)
  const handleSaveVideo = async () => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return
    
    if (!videoTitle || !videoUrl) {
      showMessage('Título e URL do vídeo são obrigatórios', 'error')
      return
    }
    
    setIsLoadingVideos(true)
    try {
      const videoData = {
        title: videoTitle,
        description: videoDescription || null,
        video_url: videoUrl,
        thumbnail_url: videoThumbnailUrl || null,
        category: videoCategory,
        language: videoLanguage,
        duration: videoDuration ? parseInt(videoDuration) : null,
        featured: videoFeatured,
        published: videoPublished,
        order_index: videoOrderIndex || 0
      }
      
      if (editingVideo) {
        await adminService.updateVideo(sessionid, editingVideo.id, videoData)
        showMessage('Vídeo atualizado com sucesso', 'success')
      } else {
        await adminService.createVideo(sessionid, videoData)
        showMessage('Vídeo criado com sucesso', 'success')
      }
      
      setShowVideoModal(false)
      loadVideos()
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error)
      showMessage(error.message || 'Erro ao salvar vídeo', 'error')
    } finally {
      setIsLoadingVideos(false)
    }
  }

  // Deletar vídeo
  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) return
    
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return
    
    setIsLoadingVideos(true)
    try {
      await adminService.deleteVideo(sessionid, videoId)
      showMessage('Vídeo deletado com sucesso', 'success')
      loadVideos()
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error)
      showMessage(error.message || 'Erro ao deletar vídeo', 'error')
    } finally {
      setIsLoadingVideos(false)
    }
  }

  // Carregar dados quando activeTab, accountSubTab, search, page ou chatStatusFilter mudarem
  // Separar do useEffect que carrega username para evitar loops
  useEffect(() => {
    // Não executar se username ainda não foi carregado
    if (!username) return
    
    // Verificar se algo realmente mudou
    const isFirstLoad = lastActiveTabRef.current === ''
    const tabChanged = lastActiveTabRef.current !== activeTab && lastActiveTabRef.current !== ''
    const searchChanged = lastSearchRef.current !== search && lastSearchRef.current !== ''
    const pageChanged = lastPageRef.current !== page && lastPageRef.current !== 1
    const chatFilterChanged = lastChatStatusFilterRef.current !== chatStatusFilter && lastChatStatusFilterRef.current !== ''
    
    // Se nada mudou e não é a primeira carga, não fazer nada
    if (!isFirstLoad && !tabChanged && !searchChanged && !pageChanged && !chatFilterChanged) {
      return
    }
    
    // Atualizar refs
    lastActiveTabRef.current = activeTab
    lastSearchRef.current = search
    lastPageRef.current = page
    lastChatStatusFilterRef.current = chatStatusFilter
    
    if (activeTab === 'users') {
      // Carregar usuários quando search ou page mudar, ou quando mudar para a aba users
      if (isFirstLoad || tabChanged || searchChanged || pageChanged) {
        if (!isLoadingUsersRef.current) {
          isLoadingUsersRef.current = true
          loadUsers().finally(() => {
            isLoadingUsersRef.current = false
          })
        }
      }
      // Carregar stats apenas quando mudar para a aba users (incluindo primeira vez)
      if ((isFirstLoad || tabChanged) && !isLoadingStatsRef.current) {
        isLoadingStatsRef.current = true
        loadStats().finally(() => {
          isLoadingStatsRef.current = false
        })
      }
    } else if (activeTab === 'chat') {
      // Carregar tickets APENAS quando mudar para a aba chat ou quando o filtro mudar
      if (!isLoadingChatTicketsRef.current) {
        // Se mudou de aba para chat, carregar
        if (tabChanged) {
          hasLoadedChatTicketsRef.current = true
          loadChatTickets()
        } 
        // Se o filtro mudou E já está na aba chat, recarregar
        else if (chatFilterChanged && !tabChanged) {
          loadChatTickets()
        }
        // Se é a primeira carga e está na aba chat
        else if (isFirstLoad && !hasLoadedChatTicketsRef.current) {
          hasLoadedChatTicketsRef.current = true
          loadChatTickets()
        }
      }
    } else if (activeTab === 'videos') {
      // Carregar vídeos quando mudar para a aba videos
      if (tabChanged || isFirstLoad) {
        loadVideos()
      }
    } else if (activeTab === 'account' && accountSubTab === 'chat') {
      // Carregar tickets do usuário quando mudar para a aba account/chat
      if (isFirstLoad || tabChanged) {
        loadUserChatTickets()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accountSubTab, search, page, chatStatusFilter])
  
  // Carregar dados iniciais quando username for definido pela primeira vez
  useEffect(() => {
    if (!username) return
    if (lastActiveTabRef.current !== '') return // Já foi carregado
    
    // Carregar dados iniciais apenas uma vez
    if (activeTab === 'users') {
      if (!isLoadingUsersRef.current) {
        isLoadingUsersRef.current = true
        loadUsers().finally(() => {
          isLoadingUsersRef.current = false
        })
      }
      if (!isLoadingStatsRef.current) {
        isLoadingStatsRef.current = true
        loadStats().finally(() => {
          isLoadingStatsRef.current = false
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  // Carregar foto de perfil do admin quando o componente montar
  useEffect(() => {
    const loadAdminProfilePicture = async () => {
      if (!username) return
      const sessionid = localStorage.getItem('admin_sessionid')
      if (sessionid) {
        try {
          const response = await authService.getSettings(sessionid)
          if (response.success && response.settings) {
            if (response.settings.profilePictureUrl) {
              setProfilePictureUrl(response.settings.profilePictureUrl)
              setAvatarError(false)
            }
          }
        } catch (error) {
          console.error('Erro ao carregar foto de perfil do admin:', error)
        }
      }
    }
    loadAdminProfilePicture()
  }, [username])

  // Carregar dados do admin quando abrir a aba Account
  useEffect(() => {
    const loadAdminData = async () => {
      if (activeTab === 'account' && accountSubTab === 'info') {
        const sessionid = localStorage.getItem('admin_sessionid')
        if (sessionid) {
          try {
            const response = await authService.getSettings(sessionid)
            if (response.success && response.settings) {
              setAdminData({
                username: response.settings.username || username,
                email: response.settings.email || '',
                id: response.settings.id || '',
                verified: response.settings.verified || false,
                two_factor_enabled: response.settings.two_factor_enabled || false,
                created_at: response.settings.registeredDate || ''
              })
              if (response.settings.profilePictureUrl) {
                setProfilePictureUrl(response.settings.profilePictureUrl)
                setAvatarError(false)
              }
            }
          } catch (error) {
            console.error('Erro ao carregar dados do admin:', error)
          }
        }
      }
    }
    loadAdminData()
  }, [activeTab, accountSubTab, username])

  const handleLogout = () => {
    localStorage.removeItem('admin_sessionid')
    localStorage.removeItem('admin_username')
    navigate('/secure/access')
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setEditUsername(user.username || '')
    setEditEmail(user.email || '')
    setEditSubscription(user.subscription || 'default')
    setEditExpires(user.expires ? new Date(user.expires).toISOString().slice(0, 16) : '')
    setEditBanned(user.banned || false)
    setEditIsAdmin(user.is_admin || false)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid || !editingUser) return

    setIsLoadingUsers(true)
    try {
      const expires = editExpires ? new Date(editExpires).toISOString() : null
      const response = await adminService.editUser(sessionid, editingUser.id, {
        username: editUsername,
        email: editEmail,
        subscription: editSubscription,
        expires: expires,
        banned: editBanned,
        is_admin: editIsAdmin
      })
      
      if (response.success) {
        showMessage('Usuário atualizado com sucesso!', 'success')
        setShowEditModal(false)
        setEditingUser(null)
        await loadUsers()
        await loadStats()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao atualizar usuário', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
      return
    }

    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingUsers(true)
    try {
      const response = await adminService.deleteUser(sessionid, userId)
      if (response.success) {
        showMessage('Usuário deletado com sucesso!', 'success')
        await loadUsers()
        await loadStats()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao deletar usuário', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleBan = async (userId, banned) => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingUsers(true)
    try {
      const response = await adminService.banUser(sessionid, userId, banned)
      if (response.success) {
        showMessage(banned ? 'Usuário banido com sucesso!' : 'Usuário desbanido com sucesso!', 'success')
        await loadUsers()
        await loadStats()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao banir/desbanir usuário', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleMakeAdmin = async (userId, isAdmin) => {
    const sessionid = localStorage.getItem('admin_sessionid')
    if (!sessionid) return

    setIsLoadingUsers(true)
    try {
      const response = await adminService.makeAdmin(sessionid, userId, isAdmin)
      if (response.success) {
        showMessage(isAdmin ? 'Usuário tornou-se administrador!' : 'Privilégios de admin removidos!', 'success')
        await loadUsers()
        await loadStats()
      }
    } catch (error) {
      showMessage(error.message || 'Erro ao alterar privilégios de admin', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  const getInitial = () => {
    return username ? username.charAt(0).toUpperCase() : 'A'
  }


  if (isLoading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loading-spinner">
          <svg className="admin-spinner-svg" viewBox="0 0 50 50">
            <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
          </svg>
        </div>
      </div>
    )
  }
  
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-user-section">
          <div className="admin-user-avatar">
            {profilePictureUrl && !avatarError ? (
              <img 
                src={profilePictureUrl} 
                alt={username || 'Admin'} 
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>{getInitial()}</span>
            )}
          </div>
          <div className="admin-user-info">
            <div className="admin-user-name">{username || 'Admin'}</div>
            <div className="admin-user-role">Administrador</div>
          </div>
          <button className="admin-logout-button" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-header">
            <h3>Menu</h3>
          </div>
          <div className="admin-nav-items">
            <button 
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Gerenciar Usuários</span>
            </button>
            <button 
              className={`admin-nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Account</span>
            </button>
            <button 
              className={`admin-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Chat Staff</span>
            </button>
            <button 
              className={`admin-nav-item ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('videos')
                loadVideos()
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <span>Gerenciar Vídeos</span>
            </button>
            <button 
              className={`admin-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('payments')
                loadPayments()
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span>Pagamento</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className={`admin-content ${activeTab === 'chat' ? 'admin-content-no-padding' : ''}`}>
          {activeTab === 'users' ? (
            <>
              {/* Header */}
              <div className="admin-content-header">
                <div className="admin-breadcrumbs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Painel de Administração</span>
                  <span className="admin-separator">›</span>
                  <span>Gerenciar Usuários</span>
                </div>

                <h1 className="admin-page-title">Gerenciar Usuários</h1>
                <p className="admin-page-subtitle">
                  Visualize e gerencie todos os usuários do sistema
                </p>
              </div>

          {/* Stats Cards */}
          {stats && (
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.users.total}</div>
                  <div className="admin-stat-label">Total de Usuários</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 127, 0.1)', color: '#dc267f' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.users.admins}</div>
                  <div className="admin-stat-label">Administradores</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.users.banned}</div>
                  <div className="admin-stat-label">Banidos</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.users.verified}</div>
                  <div className="admin-stat-label">Verificados</div>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`admin-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Search and Filters */}
          <div className="admin-filters">
            <div className="admin-search-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Buscar por username ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Avatar</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Subscription</th>
                  <th>Expires</th>
                  <th>Verified</th>
                  <th>2FA</th>
                  <th>Banned</th>
                  <th>Admin</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="admin-loading-spinner-small">
                        <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                          <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <UserAvatar 
                          username={user.username}
                          profilePictureUrl={user.profile_picture_url}
                        />
                      </td>
                      <td>{user.username}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td>
                        <span className="admin-badge admin-badge-subscription">{user.subscription || 'default'}</span>
                      </td>
                      <td>{formatDate(user.expires)}</td>
                      <td>
                        {user.verified ? (
                          <span className="admin-badge admin-badge-success">Sim</span>
                        ) : (
                          <span className="admin-badge admin-badge-danger">Não</span>
                        )}
                      </td>
                      <td>
                        {user.two_factor_enabled ? (
                          <span className="admin-badge admin-badge-success">Ativo</span>
                        ) : (
                          <span className="admin-badge admin-badge-secondary">Inativo</span>
                        )}
                      </td>
                      <td>
                        {user.banned ? (
                          <span className="admin-badge admin-badge-danger">Sim</span>
                        ) : (
                          <span className="admin-badge admin-badge-success">Não</span>
                        )}
                      </td>
                      <td>
                        {user.is_admin ? (
                          <span className="admin-badge admin-badge-admin">Admin</span>
                        ) : (
                          <span className="admin-badge admin-badge-secondary">Usuário</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn admin-action-edit"
                            onClick={() => handleEdit(user)}
                            title="Editar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {user.banned ? (
                            <button
                              className="admin-action-btn admin-action-unban"
                              onClick={() => handleBan(user.id, false)}
                              title="Desbanir"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              className="admin-action-btn admin-action-ban"
                              onClick={() => handleBan(user.id, true)}
                              title="Banir"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            </button>
                          )}
                          {user.is_admin ? (
                            <button
                              className="admin-action-btn admin-action-remove-admin"
                              onClick={() => handleMakeAdmin(user.id, false)}
                              title="Remover Admin"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              className="admin-action-btn admin-action-make-admin"
                              onClick={() => handleMakeAdmin(user.id, true)}
                              title="Tornar Admin"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                              </svg>
                            </button>
                          )}
                          <button
                            className="admin-action-btn admin-action-delete"
                            onClick={() => handleDelete(user.id)}
                            title="Deletar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <span className="admin-pagination-info">
                Página {page} de {Math.ceil(total / limit)} ({total} usuários)
              </span>
              <button
                className="admin-pagination-btn"
                onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                disabled={page >= Math.ceil(total / limit)}
              >
                Próxima
              </button>
            </div>
          )}
            </>
          ) : activeTab === 'account' ? (
            <>
              {/* Header */}
              <div className="admin-content-header">
                <div className="admin-breadcrumbs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Painel de Administração</span>
                  <span className="admin-separator">›</span>
                  <span>Account</span>
                </div>

                <h1 className="admin-page-title">Account</h1>
                <p className="admin-page-subtitle">
                  Gerencie suas informações de conta
                </p>
              </div>

              {/* Account Sub Tabs */}
              <div className="admin-account-tabs">
                <button
                  className={`admin-account-tab ${accountSubTab === 'info' ? 'active' : ''}`}
                  onClick={() => setAccountSubTab('info')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Informações
                </button>
                <button
                  className={`admin-account-tab ${accountSubTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setAccountSubTab('chat')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Chat
                  {userChatTickets.filter(t => t.unread_count > 0).length > 0 && (
                    <span className="admin-account-tab-badge">
                      {userChatTickets.filter(t => t.unread_count > 0).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Account Content */}
              {accountSubTab === 'info' ? (
                <div className="admin-account-container">
                <div className="admin-account-card">
                  <div className="admin-account-header">
                    <div className="admin-account-avatar-large">
                      {profilePictureUrl && !avatarError ? (
                        <img 
                          src={profilePictureUrl} 
                          alt={username || 'Admin'} 
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <span>{getInitial()}</span>
                      )}
                    </div>
                    <div className="admin-account-info">
                      <h2 className="admin-account-name">{username || 'Admin'}</h2>
                      <p className="admin-account-role">Administrador</p>
                    </div>
                  </div>

                  <div className="admin-account-details">
                    <div className="admin-account-section">
                      <h3 className="admin-account-section-title">Informações da Conta</h3>
                      <div className="admin-account-field">
                        <span className="admin-account-label">Username</span>
                        <span className="admin-account-value">{adminData?.username || username || 'N/A'}</span>
                      </div>
                      <div className="admin-account-field">
                        <span className="admin-account-label">Email</span>
                        <span className="admin-account-value">{adminData?.email || 'N/A'}</span>
                      </div>
                      <div className="admin-account-field">
                        <span className="admin-account-label">ID</span>
                        <span className="admin-account-value">{adminData?.id || 'N/A'}</span>
                      </div>
                      <div className="admin-account-field">
                        <span className="admin-account-label">Status</span>
                        <span className="admin-account-value">
                          <span className="admin-badge admin-badge-admin">Administrador</span>
                        </span>
                      </div>
                      <div className="admin-account-field">
                        <span className="admin-account-label">Verificado</span>
                        <span className="admin-account-value">
                          {adminData?.verified ? (
                            <span className="admin-badge admin-badge-success">Sim</span>
                          ) : (
                            <span className="admin-badge admin-badge-danger">Não</span>
                          )}
                        </span>
                      </div>
                      <div className="admin-account-field">
                        <span className="admin-account-label">2FA</span>
                        <span className="admin-account-value">
                          {adminData?.two_factor_enabled ? (
                            <span className="admin-badge admin-badge-success">Ativo</span>
                          ) : (
                            <span className="admin-badge admin-badge-secondary">Inativo</span>
                          )}
                        </span>
                      </div>
                      {adminData?.created_at && (
                        <div className="admin-account-field">
                          <span className="admin-account-label">Data de Criação</span>
                          <span className="admin-account-value">{formatDate(adminData.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              ) : accountSubTab === 'chat' ? (
                <div className="admin-account-container">
                  <div className="admin-user-chat-container">
                    <div className="admin-user-chat-layout">
                      {/* Lista de Tickets */}
                      <div className="admin-user-chat-tickets-list">
                        <div className="admin-user-chat-header">
                          <h3>Meus Tickets</h3>
                          <button
                            className="admin-user-chat-new-btn"
                            onClick={() => setShowNewTicketModal(true)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Novo Ticket
                          </button>
                        </div>

                        <div className="admin-user-chat-tickets-scroll">
                          {isLoadingUserChat ? (
                            <div className="admin-chat-loading">
                              <div className="admin-loading-spinner-small">
                                <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                                  <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                                </svg>
                              </div>
                            </div>
                          ) : userChatTickets.length === 0 ? (
                            <div className="admin-chat-empty">
                              <p>Nenhum ticket encontrado</p>
                              <button
                                className="admin-user-chat-new-btn-small"
                                onClick={() => setShowNewTicketModal(true)}
                              >
                                Criar primeiro ticket
                              </button>
                            </div>
                          ) : (
                            userChatTickets.map(ticket => (
                              <div
                                key={ticket.id}
                                className={`admin-user-chat-ticket-item ${selectedUserTicket?.id === ticket.id ? 'active' : ''} ${ticket.unread_count > 0 ? 'unread' : ''}`}
                                onClick={() => handleSelectUserTicket(ticket)}
                              >
                                <div className="admin-user-chat-ticket-header">
                                  <strong>{ticket.subject}</strong>
                                  {ticket.unread_count > 0 && (
                                    <span className="admin-chat-unread-badge">{ticket.unread_count}</span>
                                  )}
                                </div>
                                <div className="admin-user-chat-ticket-status">
                                  <span className={`admin-chat-status-badge admin-chat-status-${ticket.status}`}>
                                    {ticket.status === 'open' ? 'Aberto' : 
                                     ticket.status === 'in_progress' ? 'Em Andamento' :
                                     ticket.status === 'closed' ? 'Fechado' : ticket.status}
                                  </span>
                                </div>
                                <div className="admin-chat-ticket-time">
                                  {formatDate(ticket.last_message_at)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Área de Chat */}
                      <div className="admin-user-chat-messages-area">
                        {selectedUserTicket ? (
                          <>
                            <div className="admin-user-chat-header">
                              <div className="admin-user-chat-header-info">
                                <h3>{selectedUserTicket.subject}</h3>
                                <p>
                                  Status: <span className={`admin-chat-status-badge admin-chat-status-${selectedUserTicket.status}`}>
                                    {selectedUserTicket.status === 'open' ? 'Aberto' : 
                                     selectedUserTicket.status === 'in_progress' ? 'Em Andamento' :
                                     selectedUserTicket.status === 'closed' ? 'Fechado' : selectedUserTicket.status}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="admin-user-chat-messages-scroll">
                              {isLoadingUserChat ? (
                                <div className="admin-chat-loading">
                                  <div className="admin-loading-spinner-small">
                                    <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                                      <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                userChatMessages.map(msg => (
                                  <div
                                    key={msg.id}
                                    className={`admin-chat-message ${msg.is_staff ? 'staff' : 'user'}`}
                                  >
                                    <div className="admin-chat-message-avatar">
                                      {msg.profile_picture_url ? (
                                        <img src={msg.profile_picture_url} alt={msg.username} />
                                      ) : (
                                        <span>{msg.username?.charAt(0).toUpperCase() || 'U'}</span>
                                      )}
                                    </div>
                                    <div className="admin-chat-message-content">
                                      <div className="admin-chat-message-header">
                                        <span className="admin-chat-message-author">{msg.username}</span>
                                        {msg.is_staff && <span className="admin-chat-staff-badge">Staff</span>}
                                        <span className="admin-chat-message-time">
                                          {formatDate(msg.created_at)}
                                        </span>
                                      </div>
                                      {msg.image_url && (
                                        <div className="admin-chat-message-image">
                                          <img 
                                            src={`${getApiBaseUrl()}${msg.image_url}`} 
                                            alt="Imagem enviada" 
                                            onClick={() => window.open(`${getApiBaseUrl()}${msg.image_url}`, '_blank')}
                                            style={{ cursor: 'pointer', maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
                                          />
                                        </div>
                                      )}
                                      {msg.message && <div className="admin-chat-message-text">{msg.message}</div>}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="admin-chat-input-area">
                              {userImagePreview && (
                                <div className="admin-chat-image-preview">
                                  <img src={userImagePreview} alt="Preview" />
                                  <button 
                                    className="admin-chat-remove-image" 
                                    onClick={handleRemoveUserImage}
                                    type="button"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                              <div className="admin-chat-input-wrapper">
                                <input
                                  type="file"
                                  ref={userFileInputRef}
                                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                  onChange={handleUserImageSelect}
                                  style={{ display: 'none' }}
                                />
                                <button
                                  className="admin-chat-image-btn"
                                  onClick={() => userFileInputRef.current?.click()}
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
                                  className="admin-chat-input"
                                  placeholder="Digite sua mensagem..."
                                  value={newUserMessage}
                                  onChange={(e) => setNewUserMessage(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSendUserMessage()
                                    }
                                  }}
                                  rows={3}
                                  disabled={selectedUserTicket.status === 'closed'}
                                />
                                <button
                                  className="admin-chat-send-btn"
                                  onClick={handleSendUserMessage}
                                  disabled={(!newUserMessage.trim() && !selectedUserImage) || isLoadingUserChat || selectedUserTicket.status === 'closed'}
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
                          <div className="admin-chat-empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <p>Selecione um ticket ou crie um novo para começar</p>
                            <button
                              className="admin-user-chat-new-btn-small"
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
                </div>
              ) : null}
            </>
          ) : activeTab === 'chat' ? (
            <>
              {/* Header */}
              <div className="admin-content-header">
                <div className="admin-breadcrumbs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Painel de Administração</span>
                  <span className="admin-separator">›</span>
                  <span>Chat Staff</span>
                </div>

                <h1 className="admin-page-title">Chat Staff</h1>
                <p className="admin-page-subtitle">
                  Gerencie todos os tickets de suporte do sistema
                </p>
              </div>

              {/* Chat Staff Content */}
              <div className="admin-chat-container">
                <div className="admin-chat-layout">
                  {/* Lista de Tickets */}
                  <div className="admin-chat-tickets-list">
                    <div className="admin-chat-filters">
                      <button
                        className={`admin-chat-filter-btn ${chatStatusFilter === '' ? 'active' : ''}`}
                        onClick={() => setChatStatusFilter('')}
                      >
                        Todos
                      </button>
                      <button
                        className={`admin-chat-filter-btn ${chatStatusFilter === 'open' ? 'active' : ''}`}
                        onClick={() => setChatStatusFilter('open')}
                      >
                        Abertos
                      </button>
                      <button
                        className={`admin-chat-filter-btn ${chatStatusFilter === 'in_progress' ? 'active' : ''}`}
                        onClick={() => setChatStatusFilter('in_progress')}
                      >
                        Em Andamento
                      </button>
                      <button
                        className={`admin-chat-filter-btn ${chatStatusFilter === 'closed' ? 'active' : ''}`}
                        onClick={() => setChatStatusFilter('closed')}
                      >
                        Fechados
                      </button>
                    </div>

                    <div className="admin-chat-tickets-scroll">
                      {isLoadingChat ? (
                        <div className="admin-chat-loading">
                          <div className="admin-loading-spinner-small">
                            <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                              <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                            </svg>
                          </div>
                        </div>
                      ) : chatTickets.length === 0 ? (
                        <div className="admin-chat-empty">
                          <p>Nenhum ticket encontrado</p>
                        </div>
                      ) : (
                        chatTickets.map(ticket => (
                          <div
                            key={ticket.id}
                            className={`admin-chat-ticket-item ${selectedTicket?.id === ticket.id ? 'active' : ''} ${ticket.unread_count > 0 ? 'unread' : ''}`}
                            onClick={() => handleSelectTicket(ticket)}
                          >
                            <div className="admin-chat-ticket-header">
                              <div className="admin-chat-ticket-user">
                                <strong>{ticket.username}</strong>
                                {ticket.unread_count > 0 && (
                                  <span className="admin-chat-unread-badge">{ticket.unread_count}</span>
                                )}
                              </div>
                              <span className={`admin-chat-status-badge admin-chat-status-${ticket.status}`}>
                                {ticket.status === 'open' ? 'Aberto' : 
                                 ticket.status === 'in_progress' ? 'Em Andamento' :
                                 ticket.status === 'closed' ? 'Fechado' : ticket.status}
                              </span>
                            </div>
                            <div className="admin-chat-ticket-subject">{ticket.subject}</div>
                            <div className="admin-chat-ticket-time">
                              {formatDate(ticket.last_message_at)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Área de Chat */}
                  <div className="admin-chat-messages-area">
                    {selectedTicket ? (
                      <>
                        <div className="admin-chat-header">
                          <div className="admin-chat-header-info">
                            <h3>{selectedTicket.subject}</h3>
                            <p>{selectedTicket.username} • {selectedTicket.email}</p>
                          </div>
                          <div className="admin-chat-header-actions">
                            <select
                              value={selectedTicket.status}
                              onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                              className="admin-chat-status-select"
                            >
                              <option value="open">Aberto</option>
                              <option value="in_progress">Em Andamento</option>
                              <option value="waiting">Aguardando</option>
                              <option value="closed">Fechado</option>
                            </select>
                          </div>
                        </div>

                        <div 
                          className="admin-chat-messages-scroll" 
                          id="chat-messages-scroll"
                          ref={chatMessagesScrollRef}
                        >
                          {isLoadingChat ? (
                            <div className="admin-chat-loading">
                              <div className="admin-loading-spinner-small">
                                <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                                  <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <>
                              {chatMessages.map(msg => (
                              <div
                                key={msg.id}
                                className={`admin-chat-message ${msg.is_staff ? 'staff' : 'user'}`}
                              >
                                <div className="admin-chat-message-avatar">
                                  {msg.profile_picture_url ? (
                                    <img src={msg.profile_picture_url} alt={msg.username} />
                                  ) : (
                                    <span>{msg.username?.charAt(0).toUpperCase() || 'U'}</span>
                                  )}
                                </div>
                                <div className="admin-chat-message-content">
                                  <div className="admin-chat-message-header">
                                    <span className="admin-chat-message-author">{msg.username}</span>
                                    {msg.is_staff && <span className="admin-chat-staff-badge">Staff</span>}
                                    <span className="admin-chat-message-time">
                                      {formatDate(msg.created_at)}
                                    </span>
                                  </div>
                                  {msg.image_url && (
                                    <div className="admin-chat-message-image">
                                      <img 
                                        src={`${getApiBaseUrl()}${msg.image_url}`} 
                                        alt="Imagem enviada" 
                                        onClick={() => window.open(`${getApiBaseUrl()}${msg.image_url}`, '_blank')}
                                        style={{ cursor: 'pointer', maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
                                      />
                                    </div>
                                  )}
                                  {msg.message && <div className="admin-chat-message-text">{msg.message}</div>}
                                </div>
                              </div>
                            ))}
                              <div ref={chatMessagesEndRef} />
                            </>
                          )}
                        </div>

                        <div className="admin-chat-input-area">
                          {chatImagePreview && (
                            <div className="admin-chat-image-preview">
                              <img src={chatImagePreview} alt="Preview" />
                              <button 
                                className="admin-chat-remove-image" 
                                onClick={handleRemoveChatImage}
                                type="button"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="admin-chat-input-wrapper">
                            <input
                              type="file"
                              ref={chatFileInputRef}
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleChatImageSelect}
                              style={{ display: 'none' }}
                            />
                            <button
                              className="admin-chat-image-btn"
                              onClick={() => chatFileInputRef.current?.click()}
                              type="button"
                              title="Enviar imagem"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </button>
                            <textarea
                              className="admin-chat-input"
                              placeholder="Digite sua mensagem..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendMessage()
                                }
                              }}
                            />
                            <button
                              className="admin-chat-send-btn"
                              onClick={handleSendMessage}
                              disabled={(!newMessage.trim() && !selectedChatImage) || isLoadingChat}
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
                      <div className="admin-chat-empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>Selecione um ticket para visualizar as mensagens</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'videos' ? (
            <>
              {/* Header */}
              <div className="admin-content-header">
                <div className="admin-breadcrumbs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Painel de Administração</span>
                  <span className="admin-separator">›</span>
                  <span>Gerenciar Vídeos</span>
                </div>

                <h1 className="admin-page-title">Gerenciar Vídeos</h1>
                <p className="admin-page-subtitle">
                  Crie e gerencie tutoriais em vídeo para ajudar os usuários a integrar a API
                </p>
              </div>

              {/* Actions */}
              <div className="admin-actions-bar">
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => openVideoModal()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Criar Novo Vídeo
                </button>
              </div>

              {/* Videos List */}
              <div className="admin-videos-container">
                {isLoadingVideos ? (
                  <div className="admin-loading">
                    <div className="admin-loading-spinner">
                      <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                        <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                      </svg>
                    </div>
                    <p>Carregando vídeos...</p>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="admin-empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <h3>Nenhum vídeo cadastrado</h3>
                    <p>Crie seu primeiro vídeo tutorial para começar</p>
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={() => openVideoModal()}
                    >
                      Criar Primeiro Vídeo
                    </button>
                  </div>
                ) : (
                  <div className="admin-videos-grid">
                    {videos.map(video => (
                      <div key={video.id} className="admin-video-card">
                        {video.thumbnail_url ? (
                          <div className="admin-video-thumbnail">
                            <img src={video.thumbnail_url} alt={video.title} />
                            {video.featured && (
                              <div className="admin-video-featured-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                Destaque
                              </div>
                            )}
                            {!video.published && (
                              <div className="admin-video-unpublished-badge">Rascunho</div>
                            )}
                          </div>
                        ) : (
                          <div className="admin-video-thumbnail default">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="23 7 16 12 23 17 23 7"/>
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                            </svg>
                            {video.featured && (
                              <div className="admin-video-featured-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                Destaque
                              </div>
                            )}
                            {!video.published && (
                              <div className="admin-video-unpublished-badge">Rascunho</div>
                            )}
                          </div>
                        )}
                        <div className="admin-video-info">
                          <h3 className="admin-video-title">{video.title}</h3>
                          {video.description && (
                            <p className="admin-video-description">{video.description}</p>
                          )}
                          <div className="admin-video-meta">
                            <span className="admin-video-category">{video.category}</span>
                            <span className="admin-video-views">{video.views || 0} visualizações</span>
                          </div>
                          <div className="admin-video-actions">
                            <button
                              className="admin-btn admin-btn-small admin-btn-secondary"
                              onClick={() => openVideoModal(video)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              className="admin-btn admin-btn-small admin-btn-danger"
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={isLoadingVideos}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'payments' ? (
            <>
              {/* Header */}
              <div className="admin-content-header">
                <div className="admin-breadcrumbs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Painel de Administração</span>
                  <span className="admin-separator">›</span>
                  <span>Pagamento</span>
                </div>

                <h1 className="admin-page-title">Logs de Pagamentos</h1>
                <p className="admin-page-subtitle">
                  Visualize todos os logs de pagamentos realizados no sistema
                </p>
              </div>

              {/* Filters */}
              <div className="admin-filters-bar">
                <div className="admin-search-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Buscar por usuário, email, ID de pagamento..."
                    value={paymentSearch}
                    onChange={(e) => {
                      setPaymentSearch(e.target.value)
                      setPaymentPage(1)
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        loadPayments()
                      }
                    }}
                  />
                </div>
                <select
                  className="admin-filter-select"
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value)
                    setPaymentPage(1)
                  }}
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={loadPayments}
                  disabled={isLoadingPayments}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Atualizar
                </button>
              </div>

              {/* Payments Table */}
              <div className="admin-table-container">
                {isLoadingPayments ? (
                  <div className="admin-loading">
                    <div className="admin-loading-spinner">
                      <svg className="admin-spinner-svg" viewBox="0 0 50 50">
                        <circle className="admin-spinner-circle" cx="25" cy="25" r="20" />
                      </svg>
                    </div>
                    <p>Carregando pagamentos...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="admin-empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <h3>Nenhum pagamento encontrado</h3>
                    <p>{paymentSearch || paymentStatusFilter ? 'Tente ajustar os filtros de busca' : 'Ainda não há pagamentos registrados no sistema'}</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Plano</th>
                            <th>Período</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Payment ID</th>
                            <th>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.id}</td>
                              <td>{payment.username || 'N/A'}</td>
                              <td>{payment.email || 'N/A'}</td>
                              <td>
                                <span className="admin-badge admin-badge-info">
                                  {payment.plan === 'developer' ? 'Developer' : payment.plan === 'seller' ? 'Seller' : payment.plan}
                                </span>
                              </td>
                              <td>
                                <span className="admin-badge admin-badge-secondary">
                                  {payment.period === 'monthly' ? 'Mensal' : payment.period === 'annual' ? 'Anual' : payment.period}
                                </span>
                              </td>
                              <td>R$ {parseFloat(payment.amount).toFixed(2)}</td>
                              <td>
                                <span className={`admin-badge ${
                                  payment.status === 'approved' ? 'admin-badge-success' :
                                  payment.status === 'pending' ? 'admin-badge-warning' :
                                  payment.status === 'rejected' ? 'admin-badge-danger' :
                                  payment.status === 'cancelled' ? 'admin-badge-secondary' :
                                  payment.status === 'refunded' ? 'admin-badge-info' : ''
                                }`}>
                                  {payment.status === 'approved' ? 'Aprovado' :
                                   payment.status === 'pending' ? 'Pendente' :
                                   payment.status === 'rejected' ? 'Rejeitado' :
                                   payment.status === 'cancelled' ? 'Cancelado' :
                                   payment.status === 'refunded' ? 'Reembolsado' : payment.status}
                                </span>
                              </td>
                              <td>
                                <span className="admin-code-text" title={payment.payment_id || 'N/A'}>
                                  {payment.payment_id ? `${payment.payment_id.substring(0, 15)}...` : 'N/A'}
                                </span>
                              </td>
                              <td>
                                {payment.created_at ? new Date(payment.created_at).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {paymentTotal > paymentLimit && (
                      <div className="admin-pagination">
                        <button
                          className="admin-pagination-btn"
                          onClick={() => {
                            if (paymentPage > 1) {
                              setPaymentPage(paymentPage - 1)
                            }
                          }}
                          disabled={paymentPage === 1 || isLoadingPayments}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                          Anterior
                        </button>
                        <span className="admin-pagination-info">
                          Página {paymentPage} de {Math.ceil(paymentTotal / paymentLimit)} ({paymentTotal} total)
                        </span>
                        <button
                          className="admin-pagination-btn"
                          onClick={() => {
                            if (paymentPage < Math.ceil(paymentTotal / paymentLimit)) {
                              setPaymentPage(paymentPage + 1)
                            }
                          }}
                          disabled={paymentPage >= Math.ceil(paymentTotal / paymentLimit) || isLoadingPayments}
                        >
                          Próxima
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-content admin-modal-edit-user" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Editar Usuário</h2>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label htmlFor="edit-username">Username:</label>
                <input
                  type="text"
                  id="edit-username"
                  className="admin-form-input"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Digite o username"
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="edit-email">Email:</label>
                <input
                  type="email"
                  id="edit-email"
                  className="admin-form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Digite o email"
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="edit-subscription">Subscription:</label>
                <div className="admin-select-wrapper">
                  <select
                    id="edit-subscription"
                    className="admin-form-input admin-form-select"
                    value={editSubscription}
                    onChange={(e) => setEditSubscription(e.target.value)}
                  >
                    <option value="default">default</option>
                    <option value="standard">standard</option>
                    <option value="premium">premium</option>
                    <option value="ultimate">ultimate</option>
                  </select>
                  <svg className="admin-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <div className="admin-form-group">
                <label htmlFor="edit-expires">Expires:</label>
                <div className="admin-datetime-wrapper">
                  <input
                    type="datetime-local"
                    id="edit-expires"
                    className="admin-form-input admin-form-datetime"
                    value={editExpires}
                    onChange={(e) => setEditExpires(e.target.value)}
                  />
                  <svg className="admin-datetime-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
              <div className="admin-form-group admin-checkbox-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editBanned}
                    onChange={(e) => setEditBanned(e.target.checked)}
                  />
                  <span>Banido</span>
                </label>
              </div>
              <div className="admin-form-group admin-checkbox-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                  />
                  <span>Administrador</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-modal-btn admin-modal-btn-secondary"
                onClick={() => setShowEditModal(false)}
                disabled={isLoadingUsers}
              >
                Cancelar
              </button>
              <button
                className="admin-modal-btn admin-modal-btn-primary"
                onClick={handleSaveEdit}
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Vídeo */}
      {showVideoModal && (
        <div className="admin-modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="admin-modal-content admin-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingVideo ? 'Editar Vídeo' : 'Criar Novo Vídeo'}
              </h2>
              <button className="admin-modal-close" onClick={() => setShowVideoModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label htmlFor="video-title">Título *</label>
                <input
                  type="text"
                  id="video-title"
                  className="admin-form-input"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ex: Como integrar a API KeyUnit em C#"
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="video-description">Descrição</label>
                <textarea
                  id="video-description"
                  className="admin-form-input"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Descrição do vídeo..."
                  rows={4}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="video-url">URL do Vídeo *</label>
                <input
                  type="url"
                  id="video-url"
                  className="admin-form-input"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <small className="admin-form-help">Suporta YouTube, Vimeo e outros serviços de vídeo</small>
              </div>
              <div className="admin-form-group">
                <label htmlFor="video-thumbnail">URL da Thumbnail</label>
                <input
                  type="url"
                  id="video-thumbnail"
                  className="admin-form-input"
                  value={videoThumbnailUrl}
                  onChange={(e) => setVideoThumbnailUrl(e.target.value)}
                  placeholder="https://exemplo.com/thumbnail.jpg"
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="video-category">Categoria</label>
                  <select
                    id="video-category"
                    className="admin-form-input"
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="api">API Integration</option>
                    <option value="integration">Integração</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="video-language">Idioma</label>
                  <select
                    id="video-language"
                    className="admin-form-input"
                    value={videoLanguage}
                    onChange={(e) => setVideoLanguage(e.target.value)}
                  >
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="video-duration">Duração (segundos)</label>
                  <input
                    type="number"
                    id="video-duration"
                    className="admin-form-input"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="300"
                    min="0"
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="video-order">Ordem de Exibição</label>
                  <input
                    type="number"
                    id="video-order"
                    className="admin-form-input"
                    value={videoOrderIndex}
                    onChange={(e) => setVideoOrderIndex(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={videoFeatured}
                    onChange={(e) => setVideoFeatured(e.target.checked)}
                  />
                  <span>Vídeo em Destaque</span>
                </label>
              </div>
              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={videoPublished}
                    onChange={(e) => setVideoPublished(e.target.checked)}
                  />
                  <span>Publicado (visível para usuários)</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-modal-btn admin-modal-btn-secondary"
                onClick={() => setShowVideoModal(false)}
                disabled={isLoadingVideos}
              >
                Cancelar
              </button>
              <button
                className="admin-modal-btn admin-modal-btn-primary"
                onClick={handleSaveVideo}
                disabled={isLoadingVideos || !videoTitle.trim() || !videoUrl.trim()}
              >
                {isLoadingVideos ? 'Salvando...' : editingVideo ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Novo Ticket */}
      {showNewTicketModal && (
        <div className="admin-modal-overlay" onClick={() => setShowNewTicketModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Criar Novo Ticket</h2>
              <button className="admin-modal-close" onClick={() => setShowNewTicketModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label htmlFor="ticket-subject">Assunto:</label>
                <input
                  type="text"
                  id="ticket-subject"
                  className="admin-form-input"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Ex: Problema com login"
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="ticket-message">Mensagem:</label>
                <textarea
                  id="ticket-message"
                  className="admin-form-input"
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Descreva seu problema ou dúvida..."
                  rows={6}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-modal-btn admin-modal-btn-secondary"
                onClick={() => {
                  setShowNewTicketModal(false)
                  setNewTicketSubject('')
                  setNewTicketMessage('')
                }}
                disabled={isLoadingUserChat}
              >
                Cancelar
              </button>
              <button
                className="admin-modal-btn admin-modal-btn-primary"
                onClick={handleCreateTicket}
                disabled={isLoadingUserChat || !newTicketSubject.trim() || !newTicketMessage.trim()}
              >
                {isLoadingUserChat ? 'Criando...' : 'Criar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

