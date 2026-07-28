import { useNavigationType } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

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
  const [animClass, setAnimClass] = useState('');
  const prevType = useRef(type);

  useEffect(() => {
    if (type === 'PUSH') {
      setAnimClass('page-slide-right');
    } else if (type === 'POP') {
      setAnimClass('page-slide-left');
    } else {
      setAnimClass('page-fade-in');
    }
    prevType.current = type;
  }, [type]);

  return (
    <div className={animClass} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}
