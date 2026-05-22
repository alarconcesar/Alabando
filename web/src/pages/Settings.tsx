import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('theme') || 'naranja'
  );

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme === 'naranja' ? '' : theme);
  };

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? Number(saved) : 19;
  });

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = Number(e.target.value);
    setFontSize(size);
    localStorage.setItem('fontSize', size.toString());
  };

  const resetFontSize = () => {
    setFontSize(19);
    localStorage.setItem('fontSize', '19');
  };

  return (
    <div className="page-enter-active">
      <header className="app-bar">
        <button onClick={() => navigate(-1)} className="icon-btn">
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1 }}>Ajustes</h1>
      </header>

      <main style={{ padding: 20 }}>
        <div className="settings-group">
          <h3>Tema de la Aplicación</h3>
          <p style={{ marginBottom: 16, color: 'var(--on-surface)', opacity: 0.8, fontSize: '0.9rem' }}>
            Personaliza los colores de la aplicación a tu gusto.
          </p>
          
          <div className="theme-selector">
            <div 
              className={`theme-option ${currentTheme === 'naranja' ? 'active' : ''}`}
              style={{ background: '#FC7124' }}
              onClick={() => changeTheme('naranja')}
              title="Claro"
            />
            <div 
              className={`theme-option ${currentTheme === 'dark' ? 'active' : ''}`}
              style={{ background: '#231917', border: '1px solid #53433F' }}
              onClick={() => changeTheme('dark')}
              title="Oscuro"
            />
          </div>
        </div>

        <div className="settings-group" style={{ marginTop: 40 }}>
          <h3>Tamaño de Lectura</h3>
          <p style={{ marginBottom: 16, color: 'var(--on-surface)', opacity: 0.8, fontSize: '0.9rem' }}>
            Ajusta el tamaño del texto para las letras de los himnos.
          </p>
          
          <div style={{ background: 'var(--surface)', padding: '20px 16px', borderRadius: 12, border: '1px solid var(--surface-variant)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Aa</span>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: 'var(--primary)' }}>Aa</span>
              <span style={{ fontSize: '30px', fontWeight: 600 }}>Aa</span>
            </div>
            <input 
              type="range" 
              min="14" 
              max="30" 
              value={fontSize} 
              onChange={handleFontSizeChange}
              className="text-size-slider"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
                {fontSize === 19 ? 'Tamaño original' : 'Tamaño modificado'}
              </span>
              {fontSize !== 19 && (
                <button 
                  onClick={resetFontSize}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Restaurar original
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="settings-group" style={{ marginTop: 40 }}>
          <h3>Acerca de</h3>
          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--surface-variant)' }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Himnario EAV</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--outline)', marginBottom: 12 }}>Versión PWA 1.0.0</p>
            <p style={{ fontSize: '0.85rem' }}>
              Esta aplicación está diseñada para funcionar sin conexión una vez instalada en tu dispositivo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
