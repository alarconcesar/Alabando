import { useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: SwipeConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipingRef = useRef(false);
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight });
  callbacksRef.current = { onSwipeLeft, onSwipeRight };

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      clearTimers();
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      swipingRef.current = false;
      el.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartRef.current.x;
      const deltaY = currentY - touchStartRef.current.y;

      // Only horizontal swipe — prevent default to block scroll
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && Math.abs(deltaX) > 5) {
        e.preventDefault(); // This works because we use passive: false
        swipingRef.current = true;
        el.style.transform = `translateX(${deltaX}px)`;
        el.style.willChange = 'transform';
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;

      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - touchStartRef.current.x;
      touchStartRef.current = null;

      if (!swipingRef.current) {
        el.style.transition = '';
        el.style.transform = '';
        el.style.willChange = '';
        return;
      }

      swipingRef.current = false;

      if (Math.abs(deltaX) >= threshold) {
        // Navigate: slide out then navigate
        const direction = deltaX > 0 ? 1 : -1;
        el.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = `translateX(${direction * window.innerWidth * 1.2}px)`;

        timeoutRef.current = setTimeout(() => {
          el.style.transition = '';
          el.style.transform = '';
          el.style.willChange = '';
          if (deltaX > 0) {
            callbacksRef.current.onSwipeRight?.();
          } else {
            callbacksRef.current.onSwipeLeft?.();
          }
        }, 250);
      } else {
        // Bounce back
        el.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = 'translateX(0)';
        timeoutRef.current = setTimeout(() => {
          el.style.transition = '';
          el.style.transform = '';
          el.style.willChange = '';
        }, 250);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      clearTimers();
    };
  }, [threshold, clearTimers]);

  return { containerRef };
}
