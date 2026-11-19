import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Music2 } from 'lucide-react';
import { parseMidiBuffer, WebAudioMidiPlayer } from '../lib/midiPlayer';

interface MidiPlayerProps {
  url: string;
  title?: string;
}

function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function MidiPlayer({ url, title }: MidiPlayerProps) {
  const playerRef = useRef<WebAudioMidiPlayer | null>(null);
  const [prevUrl, setPrevUrl] = useState(url);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [transpose, setTranspose] = useState(0);

  if (prevUrl !== url) {
    setPrevUrl(url);
    setLoadedUrl(null);
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }

  const loading = loadedUrl !== url && error === null;

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    fetch(url, { signal: ctrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buf => {
        if (cancelled) return;
        const parsed = parseMidiBuffer(buf);
        const player = new WebAudioMidiPlayer(parsed, (t, isPlaying) => {
          setCurrentTime(t);
          setPlaying(isPlaying);
        });
        playerRef.current = player;
        setDuration(parsed.duration);
        setLoadedUrl(url);
      })
      .catch(err => {
        if (cancelled || (err as Error).name === 'AbortError') return;
        setError('No se pudo cargar el audio guía MIDI');
      });

    return () => {
      cancelled = true;
      ctrl.abort();
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    playerRef.current?.setRate(rate);
  }, [rate]);

  useEffect(() => {
    playerRef.current?.setTranspose(transpose);
  }, [transpose]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else p.play();
  };

  return (
    <div
      className="midi-player-card"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--surface-variant)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Music2 size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--on-surface)' }}>
            Audio guía (MIDI)
          </span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 999,
            backgroundColor: 'var(--primary-container)',
            color: 'var(--on-primary-container)',
            flexShrink: 0,
          }}
        >
          Referencia
        </span>
      </div>

      {loading ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>Cargando partitura MIDI...</p>
      ) : error ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>{error}</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? `Pausar audio guía de ${title ?? 'himno'}` : `Reproducir audio guía de ${title ?? 'himno'}`}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
            </button>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                type="range"
                min={0}
                max={Math.max(0.1, duration)}
                step={0.1}
                value={Math.min(currentTime, duration)}
                onChange={e => playerRef.current?.seek(Number(e.target.value))}
                aria-label="Progreso del audio guía"
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--outline)' }}>
                <span>{formatSec(currentTime)}</span>
                <span>{formatSec(duration)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => playerRef.current?.stop()}
              aria-label="Reiniciar audio guía"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid var(--surface-variant)',
                backgroundColor: 'transparent',
                color: 'var(--on-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>Velocidad:</span>
              {[0.75, 1, 1.25].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`filter-chip ${rate === r ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '3px 9px' }}
                >
                  {r}×
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>Tono:</span>
              <button
                type="button"
                onClick={() => setTranspose(t => Math.max(-6, t - 1))}
                aria-label="Bajar un semitono"
                className="filter-chip"
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                -
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 28, textAlign: 'center', color: 'var(--on-surface)' }}>
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <button
                type="button"
                onClick={() => setTranspose(t => Math.min(6, t + 1))}
                aria-label="Subir un semitono"
                className="filter-chip"
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                +
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
