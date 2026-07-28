import { useParams, useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { useFavorites } from '../hooks/useFavorites';
import { Heart, Share2, ChevronLeft, ChevronRight, FileMusic, Music, Type, ArrowLeft, Monitor, X, MoreVertical } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { STORAGE_KEYS, MAX_HISTORY } from '../lib/constants';
import { SkeletonDetail } from '../components/Skeletons';
import type { Himno } from '../types.d';

// ── Renders just the lyrics body for a hymn ───────────────────────────────
function HymnLyricsBody({ himno, fontSize }: { himno: Himno; fontSize: number }) {
  return (
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
            return (<div key={i} className="lyrics-section-title-container">{sec.lbl}</div>);
          }
          if (sec.lbl) {
            const l = sec.lbl.toLowerCase();
            if (l.includes('hermano')) voiceClass = 'voice-hermanos';
            else if (l.includes('hermana')) voiceClass = 'voice-hermanas';
            else if (l.includes('todo')) voiceClass = 'voice-todos';
          }
          return (
            <div key={i} className={containerClass}>
              {sec.t === 'e' && sec.n && <span className="lyrics-verse-num">{sec.n}</span>}
              {sec.lbl && <div><span className={`lyrics-voice-badge ${voiceClass}`}>{sec.lbl}</span></div>}
              {sec.l.map((line, j) => <div key={j}>{line}</div>)}
            </div>
          );
        })
      ) : (
        himno.letra.split('\n \n').map((stanza, i) => {
          const isChorus = stanza.trim().startsWith('CORO');
          let content = stanza.trim();
          if (isChorus) content = content.replace(/^CORO\s*/i, '');
          return (
            <div key={i} className={isChorus ? 'lyrics-chorus-container' : 'lyrics-verse-container'}>
              {content.split('\n').map((line, j) => <div key={j}>{line}</div>)}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Full hymn layout (shared by all 3 carousel panes) ─────────────────────
function HymnPane({ himno, fontSize }: { himno: Himno; fontSize: number }) {
  return (
    <div className="hymn-detail-lyrics-container" style={{ paddingBottom: 200 }}>
      <h1 className="hymn-detail-title-main">{himno.nombre}</h1>
      <HymnLyricsBody himno={himno} fontSize={fontSize} />
    </div>
  );
}

// ── Carousel with 3 panes: prev / current / next ──────────────────────────
function LyricsCarousel({ himnos, currentIndex, setActiveId, fontSize }: {
  himnos: Himno[];
  currentIndex: number;
  setActiveId: (id: number) => void;
  fontSize: number;
}) {
  const getOffset = useCallback(() => -window.innerWidth, []);
  const [translate, setTranslate] = useState(getOffset);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startXRef = useRef(0);
  const baseRef = useRef(0);

  const prevHimno = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const nextHimno = currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;

  // Reset position when index changes externally (button nav)
  useEffect(() => {
    setTranslate(-window.innerWidth);
    baseRef.current = -window.innerWidth;
    setIsAnimating(false);
    setIsDragging(false);
  }, [currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isAnimating) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    baseRef.current = translate;
  }, [isAnimating, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || isAnimating) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    const base = baseRef.current;
    // Base is -100vw (center). Drag left reveals next, drag right reveals prev
    const maxLeft = nextHimno ? base - 200 : base;
    const maxRight = prevHimno ? base + 200 : base;
    setTranslate(Math.max(maxLeft, Math.min(maxRight, base + deltaX)));
  }, [isDragging, isAnimating, prevHimno, nextHimno]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isAnimating) return;
    setIsDragging(false);

    const center = -window.innerWidth;
    const offset = translate - center;

    if (offset < -100 && nextHimno) {
      // Swipe left → go next
      setIsAnimating(true);
      setTranslate(-2 * window.innerWidth);
      setTimeout(() => {
        setActiveId(nextHimno.id);
      }, 280);
    } else if (offset > 100 && prevHimno) {
      // Swipe right → go prev
      setIsAnimating(true);
      setTranslate(0);
      setTimeout(() => {
        setActiveId(prevHimno.id);
      }, 280);
    } else {
      // Bounce back to center
      setIsAnimating(true);
      setTranslate(center);
      setTimeout(() => setIsAnimating(false), 250);
    }
  }, [isDragging, isAnimating, translate, prevHimno, nextHimno, setActiveId]);

  return (
    <div
      style={{ overflow: 'hidden', width: '100%', touchAction: 'none', userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          display: 'flex',
          transform: `translateX(${translate}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
          width: '100%',
        }}
      >
        {/* Prev pane */}
        <div style={{ minWidth: '100vw', boxSizing: 'border-box' }}>
          {prevHimno ? (
            <div style={{ opacity: 0.45 }}>
              <HymnPane himno={prevHimno} fontSize={fontSize} />
            </div>
          ) : <div style={{ minWidth: '100vw' }} />}
        </div>

        {/* Current pane */}
        <div style={{ minWidth: '100vw', boxSizing: 'border-box' }}>
          <HymnPane himno={himnos[currentIndex]} fontSize={fontSize} />
        </div>

        {/* Next pane */}
        <div style={{ minWidth: '100vw', boxSizing: 'border-box' }}>
          {nextHimno ? (
            <div style={{ opacity: 0.45 }}>
              <HymnPane himno={nextHimno} fontSize={fontSize} />
            </div>
          ) : <div style={{ minWidth: '100vw' }} />}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function HymnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { himnos, loading } = useHimnos();

  const [activeId, setActiveId] = useState<number | null>(null);

  // Sync activeId from URL (only on mount and direct navigation)
  const urlId = Number(id);
  useEffect(() => {
    if (!isNaN(urlId)) {
      setActiveId(urlId);
    }
  }, [urlId]);

  // Fix URL if it doesn't match active hymn (after swipe)
  useEffect(() => {
    if (activeId && activeId !== urlId && !isNaN(urlId)) {
      navigate(`/himno/${activeId}`, { replace: true });
    }
  }, [activeId]);

  const currentIndex = activeId ? himnos.findIndex(h => h.id === activeId) : -1;
  const himno = currentIndex >= 0 ? himnos[currentIndex] : null;
  const prevHimno = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const nextHimno = currentIndex >= 0 && currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;

  const goNext = useCallback(() => nextHimno && setActiveId(nextHimno.id), [nextHimno]);
  const goPrev = useCallback(() => prevHimno && setActiveId(prevHimno.id), [prevHimno]);

  const [showScore, setShowScore] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? Number(saved) : 19;
  });
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const himnoFav = himno ? isFavorite(himno.id) : false;
  const [favBurst, setFavBurst] = useState(false);
  const [favRipple, setFavRipple] = useState(false);

  const handleShare = () => {
    if (navigator.share && himno) {
      navigator.share({ title: himno.nombre, text: `${himno.nombre}\n\n${himno.letra}` }).catch(console.error);
    }
  };

  // Reset scroll when hymn changes
  useEffect(() => { window.scrollTo(0, 0); }, [activeId]);

  // Save to history
  useEffect(() => {
    if (himno) {
      const history = getJSON<{ id: number; nombre: string; numero: string; timestamp: number }[]>(STORAGE_KEYS.HISTORY, []);
      const filtered = history.filter((h: { id: number }) => h.id !== himno.id);
      filtered.unshift({ id: himno.id, nombre: himno.nombre, numero: himno.numero, timestamp: Date.now() });
      if (filtered.length > MAX_HISTORY) filtered.pop();
      setJSON(STORAGE_KEYS.HISTORY, filtered);
    }
  }, [himno]);

  // Presentation mode
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentStanzaIndex, setCurrentStanzaIndex] = useState(0);

  interface SlideSection { type: 'estrofa' | 'coro' | 'pre-coro' | 'puente'; label?: string; number?: number; lines: string[]; }
  const slides: SlideSection[] = [];
  if (himno) {
    if (himno.letra_estructurada) {
      himno.letra_estructurada.forEach(sec => {
        if (['e', 'c', 'p', 'b'].includes(sec.t)) {
          let typeName: SlideSection['type'] = 'estrofa';
          if (sec.t === 'c') typeName = 'coro';
          else if (sec.t === 'p') typeName = 'pre-coro';
          else if (sec.t === 'b') typeName = 'puente';
          slides.push({ type: typeName, label: sec.lbl, number: sec.n, lines: sec.l });
        }
      });
    } else {
      himno.letra.split('\n \n').map(s => s.trim()).filter(s => s.length > 0).forEach(s => {
        const isChorus = s.toUpperCase().startsWith('CORO');
        slides.push({ type: isChorus ? 'coro' : 'estrofa', lines: (isChorus ? s.replace(/^CORO\s*/i, '').trim() : s).split('\n').map(l => l.trim()).filter(l => l.length > 0) });
      });
    }
  }

  const enterPresentationMode = async () => {
    setCurrentStanzaIndex(0); setPresentationMode(true);
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      if (screen.orientation && 'lock' in screen.orientation) await (screen.orientation as any).lock('landscape').catch(() => {});
    } catch (e) { console.warn("Fullscreen failed:", e); }
  };

  const exitPresentationMode = async () => {
    setPresentationMode(false);
    try {
      if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen();
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) { console.warn("Exit fullscreen failed:", e); }
  };

  const nextStanza = useCallback(() => setCurrentStanzaIndex(prev => Math.min(prev + 1, slides.length - 1)), [slides.length]);
  const prevStanza = useCallback(() => setCurrentStanzaIndex(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentationMode) return;
      if (e.key === 'ArrowRight' || e.key === ' ') nextStanza();
      else if (e.key === 'ArrowLeft') prevStanza();
      else if (e.key === 'Escape') exitPresentationMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode, nextStanza, prevStanza]);

  useEffect(() => {
    return () => {
      if (presentationMode) {
        if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
      }
    };
  }, [presentationMode]);

  if (loading) return <SkeletonDetail />;
  if (!himno) return <div style={{ padding: 20 }}>Himno no encontrado</div>;

  const pages = himno.page && himno.page !== 'none' ? himno.page.split(',') : [];
  const ytVideos = himno.aud ? himno.aud.filter(a => a.src === 'YT') : [];

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', position: 'relative' }}>
      {/* Top Bar */}
      <div className="detail-top-bar-wrapper">
        <header className="detail-top-bar" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={() => navigate(-1)} className="detail-top-bar-btn" aria-label="Volver">
              <ArrowLeft size={24} style={{ color: 'var(--on-background)' }} />
            </button>
          </div>
          <div className="detail-top-bar-badge" style={{ fontSize: '15px' }}>{himno.numero}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => { himno && toggleFavorite(himno.id); if (himno) { setFavBurst(true); if (!himnoFav) setFavRipple(true); setTimeout(() => { setFavBurst(false); setFavRipple(false); }, 500); } }} className="detail-top-bar-btn" aria-label="Favorito" style={{ position: 'relative' }}>
              {favRipple && <div className="fav-ripple" />}
              <Heart size={20} key={String(himnoFav) + favBurst} className={favBurst ? 'fav-burst' : ''} style={{ fill: himnoFav ? 'var(--primary)' : 'none', color: himnoFav ? 'var(--primary)' : 'var(--on-background)' }} />
            </button>
          </div>
        </header>
      </div>

      {/* Lyrics carousel */}
      <main>
        <LyricsCarousel
          himnos={himnos}
          currentIndex={currentIndex}
          setActiveId={setActiveId}
          fontSize={fontSize}
        />
      </main>

      {/* Background overlay when menus open */}
      {(showTextSettings || showOptionsMenu) && (
        <div className="menu-backdrop" onClick={() => { setShowTextSettings(false); setShowOptionsMenu(false); }} />
      )}

      {/* Bottom Bar */}
      <div className="detail-bottom-bar-wrapper">
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
            <input type="range" min="14" max="30" value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))} className="text-size-slider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>{fontSize === 19 ? 'Tamaño original' : 'Tamaño modificado'}</span>
              {fontSize !== 19 && (
                <button onClick={() => setFontSize(19)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
                  Restaurar original
                </button>
              )}
            </div>
          </div>
        )}

        {showOptionsMenu && (
          <div className="options-menu">
            {himno.info && himno.info !== 'none' && himno.info.trim() !== '' && (
              <div className="options-menu-info">{himno.info}</div>
            )}
            <button className="options-menu-item" onClick={() => { setShowOptionsMenu(false); handleShare(); }}>
              <Share2 size={20} /><span>Compartir</span>
            </button>
            <button className="options-menu-item" onClick={() => { setShowOptionsMenu(false); setShowTextSettings(true); }}>
              <Type size={20} /><span>Tamaño de letra</span>
            </button>
            <button className="options-menu-item" onClick={() => { setShowOptionsMenu(false); enterPresentationMode(); }}>
              <Monitor size={20} /><span>Modo presentación</span>
            </button>
          </div>
        )}

        <div className="detail-bottom-bar-divider" />
        <div className="detail-bottom-bar">
          <button className="detail-bottom-bar-btn" onClick={goPrev} style={{ opacity: prevHimno ? 1 : 0.3 }} disabled={!prevHimno}>
            <ChevronLeft size={28} />
          </button>

          <div className="detail-bottom-center-buttons">
            <button className={`detail-bottom-action-btn ${showScore ? 'active' : ''}`}
              onClick={() => setShowScore(!showScore)} style={{ opacity: pages.length > 0 ? 1 : 0.3 }} disabled={pages.length === 0}>
              <FileMusic size={20} />
            </button>
            <button className={`detail-bottom-action-btn ${showVideo ? 'active' : ''}`}
              onClick={() => setShowVideo(!showVideo)} style={{ opacity: ytVideos.length > 0 ? 1 : 0.3 }} disabled={ytVideos.length === 0}>
              <Music size={20} />
            </button>
            <button className={`detail-bottom-action-btn ${showOptionsMenu ? 'active' : ''}`}
              onClick={() => setShowOptionsMenu(!showOptionsMenu)} title="Más opciones">
              <MoreVertical size={20} />
            </button>
          </div>

          <button className="detail-bottom-bar-btn" onClick={goNext} style={{ opacity: nextHimno ? 1 : 0.3 }} disabled={!nextHimno}>
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {/* Presentation Mode */}
      {presentationMode && (
        <div className="presentation-overlay">
          <button className="presentation-close-btn" onClick={exitPresentationMode} aria-label="Salir"><X size={24} /></button>
          <div className="presentation-content-area">
            {currentStanzaIndex > 0 && <div className="presentation-touch-area presentation-touch-left" onClick={prevStanza}><ChevronLeft size={48} style={{ opacity: 0.5 }} /></div>}
            <div className="presentation-slide" key={currentStanzaIndex}>
              {(() => {
                const slide = slides[currentStanzaIndex];
                if (!slide) return null;
                let typeText = '';
                if (slide.type === 'estrofa') typeText = slide.number ? `Estrofa ${slide.number}` : '';
                else if (slide.type === 'coro') typeText = `Coro ${slide.number || ''}`;
                else if (slide.type === 'pre-coro') typeText = 'Pre-Coro';
                else if (slide.type === 'puente') typeText = 'Puente';
                let voiceClass = 'voice-generic';
                if (slide.label) {
                  const l = slide.label.toLowerCase();
                  if (l.includes('hermano')) voiceClass = 'voice-hermanos';
                  else if (l.includes('hermana')) voiceClass = 'voice-hermanas';
                  else if (l.includes('todo')) voiceClass = 'voice-todos';
                }
                return (
                  <>
                    <div className="presentation-section-type">{typeText.trim()}</div>
                    {slide.label && <div><span className={`lyrics-voice-badge ${voiceClass}`}>{slide.label}</span></div>}
                    {slide.lines.map((line, idx) => <div key={idx}>{line}</div>)}
                  </>
                );
              })()}
            </div>
            {currentStanzaIndex < slides.length - 1 && <div className="presentation-touch-area presentation-touch-right" onClick={nextStanza}><ChevronRight size={48} style={{ opacity: 0.5 }} /></div>}
          </div>
          <div className="presentation-progress">
            {slides.map((_, i) => <div key={i} className={`presentation-dot ${i === currentStanzaIndex ? 'active' : ''}`} />)}
          </div>
        </div>
      )}
    </div>
  );
}
