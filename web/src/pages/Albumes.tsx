import { useHimnos } from '../hooks/useHimnos';
import { useMemo } from 'react';
import { SkeletonAlbumes } from '../components/Skeletons';
import { Link } from 'react-router-dom';

export default function Albumes() {
  const { himnos, loading } = useHimnos();

  const categorias = useMemo(() => {
    const cats = new Set<string>();
    himnos.forEach(h => cats.add(h.categoria));
    // Sort categories alphabetically
    return Array.from(cats).sort();
  }, [himnos]);

  return (
    <div className="page-enter-active" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 100 }}>
      <header className="app-bar" style={{ padding: '16px 20px', borderBottom: 'none' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--on-background)' }}>Álbumes</h1>
      </header>
      
      <div className="himno-item-divider" style={{ margin: '0 16px 8px 16px' }} />

      <main>
        {loading ? (
          <SkeletonAlbumes />
        ) : (
          categorias.map((cat, index) => {
            const count = himnos.filter(h => h.categoria === cat).length;
            return (
              <div key={cat}>
                <Link 
                  to={`/search?cat=${encodeURIComponent(cat)}`} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: '16px 20px', 
                    textDecoration: 'none',
                    color: 'var(--on-background)'
                  }}
                  className="himno-item-container"
                >
                  <span style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    {cat}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--outline)' }}>
                    {count} {count === 1 ? 'himno' : 'himnos'}
                  </span>
                </Link>
                {index < categorias.length - 1 && (
                  <div className="himno-item-divider" style={{ margin: '0 16px' }} />
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
