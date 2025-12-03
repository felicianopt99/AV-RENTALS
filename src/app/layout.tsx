
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { TranslationProvider } from '@/contexts/TranslationContext';
import BackgroundTranslationProvider from '@/components/translation/BackgroundTranslation';
import TranslationPreloader from '@/components/translation/TranslationPreloader';
import RouteTranslationPreloader from '@/components/translation/RouteTranslationPreloader';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { cookies } from 'next/headers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'AV Rentals',
  description: 'Audiovisual Equipment Rental Management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AV Rentals',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get('app-language')?.value;
  const lang = cookieLang === 'pt' ? 'pt' : 'en';
  return (
    <html lang={lang} suppressHydrationWarning={true}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ReactQueryProvider>
          <ThemeProvider>
            <TranslationProvider>
              <BackgroundTranslationProvider>
                <AppProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  <PWAInstallPrompt />
                  <TranslationPreloader />
                  <RouteTranslationPreloader />
                </AppProvider>
              </BackgroundTranslationProvider>
            </TranslationProvider>
          </ThemeProvider>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
