
"use client";

import { MobileNavProvider } from '@/contexts/MobileNavContext';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <MobileNavProvider>{children}</MobileNavProvider>;
}
