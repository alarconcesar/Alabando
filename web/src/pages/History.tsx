import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useHimnos } from '../hooks/useHimnos';
import HimnoItem from '../components/HimnoItem';
import { SkeletonHimnoItem } from '../components/Skeletons';
import { getJSON, removeKey } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { HistoryItem } from '../types.d';

export default function History() {
  const navigate = useNavigate();
  const { himnos, loading } = useHimnos();
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    getJSON<HistoryItem[]>(STORAGE_KEYS.HISTORY, []),
  );

  const clearHistory = () => {
    removeKey(STORAGE_KEYS.HISTORY);
    setHistory([]);
  };

  const historyHimnos = history
    .map(histItem => himnos.find(h => h.id === histItem.id))
    .filter((h): h is NonNullable<typeof h> => !!h);

  return (
    <div className="page-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 80 }}>
      <header className="app-bar">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Atrás">
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, marginLeft: 12, fontSize: '1.25rem', fontWeight: 700 }}>Vistos Recientemente</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              background: 'transparent', border: 'none', color: 'var(--primary)',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Trash2 size={18} />
            Limpiar
          </button>
        )}
      </header>

      <main style={{ marginTop: 8 }}>
        {loading ? (
          <div>
            <div className="himno-item-divider" />
            {Array.from({ length: 5 }).map((_, i) => <SkeletonHimnoItem key={i} />)}
          </div>
        ) : historyHimnos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--outline)' }}>
            No has visto ningún himno recientemente.
          </div>
        ) : (
          <div>
            <div className="himno-item-divider" />
            {historyHimnos.map((h, index) => (
              <HimnoItem key={`${h.id}-${index}`} himno={h} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
