import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paymentService, authService } from '../services/api'
import './PaymentPage.css'

const PaymentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const plan = searchParams.get('plan')
  const period = searchParams.get('period')
  
  const [selectedPlan, setSelectedPlan] = useState(plan || null)
  const [selectedPeriod, setSelectedPeriod] = useState(period || null)
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [pixQrCode, setPixQrCode] = useState(null)
  const [pixCode, setPixCode] = useState('')
  const [externalReference, setExternalReference] = useState(null)
  const [copiedPix, setCopiedPix] = useState(false)
  const [userPlan, setUserPlan] = useState('tester')
  
  const paymentStatusCheckIntervalRef = useRef(null)

  // Funções auxiliares
  const getPlanDisplayName = (plan) => {
    const planNames = {
      tester: 'PLANO TESTE',
      weekly: 'PLANO SEMANAL',
      monthly: 'PLANO MENSAL',
      quarterly: 'PLANO TRIMESTRAL',
      annual: 'PLANO ANUAL',
      lifetime: 'PLANO LIFETIME',
      test_5m: 'PLANO 5 MIN'
    }
    return planNames[plan] || plan?.toUpperCase() || 'PLANO'
  }

  const getPeriodDisplayName = (period) => {
    const periodNames = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      lifetime: 'Vitalício',
      minutes5: '5 Minutos'
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
      lifetime: { lifetime: 399.00 },
      test_5m: { minutes5: 2.00 }
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

  // Verificar status do pagamento periodicamente
  const startPaymentStatusCheck = (externalRef, paymentId = null) => {
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
            
            // Recarregar configurações para atualizar o plano
            try {
              const settingsResponse = await authService.getSettings(sessionid)
              if (settingsResponse.success && settingsResponse.settings) {
                setUserPlan(settingsResponse.settings.plan || 'tester')
              }
            } catch (error) {
              console.error('Erro ao recarregar configurações:', error)
            }
            
            setTimeout(() => {
              stopPaymentStatusCheck()
              navigate('/')
            }, 2000)
          } else if (response.status === 'rejected' || response.status === 'cancelled') {
            clearInterval(checkInterval)
            paymentStatusCheckIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }, 3000)

    paymentStatusCheckIntervalRef.current = checkInterval

    setTimeout(() => {
      if (paymentStatusCheckIntervalRef.current === checkInterval) {
        clearInterval(checkInterval)
        paymentStatusCheckIntervalRef.current = null
      }
    }, 600000)
  }

  const stopPaymentStatusCheck = () => {
    if (paymentStatusCheckIntervalRef.current) {
      clearInterval(paymentStatusCheckIntervalRef.current)
      paymentStatusCheckIntervalRef.current = null
    }
  }

  // Criar pagamento PIX
  const createPaymentPreference = async () => {
    if (!selectedPlan) return
    
    setIsLoadingPayment(true)
    const sessionid = localStorage.getItem('sessionid')
    
    try {
      const finalPeriod = selectedPeriod || 'monthly'
      const response = await paymentService.createPix(sessionid, selectedPlan, finalPeriod)
      
      if (response.success) {
        setExternalReference(response.external_reference)
        setPixQrCode(response.qr_code_base64)
        setPixCode(response.qr_code)
        startPaymentStatusCheck(response.external_reference, response.payment_id)
      } else {
        console.error('Erro ao criar pagamento:', response.message)
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
    } finally {
      setIsLoadingPayment(false)
    }
  }

  // Copiar código PIX
  const handleCopyPix = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2000)
    }
  }

  // Carregar pagamento ao montar o componente
  useEffect(() => {
    if (selectedPlan && !pixQrCode && !isLoadingPayment) {
      createPaymentPreference()
    }
    
    return () => {
      stopPaymentStatusCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan])

  // Verificar autenticação
  useEffect(() => {
    const sessionid = localStorage.getItem('sessionid')
    if (!sessionid) {
      navigate('/')
      return
    }
    
    if (!selectedPlan) {
      navigate('/')
      return
    }
  }, [navigate, selectedPlan])

  return (
    <div className="payment-page">
      <div className="payment-page-container">
        <div className="payment-page-header">
          <div className="payment-header-top">
            <button 
              className="payment-back-btn"
              onClick={() => navigate('/')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Voltar
            </button>
          </div>
          <div className="payment-header-content">
            <div className="payment-header-left">
              <h1 className="payment-page-title">Finalizar Pagamento</h1>
            </div>
            <div className="payment-header-right">
              <span className="payment-plan-badge">
                {getPlanDisplayName(selectedPlan)}
              </span>
              <span className="payment-plan-period">
                {selectedPeriod ? getPeriodDisplayName(selectedPeriod) : 'Mensal'}
              </span>
            </div>
          </div>
        </div>

        <div className="payment-page-content">
          {isLoadingPayment ? (
            <div className="payment-loading">
              <div className="spinner"></div>
              <p>Preparando pagamento...</p>
            </div>
          ) : paymentStatus === 'approved' ? (
            <div className="payment-success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <h3>Pagamento Aprovado!</h3>
              <p>Seu plano foi atualizado com sucesso.</p>
            </div>
          ) : (
            <>
              {/* Resumo do Pedido */}
              <div className="payment-summary">
                <div className="payment-summary-content">
                  <div className="payment-summary-item">
                    <div className="payment-summary-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 7h-4M4 7h4m0 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 0v10m6-10v10m-6 0h6" />
                      </svg>
                    </div>
                    <div className="payment-summary-details">
                      <span className="payment-summary-label">Plano Selecionado</span>
                      <span className="payment-summary-value">
                        {getPlanDisplayName(selectedPlan)} - {selectedPeriod ? getPeriodDisplayName(selectedPeriod) : 'Mensal'}
                      </span>
                    </div>
                  </div>
                  <div className="payment-summary-divider"></div>
                  <div className="payment-summary-item">
                    <div className="payment-summary-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="payment-summary-details">
                      <span className="payment-summary-label">Valor Total</span>
                      <span className="payment-summary-value payment-amount">
                        R$ {selectedPlan && selectedPeriod 
                          ? getPlanPrice(selectedPlan, selectedPeriod)
                          : '0,00'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteúdo PIX */}
              <div className="payment-pix-content">
                {pixQrCode && pixCode ? (
                  <>
                    <div className="pix-instructions">
                      <h3 className="pix-instructions-title">Como pagar com PIX</h3>
                      <div className="pix-instructions-list">
                        <div className="pix-instruction-item">
                          <div className="pix-instruction-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="2" y="2" width="20" height="20" rx="2.5" />
                              <path d="M7 12h10M12 7v10" />
                            </svg>
                          </div>
                          <span>Escaneie o QR Code com o app do seu banco</span>
                        </div>
                        <div className="pix-instruction-item">
                          <div className="pix-instruction-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </div>
                          <span>Ou copie e cole o código PIX</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pix-payment-container">
                      <div className="pix-qr-code-container">
                        <div className="pix-qr-code-wrapper">
                          <div className="pix-qr-code">
                            <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" />
                          </div>
                          <div className="pix-qr-overlay">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="2" width="20" height="20" rx="2" />
                              <path d="M7 12h10M12 7v10" />
                            </svg>
                          </div>
                        </div>
                        <p className="pix-qr-hint">Escaneie com seu app bancário</p>
                      </div>
                      
                      <div className="pix-code-section">
                        <div className="pix-code-header">
                          <div className="pix-code-header-content">
                            <label>Código PIX (Copiar e Colar)</label>
                            <span className="pix-code-hint">Cole no app do seu banco</span>
                          </div>
                        </div>
                        <div className="pix-code-input-group">
                          <input
                            type="text"
                            value={pixCode}
                            readOnly
                            className="pix-code-input"
                          />
                          <button
                            className={`pix-copy-btn ${copiedPix ? 'copied' : ''}`}
                            onClick={handleCopyPix}
                          >
                            {copiedPix ? (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <rect x="9" y="9" width="13" height="13" rx="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="payment-additional-info">
                      <div className="payment-info-grid">
                        <div className="payment-info-item">
                          <div className="payment-info-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </div>
                          <div className="payment-info-content">
                            <span className="payment-info-label">TEMPO DE EXPIRAÇÃO</span>
                            <span className="payment-info-value">30 minutos</span>
                          </div>
                        </div>
                        <div className="payment-info-item">
                          <div className="payment-info-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                          </div>
                          <div className="payment-info-content">
                            <span className="payment-info-label">SEGURANÇA</span>
                            <span className="payment-info-value">Pagamento 100% seguro e criptografado</span>
                          </div>
                        </div>
                        <div className="payment-info-item payment-info-item-full">
                          <div className="payment-info-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                          <div className="payment-info-content">
                            <span className="payment-info-label">BENEFÍCIOS DO PLANO</span>
                            <span className="payment-info-value">
                              {selectedPlan ? getPlanBenefits(selectedPlan) : 'Acesso completo ao sistema'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="payment-status-info">
                      <div className="payment-status-indicator">
                        <div className={`status-dot ${paymentStatus === 'approved' ? 'approved' : paymentStatus === 'rejected' ? 'rejected' : 'pending'}`}></div>
                        <p className="payment-status-text">
                          {paymentStatus === 'pending' && 'Aguardando pagamento...'}
                          {paymentStatus === 'approved' && 'Pagamento aprovado!'}
                          {paymentStatus === 'rejected' && 'Pagamento rejeitado'}
                        </p>
                      </div>
                      {paymentStatus === 'pending' && (
                        <p className="payment-status-subtext">
                          O pagamento será confirmado automaticamente após a aprovação
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="payment-loading">
                    <div className="spinner"></div>
                    <p>Gerando QR Code PIX...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentPage

