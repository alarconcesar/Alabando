import { useHimnos } from '../hooks/useHimnos';
import { useMemo } from 'react';
import { SkeletonAlbumes } from '../components/Skeletons';
import { Link } from 'react-router-dom';
import { getAlbumGradient, getAlbumTint } from '../lib/constants';
import { ChevronRight } from 'lucide-react';

export default function Albumes() {
  const { himnos, loading } = useHimnos();

  const categorias = useMemo(() => {
    const cats = new Map<string, number>();
    himnos.forEach(h => {
      cats.set(h.categoria, (cats.get(h.categoria) || 0) + 1);
    });
    return Array.from(cats.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [himnos]);

  return (
    <div className="page-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 100 }}>
      <header className="app-bar" style={{ padding: '16px 20px', borderBottom: 'none' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--on-background)' }}>Categorías</h1>
      </header>

      <div className="himno-item-divider" style={{ margin: '0 16px 16px 16px' }} />

      <main style={{ padding: '0 16px' }}>
        {loading ? (
          <SkeletonAlbumes />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {categorias.map(([cat, count]) => {
              const gradient = getAlbumGradient(cat);
              return (
                <Link
                  key={cat}
                  to={`/search?cat=${encodeURIComponent(cat)}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="album-card"
                    style={{
                      borderRadius: 16,
                      padding: '20px 16px',
                      minHeight: 110,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                      background: getAlbumTint(gradient),
                      border: '1px solid var(--surface-variant)',
                      transition: 'transform 0.2s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <h3 style={{
                        color: 'var(--on-background)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        lineHeight: 1.25,
                      }}>
                        {cat}
                      </h3>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{
                        color: 'var(--outline)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        {count} {count === 1 ? 'himno' : 'himnos'}
                      </span>
                      <ChevronRight size={16} style={{ color: 'var(--outline)' }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
