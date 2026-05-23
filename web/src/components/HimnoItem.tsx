import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Himno } from '../hooks/useHimnos';
import { useState, useEffect } from 'react';

interface HimnoItemProps {
  himno: Himno;
  onFavoriteToggle?: () => void;
  extraContent?: React.ReactNode;
  isFavorite?: boolean;
}

export default function HimnoItem({ himno, onFavoriteToggle, extraContent, isFavorite: isFavoriteProp }: HimnoItemProps) {
  const [localIsFavorite, setLocalIsFavorite] = useState(false);

  useEffect(() => {
    if (isFavoriteProp === undefined) {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setLocalIsFavorite(favs.includes(himno.id));
    }
  }, [himno.id, isFavoriteProp]);

  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : localIsFavorite;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFav = false;
    if (isFavorite) {
      favs = favs.filter((id: number) => id !== himno.id);
    } else {
      favs.push(himno.id);
      newFav = true;
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
    if (isFavoriteProp === undefined) {
      setLocalIsFavorite(newFav);
    }
    if (onFavoriteToggle) {
      onFavoriteToggle();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Link to={`/himno/${himno.id}`} className="himno-item-container">
        {/* Left Column: Badge and Icons */}
        <div className="himno-item-left">
          <div className="himno-item-badge">
            {himno.numero}
          </div>
        </div>

        {/* Middle Column: Title and Category */}
        <div className="himno-item-middle">
          <span className="himno-item-title">{himno.nombre}</span>
          <span className="himno-item-category">{himno.categoria}</span>
          {extraContent}
        </div>

        {/* Right Column: Heart Icon Button */}
        <div className="himno-item-right">
          <button onClick={handleFavoriteClick} className="himno-item-fav-btn" aria-label="Favorito">
            <Heart 
              size={25} 
              style={{ 
                fill: isFavorite ? 'var(--primary)' : 'none', 
                color: isFavorite ? 'var(--primary)' : 'var(--primary)' 
              }} 
            />
          </button>
        </div>
      </Link>
      <div className="himno-item-divider" />
    </div>
  );
}
