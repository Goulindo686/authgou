import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './TermosPage.css'

const TermosPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Scroll para o topo quando a página carregar
    window.scrollTo(0, 0)
  }, [])

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="termos-container">
      {/* Header de Navegação */}
      <header className="termos-header">
        <div className="termos-header-content">
          <div className="termos-logo">
            <span className="logo-key">Gou</span>
            <span className="logo-unit">Auth</span>
          </div>
          <nav className="termos-nav">
            <a href="/" className="nav-link" onClick={(e) => { e.preventDefault(); handleGoHome() }}>Home</a>
            <a href="/termos" className="nav-link active">Termos</a>
            <a href="/planos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/planos') }}>Planos</a>
            <a href="/videos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/videos') }}>Videos</a>
          </nav>
        </div>
      </header>

      {/* Imagem Decorativa */}
      <div className="termos-svg-animation">
        <img 
          src="https://cdn.discordapp.com/attachments/1427419176166883379/1439099712123703337/Gemini_Generated_Image_c5q64tc5q64tc5q6_1.png?ex=691bec8c&is=691a9b0c&hm=eaf41f4b1222e7fb0ce51b3aef05610d53aac5ac1fa93623567e9ecf2accbf00&" 
          alt="Decorative illustration"
          className="termos-decorative-image"
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="termos-content">
        <div className="termos-wrapper">
          <h1 className="termos-title">
            <span className="title-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
            Termos de Uso
          </h1>
          
          <div className="termos-intro">
            <p className="intro-text">
              Bem-vindo ao <strong>Gou Auth</strong>. Ao usar nossos serviços, você concorda com os termos e condições descritos abaixo. 
              Por favor, leia cuidadosamente antes de utilizar nossa plataforma.
            </p>
            <p className="intro-date">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="termos-sections">
            {/* Seção 1 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">01</span>
                Aceitação dos Termos
              </h2>
              <div className="section-content">
                <p>
                  Ao acessar e usar os serviços da Gou Auth, você reconhece que leu, entendeu e concorda em ficar vinculado a estes 
                  Termos de Uso e a todas as leis e regulamentações aplicáveis. Se você não concordar com qualquer parte destes termos, 
                  não deve usar nossos serviços.
                </p>
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente 
                  após sua publicação nesta página. É sua responsabilidade revisar periodicamente estes termos.
                </p>
              </div>
            </section>

            {/* Seção 2 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">02</span>
                Descrição do Serviço
              </h2>
              <div className="section-content">
                <p>
                  A Gou Auth é uma plataforma de autenticação e gerenciamento de licenças que permite aos usuários criar, gerenciar 
                  e controlar aplicações, usuários e licenças de software de forma segura e eficiente.
                </p>
                <ul className="termos-list">
                  <li>Criação e gerenciamento de aplicações</li>
                  <li>Geração e controle de licenças de software</li>
                  <li>Gerenciamento de usuários e permissões</li>
                  <li>Sistema de autenticação seguro com 2FA</li>
                  <li>API para integração com seus sistemas</li>
                </ul>
              </div>
            </section>

            {/* Seção 3 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">03</span>
                Cadastro e Conta de Usuário
              </h2>
              <div className="section-content">
                <p>
                  Para usar nossos serviços, você precisa criar uma conta fornecendo informações precisas, completas e atualizadas. 
                  Você é responsável por manter a confidencialidade de suas credenciais de login.
                </p>
                <p>
                  Você é responsável por todas as atividades que ocorrem sob sua conta. Você deve notificar-nos imediatamente sobre 
                  qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
                </p>
              </div>
            </section>

            {/* Seção 4 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">04</span>
                Uso Aceitável
              </h2>
              <div className="section-content">
                <p>Você concorda em usar nossos serviços apenas para fins legais e de acordo com estes Termos. Você não deve:</p>
                <ul className="termos-list">
                  <li>Usar o serviço de forma que viole qualquer lei ou regulamento</li>
                  <li>Interferir ou interromper o funcionamento do serviço</li>
                  <li>Tentar obter acesso não autorizado a qualquer parte do serviço</li>
                  <li>Usar o serviço para transmitir qualquer conteúdo malicioso ou prejudicial</li>
                  <li>Compartilhar suas credenciais com terceiros</li>
                  <li>Usar o serviço para atividades fraudulentas ou enganosas</li>
                </ul>
              </div>
            </section>

            {/* Seção 5 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">05</span>
                Propriedade Intelectual
              </h2>
              <div className="section-content">
                <p>
                  Todo o conteúdo, funcionalidades e tecnologia fornecidos pela Gou Auth, incluindo mas não limitado a software, 
                  design, texto, gráficos, logotipos e ícones, são de propriedade exclusiva da Gou Auth ou de seus licenciadores 
                  e estão protegidos por leis de direitos autorais, marcas comerciais e outras leis de propriedade intelectual.
                </p>
                <p>
                  Você recebe uma licença limitada, não exclusiva, não transferível e revogável para usar nossos serviços de acordo 
                  com estes Termos. Você não deve copiar, modificar, distribuir, vender ou alugar qualquer parte de nossos serviços.
                </p>
              </div>
            </section>

            {/* Seção 6 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">06</span>
                Privacidade e Proteção de Dados
              </h2>
              <div className="section-content">
                <p>
                  Valorizamos sua privacidade. Nossa coleta e uso de informações pessoais são regidos por nossa Política de Privacidade, 
                  que é incorporada a estes Termos por referência.
                </p>
                <p>
                  Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger seus dados contra acesso não 
                  autorizado, alteração, divulgação ou destruição.
                </p>
              </div>
            </section>

            {/* Seção 7 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">07</span>
                Limitação de Responsabilidade
              </h2>
              <div className="section-content">
                <p>
                  Na máxima extensão permitida por lei, a Gou Auth não será responsável por quaisquer danos diretos, indiretos, 
                  incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar nossos serviços.
                </p>
                <p>
                  Nossos serviços são fornecidos "como estão" e "conforme disponível" sem garantias de qualquer tipo, expressas ou 
                  implícitas, incluindo, mas não limitado a, garantias de comercialização, adequação a um propósito específico e 
                  não violação.
                </p>
              </div>
            </section>

            {/* Seção 8 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">08</span>
                Rescisão
              </h2>
              <div className="section-content">
                <p>
                  Podemos encerrar ou suspender sua conta e acesso aos serviços imediatamente, sem aviso prévio ou responsabilidade, 
                  por qualquer motivo, incluindo, mas não limitado a, violação destes Termos.
                </p>
                <p>
                  Após o encerramento, seu direito de usar o serviço cessará imediatamente. Todas as disposições destes Termos que, 
                  por sua natureza, devem sobreviver ao encerramento sobreviverão ao encerramento.
                </p>
              </div>
            </section>

            {/* Seção 9 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">09</span>
                Lei Aplicável
              </h2>
              <div className="section-content">
                <p>
                  Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem dar efeito a quaisquer princípios 
                  de conflitos de leis.
                </p>
                <p>
                  Qualquer disputa decorrente ou relacionada a estes Termos será resolvida exclusivamente pelos tribunais competentes 
                  do Brasil.
                </p>
              </div>
            </section>

            {/* Seção 10 */}
            <section className="termos-section">
              <h2 className="section-title">
                <span className="section-number">10</span>
                Contato
              </h2>
              <div className="section-content">
                <p>
                  Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco através dos canais de suporte 
                  disponíveis em nossa plataforma.
                </p>
                <p>
                  Estamos comprometidos em fornecer suporte de qualidade e responderemos às suas perguntas o mais rápido possível.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermosPage

