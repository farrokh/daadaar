'use client';

import { LegalMenu } from '@/components/layout/legal-menu';

import { useToolContext } from '@/components/providers/tool-provider';
import { Button } from '@/components/ui/button';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, Info, LayoutGrid, LogIn, LogOut, User, UserPlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Navbar() {
  const t = useTranslations('navigation');
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { tools } = useToolContext();
  const pathname = usePathname();
  const registeredUser = currentUser?.type === 'registered' ? currentUser : null;
  const [showTutorialHint, setShowTutorialHint] = useState(false);
  const tutorialLink = 'https://www.instagram.com/p/DTNBYSmAiKN/';

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname?.startsWith(path);
  };
  const showGlass = !tools;
  const glassClasses =
    'liquid-glass bg-white/5 backdrop-blur-lg rounded-full px-6 h-16 transition-all duration-500 ease-out border border-white/10';

  useEffect(() => {
    const storageKey = 'daadaar:tutorial-hint-seen';
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey)) return;

    localStorage.setItem(storageKey, 'true');
    setShowTutorialHint(true);
    const timeoutId = window.setTimeout(() => setShowTutorialHint(false), 6000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="fixed bottom-4 left-0 right-0 flex items-center justify-between p-6 z-50 pointer-events-none">
      {/* Left Section: Logo & Nav */}
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-8',
          showGlass ? glassClasses : 'pl-4'
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-28 h-8 transition-transform duration-300 group-hover:scale-102 -translate-y-[6px]">
            <Image
              src="/logo_navbar_en.svg"
              alt="Daadaar Logo"
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-6">
          {[
            { href: '/', label: t('graph') },
            { href: '/reports', label: t('reports') },
            { href: '/about', label: t('about') },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105',
                isActive(link.href)
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Center: Dynamic Tools (The Dock) */}
      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2">{tools}</div>

      {/* Right: Auth */}
      <div className={cn('pointer-events-auto flex items-center gap-4', showGlass && glassClasses)}>
        <div className="relative">
          {showTutorialHint && (
            <div className="absolute bottom-full right-0 mb-3 w-64 rounded-md border border-border bg-background/95 p-3 text-xs text-foreground/80 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-accent-primary" />
                <p className="flex-1">{t('tutorial_hint')}</p>
                <button
                  type="button"
                  onClick={() => setShowTutorialHint(false)}
                  className="text-foreground/50 transition-colors hover:text-foreground"
                  aria-label={t('close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 border-b border-r border-border bg-background/95" />
            </div>
          )}
          <a
            href={tutorialLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShowTutorialHint(false)}
            title={t('tutorial')}
            className="inline-flex"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground/60 hover:text-foreground transition-colors"
              aria-label={t('tutorial')}
            >
              <BookOpen className="h-5 w-5" />
            </Button>
          </a>
        </div>
        <LegalMenu />
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {(registeredUser?.role === 'admin' || registeredUser?.role === 'moderator') && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'font-semibold transition-all duration-300',
                    isActive('/admin')
                      ? 'text-accent-primary'
                      : 'text-foreground/60 hover:text-accent-primary'
                  )}
                >
                  {t('admin')}
                </Button>
              </Link>
            )}
            <Link href="/profile" title={t('profile')}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'transition-all duration-300',
                  isActive('/profile')
                    ? 'text-foreground font-semibold'
                    : 'text-foreground/60 hover:text-foreground'
                )}
              >
                {registeredUser?.displayName || registeredUser?.username || t('profile')}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-foreground/60 hover:text-destructive transition-colors"
            >
              {t('logout')}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              {t('login')} / {t('signup')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
