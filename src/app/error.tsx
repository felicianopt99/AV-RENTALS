"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

import { useTranslate } from '@/contexts/TranslationContext';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { translated: uiTryagainText } = useTranslate('Try again');
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="bg-card p-8 rounded-lg shadow-xl text-center max-w-md">
        <h2 className="text-2xl font-semibold text-destructive mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. We're sorry for the inconvenience.
        </p>
        {process.env.NODE_ENV === 'development' && error?.message && (
          <pre className="text-left bg-muted p-2 rounded-md text-xs overflow-auto max-h-40 mb-4">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {uiTryagainText}</Button>
      </div>
    </div>
  );
}
