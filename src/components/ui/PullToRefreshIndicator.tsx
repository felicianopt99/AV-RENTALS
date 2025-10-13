"use client";

import React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
  isThresholdReached: boolean;
}

export function PullToRefreshIndicator({
  isRefreshing,
  pullDistance,
  threshold,
  isThresholdReached
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = Math.min(progress * 2, 1);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-b transition-all duration-200"
      style={{
        height: `${Math.min(pullDistance * 0.8, 80)}px`,
        opacity: opacity
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {isRefreshing ? (
          <>
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Refreshing...</span>
          </>
        ) : (
          <>
            <div 
              className={`transition-transform duration-200 ${
                isThresholdReached ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <ArrowDown className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">
              {isThresholdReached ? 'Release to refresh' : 'Pull to refresh'}
            </span>
            <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}