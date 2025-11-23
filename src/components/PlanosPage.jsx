import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlanosPage.css'
import { authService } from '../services/api'

const PlanosPage = () => {
  const navigate = useNavigate()
  const [isAnnualPricing, setIsAnnualPricing] = useState(false)
  const [sessionid, setSessionid] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    const s = localStorage.getItem('sessionid') || ''
    setSessionid(s)
  }, [])

  const handleGoHome = () => {
    navigate('/')
  }

  const plans = [
    {
      id: 'tester',
      name: 'PLANO TESTE',
      subtitle: 'Gratuito e Ilimitado',
      price: '0,00',
      period: 'Sem tempo para expirar',
      duration: null,
      description: 'Plano gratuito para experimentar',
      features: [
        '1 Aplicação',
        '10 Licenças',
        '10 Usuários',
        'Variáveis Globais Limitadas',
        'Upload até 10 MB',
        'Logs básicos',
        'Webhooks limitados',
        'Suporte via e-mail'
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2v6l6 3-6 3V2z"/>
          <path d="M3 12h18"/>
          <path d="M3 18h18"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
      popular: false
    },
    {
      id: 'weekly',
      name: 'PLANO SEMANAL',
      subtitle: null,
      price: '7,90',
      period: '/ semana',
      duration: '7 dias',
      description: 'Ideal para testes rápidos',
      features: [
        '3 Aplicações',
        '20 Licenças',
        '50 Usuários',
        'Variáveis Globais',
        'Upload até 15 MB',
        'Logs detalhados',
        'Webhooks básicos'
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      popular: false
    },
    {
      id: 'monthly',
      name: 'PLANO MENSAL',
      subtitle: null,
      price: '19,90',
      period: '/ mês',
      duration: '30 dias',
      description: 'O plano mais popular para projetos em produção',
      features: [
        'Aplicações Ilimitadas',
        'Licenças Ilimitadas',
        'Usuários Ilimitados',
        'Upload até 50 MB',
        'Variáveis Globais e de Usuário',
        'Webhooks + API liberada',
        'Logs com auditoria'
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
      popular: true
    },
    {
      id: 'quarterly',
      name: 'PLANO TRIMESTRAL',
      subtitle: null,
      price: '49,90',
      period: '/ trimestre',
      duration: '90 dias',
      description: 'Economia e recursos avançados',
      features: [
        'Tudo do plano Mensal',
        'Upload até 75 MB',
        'Logs avançados (JSON + CSV)',
        'Webhooks com autenticação',
        'Suporte prioritário'
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
        </svg>
      ),
      popular: false
    },
    {
      id: 'annual',
      name: 'PLANO ANUAL',
      subtitle: null,
      price: '100,00',
      period: '/ ano',
      duration: '365 dias',
      description: 'Máxima economia e recursos premium',
      features: [
        'Tudo do plano Trimestral',
        'Upload até 150 MB',
        'Auditoria completa',
        'Backups automáticos',
        'Suporte premium (Discord / E-mail)',
        'Acesso antecipado a novas funções'
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
      ),
      popular: false
    },
    {
      id: 'lifetime',
      name: 'PLANO LIFETIME',
      subtitle: 'Vitalício',
      price: '399,00',
      period: '(pagamento único)',
      duration: 'Acesso Vitalício',
      description: 'Investimento único, benefícios para sempre',
      features: [
        'Tudo do plano Anual',
        'Atualizações futuras garantidas',
        'Upload e armazenamento ilimitados',
        'Logs e auditorias sem limite',
        'Suporte com prioridade máxima',
        'Benefícios exclusivos e descontos'
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
          <path d="M11 3 8 9l4 12 4-12-3-6"/>
          <path d="M2 9h20"/>
        </svg>
      ),
      popular: false
    }
  ]

  const handleSelectPlan = (planId) => {
    navigate('/', { state: { selectedPlan: planId } })
  }

  

  return (
    <div className="planos-container">
      {/* Header de Navegação */}
      <header className="planos-header">
        <div className="planos-header-content">
          <div className="planos-logo">
            <span className="logo-key">Gou</span>
            <span className="logo-unit">Auth</span>
          </div>
          <nav className="planos-nav">
            <a href="/" className="nav-link" onClick={(e) => { e.preventDefault(); handleGoHome() }}>Home</a>
            <a href="/termos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/termos') }}>Termos</a>
            <a href="/planos" className="nav-link active">Planos</a>
            <a href="/videos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/videos') }}>Videos</a>
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="planos-content">
        
        <div className="planos-wrapper">
          {/* Hero Section */}
          <div className="planos-hero">
            <h1 className="planos-title">
              <span className="title-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              Escolha o Plano Ideal
            </h1>
            <p className="planos-subtitle">
              Planos flexíveis para todos os tipos de projetos. Comece grátis e escale conforme sua necessidade.
            </p>

          </div>

          {/* Cards de Planos */}
          <div className="planos-grid">
            {plans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={`plan-card plan-${plan.id} ${plan.popular ? 'popular' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="popular-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Mais Popular
                  </div>
                )}
                
                <div className="plan-header">
                  <div className="plan-icon">
                    {plan.icon}
                  </div>
                  <h3 className="plan-title">{plan.name}</h3>
                  {plan.subtitle && (
                    <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{plan.subtitle}</p>
                  )}
                </div>

                <div className="plan-price">
                  <div className="price-wrapper">
                    <span className="currency">R$</span>
                    <span className="plan-amount">{plan.price}</span>
                    <span className="plan-period">{plan.period}</span>
                  </div>
                  {plan.duration && (
                    <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                      📅 Duração: {plan.duration}
                    </p>
                  )}
                </div>

                <p className="plan-description">{plan.description}</p>

                <div className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="plan-feature" style={{ '--index': idx }}>
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path className="check-path" d="M20 6L9 17l-5-5"/>
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`plan-button plan-button-${plan.id}`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.id === 'tester' ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Começar Grátis</span>
                    </>
                  ) : (
                    <>
                      {plan.id === 'weekly' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                      )}
                      {plan.id === 'monthly' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                          <line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                      )}
                      {plan.id === 'quarterly' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                        </svg>
                      )}
                      {plan.id === 'annual' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                          <path d="M4 22h16"/>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                      )}
                      {plan.id === 'lifetime' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
                          <path d="M11 3 8 9l4 12 4-12-3-6"/>
                          <path d="M2 9h20"/>
                        </svg>
                      )}
                      <span>Escolher {plan.name}</span>
                      <div className="plan-button-shine"></div>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="planos-faq">
            <h2 className="faq-title">Perguntas Frequentes</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3 className="faq-question">Posso mudar de plano depois?</h3>
                <p className="faq-answer">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                  As alterações são aplicadas imediatamente.
                </p>
              </div>
              <div className="faq-item">
                <h3 className="faq-question">Como funciona o plano anual?</h3>
                <p className="faq-answer">
                  Com o plano anual, você paga uma vez por ano e economiza mais de 50% em comparação 
                  ao plano mensal. Ideal para projetos de longo prazo.
                </p>
              </div>
              <div className="faq-item">
                <h3 className="faq-question">Há limites no plano Tester?</h3>
                <p className="faq-answer">
                  O plano Tester oferece acesso básico com limites de 5 aplicações e 50 usuários. 
                  Perfeito para testar antes de escolher um plano pago.
                </p>
              </div>
              <div className="faq-item">
                <h3 className="faq-question">O que está incluído no suporte?</h3>
                <p className="faq-answer">
                  O plano Developer inclui suporte prioritário por email. O plano Seller oferece 
                  suporte 24/7 com resposta garantida em até 2 horas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanosPage

