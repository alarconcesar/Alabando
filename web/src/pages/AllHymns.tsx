import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, FileMusic } from 'lucide-react';
import { useHimnos } from '../hooks/useHimnos';
import VirtualHymnList from '../components/VirtualHymnList';

export default function AllHymns() {
  const { himnos, loading } = useHimnos();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterHasAudio, setFilterHasAudio] = useState(false);
  const [filterHasPartitura, setFilterHasPartitura] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Derive categories from data: numeric prefix + unique categorias
  const categories = useMemo(() => {
    const prefixCats = new Set<string>();
    const otherCats = new Set<string>();

    himnos.forEach(h => {
      if (h.numero.startsWith('C-')) prefixCats.add('Canticos');
      else if (h.numero.startsWith('S-')) prefixCats.add('Suplementarios');
      else if (h.numero.startsWith('N-')) prefixCats.add('Nuevos');
      else otherCats.add(h.categoria);
    });

    // Priority order: Canticos, Suplementarios, Nuevos, then rest alphabetically
    const priority = ['Canticos', 'Suplementarios', 'Nuevos'];
    const rest = Array.from(otherCats).sort();
    return [...priority.filter(c => prefixCats.has(c) || himnos.some(h => h.categoria === c)), ...rest];
  }, [himnos]);

  const toggleCategory = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setFilterHasAudio(false);
    setFilterHasPartitura(false);
  };

  const filteredHimnos = useMemo(() => {
    let result = himnos;

    if (selectedCategory) {
      result = result.filter(h => {
        if (selectedCategory === 'Canticos' && h.numero.startsWith('C-')) return true;
        if (selectedCategory === 'Suplementarios' && h.numero.startsWith('S-')) return true;
        if (selectedCategory === 'Nuevos' && h.numero.startsWith('N-')) return true;
        return h.categoria === selectedCategory;
      });
    }

    if (filterHasAudio) {
      result = result.filter(h => h.aud && h.aud.length > 0);
    }

    if (filterHasPartitura) {
      result = result.filter(h => h.page && h.page !== 'none');
    }

    return result;
  }, [himnos, selectedCategory, filterHasAudio, filterHasPartitura]);

  const hasActiveFilters = selectedCategory !== null || filterHasAudio || filterHasPartitura;

  return (
    <div className="page-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'var(--background)',
        borderBottom: '1px solid var(--barra)',
      }}>
      <header className="app-bar" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: 'none' }}>
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Atrás">
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-background)' }}>
          Todos los Himnos
        </h1>
      </header>

      <div style={{ padding: '4px 0 8px 0' }}>
        <div style={{ padding: '0 20px 8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--outline)' }}>
            Categoría:
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
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

        <div style={{ display: 'flex', gap: 12, padding: '8px 20px 0 20px' }}>
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

      <div ref={containerRef} style={{ padding: '8px 20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--outline)', fontWeight: 500 }}>
          {hasActiveFilters ? (
            <>Mostrando {filteredHimnos.length} de {himnos.length} himnos</>
          ) : (
            <>{himnos.length} himnos en total</>
          )}
        </p>
      </div>
      </div>

      <div className="himno-item-divider" style={{ margin: '0 16px 8px 16px' }} />

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
          <VirtualHymnList himnos={filteredHimnos} />
        )}
      </main>
    </div>
  );
}
