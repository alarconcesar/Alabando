import { useState, useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: SwipeConfig) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const bounceBack = useCallback(() => {
    setIsSwiping(false);
    setTranslateX(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      clearTimers();
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      setIsSwiping(true);
    }
  }, [clearTimers]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;

    // Only apply horizontal drag if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      setTranslateX(deltaX);
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartRef.current.x;

    touchStartRef.current = null;

    if (Math.abs(deltaX) >= threshold) {
      // Animate off-screen then navigate
      const direction = deltaX > 0 ? 1 : -1;
      const offScreen = direction * window.innerWidth;
      setTranslateX(offScreen);

      timeoutRef.current = setTimeout(() => {
        setIsSwiping(false);
        setTranslateX(0);
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }, 250);
    } else {
      // Bounce back
      bounceBack();
    }
  }, [onSwipeLeft, onSwipeRight, threshold, bounceBack]);

  return {
    translateX,
    isSwiping,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } as const;
}
