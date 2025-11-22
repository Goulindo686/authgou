import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { videoService } from '../services/api'
import './VideosPage.css'

const VideosPage = () => {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [featuredVideos, setFeaturedVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedVideo, setSelectedVideo] = useState(null)

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'tutorial', name: 'Tutoriais' },
    { id: 'api', name: 'API Integration' },
    { id: 'integration', name: 'Integração' }
  ]

  useEffect(() => {
    loadVideos()
    window.scrollTo(0, 0)
  }, [selectedCategory])

  const loadVideos = async () => {
    try {
      setIsLoading(true)
      
      // Carregar vídeos em destaque
      const featuredResponse = await videoService.getVideos(null, true)
      if (featuredResponse.success) {
        setFeaturedVideos(featuredResponse.videos || [])
      }
      
      // Carregar todos os vídeos ou por categoria
      const category = selectedCategory === 'all' ? null : selectedCategory
      const response = await videoService.getVideos(category, null)
      
      if (response.success) {
        setVideos(response.videos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error)
      setVideos([])
      setFeaturedVideos([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoClick = async (video) => {
    setSelectedVideo(video)
    // Incrementar visualizações
    try {
      await videoService.incrementView(video.id)
    } catch (error) {
      // Ignorar erro silenciosamente
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (views) => {
    if (!views) return '0 visualizações'
    if (views < 1000) return `${views} visualizações`
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K visualizações`
    return `${(views / 1000000).toFixed(1)}M visualizações`
  }

  const embedVideoUrl = (url) => {
    // Converter URLs do YouTube para embed
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtube.com/embed/')) {
      return url
    }
    // Para outros tipos de vídeo, retornar URL original
    return url
  }

  const isVideoFile = (url) => {
    if (!url) return false
    const urlLower = url.toLowerCase()
    // Verificar se a URL termina com extensão de vídeo ou contém extensão na query string
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8', '.flv', '.wmv']
    const hasExtension = videoExtensions.some(ext => {
      // Verificar se a extensão está no final da URL ou na query string
      return urlLower.endsWith(ext) || urlLower.includes(ext + '?') || urlLower.includes(ext + '&') || urlLower.includes(ext + '#')
    })
    // Se não for YouTube e não for uma URL de embed conhecida, considerar como arquivo de vídeo se tiver extensão
    return hasExtension && !isYouTubeUrl(url) && !urlLower.includes('embed')
  }

  const isYouTubeUrl = (url) => {
    if (!url) return false
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  return (
    <div className="videos-container">
      {/* Header de Navegação */}
      <header className="videos-header">
        <div className="videos-header-content">
          <div className="videos-logo">
            <span className="logo-key">Gou</span>
            <span className="logo-unit">Auth</span>
          </div>
          <nav className="videos-nav">
            <a href="/" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/') }}>Home</a>
            <a href="/termos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/termos') }}>Termos</a>
            <a href="/planos" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/planos') }}>Planos</a>
            <a href="/videos" className="nav-link active">Videos</a>
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="videos-content">
        <div className="videos-wrapper">
          {/* Hero Section */}
          <div className="videos-hero">
            <h1 className="videos-title">
              <span className="title-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </span>
              Tutoriais e Vídeos
            </h1>
            <p className="videos-subtitle">
              Aprenda como integrar a API Gou Auth em seus projetos com nossos tutoriais em vídeo
            </p>
          </div>

          {/* Filtros de Categoria */}
          <div className="videos-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`filter-button ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Vídeos em Destaque */}
          {featuredVideos.length > 0 && selectedCategory === 'all' && (
            <div className="featured-section">
              <div className="featured-videos-compact">
                {featuredVideos.slice(0, 3).map(video => (
                  <div key={video.id} className="featured-video-compact-card" onClick={() => handleVideoClick(video)}>
                    {video.thumbnail_url ? (
                      <div className="featured-thumbnail-compact">
                        <img src={video.thumbnail_url} alt={video.title} />
                        <div className="play-overlay-compact">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <polygon points="9 5 19 12 9 19 9 5"/>
                          </svg>
                        </div>
                        {video.duration && (
                          <div className="video-duration-compact">{formatDuration(video.duration)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="featured-thumbnail-compact default">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        {video.duration && (
                          <div className="video-duration-compact">{formatDuration(video.duration)}</div>
                        )}
                      </div>
                    )}
                    <div className="featured-info-compact">
                      <h3 className="featured-title-compact">{video.title}</h3>
                      <div className="featured-meta-compact">
                        <span className="featured-views-compact">{formatViews(video.views)}</span>
                        {video.category && (
                          <span className="featured-category-compact">{video.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid de Vídeos */}
          <div className="videos-grid">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Carregando vídeos...</p>
              </div>
            ) : videos.length > 0 ? (
              videos.map(video => (
                <div key={video.id} className="video-card" onClick={() => handleVideoClick(video)}>
                  {video.thumbnail_url ? (
                    <div className="video-thumbnail">
                      <img src={video.thumbnail_url} alt={video.title} />
                      <div className="play-overlay">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                          <polygon points="9 5 19 12 9 19 9 5"/>
                        </svg>
                      </div>
                      {video.duration && (
                        <div className="video-duration">{formatDuration(video.duration)}</div>
                      )}
                    </div>
                  ) : (
                    <div className="video-thumbnail default">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                      {video.duration && (
                        <div className="video-duration">{formatDuration(video.duration)}</div>
                      )}
                    </div>
                  )}
                  <div className="video-info">
                    <h3 className="video-title">{video.title}</h3>
                    {video.description && (
                      <p className="video-description">{video.description}</p>
                    )}
                    <div className="video-meta">
                      <span className="video-views">{formatViews(video.views)}</span>
                      {video.category && (
                        <span className="video-category">{video.category}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <h3>Nenhum vídeo encontrado</h3>
                <p>Não há vídeos disponíveis nesta categoria ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Vídeo */}
      {selectedVideo && (
        <div className="video-modal" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="modal-video-container">
              {isYouTubeUrl(selectedVideo.video_url) ? (
                <iframe
                  src={embedVideoUrl(selectedVideo.video_url)}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : isVideoFile(selectedVideo.video_url) ? (
                <video
                  src={selectedVideo.video_url}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                >
                  Seu navegador não suporta a reprodução de vídeo.
                </video>
              ) : (
                <iframe
                  src={embedVideoUrl(selectedVideo.video_url)}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
            <div className="modal-video-info">
              <h2>{selectedVideo.title}</h2>
              {selectedVideo.description && (
                <p>{selectedVideo.description}</p>
              )}
              <div className="modal-video-meta">
                <span>{formatViews(selectedVideo.views)}</span>
                {selectedVideo.category && <span>{selectedVideo.category}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideosPage

