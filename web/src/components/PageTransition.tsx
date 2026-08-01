import { useNavigationType } from 'react-router-dom';
import { useState } from 'react';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps page content with a directional slide animation.
 * 'PUSH' → slides from right (forward navigation)
 * 'POP'  → slides from left (back navigation)
 * 'REPLACE' → no animation (fade only)
 */
export default function PageTransition({ children }: Props) {
  const type = useNavigationType();
  // Ajuste de estado durante render cuando cambia el tipo de navegación
  // (patrón recomendado por React en vez de useEffect)
  const [prevType, setPrevType] = useState(type);
  const [animClass, setAnimClass] = useState('');

  if (prevType !== type) {
    setPrevType(type);
    setAnimClass(
      type === 'PUSH'
        ? 'page-slide-right'
        : type === 'POP'
          ? 'page-slide-left'
          : 'page-fade-in',
    );
  }

  return (
    <div className={animClass} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}
