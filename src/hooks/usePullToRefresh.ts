"use client";

import { useState, useEffect, useCallback } from 'react';

interface PullToRefreshOptions {
  threshold?: number;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

export function usePullToRefresh({ 
  threshold = 100, 
  onRefresh, 
  disabled = false 
}: PullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStart, setTouchStart] = useState<{ y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only trigger if at top of page
    if (window.scrollY === 0) {
      setTouchStart({
        y: e.touches[0].clientY,
        time: Date.now()
      });
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !touchStart) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart.y;

    // Only allow pull down when at top of page
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }, [disabled, isRefreshing, touchStart, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !touchStart) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }

      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500); // Minimum refresh time for visual feedback
      }
    }

    setTouchStart(null);
    setPullDistance(0);
  }, [disabled, isRefreshing, touchStart, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0,
    isThresholdReached: pullDistance >= threshold
  };
}