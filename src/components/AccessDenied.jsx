import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AccessDenied.css'

const AccessDenied = () => {
  const navigate = useNavigate()

  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="access-denied-title">404</h1>
        <h2 className="access-denied-subtitle">Página não encontrada</h2>
        <p className="access-denied-message">
          A página que você está procurando não existe ou foi movida.
        </p>
        <button 
          className="access-denied-button"
          onClick={() => navigate('/')}
        >
          Voltar para o início
        </button>
      </div>
    </div>
  )
}

export default AccessDenied

