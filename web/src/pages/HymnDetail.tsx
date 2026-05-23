import { useParams, useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { Heart, Share2, ChevronLeft, ChevronRight, FileMusic, Music, Type, ArrowLeft, Monitor, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function HymnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { himnos, loading } = useHimnos();
  
  const [showScore, setShowScore] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? Number(saved) : 19;
  });
  const [showTextSettings, setShowTextSettings] = useState(false);
  
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentStanzaIndex, setCurrentStanzaIndex] = useState(0);
  const [zoomedPage, setZoomedPage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  const currentIndex = himnos.findIndex(h => h.id === Number(id));
  const himno = himnos[currentIndex];

  const prevHimno = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const nextHimno = currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (himno) {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favs.includes(himno.id));
    }
  }, [himno]);

  const toggleFavorite = () => {
    if (!himno) return;
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      favs = favs.filter((id: number) => id !== himno.id);
    } else {
      favs.push(himno.id);
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share && himno) {
      navigator.share({
        title: himno.nombre,
        text: `${himno.nombre}\n\n${himno.letra}`,
      }).catch(console.error);
    }
  };

  // Save to history on view
  useEffect(() => {
    if (himno) {
      const historyStr = localStorage.getItem('history') || '[]';
      let history = JSON.parse(historyStr);
      history = history.filter((h: any) => h.id !== himno.id);
      history.unshift({ id: himno.id, nombre: himno.nombre, numero: himno.numero, timestamp: Date.now() });
      if (history.length > 50) history.pop();
      localStorage.setItem('history', JSON.stringify(history));
    }
  }, [himno]);

  // Split by the actual stanza delimiter: newline + space + newline
  const stanzas = himno ? himno.letra.split('\n \n').map(s => s.trim()).filter(s => s.length > 0) : [];

  const enterPresentationMode = async () => {
    setCurrentStanzaIndex(0);
    setPresentationMode(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        // @ts-ignore
        await screen.orientation.lock('landscape');
      }
    } catch (e) {
      console.warn("Fullscreen or orientation lock failed:", e);
    }
  };

  const exitPresentationMode = async () => {
    setPresentationMode(false);
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (e) {
      console.warn("Exit fullscreen failed:", e);
    }
  };

  const nextStanza = useCallback(() => {
    setCurrentStanzaIndex(prev => Math.min(prev + 1, stanzas.length - 1));
  }, [stanzas.length]);

  const prevStanza = useCallback(() => {
    setCurrentStanzaIndex(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentationMode) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextStanza();
      } else if (e.key === 'ArrowLeft') {
        prevStanza();
      } else if (e.key === 'Escape') {
        exitPresentationMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode, nextStanza, prevStanza]);

  // Clean up if unmounted
  useEffect(() => {
    return () => {
      if (presentationMode) {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(e => console.warn(e));
        }
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    };
  }, [presentationMode]);

  // Early returns must be after all hooks
  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;
  if (!himno) return <div style={{ padding: 20 }}>Himno no encontrado</div>;

  const pages = himno.page && himno.page !== 'none' ? himno.page.split(',') : [];
  const ytVideo = himno.aud && himno.aud.find(a => a.src === 'YT');

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', position: 'relative' }}>
      <div className="page-enter-active">
        {/* Top Bar */}
        <div className="detail-top-bar-wrapper">
          <header className="detail-top-bar" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button onClick={() => navigate(-1)} className="detail-top-bar-btn" aria-label="Volver">
                <ArrowLeft size={24} style={{ color: 'var(--on-background)' }} />
              </button>
            </div>
            
            <div className="detail-top-bar-badge" style={{ fontSize: '15px' }}>
              {himno.numero}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={toggleFavorite} className="detail-top-bar-btn" aria-label="Favorito">
                <Heart size={20} style={{ fill: isFavorite ? 'var(--primary)' : 'none', color: isFavorite ? 'var(--primary)' : 'var(--on-background)' }} />
              </button>
              <button onClick={handleShare} className="detail-top-bar-btn" aria-label="Compartir">
                <Share2 size={20} style={{ color: 'var(--on-background)' }} />
              </button>
            </div>
          </header>
        </div>

        <main className="hymn-detail-lyrics-container">
        <h1 className="hymn-detail-title-main">{himno.nombre}</h1>

        {showScore && pages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', marginBottom: 32 }}>
            {pages.map(p => (
              <img 
                key={p} 
                src={`/partituras/page_${p.trim()}.png`} 
                alt={`Partitura página ${p}`}
                style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'zoom-in' }}
                loading="lazy"
                onClick={() => {
                  setZoomScale(1);
                  setZoomedPage(`/partituras/page_${p.trim()}.png`);
                }}
              />
            ))}
          </div>
        )}



        {showVideo && ytVideo && (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%', marginBottom: 32, borderRadius: 12, overflow: 'hidden' }}>
            <iframe 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              src={`https://www.youtube.com/embed/${ytVideo.id}?autoplay=1`} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        )}

        {!showScore && (
          <div className="hymn-detail-text-body" style={{ fontSize: `${fontSize}px` }}>
            {himno.letra.split('\n \n').map((stanza, i) => {
              const isChorus = stanza.trim().startsWith('CORO');
              let content = stanza.trim();
              if (isChorus) {
                content = content.replace(/^CORO\s*/i, '');
              }
              return (
                <div key={i} className={isChorus ? 'lyrics-chorus' : 'lyrics-verse'}>
                  {content.split('\n').map((line, j) => (
                    <div key={j}>{line}</div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>
      </div>

      {/* Background overlay when text settings open */}
      {showTextSettings && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 998 }}
          onClick={() => setShowTextSettings(false)}
        />
      )}

      {/* Bottom Navigation Control Bar */}
      <div className="detail-bottom-bar-wrapper">
        
        {/* Text Size Drawer */}
        {showTextSettings && (
          <div className="text-size-drawer">
            <div className="text-size-drawer-header">
              <span className="text-size-drawer-title">Tamaño de letra</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Aa</span>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: 'var(--primary)' }}>Aa</span>
              <span style={{ fontSize: '30px', fontWeight: 600 }}>Aa</span>
            </div>
            <input 
              type="range" 
              min="14" 
              max="30" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="text-size-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
                {fontSize === 19 ? 'Tamaño original' : 'Tamaño modificado'}
              </span>
              {fontSize !== 19 && (
                <button 
                  onClick={() => setFontSize(19)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                >
                  Restaurar original
                </button>
              )}
            </div>
          </div>
        )}

        <div className="detail-bottom-bar-divider" />
        <div className="detail-bottom-bar">
          <button 
            className="detail-bottom-bar-btn" 
            onClick={() => prevHimno && navigate(`/himno/${prevHimno.id}`, { replace: true })}
            style={{ opacity: prevHimno ? 1 : 0.3 }}
            disabled={!prevHimno}
          >
            <ChevronLeft size={28} />
          </button>
          
          <div className="detail-bottom-center-buttons">
            <button 
              className={`detail-bottom-action-btn ${showScore ? 'active' : ''}`}
              onClick={() => { setShowScore(!showScore); setShowVideo(false); }}
              style={{ opacity: pages.length > 0 ? 1 : 0.3 }}
              disabled={pages.length === 0}
            >
              <FileMusic size={20} />
            </button>
            <button 
              className={`detail-bottom-action-btn ${showVideo ? 'active' : ''}`}
              onClick={() => { setShowVideo(!showVideo); setShowScore(false); }}
              style={{ opacity: ytVideo ? 1 : 0.3 }}
              disabled={!ytVideo}
            >
              <Music size={20} />
            </button>
            <button 
              className={`detail-bottom-action-btn ${showTextSettings ? 'active' : ''}`}
              onClick={() => setShowTextSettings(!showTextSettings)}
            >
              <Type size={20} />
            </button>
            <button 
              className="detail-bottom-action-btn"
              onClick={enterPresentationMode}
              title="Modo Presentación"
            >
              <Monitor size={20} />
            </button>
          </div>

          <button 
            className="detail-bottom-bar-btn" 
            onClick={() => nextHimno && navigate(`/himno/${nextHimno.id}`, { replace: true })}
            style={{ opacity: nextHimno ? 1 : 0.3 }}
            disabled={!nextHimno}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {/* Presentation Mode Overlay */}
      {presentationMode && (
        <div className="presentation-overlay">
          <button className="presentation-close-btn" onClick={exitPresentationMode} aria-label="Salir">
            <X size={24} />
          </button>
          
          <div className="presentation-content-area">
            {currentStanzaIndex > 0 && (
              <div className="presentation-touch-area presentation-touch-left" onClick={prevStanza}>
                <ChevronLeft size={48} style={{ opacity: 0.5 }} />
              </div>
            )}
            
            <div className="presentation-slide" key={currentStanzaIndex}>
              {(() => {
                const raw = stanzas[currentStanzaIndex];
                const isChorus = raw.startsWith('CORO');
                const content = raw.replace(/^CORO\s*/i, '');
                const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                return (
                  <>
                    {isChorus && (
                      <div style={{ fontSize: '0.45em', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.6em', fontWeight: 500 }}>
                        Coro
                      </div>
                    )}
                    {lines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </>
                );
              })()}
            </div>

            {currentStanzaIndex < stanzas.length - 1 && (
              <div className="presentation-touch-area presentation-touch-right" onClick={nextStanza}>
                <ChevronRight size={48} style={{ opacity: 0.5 }} />
              </div>
            )}
          </div>
          
          <div className="presentation-progress">
            {stanzas.map((_, i) => (
              <div key={i} className={`presentation-dot ${i === currentStanzaIndex ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      )}
      {/* Partitura Lightbox (Zoomable with custom controls) */}
      {zoomedPage && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 90000,
            backgroundColor: 'rgba(0,0,0,0.97)',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {/* Top bar with Close button */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 90002 }}>
            <button 
              onClick={() => setZoomedPage(null)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '50%', width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', fontSize: 20
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Main scrollable viewport */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y pinch-zoom',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div style={{ margin: 'auto', display: 'inline-block', textAlign: 'center' }}>
              <img 
                src={zoomedPage}
                alt="Partitura ampliada"
                style={{
                  width: zoomScale > 1 ? `${zoomScale * 100}%` : 'auto',
                  maxWidth: zoomScale > 1 ? 'none' : '100%',
                  maxHeight: zoomScale > 1 ? 'none' : '90vh',
                  height: 'auto',
                  borderRadius: 8,
                  objectFit: 'contain',
                  touchAction: 'pinch-zoom',
                  display: 'block',
                  transition: 'width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          </div>

          {/* Floating Zoom Controls Bar at the bottom */}
          <div 
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 90002,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 16px',
              borderRadius: 24,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              color: '#fff',
            }}
          >
            <button
              onClick={() => setZoomScale(s => Math.max(1, s - 0.5))}
              disabled={zoomScale <= 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomScale <= 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 22,
                fontWeight: 'bold',
                cursor: zoomScale <= 1 ? 'default' : 'pointer',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 48, textAlign: 'center' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(s => Math.min(3, s + 0.5))}
              disabled={zoomScale >= 3}
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomScale >= 3 ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 22,
                fontWeight: 'bold',
                cursor: zoomScale >= 3 ? 'default' : 'pointer',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
            {zoomScale > 1 && (
              <button
                onClick={() => setZoomScale(1)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 11,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Restablecer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
