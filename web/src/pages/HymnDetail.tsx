import { useParams, useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { useFavorites } from '../hooks/useFavorites';
import { Heart, Share2, ChevronLeft, ChevronRight, FileMusic, Music, Type, ArrowLeft, Monitor, X, MoreVertical } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { STORAGE_KEYS, MAX_HISTORY } from '../lib/constants';
import { useSwipe } from '../hooks/useSwipe';

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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentStanzaIndex, setCurrentStanzaIndex] = useState(0);
  const [zoomedPage, setZoomedPage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [pinchStartDist, setPinchStartDist] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(1);

  const viewportRef = useRef<HTMLDivElement>(null);

  const clampPan = (x: number, y: number, scale: number) => {
    const limitX = Math.max(0, window.innerWidth * (scale - 0.5));
    const limitY = Math.max(0, window.innerHeight * (scale - 0.5));
    return {
      x: Math.max(-limitX, Math.min(limitX, x)),
      y: Math.max(-limitY, Math.min(limitY, y))
    };
  };

  const getTouchDist = (t1: Touch | React.Touch, t2: Touch | React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX - panX);
    setStartY(e.clientY - panY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    const newPanX = e.clientX - startX;
    const newPanY = e.clientY - startY;
    const clamped = clampPan(newPanX, newPanY, zoomScale);
    setPanX(clamped.x);
    setPanY(clamped.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setStartX(touch.clientX - panX);
      setStartY(touch.clientY - panY);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      setPinchStartDist(dist);
      setPinchStartScale(zoomScale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoomScale > 1) {
      const touch = e.touches[0];
      const newPanX = touch.clientX - startX;
      const newPanY = touch.clientY - startY;
      const clamped = clampPan(newPanX, newPanY, zoomScale);
      setPanX(clamped.x);
      setPanY(clamped.y);
    } else if (e.touches.length === 2 && pinchStartDist > 0) {
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const factor = dist / pinchStartDist;
      let newScale = pinchStartScale * factor;
      newScale = Math.min(3, Math.max(1, newScale));
      setZoomScale(newScale);
      if (newScale === 1) {
        setPanX(0);
        setPanY(0);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setPinchStartDist(0);
  };

  const handleOpenZoom = (pageUrl: string) => {
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setIsDragging(false);
    setZoomedPage(pageUrl);
  };

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.15;
      setZoomScale(s => {
        let newScale = s + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
        newScale = Math.min(3, Math.max(1, newScale));
        if (newScale === 1) {
          setPanX(0);
          setPanY(0);
        }
        return newScale;
      });
    };

    node.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleWheelRaw);
    };
  }, [zoomedPage]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  const currentIndex = himnos.findIndex(h => h.id === Number(id));
  const himno = himnos[currentIndex];

  const prevHimno = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const nextHimno = currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;

  // ── Swipe to navigate between hymns ─────────────────────
  const { containerRef } = useSwipe({
    onSwipeLeft: nextHimno ? () => navigate(`/himno/${nextHimno.id}`, { replace: true }) : undefined,
    onSwipeRight: prevHimno ? () => navigate(`/himno/${prevHimno.id}`, { replace: true }) : undefined,
  });

  const { isFavorite, toggleFavorite } = useFavorites();

  // ── favorite helpers ────────────────────────────────────
  const himnoFav = himno ? isFavorite(himno.id) : false;

  const handleShare = () => {
    if (navigator.share && himno) {
      navigator.share({
        title: himno.nombre,
        text: `${himno.nombre}\n\n${himno.letra}`,
      }).catch(console.error);
    }
  };

  // Reset scroll to top when changing hymns
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Save to history on view
  useEffect(() => {
    if (himno) {
      const history = getJSON<{ id: number; nombre: string; numero: string; timestamp: number }[]>(STORAGE_KEYS.HISTORY, []);
      const filtered = history.filter((h: { id: number }) => h.id !== himno.id);
      filtered.unshift({ id: himno.id, nombre: himno.nombre, numero: himno.numero, timestamp: Date.now() });
      if (filtered.length > MAX_HISTORY) filtered.pop();
      setJSON(STORAGE_KEYS.HISTORY, filtered);
    }
  }, [himno]);

  interface SlideSection {
    type: 'estrofa' | 'coro' | 'pre-coro' | 'puente';
    label?: string;
    number?: number;
    lines: string[];
  }

  const slides: SlideSection[] = [];
  if (himno) {
    if (himno.letra_estructurada) {
      himno.letra_estructurada.forEach(sec => {
        if (['e', 'c', 'p', 'b'].includes(sec.t)) {
          let typeName: SlideSection['type'] = 'estrofa';
          if (sec.t === 'c') typeName = 'coro';
          else if (sec.t === 'p') typeName = 'pre-coro';
          else if (sec.t === 'b') typeName = 'puente';
          
          slides.push({
            type: typeName,
            label: sec.lbl,
            number: sec.n,
            lines: sec.l
          });
        }
      });
    } else {
      const fallbackStanzas = himno.letra.split('\n \n').map(s => s.trim()).filter(s => s.length > 0);
      fallbackStanzas.forEach(s => {
        const isChorus = s.toUpperCase().startsWith('CORO');
        const cleanedText = isChorus ? s.replace(/^CORO\s*/i, '').trim() : s;
        slides.push({
          type: isChorus ? 'coro' : 'estrofa',
          lines: cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        });
      });
    }
  }

  const enterPresentationMode = async () => {
    setCurrentStanzaIndex(0);
    setPresentationMode(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
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
    setCurrentStanzaIndex(prev => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

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
  const ytVideos = himno.aud ? himno.aud.filter(a => a.src === 'YT') : [];
  const selectedVideo = ytVideos[selectedVideoIndex] ?? null;

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          display: 'flex', flexDirection: 'column', minHeight: '100vh',
        }}
      >
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
              <button onClick={() => himno && toggleFavorite(himno.id)} className="detail-top-bar-btn" aria-label="Favorito">
                <Heart size={20} style={{ fill: himnoFav ? 'var(--primary)' : 'none', color: himnoFav ? 'var(--primary)' : 'var(--on-background)' }} />
              </button>
            </div>
          </header>
        </div>

        <main className="hymn-detail-lyrics-container">
        <h1 className="hymn-detail-title-main">{himno.nombre}</h1>

        {showVideo && ytVideos.length > 0 && (
          <>
            {/* Multi-video selector chips */}
            {ytVideos.length > 1 && (
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap',
                justifyContent: 'center', marginBottom: 16,
              }}>
                {ytVideos.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVideoIndex(i)}
                    className={`filter-chip ${selectedVideoIndex === i ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  >
                    Versión {i + 1}{v.lang && v.lang !== 'es' ? ` (${v.lang.toUpperCase()})` : ''}
                  </button>
                ))}
              </div>
            )}
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%', marginBottom: 32, borderRadius: 12, overflow: 'hidden' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                key={selectedVideo.id}
              ></iframe>
            </div>
          </>
        )}

        {showScore && pages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', marginBottom: 32 }}>
            {pages.map(p => (
              <img 
                key={p} 
                src={`/partituras/page_${p.trim()}.png`} 
                alt={`Partitura página ${p}`}
                style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'zoom-in' }}
                loading="lazy"
                onClick={() => handleOpenZoom(`/partituras/page_${p.trim()}.png`)}
              />
            ))}
          </div>
        )}

        {!showScore && (
          <div className="hymn-detail-text-body" style={{ fontSize: `${fontSize}px` }}>
            {himno.letra_estructurada ? (
              himno.letra_estructurada.map((sec, i) => {
                let containerClass = 'lyrics-verse-container';
                let voiceClass = 'voice-generic';
                
                if (sec.t === 'c') containerClass = 'lyrics-chorus-container';
                else if (sec.t === 'p') containerClass = 'lyrics-pre-chorus-container';
                else if (sec.t === 'b') containerClass = 'lyrics-bridge-container';
                else if (sec.t === 'n') containerClass = 'lyrics-note-container';
                else if (sec.t === 's') {
                  return (
                    <div key={i} className="lyrics-section-title-container">
                      {sec.lbl}
                    </div>
                  );
                }
                
                if (sec.lbl) {
                  const lblLower = sec.lbl.toLowerCase();
                  if (lblLower.includes('hermano')) voiceClass = 'voice-hermanos';
                  else if (lblLower.includes('hermana')) voiceClass = 'voice-hermanas';
                  else if (lblLower.includes('todo')) voiceClass = 'voice-todos';
                }
                
                return (
                  <div key={i} className={containerClass}>
                    {sec.t === 'e' && sec.n && (
                      <span className="lyrics-verse-num">{sec.n}</span>
                    )}
                    {sec.lbl && (
                      <div>
                        <span className={`lyrics-voice-badge ${voiceClass}`}>
                          {sec.lbl}
                        </span>
                      </div>
                    )}
                    {sec.l.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                );
              })
            ) : (
              // Fallback if structured lyrics not available
              himno.letra.split('\n \n').map((stanza, i) => {
                const isChorus = stanza.trim().startsWith('CORO');
                let content = stanza.trim();
                if (isChorus) {
                  content = content.replace(/^CORO\s*/i, '');
                }
                return (
                  <div key={i} className={isChorus ? 'lyrics-chorus-container' : 'lyrics-verse-container'}>
                    {content.split('\n').map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
      </div>

      {/* Background overlay when text settings or options menu open */}
      {(showTextSettings || showOptionsMenu) && (
        <div 
          className="menu-backdrop"
          onClick={() => { setShowTextSettings(false); setShowOptionsMenu(false); }}
        />
      )}

      {/* Bottom Navigation Control Bar */}
      <div className="detail-bottom-bar-wrapper" style={{ marginTop: 'auto' }}>
        
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

        {/* Options Menu */}
        {showOptionsMenu && (
          <div className="options-menu">
            {himno.info && himno.info !== 'none' && himno.info.trim() !== '' && (
              <div className="options-menu-info">
                {himno.info}
              </div>
            )}
            <button 
              className="options-menu-item"
              onClick={() => {
                setShowOptionsMenu(false);
                handleShare();
              }}
            >
              <Share2 size={20} />
              <span>Compartir</span>
            </button>
            <button 
              className="options-menu-item"
              onClick={() => {
                setShowOptionsMenu(false);
                setShowTextSettings(true);
              }}
            >
              <Type size={20} />
              <span>Tamaño de letra</span>
            </button>
            <button 
              className="options-menu-item"
              onClick={() => {
                setShowOptionsMenu(false);
                enterPresentationMode();
              }}
            >
              <Monitor size={20} />
              <span>Modo presentación</span>
            </button>
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
              onClick={() => setShowScore(!showScore)}
              style={{ opacity: pages.length > 0 ? 1 : 0.3 }}
              disabled={pages.length === 0}
            >
              <FileMusic size={20} />
            </button>
            <button 
              className={`detail-bottom-action-btn ${showVideo ? 'active' : ''}`}
              onClick={() => setShowVideo(!showVideo)}
              style={{ opacity: ytVideos.length > 0 ? 1 : 0.3 }}
              disabled={ytVideos.length === 0}
            >
              <Music size={20} />
            </button>
            <button 
              className={`detail-bottom-action-btn ${showOptionsMenu ? 'active' : ''}`}
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              title="Más opciones"
            >
              <MoreVertical size={20} />
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
                const slide = slides[currentStanzaIndex];
                if (!slide) return null;
                
                // Get type name in Spanish
                let typeText = '';
                if (slide.type === 'estrofa') {
                  typeText = slide.number ? `Estrofa ${slide.number}` : '';
                } else if (slide.type === 'coro') {
                  typeText = `Coro ${slide.number || ''}`;
                } else if (slide.type === 'pre-coro') {
                  typeText = 'Pre-Coro';
                } else if (slide.type === 'puente') {
                  typeText = 'Puente';
                }
                
                // Voice label mapping to CSS class
                let voiceClass = 'voice-generic';
                if (slide.label) {
                  const lblLower = slide.label.toLowerCase();
                  if (lblLower.includes('hermano')) voiceClass = 'voice-hermanos';
                  else if (lblLower.includes('hermana')) voiceClass = 'voice-hermanas';
                  else if (lblLower.includes('todo')) voiceClass = 'voice-todos';
                }
                
                return (
                  <>
                    <div className="presentation-section-type">
                      {typeText.trim()}
                    </div>
                    {slide.label && (
                      <div>
                        <span className={`lyrics-voice-badge ${voiceClass}`}>
                          {slide.label}
                        </span>
                      </div>
                    )}
                    {slide.lines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </>
                );
              })()}
            </div>

            {currentStanzaIndex < slides.length - 1 && (
              <div className="presentation-touch-area presentation-touch-right" onClick={nextStanza}>
                <ChevronRight size={48} style={{ opacity: 0.5 }} />
              </div>
            )}
          </div>
          
          <div className="presentation-progress">
            {slides.map((_, i) => (
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
            animation: 'fadeIn 0.2s ease',
            userSelect: 'none'
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

          {/* Main viewport for grabbing and dragging */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none'
            }}
          >
            <div 
              style={{ 
                transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                display: 'inline-block',
                textAlign: 'center'
              }}
            >
              <img 
                src={zoomedPage}
                alt="Partitura ampliada"
                style={{
                  maxWidth: '100vw',
                  maxHeight: '85vh',
                  borderRadius: 8,
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none',
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
              onClick={() => setZoomScale(s => {
                const next = Math.max(1, s - 0.25);
                if (next === 1) {
                  setPanX(0);
                  setPanY(0);
                }
                return next;
              })}
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
              onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}
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
                onClick={() => {
                  setZoomScale(1);
                  setPanX(0);
                  setPanY(0);
                }}
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
