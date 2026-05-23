import { useNavigate } from 'react-router-dom';
import { useHimnos } from '../hooks/useHimnos';
import { Settings, PlusSquare, Inbox, Heart, Share2, Check, Library, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import HimnoItem from '../components/HimnoItem';

export default function Home() {
  const { himnos, loading } = useHimnos();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const hist = localStorage.getItem('history');
    if (hist) {
      setHistory(JSON.parse(hist));
    }
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(favs);
  }, []);


  const handleShare = async () => {
    const shareData = {
      title: 'Himnario Alabando',
      text: '¡Canta y alaba con la app de Himnos Alabando!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Only ignore abort errors from user canceling the share sheet
        if ((err as Error).name !== 'AbortError') {
          console.error('Error al compartir:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
      }
    }
  };

  // Map local storage history (id, timestamp) to full Himno objects from useHimnos
  const historyHimnos = history
    .map(histItem => himnos.find(h => h.id === histItem.id))
    .filter((h): h is NonNullable<typeof h> => !!h);

  return (
    <div className="page-fade-in" style={{ paddingBottom: 100, backgroundColor: 'var(--background)' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 20px 16px 20px' }}>
        <div>
          <div className="home-header-greeting">Hola,</div>
          <h1 className="home-header-title" style={{ color: 'var(--on-background)' }}>¡Es hora de Alabar!</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleShare} className="icon-btn" aria-label="Compartir" style={{ backgroundColor: 'var(--surface)' }}>
            <Share2 size={24} />
          </button>
          <button onClick={() => navigate('/settings')} className="icon-btn" aria-label="Ajustes" style={{ backgroundColor: 'var(--surface)' }}>
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Grid Cards (Quick Actions) */}
      <div style={{ display: 'flex', gap: 16, padding: '12px 20px' }}>
        <div onClick={() => navigate('/all-hymns')} className="home-action-card">
          <Library size={80} className="home-action-card-bg-icon" style={{ color: 'var(--primary)' }} />
          <div className="home-action-card-content">
            <Library size={28} style={{ color: 'var(--primary)' }} />
            <h2 className="home-action-card-title">Todos los<br/>Himnos</h2>
          </div>
        </div>
        <div onClick={() => navigate('/search')} className="home-action-card">
          <Search size={80} className="home-action-card-bg-icon" style={{ color: 'var(--primary)' }} />
          <div className="home-action-card-content">
            <Search size={28} style={{ color: 'var(--primary)' }} />
            <h2 className="home-action-card-title">Buscar</h2>
          </div>
        </div>
      </div>

      {/* Banner 1 */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.35)), url(/img/img1.jpg)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          borderRadius: 24, 
          height: 160, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 20
        }}>
          <div>
            <h2 style={{ 
              color: '#FFFFFF', 
              textAlign: 'center', 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              lineHeight: 1.3,
              textShadow: '0 2px 4px rgba(0,0,0,0.4)', 
            }}>
              Cada Alabanza es una Bendición Especial
            </h2>
          </div>
        </div>
      </div>

      {/* Mis Últimas Alabanzas Section */}
      <div style={{ padding: '24px 20px 12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--on-background)' }}>
          Mis Últimas Alabanzas
        </h2>
      </div>

      {/* Surface Island for History */}
      <div className="surface-island">
        {loading ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--outline)' }}>Cargando...</div>
        ) : historyHimnos.length === 0 ? (
          <div className="empty-view-container" style={{ padding: '40px 20px' }}>
            <Inbox size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
            <p style={{ fontSize: '0.95rem' }}>No hay alabanzas recientes</p>
          </div>
        ) : (
          <div>
            {historyHimnos.slice(0, 3).map((h, i) => (
              <div key={h.id}>
                {i > 0 && <div className="himno-item-divider" style={{ margin: '0 16px' }} />}
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
            
            <button 
              onClick={() => navigate('/history')} 
              style={{ 
                width: '100%', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--primary)', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                padding: '14px 16px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              Ver historial completo
            </button>
          </div>
        )}
      </div>



      {/* Made with Love Footer */}
      <div style={{ textAlign: 'center', marginTop: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--outline)' }}>Hecho con mucho</p>
        <Heart size={20} className="animate-pulse" style={{ color: 'var(--primary)', fill: 'var(--primary)' }} />
      </div>

      {/* Clipboard Copy Toast Feedback */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <Check size={18} />
        <span>¡Enlace copiado al portapapeles!</span>
      </div>
    </div>
  );
}
