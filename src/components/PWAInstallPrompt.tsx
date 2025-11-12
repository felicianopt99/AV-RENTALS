"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { currentUser } = useAppContext();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [shownThisLogin, setShownThisLogin] = useState(false);

  // Reset shownThisLogin when user logs in
  useEffect(() => {
    if (currentUser) {
      setShownThisLogin(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if not shown this login and not dismissed recently
      const dismissedTime = localStorage.getItem('pwa-install-dismissed');
      let dismissedRecently = false;
      if (dismissedTime) {
        const daysSinceDismissal = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        dismissedRecently = daysSinceDismissal < 7;
      }
      if (!shownThisLogin && !dismissedRecently) {
        setShowInstallPrompt(true);
        setShownThisLogin(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide prompt if app is already installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [shownThisLogin]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store dismissal in localStorage to avoid showing again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showInstallPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9998] md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium">{useTranslate('Install AV Rentals')}</p>
          <p className="text-xs text-muted-foreground">{useTranslate('Add to home screen for quick access')}</p>
        </div>
        <Button size="sm" onClick={handleInstallClick} className="shrink-0">
          <Download className="h-4 w-4 mr-1" />
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss} className="shrink-0 p-2">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}