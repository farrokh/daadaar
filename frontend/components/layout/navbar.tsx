'use client';

import { LegalMenu } from '@/components/layout/legal-menu';

import { useToolContext } from '@/components/providers/tool-provider';
import { Button } from '@/components/ui/button';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { FileText, Info, LayoutGrid, LogIn, LogOut, User, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function Navbar() {
  const t = useTranslations('navigation');
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { tools } = useToolContext();
  const pathname = usePathname();
  const registeredUser = currentUser?.type === 'registered' ? currentUser : null;

  const isActive = (path: string) => pathname === path || pathname?.endsWith(path);
  const showGlass = !tools;
  const glassClasses =
    'liquid-glass bg-white/5 backdrop-blur-lg rounded-full px-6 h-16 transition-all duration-500 ease-out border border-white/10';

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
          <Link
            href="/"
            className={cn(
              'text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105',
              isActive('/')
                ? 'text-foreground font-semibold'
                : 'text-foreground/60 hover:text-foreground'
            )}
          >
            {t('graph')}
          </Link>
          <Link
            href="/reports"
            className={cn(
              'text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105',
              isActive('/reports')
                ? 'text-foreground font-semibold'
                : 'text-foreground/60 hover:text-foreground'
            )}
          >
            {t('reports')}
          </Link>
          <Link
            href="/about"
            className={cn(
              'text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105',
              isActive('/about')
                ? 'text-foreground font-semibold'
                : 'text-foreground/60 hover:text-foreground'
            )}
          >
            {t('about')}
          </Link>
        </nav>
      </div>

      {/* Center: Dynamic Tools (The Dock) */}
      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2">{tools}</div>

      {/* Right: Auth */}
      <div className={cn('pointer-events-auto flex items-center gap-4', showGlass && glassClasses)}>
        <LegalMenu />
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {(registeredUser?.role === 'admin' || registeredUser?.role === 'moderator') && (
              <Link href="/admin/content-reports">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-accent-primary hover:text-accent-primary/80 font-semibold"
                >
                  {t('admin')}
                </Button>
              </Link>
            )}
            <Link href="/profile" title={t('profile')}>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/60 hover:text-foreground"
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
