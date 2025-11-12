"use client"; // Not-found components must be Client Components

import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useTranslate } from '@/contexts/TranslationContext';
export default function NotFound() {
  // Translation hooks
  const { translated: uiGoBackText } = useTranslate('Go Back');
  const { translated: uiGotoDashboardText } = useTranslate('Go to Dashboard');
  const { translated: uiPageNotFoundText } = useTranslate('Page Not Found');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="bg-card p-8 rounded-lg shadow-xl text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">
          {uiPageNotFoundText}</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              {uiGotoDashboardText}</Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {uiGoBackText}</Button>
        </div>
      </div>
    </div>
  );
}
