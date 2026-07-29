import { useParams, useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { useFavorites } from '../hooks/useFavorites';
import { Heart, Share2, ChevronLeft, ChevronRight, FileMusic, Music, Type, ArrowLeft, Monitor, X, MoreVertical } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { STORAGE_KEYS, MAX_HISTORY } from '../lib/constants';
import { SkeletonDetail } from '../components/Skeletons';
import type { Himno } from '../types.d';

// ── Lyrics body (shared) ──────────────────────────────────────────────────
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
          else if (sec.t === 's') return (<div key={i} className="lyrics-section-title-container">{sec.lbl}</div>);
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

// ── Full hymn pane (title + lyrics) ───────────────────────────────────────
function HymnPane({ himno, fontSize }: { himno: Himno; fontSize: number }) {
  return (
    <div className="hymn-detail-lyrics-container" style={{ paddingBottom: 130 }}>
      <h1 className="hymn-detail-title-main">{himno.nombre}</h1>
      <HymnLyricsBody himno={himno} fontSize={fontSize} />
    </div>
  );
}

// ── 3-pane carousel (overflow hidden clips sides, body scrolls vertical) ──
function LyricsCarousel({ himnos, currentIndex, setActiveId, fontSize }: {
  himnos: Himno[];
  currentIndex: number;
  setActiveId: (id: number) => void;
  fontSize: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animate, setAnimate] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const base = useRef(0);
  const animatingRef = useRef(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null as unknown as ReturnType<typeof setTimeout>);

  // Refs para evitar stale closures en event handlers durante swipes rápidos
  const translateRef = useRef(0);
  const prevRef = useRef<Himno | null>(null);
  const nextRef = useRef<Himno | null>(null);

  const prev = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const next = currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;
  // Sincronizar refs en cada render (antes de event handlers)
  prevRef.current = prev;
  nextRef.current = next;

  // Jump to center immediately — no transition
  useLayoutEffect(() => {
    clearTimeout(navTimeoutRef.current);
    animatingRef.current = false;
    setAnimate(false);
    setTranslate(0);
    translateRef.current = 0;
    base.current = 0;
    setDragging(false);
  }, [currentIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(navTimeoutRef.current);
  }, []);

  const onStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    // If animation is in progress, cancel it and read current visual position from DOM
    if (animatingRef.current) {
      clearTimeout(navTimeoutRef.current);
      animatingRef.current = false;
      setAnimate(false);
      // Leer la posición visual REAL del DOM, no el target del state
      // La CSS transition está mid-flight, el state ya saltó al target final
      const el = trackRef.current;
      if (el) {
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        const fullTx = matrix.m41 || 0;  // translateX total en píxeles
        const w = el.clientWidth;
        // transform: translateX(calc(-100% + Npx)) → matrix.m41 = -w + N
        // Despejamos N para obtener el translate "real" en ese instante
        const currentN = fullTx + w;
        base.current = currentN;
        setTranslate(currentN);
        translateRef.current = currentN;
      } else {
        base.current = 0;
      }
    }
    setDragging(true);
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    base.current = translateRef.current;
  }, []);

  const onMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Mostly vertical → let page scroll through
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

    e.preventDefault();
    const b = base.current;
    const maxDist = trackRef.current?.clientWidth ?? 300;
    const newVal = Math.max(-maxDist, Math.min(maxDist, b + dx));
    setTranslate(newVal);
    translateRef.current = newVal;
  }, [dragging]);

  // Helper para animar navegación desde swipe o botones
  const animateTo = useCallback((direction: -1 | 1, targetId: number) => {
    if (animatingRef.current) return;
    window.scrollTo(0, 0);
    animatingRef.current = true;
    setAnimate(true);
    setDragging(false);
    const containerWidth = trackRef.current?.clientWidth ?? window.innerWidth;
    const newTranslate = direction === 1 ? -containerWidth : containerWidth;
    setTranslate(newTranslate);
    translateRef.current = newTranslate;
    clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = setTimeout(() => {
      animatingRef.current = false;
      setActiveId(targetId);
    }, 250);
  }, [setActiveId]);

  const onEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    const containerWidth = trackRef.current?.clientWidth ?? window.innerWidth;
    const threshold = containerWidth * 0.2;
    const t = translateRef.current;
    if (t < -threshold && nextRef.current) {
      animateTo(1, nextRef.current.id);
    } else if (t > threshold && prevRef.current) {
      animateTo(-1, prevRef.current.id);
    } else {
      setAnimate(true);
      setTranslate(0);
      translateRef.current = 0;
    }
  }, [dragging, animateTo]);

  return (
    <>
      {/* Track animado */}
      <div style={{ width: '100%', overflow: 'hidden', position: 'relative', touchAction: 'pan-y', userSelect: 'none' }}>
        {/* Invisible height driver — solo el himno actual define la altura */}
        <div style={{ visibility: 'hidden' }}>
          <div className="hymn-detail-lyrics-container" style={{ paddingBottom: 130 }}>
            <HymnLyricsBody himno={himnos[currentIndex]} fontSize={fontSize} />
          </div>
        </div>
        <div ref={trackRef} style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          transform: `translateX(calc(-100% + ${translate}px))`,
          transition: dragging || !animate ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        >
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            {prev ? <HymnPane himno={prev} fontSize={fontSize} /> : <div style={{ height: 1 }} />}
          </div>
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            <HymnPane himno={himnos[currentIndex]} fontSize={fontSize} />
          </div>
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            {next ? <HymnPane himno={next} fontSize={fontSize} /> : <div style={{ height: 1 }} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function HymnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { himnos, loading } = useHimnos();

  // Active hymn (local state keeps component mounted on swipe)
  const [activeId, setActiveId] = useState<number | null>(null);

  const urlId = Number(id);

  // Sync from URL (link / back navigation)
  useEffect(() => {
    if (!isNaN(urlId)) {
      setActiveId(urlId);
    }
  }, [urlId]);

  // Sync URL silently after swipe changes
  useEffect(() => {
    if (activeId && activeId !== urlId && !isNaN(urlId)) {
      navigate(`/himno/${activeId}`, { replace: true });
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIndex = activeId ? himnos.findIndex(h => h.id === activeId) : -1;
  const himno = currentIndex >= 0 ? himnos[currentIndex] : null;
  const prevHimno = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const nextHimno = currentIndex >= 0 && currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;

  // ── UI state ─────────────────────────────────────────────
  const [showScore, setShowScore] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('fontSize')) || 19);
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  // Persist font size
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  // Reset per-himno state when hymn changes
  useEffect(() => {
    setSelectedVideoIndex(0);
    setShowScore(false);
    setShowVideo(false);
  }, [activeId]);

  const { isFavorite, toggleFavorite } = useFavorites();
  const himnoFav = himno ? isFavorite(himno.id) : false;
  const [favBurst, setFavBurst] = useState(false);
  const [favRipple, setFavRipple] = useState(false);

  const handleShare = () => {
    if (navigator.share && himno) {
      navigator.share({ title: himno.nombre, text: `${himno.nombre}\n\n${himno.letra}` }).catch(() => {});
    }
  };

  useEffect(() => { window.scrollTo(0, 0); }, [activeId]);

  useEffect(() => {
    if (himno) {
      const history = getJSON<{ id: number; nombre: string; numero: string; timestamp: number }[]>(STORAGE_KEYS.HISTORY, []);
      const filtered = history.filter((h: { id: number }) => h.id !== himno.id);
      filtered.unshift({ id: himno.id, nombre: himno.nombre, numero: himno.numero, timestamp: Date.now() });
      if (filtered.length > MAX_HISTORY) filtered.pop();
      setJSON(STORAGE_KEYS.HISTORY, filtered);
    }
  }, [himno]);

  // ── Keyboard navigation between hymns ────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (document.querySelector('.presentation-overlay')) return;
      if (e.key === 'ArrowLeft' && prevHimno) {
        setActiveId(prevHimno.id);
      } else if (e.key === 'ArrowRight' && nextHimno) {
        setActiveId(nextHimno.id);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [prevHimno, nextHimno]);

  // ── Zoom lightbox state ──────────────────────────────────
  const [zoomedPage, setZoomedPage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const [zoomStartX, setZoomStartX] = useState(0);
  const [zoomStartY, setZoomStartY] = useState(0);
  const [pinchStartDist, setPinchStartDist] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  // All pages loaded in the lightbox + current index for multi-page navigation
  const [zoomedPages, setZoomedPages] = useState<string[]>([]);
  const [zoomedPageIndex, setZoomedPageIndex] = useState(0);

  // Reset solo los parámetros de transformación (escala, pan) sin cerrar el lightbox
  const resetZoomTransform = useCallback(() => {
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setIsDraggingZoom(false);
    setZoomStartX(0);
    setZoomStartY(0);
    setPinchStartDist(0);
    setPinchStartScale(1);
  }, []);

  // Resetear TODO el estado del zoom limpiamente (incluye cerrar lightbox)
  const resetZoomState = useCallback(() => {
    setZoomedPage(null);
    setZoomedPages([]);
    setZoomedPageIndex(0);
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setIsDraggingZoom(false);
    setZoomStartX(0);
    setZoomStartY(0);
    setPinchStartDist(0);
    setPinchStartScale(1);
  }, []);

  // Cerrar zoom al cambiar de himno — reset completo
  useEffect(() => {
    resetZoomState();
  }, [activeId, resetZoomState]);

  const clampPan = (x: number, y: number, scale: number) => {
    const limitX = Math.max(0, window.innerWidth * (scale - 0.5));
    const limitY = Math.max(0, window.innerHeight * (scale - 0.5));
    return {
      x: Math.max(-limitX, Math.min(limitX, x)),
      y: Math.max(-limitY, Math.min(limitY, y)),
    };
  };

  const getTouchDist = (t1: Touch | React.Touch, t2: Touch | React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleOpenZoom = (pageUrl: string) => {
    const index = pages.indexOf(pageUrl.replace('/partituras/page_', '').replace('.png', ''));
    resetZoomState();
    setZoomedPages(pages.map(p => `/partituras/page_${p.trim()}.png`));
    setZoomedPageIndex(index >= 0 ? index : 0);
    setZoomedPage(pageUrl); // resetZoomState setea null, esto lo sobreescribe
  };

  // Wheel zoom on the viewport
  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !zoomedPage) return;
    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.15;
      setZoomScale(s => {
        let newScale = s + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
        newScale = Math.min(3, Math.max(1, newScale));
        if (newScale === 1) { setPanX(0); setPanY(0); }
        return newScale;
      });
    };
    node.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => { node.removeEventListener('wheel', handleWheelRaw); };
  }, [zoomedPage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDraggingZoom(true);
    setZoomStartX(e.clientX - panX);
    setZoomStartY(e.clientY - panY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingZoom || zoomScale <= 1) return;
    const clamped = clampPan(e.clientX - zoomStartX, e.clientY - zoomStartY, zoomScale);
    setPanX(clamped.x); setPanY(clamped.y);
  };
  const handleMouseUp = () => setIsDraggingZoom(false);

  const handleZoomTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomScale > 1) {
      setIsDraggingZoom(true);
      setZoomStartX(e.touches[0].clientX - panX);
      setZoomStartY(e.touches[0].clientY - panY);
    } else if (e.touches.length === 2) {
      setIsDraggingZoom(false);
      setPinchStartDist(getTouchDist(e.touches[0], e.touches[1]));
      setPinchStartScale(zoomScale);
    }
  };
  const handleZoomTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingZoom && zoomScale > 1) {
      const clamped = clampPan(e.touches[0].clientX - zoomStartX, e.touches[0].clientY - zoomStartY, zoomScale);
      setPanX(clamped.x); setPanY(clamped.y);
    } else if (e.touches.length === 2 && pinchStartDist > 0) {
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const factor = dist / pinchStartDist;
      let newScale = Math.min(3, Math.max(1, pinchStartScale * factor));
      setZoomScale(newScale);
      if (newScale === 1) { setPanX(0); setPanY(0); }
    }
  };
  const handleZoomTouchEnd = () => {
    setIsDraggingZoom(false);
    setPinchStartDist(0);
  };

  // ── Presentation mode ────────────────────────────────────
  const [presentationMode, setPresentationMode] = useState(false);
  const [stanzaIdx, setStanzaIdx] = useState(0);

  interface SlideSection { type: 'estrofa' | 'coro' | 'pre-coro' | 'puente'; label?: string; number?: number; lines: string[]; }
  const slides: SlideSection[] = [];
  if (himno) {
    if (himno.letra_estructurada) {
      himno.letra_estructurada.forEach(sec => {
        if (!['e', 'c', 'p', 'b'].includes(sec.t)) return;
        const typeMap: Record<string, SlideSection['type']> = { e: 'estrofa', c: 'coro', p: 'pre-coro', b: 'puente' };
        slides.push({ type: typeMap[sec.t], label: sec.lbl, number: sec.n, lines: sec.l });
      });
    } else {
      himno.letra.split('\n \n').filter(s => s.trim()).forEach(s => {
        const isChorus = s.trim().toUpperCase().startsWith('CORO');
        const text = isChorus ? s.trim().replace(/^CORO\s*/i, '').trim() : s.trim();
        slides.push({ type: isChorus ? 'coro' : 'estrofa', lines: text.split('\n').map(l => l.trim()).filter(Boolean) });
      });
    }
  }

  const enterPresentation = async () => {
    setStanzaIdx(0); setPresentationMode(true);
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      if (screen.orientation && 'lock' in screen.orientation) await (screen.orientation as any).lock('landscape').catch(() => {});
    } catch (_) { /* silent */ }
  };
  const exitPresentation = async () => {
    setPresentationMode(false);
    try { document.exitFullscreen?.(); screen.orientation?.unlock?.(); } catch (_) { /* silent */ }
  };
  const nextSlide = useCallback(() => setStanzaIdx(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prevSlide = useCallback(() => setStanzaIdx(i => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (!presentationMode) return;
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'Escape') exitPresentation();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [presentationMode, nextSlide, prevSlide]);

  useEffect(() => {
    return () => { if (presentationMode) { document.exitFullscreen?.().catch(() => {}); screen.orientation?.unlock?.(); } };
  }, [presentationMode]);

  const handleGoPrev = useCallback(() => {
    if (prevHimno) {
      window.scrollTo(0, 0);
      setActiveId(prevHimno.id);
    }
  }, [prevHimno]);

  const handleGoNext = useCallback(() => {
    if (nextHimno) {
      window.scrollTo(0, 0);
      setActiveId(nextHimno.id);
    }
  }, [nextHimno]);

  if (loading) return <SkeletonDetail />;
  if (!himno) return <div style={{ padding: 20, color: 'var(--outline)' }}>Himno no encontrado</div>;

  const pages = himno.page && himno.page !== 'none' ? himno.page.split(',') : [];
  const ytVideos = himno.aud ? himno.aud.filter(a => a.src === 'YT') : [];
  const selectedVideo = ytVideos[selectedVideoIndex] ?? null;

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
            <button onClick={() => { toggleFavorite(himno.id); setFavBurst(true); if (!himnoFav) setFavRipple(true); setTimeout(() => { setFavBurst(false); setFavRipple(false); }, 500); }} className="detail-top-bar-btn" aria-label="Favorito" style={{ position: 'relative' }}>
              {favRipple && <div className="fav-ripple" />}
              <Heart size={20} key={String(himnoFav) + favBurst} className={favBurst ? 'fav-burst' : ''} style={{ fill: himnoFav ? 'var(--primary)' : 'none', color: himnoFav ? 'var(--primary)' : 'var(--on-background)' }} />
            </button>
          </div>
        </header>
      </div>

      <main>
        {/* ── Video Section ── */}
        {showVideo && ytVideos.length > 0 && (
          <div style={{ padding: '0 20px' }}>
            {ytVideos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: '16px 0 0' }}>
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
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%', marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
              <iframe
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                key={selectedVideo.id}
              />
            </div>
          </div>
        )}

        {/* ── Score OR Carousel ── */}
        {showScore && pages.length > 0 ? (
          <div className="hymn-detail-lyrics-container" style={{ paddingBottom: 130 }}>
            <h1 className="hymn-detail-title-main">{himno.nombre}</h1>
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
          </div>
        ) : (
          <LyricsCarousel himnos={himnos} currentIndex={currentIndex} setActiveId={setActiveId} fontSize={fontSize} />
        )}
      </main>

      {(showTextSettings || showOptionsMenu) && (
        <div className="menu-backdrop" onClick={() => { setShowTextSettings(false); setShowOptionsMenu(false); }} />
      )}

      {/* Bottom Bar */}
      <div className="detail-bottom-bar-wrapper">
        {showTextSettings && (
          <div className="text-size-drawer">
            <div className="text-size-drawer-header"><span className="text-size-drawer-title">Tamaño de letra</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Aa</span>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: 'var(--primary)' }}>Aa</span>
              <span style={{ fontSize: '30px', fontWeight: 600 }}>Aa</span>
            </div>
            <input type="range" min="14" max="30" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="text-size-slider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>{fontSize === 19 ? 'Tamaño original' : 'Tamaño modificado'}</span>
              {fontSize !== 19 && <button onClick={() => setFontSize(19)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>Restaurar original</button>}
            </div>
          </div>
        )}
        {showOptionsMenu && (
          <div className="options-menu">
            {himno.info && himno.info !== 'none' && himno.info.trim() !== '' && <div className="options-menu-info">{himno.info}</div>}
            <button className="options-menu-item" onClick={() => { setShowOptionsMenu(false); handleShare(); }}><Share2 size={20} /><span>Compartir</span></button>
            <button className="options-menu-item" onClick={() => { setShowOptionsMenu(false); setShowTextSettings(true); }}><Type size={20} /><span>Tamaño de letra</span></button>
            <button className="options-menu-item" onClick={() => { setShowOptionsMenu(false); enterPresentation(); }}><Monitor size={20} /><span>Modo presentación</span></button>
          </div>
        )}
        <div className="detail-bottom-bar-divider" />
        <div className="detail-bottom-bar">
          <button className="detail-bottom-bar-btn" onClick={handleGoPrev} style={{ opacity: prevHimno ? 1 : 0.3 }} disabled={!prevHimno}><ChevronLeft size={28} /></button>
          <div className="detail-bottom-center-buttons">
            <button className={`detail-bottom-action-btn ${showScore ? 'active' : ''}`} onClick={() => setShowScore(s => !s)} style={{ opacity: pages.length > 0 ? 1 : 0.3 }} disabled={pages.length === 0}><FileMusic size={20} /></button>
            <button className={`detail-bottom-action-btn ${showVideo ? 'active' : ''}`} onClick={() => setShowVideo(s => !s)} style={{ opacity: ytVideos.length > 0 ? 1 : 0.3 }} disabled={ytVideos.length === 0}><Music size={20} /></button>
            <button className={`detail-bottom-action-btn ${showOptionsMenu ? 'active' : ''}`} onClick={() => setShowOptionsMenu(s => !s)} title="Más opciones"><MoreVertical size={20} /></button>
          </div>
          <button className="detail-bottom-bar-btn" onClick={handleGoNext} style={{ opacity: nextHimno ? 1 : 0.3 }} disabled={!nextHimno}><ChevronRight size={28} /></button>
        </div>
      </div>

      {/* Presentation */}
      {presentationMode && (
        <div className="presentation-overlay">
          <button className="presentation-close-btn" onClick={exitPresentation} aria-label="Salir"><X size={24} /></button>
          <div className="presentation-content-area">
            {stanzaIdx > 0 && <div className="presentation-touch-area presentation-touch-left" onClick={prevSlide}><ChevronLeft size={48} style={{ opacity: 0.5 }} /></div>}
            <div className="presentation-slide" key={stanzaIdx}>
              {(() => {
                const s = slides[stanzaIdx];
                if (!s) return null;
                const typeText = s.type === 'estrofa' ? (s.number ? `Estrofa ${s.number}` : '') : s.type === 'coro' ? `Coro ${s.number || ''}` : s.type === 'pre-coro' ? 'Pre-Coro' : 'Puente';
                let vc = 'voice-generic';
                if (s.label) {
                  const l = s.label.toLowerCase();
                  if (l.includes('hermano')) vc = 'voice-hermanos';
                  else if (l.includes('hermana')) vc = 'voice-hermanas';
                  else if (l.includes('todo')) vc = 'voice-todos';
                }
                return (<><div className="presentation-section-type">{typeText.trim()}</div>{s.label && <div><span className={`lyrics-voice-badge ${vc}`}>{s.label}</span></div>}{s.lines.map((line, idx) => <div key={idx}>{line}</div>)}</>);
              })()}
            </div>
            {stanzaIdx < slides.length - 1 && <div className="presentation-touch-area presentation-touch-right" onClick={nextSlide}><ChevronRight size={48} style={{ opacity: 0.5 }} /></div>}
          </div>
          <div className="presentation-progress">{slides.map((_, i) => <div key={i} className={`presentation-dot ${i === stanzaIdx ? 'active' : ''}`} />)}</div>
        </div>
      )}

      {/* ── Partitura Lightbox ── */}
      {zoomedPage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90000,
          backgroundColor: 'rgba(0,0,0,0.97)',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
          userSelect: 'none',
        }}>
          {/* Close button */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 90002 }}>
            <button
              onClick={() => resetZoomState()}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '50%', width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', fontSize: 20,
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Main viewport with zoom/pan — sin botones flotantes */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleZoomTouchStart}
            onTouchMove={handleZoomTouchMove}
            onTouchEnd={handleZoomTouchEnd}
            style={{
              flex: 1, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
              cursor: zoomScale > 1 ? (isDraggingZoom ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none',
            }}
          >
            {/* The zoomable image */}
            <div style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: isDraggingZoom ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              <img
                src={zoomedPage}
                alt="Partitura ampliada"
                style={{
                  maxWidth: '100vw', maxHeight: '85vh',
                  borderRadius: 8, objectFit: 'contain',
                  display: 'block', pointerEvents: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
              />
            </div>
          </div>

          {/* Bottom controls bar — layout fijo, nada se mueve */}
          <div style={{
            position: 'absolute', bottom: 24, left: '50%',
            transform: 'translateX(-50%)', zIndex: 90002,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(20,20,20,0.85)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '6px 10px', borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: '#fff',
          }}>
            {/* ── Page navigation (solo si hay múltiples páginas) ── */}
            {zoomedPages.length > 1 && (<>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <button
                  onClick={() => {
                    resetZoomTransform();
                    setZoomedPageIndex(i => i - 1);
                    setZoomedPage(zoomedPages[zoomedPageIndex - 1]);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    borderRadius: '50%', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: zoomedPageIndex > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
                    cursor: zoomedPageIndex > 0 ? 'pointer' : 'default',
                    flexShrink: 0,
                  }}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={22} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, minWidth: 36, textAlign: 'center' }}>
                  {zoomedPageIndex + 1}/{zoomedPages.length}
                </span>
                <button
                  onClick={() => {
                    resetZoomTransform();
                    setZoomedPageIndex(i => i + 1);
                    setZoomedPage(zoomedPages[zoomedPageIndex + 1]);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    borderRadius: '50%', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: zoomedPageIndex < zoomedPages.length - 1 ? '#fff' : 'rgba(255,255,255,0.2)',
                    cursor: zoomedPageIndex < zoomedPages.length - 1 ? 'pointer' : 'default',
                    flexShrink: 0,
                  }}
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={22} />
                </button>
              </span>

              {/* Separator */}
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            </>)}

            {/* spacer invisible para mantener centrado cuando no hay navegación */}
            {zoomedPages.length <= 1 && <div style={{ width: 1, flexShrink: 0 }} />}

            {/* ── Zoom controls ── */}
            <button
              onClick={() => setZoomScale(s => {
                const next = Math.max(1, s - 0.25);
                if (next === 1) { setPanX(0); setPanY(0); }
                return next;
              })}
              disabled={zoomScale <= 1}
              style={{
                background: 'transparent', border: 'none',
                color: zoomScale <= 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 20, fontWeight: 'bold',
                cursor: zoomScale <= 1 ? 'default' : 'pointer',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              −
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}
              disabled={zoomScale >= 3}
              style={{
                background: 'transparent', border: 'none',
                color: zoomScale >= 3 ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 20, fontWeight: 'bold',
                cursor: zoomScale >= 3 ? 'default' : 'pointer',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              +
            </button>

            {/* Restablecer (always occupies space, disabled by style when zoom=1) */}
            <button
              onClick={() => resetZoomTransform()}
              style={{
                background: zoomScale > 1 ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none',
                borderRadius: 12, color: zoomScale > 1 ? '#fff' : 'rgba(255,255,255,0.2)',
                fontSize: 11, padding: '4px 8px',
                cursor: zoomScale > 1 ? 'pointer' : 'default',
                fontWeight: 600, flexShrink: 0,
              }}
            >
              Rest.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
