import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useHimnos } from '../hooks/useHimnos';
import HimnoItem from '../components/HimnoItem';

export default function Favoritos() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const { himnos } = useHimnos();

  useEffect(() => {
    const favs = localStorage.getItem('favorites');
    if (favs) {
      setFavorites(JSON.parse(favs));
    }
  }, []);

  const favoriteHymns = himnos.filter(h => favorites.includes(h.id));

  return (
    <div className="page-enter-active" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Top Banner similar to the screenshot */}
      <div style={{ padding: '24px 16px 16px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: 90,
          height: 90,
          backgroundColor: 'var(--primary)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Heart size={45} style={{ fill: 'var(--on-primary)', color: 'var(--on-primary)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--on-background)', lineHeight: 1.2, marginBottom: '4px' }}>
            Mis Alabanzas<br/>Favoritas
          </h1>
          <div style={{ fontSize: '15px', color: 'var(--outline)' }}>
            {favoriteHymns.length} {favoriteHymns.length === 1 ? 'himno' : 'himnos'}
          </div>
        </div>
      </div>

      <div className="himno-item-divider" style={{ marginBottom: 8 }} />

      <main>
        {favoriteHymns.length === 0 ? (
          <div className="empty-view-container">
            <div className="empty-view-icon" style={{ marginBottom: 16 }} />
            <p>Aún no tienes himnos favoritos.</p>
          </div>
        ) : (
          favoriteHymns.map(h => (
            <HimnoItem 
              key={h.id} 
              himno={h} 
              isFavorite={true}
              onFavoriteToggle={() => {
                const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
                setFavorites(favs);
              }}
            />
          ))
        )}
      </main>
    </div>
  );
}
