'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { useLocale, useTranslations } from 'next-intl';

export function Navbar() {
  const t = useTranslations('navigation');
  const { currentUser, isAuthenticated, logout } = useAuth();
  const registeredUser = currentUser?.type === 'registered' ? currentUser : null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center px-4 lg:px-6 border-b border-foreground/5 bg-background/80 backdrop-blur-md z-40">
      <Link className="flex items-center justify-center" href="/">
        <span className="text-2xl font-bold tracking-tighter sm:text-3xl bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary">
          Daadaar
        </span>
      </Link>
      <nav className="mx-auto flex gap-4 sm:gap-6">
        <Link
          className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          href="/reports"
        >
          {t('reports')}
        </Link>
        <Link
          className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          href="/"
        >
          {t('graph')}
        </Link>
        <Link
          className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          href="/about"
        >
          {t('about')}
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground/60 hidden sm:inline-block">
              {registeredUser?.displayName || registeredUser?.username}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              {t('logout')}
            </Button>
          </div>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t('login')}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-xl px-6">
                {t('signup')}
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
