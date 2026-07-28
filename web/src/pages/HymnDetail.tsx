import { useParams, useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { useFavorites } from '../hooks/useFavorites';
import { Heart, Share2, ChevronLeft, ChevronRight, FileMusic, Music, Type, ArrowLeft, Monitor, X, MoreVertical } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
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

// ── Full hymn pane ─────────────────────────────────────────────────────────
function HymnPane({ himno, fontSize }: { himno: Himno; fontSize: number }) {
  return (
    <div className="hymn-detail-lyrics-container" style={{ paddingBottom: 200 }}>
      <h1 className="hymn-detail-title-main">{himno.nombre}</h1>
      <HymnLyricsBody himno={himno} fontSize={fontSize} />
    </div>
  );
}

// ── 3-pane carousel ────────────────────────────────────────────────────────
function LyricsCarousel({ himnos, currentIndex, setActiveId, fontSize }: {
  himnos: Himno[];
  currentIndex: number;
  setActiveId: (id: number) => void;
  fontSize: number;
}) {
  const centerX = -window.innerWidth;
  const [translate, setTranslate] = useState(centerX);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const base = useRef(centerX);

  const prev = currentIndex > 0 ? himnos[currentIndex - 1] : null;
  const next = currentIndex < himnos.length - 1 ? himnos[currentIndex + 1] : null;

  // Jump to center immediately when index changes
  useEffect(() => {
    setTranslate(centerX);
    base.current = centerX;
    setDragging(false);
  }, [currentIndex, centerX]);

  const onStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setDragging(true);
    startX.current = e.touches[0].clientX;
    base.current = translate;
  }, [translate]);

  const onMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX.current;
    const b = base.current;
    setTranslate(Math.max(next ? b - 250 : b, Math.min(prev ? b + 250 : b, b + dx)));
  }, [dragging, prev, next]);

  const onEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    const offset = translate - centerX;
    if (offset < -100 && next) {
      setActiveId(next.id);
    } else if (offset > 100 && prev) {
      setActiveId(prev.id);
    } else {
      setTranslate(centerX);
    }
  }, [dragging, translate, centerX, prev, next, setActiveId]);

  return (
    <div style={{ overflow: 'hidden', width: '100%', touchAction: 'none', userSelect: 'none' }}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
      <div style={{
        display: 'flex',
        transform: `translateX(${translate}px)`,
        transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        width: '100%',
      }}>
        <div style={{ minWidth: '100vw' }}>
          {prev ? <HymnPane himno={prev} fontSize={fontSize} /> : <div style={{ minWidth: '100vw' }} />}
        </div>
        <div style={{ minWidth: '100vw' }}>
          <HymnPane himno={himnos[currentIndex]} fontSize={fontSize} />
        </div>
        <div style={{ minWidth: '100vw' }}>
          {next ? <HymnPane himno={next} fontSize={fontSize} /> : <div style={{ minWidth: '100vw' }} />}
        </div>
      </div>
    </div>
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

  const goNext = useCallback(() => nextHimno && setActiveId(nextHimno.id), [nextHimno]);
  const goPrev = useCallback(() => prevHimno && setActiveId(prevHimno.id), [prevHimno]);

  // ── UI state ─────────────────────────────────────────────
  const [showScore, setShowScore] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('fontSize')) || 19);
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

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

  if (loading) return <SkeletonDetail />;
  if (!himno) return <div style={{ padding: 20, color: 'var(--outline)' }}>Himno no encontrado</div>;

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
            <button onClick={() => { toggleFavorite(himno.id); setFavBurst(true); if (!himnoFav) setFavRipple(true); setTimeout(() => { setFavBurst(false); setFavRipple(false); }, 500); }} className="detail-top-bar-btn" aria-label="Favorito" style={{ position: 'relative' }}>
              {favRipple && <div className="fav-ripple" />}
              <Heart size={20} key={String(himnoFav) + favBurst} className={favBurst ? 'fav-burst' : ''} style={{ fill: himnoFav ? 'var(--primary)' : 'none', color: himnoFav ? 'var(--primary)' : 'var(--on-background)' }} />
            </button>
          </div>
        </header>
      </div>

      <main><LyricsCarousel himnos={himnos} currentIndex={currentIndex} setActiveId={setActiveId} fontSize={fontSize} /></main>

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
          <button className="detail-bottom-bar-btn" onClick={goPrev} style={{ opacity: prevHimno ? 1 : 0.3 }} disabled={!prevHimno}><ChevronLeft size={28} /></button>
          <div className="detail-bottom-center-buttons">
            <button className={`detail-bottom-action-btn ${showScore ? 'active' : ''}`} onClick={() => setShowScore(s => !s)} style={{ opacity: pages.length > 0 ? 1 : 0.3 }} disabled={pages.length === 0}><FileMusic size={20} /></button>
            <button className={`detail-bottom-action-btn ${showVideo ? 'active' : ''}`} onClick={() => setShowVideo(s => !s)} style={{ opacity: ytVideos.length > 0 ? 1 : 0.3 }} disabled={ytVideos.length === 0}><Music size={20} /></button>
            <button className={`detail-bottom-action-btn ${showOptionsMenu ? 'active' : ''}`} onClick={() => setShowOptionsMenu(s => !s)} title="Más opciones"><MoreVertical size={20} /></button>
          </div>
          <button className="detail-bottom-bar-btn" onClick={goNext} style={{ opacity: nextHimno ? 1 : 0.3 }} disabled={!nextHimno}><ChevronRight size={28} /></button>
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
    </div>
  );
}
