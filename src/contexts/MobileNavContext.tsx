
"use client";

import { createContext, useContext, useState, useMemo } from 'react';

interface MobileNavContextType {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const value = useMemo(() => ({ activeIndex, setActiveIndex }), [activeIndex]);

  return (
    <MobileNavContext.Provider value={value}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (context === undefined) {
    throw new Error('useMobileNav must be used within a MobileNavProvider');
  }
  return context;
}
