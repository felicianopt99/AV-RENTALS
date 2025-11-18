"use client";

import { useEffect, useState } from 'react';

/**
 * Hook to safely handle client-side only rendering
 * Returns false during SSR and true after hydration
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Component wrapper for client-side only content
 * Renders fallback during SSR and children after hydration
 */
interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = useIsClient();
  
  return isClient ? <>{children}</> : <>{fallback}</>;
}