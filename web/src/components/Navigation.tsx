import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Disc, Heart } from 'lucide-react';
import { NAV_HIDE_THRESHOLD } from '../lib/constants';

export default function Navigation() {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= NAV_HIDE_THRESHOLD);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= NAV_HIDE_THRESHOLD);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide bottom nav on detail page on mobile
  if (location.pathname.startsWith('/himno/') && !isDesktop) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <Home size={24} />
        </div>
        <span>Inicio</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <Search size={24} />
        </div>
        <span>Buscar</span>
      </NavLink>
      <NavLink to="/albumes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <Disc size={24} />
        </div>
        <span>Álbumes</span>
      </NavLink>
      <NavLink to="/favoritos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <div className="nav-icon-container">
              <Heart size={24} style={{ fill: isActive ? 'currentColor' : 'none' }} />
            </div>
            <span>Favoritos</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
