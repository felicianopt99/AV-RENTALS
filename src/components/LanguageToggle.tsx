"use client";

import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageToggle() {
  const { language, setLanguage, tSync } = useTranslation();
  const pathname = usePathname() || '/';

  function applyLang(lang: 'en' | 'pt') {
    setLanguage(lang);
    try {
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `app-language=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {}
    // If on login, force reload to get SSR-rendered strings immediately
    if (pathname.startsWith('/login')) {
      window.location.reload();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title={tSync('Change Language')}>
          <Languages className="h-5 w-5" />
          <span className="sr-only">{tSync('Toggle language')}</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold uppercase bg-primary text-primary-foreground rounded px-1">
            {language}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => applyLang('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇬🇧</span>
          English
          {language === 'en' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => applyLang('pt')}
          className={language === 'pt' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇵🇹</span>
          Português (PT)
          {language === 'pt' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
