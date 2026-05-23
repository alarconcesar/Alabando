import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, FileMusic } from 'lucide-react';
import { useHimnos } from '../hooks/useHimnos';
import HimnoItem from '../components/HimnoItem';

export default function AllHymns() {
  const { himnos, loading } = useHimnos();
  const navigate = useNavigate();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterHasAudio, setFilterHasAudio] = useState(false);
  const [filterHasPartitura, setFilterHasPartitura] = useState(false);
  
  // Favorites state for passing to HimnoItem
  const [favorites, setFavorites] = useState<number[]>([]);
  
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(favs);
  }, []);

  // Priority categories for the first row
  const categories = ['Canticos', 'Suplementarios', 'Nuevos'];

  // Toggle category selection (Single Select / Radio behavior)
  const toggleCategory = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  // Clear all filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setFilterHasAudio(false);
    setFilterHasPartitura(false);
  };

  // Filter hymns based on selected filters (accumulative/AND logic)
  const filteredHimnos = useMemo(() => {
    let result = himnos;
    
    // Filter by single category
    if (selectedCategory) {
      result = result.filter(h => {
        if (selectedCategory === 'Canticos' && h.numero.startsWith('C-')) return true;
        if (selectedCategory === 'Suplementarios' && h.numero.startsWith('S-')) return true;
        if (selectedCategory === 'Nuevos' && h.numero.startsWith('N-')) return true;
        return h.categoria === selectedCategory;
      });
    }
    
    // Filter by audio
    if (filterHasAudio) {
      result = result.filter(h => h.aud && h.aud.length > 0);
    }
    
    // Filter by partitura
    if (filterHasPartitura) {
      result = result.filter(h => h.page && h.page !== 'none');
    }
    
    return result;
  }, [himnos, selectedCategory, filterHasAudio, filterHasPartitura]);

  const hasActiveFilters = selectedCategory !== null || filterHasAudio || filterHasPartitura;

  return (
    <div className="page-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <header className="app-bar" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Atrás">
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-background)' }}>
          Todos los Himnos
        </h1>
      </header>

      {/* Filter Section */}
      <div style={{ padding: '12px 0' }}>
        {/* Row 1: Categories (Single Select) */}
        <div style={{ padding: '0 20px 12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--outline)' }}>
            Categoría:
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
        <div className="filter-chips-container">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 2: Media Filters (Multi Select) */}
        <div style={{ display: 'flex', gap: 12, padding: '12px 20px 0 20px' }}>
          <button
            onClick={() => setFilterHasAudio(!filterHasAudio)}
            className={`toggle-filter-btn ${filterHasAudio ? 'active' : ''}`}
          >
            <Music size={18} />
            <span>Con Audio</span>
          </button>
          <button
            onClick={() => setFilterHasPartitura(!filterHasPartitura)}
            className={`toggle-filter-btn ${filterHasPartitura ? 'active' : ''}`}
          >
            <FileMusic size={18} />
            <span>Con Partitura</span>
          </button>
        </div>
      </div>

      {/* Results Counter */}
      <div style={{ padding: '16px 20px 8px 20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--outline)', fontWeight: 500 }}>
          {hasActiveFilters ? (
            <>Mostrando {filteredHimnos.length} de {himnos.length} himnos</>
          ) : (
            <>{himnos.length} himnos en total</>
          )}
        </p>
      </div>

      <div className="himno-item-divider" style={{ margin: '0 16px 8px 16px' }} />

      {/* Hymn List */}
      <main>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--outline)' }}>
            Cargando himnos...
          </div>
        ) : filteredHimnos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--outline)' }}>
            <p style={{ fontSize: '16px', marginBottom: 8 }}>No se encontraron himnos</p>
            <p style={{ fontSize: '14px' }}>Intenta ajustar los filtros</p>
          </div>
        ) : (
          <div>
            {filteredHimnos.map((h, index) => (
              <div key={h.id}>
                {index > 0 && <div className="himno-item-divider" style={{ margin: '0 16px' }} />}
                <HimnoItem
                  himno={h}
                  isFavorite={favorites.includes(h.id)}
                  onFavoriteToggle={() => {
                    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
                    setFavorites(favs);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
