"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Keep in cache for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Refetch on window focus only if data is stale
        refetchOnWindowFocus: false,
        // Retry failed requests 2 times
        retry: 2,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}