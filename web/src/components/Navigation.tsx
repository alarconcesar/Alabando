import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Disc, Heart } from 'lucide-react';
import styles from './Navigation.module.css';

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

export default function Navigation() {
  const location = useLocation();

  // Hide bottom nav / sidebar on detail page (himno view)
  if (location.pathname.startsWith('/himno/')) {
    return null;
  }

  return (
    <nav className={styles['bottom-nav']}>
      <NavLink to="/" className={({ isActive }) => cn(styles['nav-item'], isActive && styles.active)}>
        <div className={styles['nav-icon-container']}>
          <Home size={24} />
        </div>
        <span>Inicio</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => cn(styles['nav-item'], isActive && styles.active)}>
        <div className={styles['nav-icon-container']}>
          <Search size={24} />
        </div>
        <span>Buscar</span>
      </NavLink>
      <NavLink to="/albumes" className={({ isActive }) => cn(styles['nav-item'], isActive && styles.active)}>
        <div className={styles['nav-icon-container']}>
          <Disc size={24} />
        </div>
        <span>Álbumes</span>
      </NavLink>
      <NavLink to="/favoritos" className={({ isActive }) => cn(styles['nav-item'], isActive && styles.active)}>
        <div className={styles['nav-icon-container']}>
          <Heart size={24} style={{ fill: location.pathname === '/favoritos' ? 'currentColor' : 'none' }} />
        </div>
        <span>Favoritos</span>
      </NavLink>
    </nav>
  );
}
