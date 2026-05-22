import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { Search as SearchIcon, ArrowLeft, X, Delete, ChevronLeft } from 'lucide-react';
import HimnoItem from '../components/HimnoItem';

export default function Search() {
  const { himnos, loading } = useHimnos();
  const [searchParams] = useSearchParams();
  const catFilter = searchParams.get('cat');
  const navigate = useNavigate();

  // Search modes: 'keypad' (numeric) or 'text'
  const [searchMode, setSearchMode] = useState<'keypad' | 'text'>('keypad');

  // Keypad state
  const [text1, setText1] = useState(''); // Prefix: "C-", "S-", "N-" or ""
  const [text2, setText2] = useState(''); // Up to 3 digits

  // Text search query state
  const [textQuery, setTextQuery] = useState('');

  // Normalize string by converting to lowercase and removing accents/diacritics
  const normalizeStr = (str: string) => {
    return str
      .toLowerCase()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u');
  };

  // 1. Keypad Search matching
  const keypadQuery = text1 + text2;
  const keypadResult = useMemo(() => {
    if (!keypadQuery) return [];
    
    // Exact match or contains matching
    const matches = himnos.filter(h => 
      h.numero.toLowerCase().includes(keypadQuery.toLowerCase())
    );

    // Kotlin: take(1) - Only show the first result
    return matches.slice(0, 1);
  }, [himnos, keypadQuery]);

  // 2. Text Search matching
  const textFilteredResults = useMemo(() => {
    if (!textQuery.trim()) return [];

    const normalizedQuery = normalizeStr(textQuery);
    
    const matches = himnos.filter(h => 
      normalizeStr(h.nombre).includes(normalizedQuery) ||
      normalizeStr(h.letra).includes(normalizedQuery)
    );

    // Sorted: Matches in the title first, then sorted by hymn number
    return matches.sort((a, b) => {
      const aTitleMatch = normalizeStr(a.nombre).includes(normalizedQuery);
      const bTitleMatch = normalizeStr(b.nombre).includes(normalizedQuery);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      const aNum = parseInt(a.numero.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.numero.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
  }, [himnos, textQuery]);

  // Keypad key press handler
  const handleKeyPress = (key: string) => {
    if (/^\d$/.test(key)) {
      // Append number, limit to 3 digits
      setText2(prev => (prev + key).slice(0, 3));
    } else if (key === 'C' || key === 'S' || key === 'N') {
      const prefix = `${key}-`;
      // If same prefix clicked again, remove it, else set it
      setText1(prev => prev === prefix ? '' : prefix);
    } else if (key === 'delete') {
      if (text2.length > 0) {
        setText2(prev => prev.slice(0, -1));
      } else if (text1.length > 0) {
        setText1('');
      }
    }
  };

  // If a category filter is in the URL, switch to text mode automatically and search it
  useEffect(() => {
    if (catFilter) {
      setSearchMode('text');
      setTextQuery(''); // Category filters can be handled here or inside standard search
    }
  }, [catFilter]);

  // Handle category filtering
  const finalResults = useMemo(() => {
    if (catFilter) {
      return himnos.filter(h => h.categoria === catFilter);
    }
    return searchMode === 'keypad' ? keypadResult : textFilteredResults;
  }, [searchMode, catFilter, himnos, keypadResult, textFilteredResults]);

  return (
    <div className="page-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* App Bar */}
      <header className="app-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
        {catFilter && (
          <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Atrás">
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 style={{ flex: 1, marginLeft: catFilter ? 12 : 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-background)' }}>
          {catFilter ? catFilter : 'Buscar'}
        </h1>
        {searchMode === 'text' && !catFilter && (
          <button onClick={() => setSearchMode('keypad')} className="icon-btn" style={{ padding: 8, color: 'var(--primary)' }} aria-label="Volver al teclado">
            <ChevronLeft size={28} />
          </button>
        )}
      </header>

      {/* SEARCH MODE 1: NUMERIC KEYPAD */}
      {searchMode === 'keypad' && !catFilter && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
          {/* Display Pill */}
          <div 
            id="messageTextView" 
            style={{
              width: 230,
              height: 50,
              backgroundColor: 'var(--barra)',
              borderRadius: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--neutral)',
              letterSpacing: 2,
              marginBottom: 16
            }}
          >
            {keypadQuery || ' '}
          </div>

          {/* Switch to Text Search Button */}
          <button 
            id="btn_text" 
            className="btn-tonal" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '10px 24px', 
              borderRadius: 100, 
              color: 'var(--neutral)', 
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 24
            }}
            onClick={() => setSearchMode('text')}
          >
            <SearchIcon size={18} />
            Buscar por Texto
          </button>

          {/* Keypad results container */}
          <div style={{ width: '100%', minHeight: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {keypadResult.length > 0 ? (
              <div>
                <div className="himno-item-divider" />
                <HimnoItem himno={keypadResult[0]} />
              </div>
            ) : keypadQuery ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--outline)', fontSize: '0.95rem' }}>
                Ningún himno coincide
              </div>
            ) : null}
          </div>

          {/* Keyboard Grid */}
          <div className="keypad-grid" style={{ marginTop: 'auto' }}>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('1')}>1</button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('2')}>2</button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('3')}>3</button>
            <button className={`keypad-btn keypad-btn-special ${text1 === 'C-' ? 'active-special' : ''}`} style={{ backgroundColor: text1 === 'C-' ? 'var(--primary)' : 'var(--primary-container)', color: text1 === 'C-' ? 'var(--on-primary)' : 'var(--primary)' }} onClick={() => handleKeyPress('C')}>C</button>

            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('4')}>4</button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('5')}>5</button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('6')}>6</button>
            <button className={`keypad-btn keypad-btn-special ${text1 === 'S-' ? 'active-special' : ''}`} style={{ backgroundColor: text1 === 'S-' ? 'var(--primary)' : 'var(--primary-container)', color: text1 === 'S-' ? 'var(--on-primary)' : 'var(--primary)' }} onClick={() => handleKeyPress('S')}>S</button>

            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('7')}>7</button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('8')}>8</button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('9')}>9</button>
            <button className={`keypad-btn keypad-btn-special ${text1 === 'N-' ? 'active-special' : ''}`} style={{ backgroundColor: text1 === 'N-' ? 'var(--primary)' : 'var(--primary-container)', color: text1 === 'N-' ? 'var(--on-primary)' : 'var(--primary)' }} onClick={() => handleKeyPress('N')}>N</button>

            <button className="keypad-btn keypad-btn-special" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }} onClick={() => handleKeyPress('delete')} aria-label="Borrar">
              <Delete size={24} />
            </button>
            <button className="keypad-btn keypad-btn-number" onClick={() => handleKeyPress('0')}>0</button>
          </div>
        </div>
      )}

      {/* SEARCH MODE 2: TEXT SEARCH / CATEGORY */}
      {(searchMode === 'text' || catFilter) && (
        <div>
          {/* Real Input Search Box */}
          {!catFilter && (
            <div style={{ position: 'relative', margin: '16px 16px 16px 16px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'var(--barra)', 
                  borderRadius: 28, 
                  padding: '8px 16px',
                  height: 52
                }}
              >
                <SearchIcon size={20} style={{ color: 'var(--outline)', marginRight: 12 }} />
                <input 
                  type="text" 
                  placeholder="Buscar por número, título o letra..." 
                  value={textQuery}
                  onChange={e => setTextQuery(e.target.value)}
                  autoFocus
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    background: 'transparent', 
                    fontSize: '1rem', 
                    color: 'var(--on-background)',
                    outline: 'none'
                  }}
                />
                {textQuery && (
                  <button 
                    onClick={() => setTextQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--outline)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results List */}
          <main style={{ marginTop: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--outline)' }}>Buscando...</div>
            ) : finalResults.length > 0 ? (
              <div>
                <div className="himno-item-divider" />
                {finalResults.map(h => {
                  // Find lyrics snippet with match
                  const normalizedQ = normalizeStr(textQuery);
                  const matchesTitle = normalizeStr(h.nombre).includes(normalizedQ);
                  let lyricsSnippet: React.ReactNode = null;

                  if (textQuery.trim() && !matchesTitle) {
                    const normalizedLetra = normalizeStr(h.letra);
                    const matchIndex = normalizedLetra.indexOf(normalizedQ);
                    if (matchIndex !== -1) {
                      const start = Math.max(0, matchIndex - 30);
                      const end = Math.min(h.letra.length, matchIndex + textQuery.length + 60);
                      const before = (start > 0 ? '…' : '') + h.letra.slice(start, matchIndex);
                      const match = h.letra.slice(matchIndex, matchIndex + textQuery.length);
                      const after = h.letra.slice(matchIndex + textQuery.length, end) + (end < h.letra.length ? '…' : '');
                      lyricsSnippet = (
                        <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: 4, lineHeight: 1.4 }}>
                          {before}<mark style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: 3, padding: '0 2px' }}>{match}</mark>{after}
                        </p>
                      );
                    }
                  }

                  return (
                    <div key={h.id}>
                      <HimnoItem himno={h} extraContent={lyricsSnippet} />
                    </div>
                  );
                })}
              </div>
            ) : (textQuery.trim() || catFilter) ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--outline)' }}>
                No se encontraron himnos.
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--outline)', fontSize: '0.95rem' }}>
                Escribe algo para comenzar a buscar
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
