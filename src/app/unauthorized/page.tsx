"use client";

import { useTranslate } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const { translated: accessDeniedText } = useTranslate('Access Denied');
  const { translated: noPermissionText } = useTranslate('You do not have permission to access this page. Please contact your administrator if you believe this is an error.');

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <div className="max-w-lg w-full p-8 bg-destructive/10 border border-destructive/30 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">{accessDeniedText}</h1>
        <p className="text-lg text-muted-foreground mb-6">{noPermissionText}</p>
        <Link href="/" className="text-primary underline">Go to Home</Link>
      </div>
    </div>
  );
}
