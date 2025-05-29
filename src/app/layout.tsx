import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
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
    <html lang="en" className="dark">
      <head>
        {/* Next.js handles <Head> content automatically via metadata and `next/head`.
            This explicit <head> tag is added to ensure proper structure and potentially
            resolve subtle whitespace issues. Standard meta tags should still go in
            the `metadata` export or via `next/head` in page components if needed. */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <AppProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
