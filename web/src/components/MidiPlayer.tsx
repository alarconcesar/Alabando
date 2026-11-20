import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Music2, SlidersHorizontal } from 'lucide-react';
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
  const [showAdjust, setShowAdjust] = useState(false);

  if (prevUrl !== url) {
    setPrevUrl(url);
    setLoadedUrl(null);
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowAdjust(false);
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
  }, [rate, loadedUrl]);

  useEffect(() => {
    playerRef.current?.setTranspose(transpose);
  }, [transpose, loadedUrl]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else p.play(); // al terminar, play() reinicia desde 0
  };

  return (
    <div className="midi-player-card">
      <div className="midi-head">
        <Music2 size={17} aria-hidden="true" />
        <span className="midi-title">Audio guía</span>
        <span className="midi-reference">Referencia</span>
        {!loading && !error && (
          <button
            type="button"
            className="midi-adjust-btn"
            onClick={() => setShowAdjust(v => !v)}
            aria-label="Ajustes del audio guía"
            aria-expanded={showAdjust}
            aria-controls="midi-adjust-panel"
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {loading ? (
        <p className="midi-note">Cargando partitura MIDI…</p>
      ) : error ? (
        <p className="midi-note">{error}</p>
      ) : (
        <>
          <div className="midi-main">
            <button
              type="button"
              className="midi-play"
              onClick={togglePlay}
              aria-label={playing ? `Pausar audio guía de ${title ?? 'himno'}` : `Reproducir audio guía de ${title ?? 'himno'}`}
            >
              {playing ? <Pause size={19} aria-hidden="true" /> : <Play size={19} aria-hidden="true" style={{ marginLeft: 2 }} />}
            </button>

            <input
              className="midi-seek"
              type="range"
              min={0}
              max={Math.max(0.1, duration)}
              step={0.1}
              value={Math.min(currentTime, duration)}
              onChange={e => playerRef.current?.seek(Number(e.target.value))}
              aria-label="Progreso del audio guía"
            />

            <span className="midi-time">
              {formatSec(currentTime)} <span className="midi-time-sep">/</span> {formatSec(duration)}
            </span>
          </div>

          {showAdjust && (
            <div className="midi-adjust-panel" id="midi-adjust-panel">
              <div className="midi-adjust-group">
                <span className="midi-adjust-label">Velocidad</span>
                <div className="midi-adjust-options">
                  {[0.75, 1, 1.25].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRate(r)}
                      className={`filter-chip ${rate === r ? 'active' : ''}`}
                      aria-pressed={rate === r}
                    >
                      {r}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="midi-adjust-group">
                <span className="midi-adjust-label">Tono</span>
                <div className="midi-adjust-options">
                  <button
                    type="button"
                    onClick={() => setTranspose(t => Math.max(-6, t - 1))}
                    className="midi-step"
                    aria-label="Bajar un semitono"
                  >
                    −
                  </button>
                  <span className="midi-value">{transpose > 0 ? `+${transpose}` : transpose}</span>
                  <button
                    type="button"
                    onClick={() => setTranspose(t => Math.min(6, t + 1))}
                    className="midi-step"
                    aria-label="Subir un semitono"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
