'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  FileText,
  Flag,
  Info,
  LayoutGrid,
  LogOut,
  Plus,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ReportContentButton } from '../ui/report-content-button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  contentType?: 'report' | 'organization' | 'individual' | 'user' | 'media';
  contentId?: number;
  customActions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[];
}

export function MobileMenu({
  isOpen,
  onClose,
  contentType,
  contentId,
  customActions,
}: MobileMenuProps) {
  const t = useTranslations('navigation');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { currentUser, isAuthenticated, logout } = useAuth();
  const registeredUser = currentUser?.type === 'registered' ? currentUser : null;
  const [showCreateActions, setShowCreateActions] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        setShowCreateActions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const menuClass =
    'liquid-glass bg-background/80 backdrop-blur-2xl border border-foreground/10 shadow-2xl';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-28 left-1/2 -translate-x-1/2 z-[101] w-[calc(100vw-4rem)] max-w-sm overflow-hidden p-6 space-y-6 lg:hidden rounded-3xl',
              menuClass
            )}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <span className="text-lg font-bold tracking-tight text-foreground px-2">
                {t('menu')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-foreground/10 text-foreground/70 hover:text-foreground"
              >
                <X size={20} />
              </Button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4 px-2">
                <div className="h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg ring-1 ring-foreground/10">
                  {registeredUser?.displayName?.[0] || registeredUser?.username?.[0] || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold truncate text-foreground text-sm">
                    {registeredUser?.displayName || registeredUser?.username}
                  </p>
                  <p className="text-[10px] text-foreground/50 capitalize truncate">
                    {registeredUser?.role}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 px-2">
                <p className="text-foreground/70 text-sm">{tAuth('login_subtitle')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="w-full">
                    <Button
                      className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold h-9 text-xs"
                      size="sm"
                    >
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/signup" className="w-full">
                    <Button
                      className="w-full border-foreground/20 text-foreground hover:bg-foreground/10 bg-transparent h-9 text-xs"
                      variant="outline"
                      size="sm"
                    >
                      {t('signup')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/"
                onClick={onClose}
                className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
              >
                <LayoutGrid size={20} className="text-foreground/80" />
                <span className="text-[10px] font-medium text-foreground">{t('graph')}</span>
              </Link>

              <Link
                href="/reports"
                onClick={onClose}
                className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
              >
                <FileText size={20} className="text-foreground/80" />
                <span className="text-[10px] font-medium text-foreground">{t('reports')}</span>
              </Link>

              <Link
                href="/updates"
                onClick={onClose}
                className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
              >
                <Clock size={20} className="text-foreground/80" />
                <span className="text-[10px] font-medium text-foreground">{t('updates')}</span>
              </Link>

              <Link
                href="/about"
                onClick={onClose}
                className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
              >
                <Info size={20} className="text-foreground/80" />
                <span className="text-[10px] font-medium text-foreground">{t('about')}</span>
              </Link>

              {contentType && contentId && (
                <div className="relative group">
                  <ReportContentButton
                    contentType={contentType}
                    contentId={contentId}
                    className="w-full h-auto aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
                  >
                    <Flag size={20} className="text-foreground/80" />
                    <span className="text-[10px] font-medium text-foreground">
                      {tCommon('report')}
                    </span>
                  </ReportContentButton>
                </div>
              )}

              {/* Custom Actions (Create Group) */}
              {customActions && customActions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateActions(!showCreateActions)}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-colors border border-foreground/5',
                    showCreateActions
                      ? 'bg-accent-primary text-white'
                      : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'
                  )}
                >
                  <Plus
                    size={20}
                    className={showCreateActions ? 'text-white' : 'text-foreground/80'}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      showCreateActions ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {tCommon('add_new')}
                  </span>
                </button>
              )}

              {(registeredUser?.role === 'admin' || registeredUser?.role === 'moderator') && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
                >
                  <ShieldAlert size={20} className="text-accent-primary" />
                  <span className="text-[10px] font-medium text-foreground text-center">
                    {t('admin')}
                  </span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
                >
                  <User size={20} className="text-foreground/80" />
                  <span className="text-[10px] font-medium text-foreground">{t('profile')}</span>
                </Link>
              )}
            </div>

            {isAuthenticated && (
              <Button
                variant="destructive"
                className="w-full justify-center h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-xl"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                <LogOut size={16} className="mr-2" />
                {t('logout')}
              </Button>
            )}
            {/* Expandable Create Actions */}
            <AnimatePresence>
              {showCreateActions && customActions && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {customActions.map(action => (
                      <button
                        type="button"
                        key={action.label}
                        onClick={() => {
                          action.onClick();
                          onClose();
                        }}
                        className="aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5"
                      >
                        {action.icon}
                        <span className="text-[10px] font-medium text-foreground text-center line-clamp-2">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
