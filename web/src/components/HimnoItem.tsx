import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Himno } from '../types.d';
import { useFavorites } from '../hooks/useFavorites';

interface HimnoItemProps {
  himno: Himno;
  extraContent?: React.ReactNode;
}

export default function HimnoItem({ himno, extraContent }: HimnoItemProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(himno.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(himno.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Link to={`/himno/${himno.id}`} className="himno-item-container">
        <div className="himno-item-left">
          <div className="himno-item-badge">{himno.numero}</div>
        </div>

        <div className="himno-item-middle">
          <span className="himno-item-title">{himno.nombre}</span>
          <span className="himno-item-category">{himno.categoria}</span>
          {extraContent}
        </div>

        <div className="himno-item-right">
          <button
            onClick={handleFavoriteClick}
            className="himno-item-fav-btn"
            aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart
              size={25}
              style={{
                fill: fav ? 'var(--primary)' : 'none',
                color: 'var(--primary)',
              }}
            />
          </button>
        </div>
      </Link>
      <div className="himno-item-divider" />
    </div>
  );
}
