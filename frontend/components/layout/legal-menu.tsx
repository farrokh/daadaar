'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export function LegalMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('landing');

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-md border border-border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-1">
            <Link
              href="/legal/terms"
              onClick={() => setIsOpen(false)}
              className="rounded-sm px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors text-right"
            >
              {t('footer_terms')}
            </Link>
            <Link
              href="/legal/privacy"
              onClick={() => setIsOpen(false)}
              className="rounded-sm px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors text-right"
            >
              {t('footer_privacy')}
            </Link>
            <Link
              href="/legal/content-policy"
              onClick={() => setIsOpen(false)}
              className="rounded-sm px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors text-right"
            >
              {t('footer_content')}
            </Link>
            <Link
              href="/legal/copyright"
              onClick={() => setIsOpen(false)}
              className="rounded-sm px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors text-right"
            >
              {t('footer_copyright')}
            </Link>
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-foreground/60 hover:text-foreground transition-colors"
        title={t('footer_terms')}
      >
        <Scale className="h-5 w-5" />
      </Button>
    </div>
  );
}
