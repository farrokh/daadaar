'use client';

import { MobileMenu } from '@/components/layout/mobile-menu';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/use-search';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  FileText,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function MobileNavbar() {
  const t = useTranslations('navigation');
  const tGraph = useTranslations('graph');
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    results: searchResults,
    loading: searchLoading,
    runSearch,
    setResults: setSearchResults,
  } = useSearch(pathname.split('/')[1] || 'en');

  // Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      runSearch(trimmed);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, runSearch, setSearchResults]);

  // Close menu/search on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset navigation state on any route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  interface NavItemProps {
    href?: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick?: () => void;
  }

  const NavItem = ({ href, icon: Icon, active, onClick }: NavItemProps) => {
    const className = cn(
      'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
      active
        ? 'text-accent-primary bg-accent-primary/10'
        : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
    );

    const content = (
      <>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {active && (
          <motion.div
            layoutId="mobile-nav-glow"
            className="absolute inset-0 rounded-full bg-accent-primary/5 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </>
    );

    if (href) {
      return (
        <Link href={href} onClick={onClick} className={className}>
          {content}
        </Link>
      );
    }

    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden flex flex-col justify-end pb-32"
          >
            <button
              type="button"
              className="absolute inset-0 w-full h-full cursor-default"
              onClick={() => setIsSearchOpen(false)}
              aria-label="Close search"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative mx-6"
            >
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={tGraph('search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-background/90 text-foreground placeholder-foreground/40 rounded-2xl border border-foreground/10 shadow-2xl backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 text-base"
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
                  size={20}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>

              {/* Search Results */}
              <AnimatePresence>
                {searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="mt-4 max-h-[50vh] overflow-y-auto rounded-2xl bg-background/90 border border-foreground/10 shadow-2xl backdrop-blur-xl custom-scrollbar divide-y divide-foreground/5"
                  >
                    {searchLoading && searchResults.length === 0 ? (
                      <div className="p-4 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'linear',
                          }}
                        >
                          <Search className="text-white/40" size={20} />
                        </motion.div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(result => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => {
                            router.push(result.url);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-5 py-4 text-left active:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-semibold text-foreground truncate text-sm">
                              {result.title}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30 shrink-0">
                              {result.type === 'report'
                                ? t('reports')
                                : result.type === 'individual'
                                  ? t('people')
                                  : t('organizations')}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="mt-1 text-[11px] text-foreground/50 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </button>
                      ))
                    ) : (
                      !searchLoading && (
                        <div className="p-4 text-center text-foreground/40 text-sm">
                          {tGraph('search_no_results')}
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Glass Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden w-[90%] max-w-sm">
        <div
          className={cn(
            'flex items-center justify-between gap-3 p-2 px-4 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] liquid-glass'
          )}
        >
          {/* Note: I'm reusing the menuClass variable mostly but tweaking bg opacity for dock to match previous preference if needed, 
           but actually user liked the menu design language so reusing simpler variable or string is fine. 
           I'll just stick to the string to be precise. */}

          <NavItem href="/" icon={LayoutGrid} label={t('graph')} active={pathname === '/'} />
          <NavItem
            href="/reports"
            icon={FileText}
            label={t('reports')}
            active={isActive('/reports')}
          />
          <NavItem
            href={undefined}
            onClick={() => setIsSearchOpen(true)}
            icon={Search}
            label={t('search')}
            active={isSearchOpen}
          />

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
              isMenuOpen
                ? 'text-accent-primary bg-accent-primary/10'
                : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
            )}
          >
            <Menu size={20} strokeWidth={isMenuOpen ? 2.5 : 2} />
          </button>
        </div>
      </div>

      {/* Pop-up Menu */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
