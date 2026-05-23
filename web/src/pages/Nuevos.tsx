import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { ArrowLeft } from 'lucide-react';
import HimnoItem from '../components/HimnoItem';

export default function Nuevos() {
  const { himnos, loading } = useHimnos();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(favs);
  }, []);

  // Asumimos que los últimos 50 himnos del JSON son los agregados más recientemente
  const ultimos = [...himnos].reverse().slice(0, 50);

  return (
    <div className="page-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 80 }}>
      <header className="app-bar">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Atrás">
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, marginLeft: 12, fontSize: '1.25rem', fontWeight: 700 }}>Últimos Agregados</h1>
      </header>

      <main style={{ marginTop: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--outline)' }}>Cargando...</div>
        ) : (
          <div>
            <div className="himno-item-divider" />
            {ultimos.map(h => (
              <HimnoItem 
                key={h.id} 
                himno={h} 
                isFavorite={favorites.includes(h.id)}
                onFavoriteToggle={() => {
                  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
                  setFavorites(favs);
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
