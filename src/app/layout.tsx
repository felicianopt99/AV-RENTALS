
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { AppProvider } from '@/contexts/AppContext';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AV Rentals',
  description: 'Audiovisual Equipment Rental Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <head>
        {/* Minimal head, Next.js handles content via metadata */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ReactQueryProvider>
          <AppProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AppProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
